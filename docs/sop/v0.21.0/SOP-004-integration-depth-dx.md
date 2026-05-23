# SOP-004: Integration Depth — Fine-Grained Patching + DX

> Version: v0.21.0
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001 (DsdElement+Signals), SOP-002 (Safe Templates)

## Problem

SOP-001 established the DsdElement+Signals bridge. It works but is shallow:

1. **Re-renders use `innerHTML` full replacement**, not fine-grained DOM patching.
   Every signal change → entire shadow DOM replaced → loses focus, scroll,
   form state, CSS transitions.
2. **Single test** (50 lines, one happy path). No batching, attribute binding,
   conditional signals, computed, cleanup, or edge-case tests.
3. **DX is bare**: two imports per component, no IDE support, no migration
   guide, generic error messages.
4. **www doesn't demonstrate the integration**. Components that could use
   signals (`less-search`, `less-toc`, `less-term`) still manage state
   imperatively.

## Objective

Make DsdElement+Signals the obvious default for interactive Ocean components.
After this SOP, a developer choosing between Lit and DsdElement+Signals for
a simple interactive widget should pick DsdElement+Signals every time.

## Implementation Plan

### Step 1: Fine-Grained DOM Patching

**Goal**: Replace `this.shadowRoot!.innerHTML = ...` with targeted DOM mutation.

Current (full replace):
```ts
// DsdElement._renderIntoShadowRoot()
this.shadowRoot!.innerHTML = result;  // ❌ full replace
```

Target (per-binding patch):
```ts
// For each signal expression in TemplateResult, patch only that DOM node
const binding = result.bindings[i];
const patchNode = this.shadowRoot!.querySelector(`[data-b="${binding.index}"]`);
if (patchNode) {
  patchNode.textContent = String(resolvedValue);  // ✅ single node
}
```

**Implementation checklist**:
- [ ] Add `data-b="0"`, `data-b="1"` markers to `renderTemplateToString()` output
  - Each `${signal}` expression gets a `data-b="N"` attribute on its containing node
- [ ] `_renderIntoShadowRoot()` first-render path: full HTML (DD, needs structure)
- [ ] `_scheduleReactiveUpdate()` path: patch only `[data-b]` nodes
  - Read current value from signal
  - Text node → `textContent = val`
  - Attribute node → `setAttribute(name, val)`
  - Boolean attribute → `toggleAttribute(name, val)`
  - Property binding → `el[name] = val`
- [ ] Fallback: if DOM structure changed (e.g. conditional block), fall back to
  full `innerHTML` replace
- [ ] Track mutation count per update for metrics (`dsd-report.json`)

### Step 2: Conditional Signal Re-Tracking

**Goal**: When a template conditionally depends on different signals, the
dependency graph must update.

```ts
// Problem case: sigA vs sigB depends on show
show.value ? html`<span>${sigA}</span>` : html`<span>${sigB}</span>`

// Bug: after show toggles, sigA still has subscription even when not rendered
// Fix: re-collect signals on every render(), diff subscriptions, unsubscribe stale
```

**Implementation checklist**:
- [ ] After each `render()`, compute `newSignals = collectTemplateSignals(result)`
- [ ] Compare with `this._signalUnsubscribers` → unsubscribe removed signals
- [ ] Subscribe new signals only
- [ ] Test: toggle condition 5 times → no stale subscriptions
- [ ] Test: signal count in `_signalUnsubscribers` matches visible bindings

### Step 3: Attribute/Property/Boolean Binding Test Coverage

**Test cases to add** (target: 12 new tests):

- [ ] Attribute binding: `html\`<div class="${sig}">\`` → `getAttribute('class')` updates
- [ ] Boolean attribute: `html\`<input ?disabled="${sig}">\`` → toggles `disabled`
- [ ] Property binding: `html\`<input .value="${sig}">\`` → `el.value` set directly
- [ ] Event handler: `html\`<button @click="${fn}">\`` → `fn` called on click
- [ ] Fine-grained: change sigA → only `[data-b="0"]` updates, `[data-b="1"]` unchanged
- [ ] Batching: 3 signal writes → 1 DOM update (check MutationObserver count)
- [ ] Cleanup: element removed → no subscriptions fire
- [ ] Nested template: `html\`<div>${html\`<span>${sig}</span>\`}</div>\``
- [ ] Computed: `computed(() => sigA.value + sigB.value)` → re-renders on either change
- [ ] Conditional: `flag ? sigA : sigB` → correct signal tracking after toggle
- [ ] AbortController: `signal.aborted` → unsubscribe → no re-render
- [ ] SSR safety: no `document.querySelector` or `shadowRoot` access during SSR

### Step 4: DX Improvements

#### 4a: Single Import
- [ ] Re-export `signal`, `computed`, `effect` from `@lessjs/core`
  - Currently: `import { DsdElement, html } from '@lessjs/core'; import { signal } from '@lessjs/signals';`
  - Target: `import { DsdElement, html, signal, computed } from '@lessjs/core';`
- [ ] `@lessjs/signals` remains a standalone package for non-DsdElement use

#### 4b: Error Messages
- [ ] `render()` returns non-string, non-TemplateResult → clear error: "DsdElement.render() must return string or html\`...\`"
- [ ] Signal used without import → runtime detection + hint: "Did you forget `import { signal } from '@lessjs/core'`?"
- [ ] TemplateResult detected but no signals subscribed → warning: "Your html template uses no signals. Use render(): string for static content."
- [ ] Cycle detected: signal write during render → warning: "Signal write detected during render(). This may cause infinite loops."

#### 4c: Migration Guide
- [ ] `docs/guide/migrating-from-lit.md`
- [ ] Side-by-side examples: Lit counter vs DsdElement+Signals counter
- [ ] Lit @state → signal() mapping table
- [ ] Lit @property → signal + attributeChangedCallback mapping
- [ ] Lit @click → html @click binding
- [ ] Lit css → StyleSheet
- [ ] Lit firstUpdated/updated → connectedCallback + signal.subscribe

### Step 5: www Component Migration

**Target components to migrate from imperative DOM to signals**:

| Component | Current State | Target State | Effort |
|---|---|---|---|
| `less-search.ts` | `_open`, `_query`, `_results` manual | `signal(false)`, `signal('')`, `signal([])` | ~20 lines |
| `less-toc.ts` | `#activeHeading` manual scroll tracking | `signal('')` + computed visibility | ~15 lines |
| `less-term.ts` | `#input` manual text state | `signal('')` + computed output | ~10 lines |

**Migration checklist per component**:
- [ ] less-search: open/close → signal, query → signal, results → computed
- [ ] less-toc: activeHeading → signal, scroll handler → signal write
- [ ] less-term: input → signal, display → computed from signal
- [ ] After migration: no `this.shadowRoot!.innerHTML =` or `this._someState =` remains
- [ ] After migration: all interactive state is `signal()` or `computed()`

### Step 6: Verification

#### Test Targets
```sh
deno test packages/core/__tests__/reactive-dsd.test.ts     # ≥12 tests
deno test packages/core/__tests__/template.test.ts         # ≥15 tests
deno test packages/core/__tests__/dsd-element.test.ts      # ≥460 tests
```

#### Gate Commands
```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
```

#### Exit Criteria
- [ ] Fine-grained patching works: changing sigA updates only `[data-b="0"]` node
- [ ] 12+ reactive-dsd tests pass
- [ ] 3 www components migrated to signals (less-search, less-toc, less-term)
- [ ] Single import path: `import { DsdElement, html, signal } from '@lessjs/core'`
- [ ] Migration guide exists and is linked from README
- [ ] All gate commands pass
- [ ] DSD report shows zero unknown errors from new components

## Non-Goals

- Do not add virtual DOM or keyed diffing (deferred, see SOP-003 README decision)
- Do not add reactive effect() beyond what signals already provides
- Do not change the `render()` contract (still returns string | TemplateResult)
- Do not add computed property notation (`.value` access is the API)

## Related

- SOP-001: DsdElement + Signals Integration
- SOP-002: Safe Templates
- ADR-0039: DsdElement + Signals Reactive Architecture
- `packages/core/src/dsd-element.ts`
- `packages/core/src/template.ts`
- `packages/signals/src/framework.ts`

> 📦 **HISTORICAL** — applies to v0.21.x only. Superseded by ADR-0057 (JSX+Signal) in v0.24.1.

# SOP-009: v0.21.0 Closure & Remediation

> Version: v0.21.0
> Priority: P0
> Status: IN PROGRESS
> Triggered by: Comprehensive Review 2026-05-23
> Depends on: SOP-001 through SOP-008

## Objective

Close all gaps identified in the v0.21.0 comprehensive review. This SOP is the
**final gate** — v0.21.0 is not truly "done" until every P0 and P1 item here
is completed.

## Source

Full review: `C:\Users\Administrator\Documents\GitHub\lessjs-v0.21.0-comprehensive-review.md`

Overall score: **8.61 / 10**. Target: **9.0 / 10**.

---

## P0 — Must Fix Before v0.22.0 Starts

### P0.1: Fix STATUS.md Stale Data

**Problem**: `docs/status/STATUS.md` says:

- "All 13 packages aligned to v0.20.1" → should be **16 packages at v0.21.0**
- Lists only 4 SOPs for v0.21.0 → should list **9 SOPs** (001-009)

**Action**:

- [ ] Update "Package Version State" → `All 16 packages aligned to v0.21.0`
- [ ] Update SOP table to include SOP-006 through SOP-009
- [ ] Update "Last Completed Line" if needed

**Files**: `docs/status/STATUS.md`

---

### P0.2: Complete www Component Signal Migration (SOP-004 Step 5)

**Problem**: Three www components still use imperative state instead of `signal()`:

- `less-search.ts`: `_open`, `_query`, `_results` manual state + `_updateResults()` manual DOM
- `less-toc.ts`: manual scroll tracking, no signal
- `less-term.ts`: manual input state, no signal

**Migration pattern**:

```ts
// Before (imperative)
private _open = false;
private _query = '';
_handleTriggerClick() {
  this._open = true;
  this._updateResults();
}

// After (signal-driven)
import { signal } from '@openelement/core';
#open = signal(false);
#query = signal('');
_handleTriggerClick() {
  this.#open.value = true;
  // render() template reads this.#open, auto-updates via _patchBindings
}
```

**Action checklist**:

- [ ] less-search: `_open`→signal, `_query`→signal, `_results`→signal, remove `_updateResults()` manual DOM
- [ ] less-toc: activeHeading→signal, scroll handler→signal write
- [ ] less-term: input→signal, display→computed from signal
- [ ] After migration: no `this.shadowRoot!.innerHTML =` or `this._someState =` remains
- [ ] After migration: all interactive state is `signal()` or `computed()`
- [ ] Full test: `deno task test`

**Files**: `www/app/islands/less-search.ts`, `less-toc.ts`, `less-term.ts`

**Effort**: ~1.5h

---

### P0.3: Create Migration Guide (SOP-004 Step 4c)

**Problem**: `docs/guide/migrating-from-lit.md` does not exist.

**Required content**:

- Side-by-side examples: Lit counter vs DsdElement+Signals counter
- Lit `@state` → `signal()` mapping table
- Lit `@property` → signal + `attributeChangedCallback` mapping
- Lit `@click` → html `@click` binding
- Lit `css` → `StyleSheet`
- Lit `firstUpdated`/`updated` → `connectedCallback` + signal.subscribe

**Action**:

- [ ] Create `docs/guide/migrating-from-lit.md`
- [ ] Link from `docs/sop/README.md` and `docs/guide/` index

**Files**: `docs/guide/migrating-from-lit.md` (new)

**Effort**: ~2h

---

## P1 — Should Fix Before v0.22.0 Feature Work

### P1.1: Expand reactive-dsd.test.ts (SOP-004 Step 3)

**Problem**: `reactive-dsd.test.ts` has **1 test**. SOP-004 target was **12+ tests**.

**Required test cases**:

- [ ] Attribute binding: `html`<div class="${sig}">``→`getAttribute('class')` updates
- [ ] Boolean attribute: `html`<input ?disabled="${sig}">``→ toggles `disabled`
- [ ] Property binding: `html`<input .value="${sig}">``→ `el.value` set directly
- [ ] Event handler: `html`<button @click="${fn}">``→ `fn` called on click
- [ ] Fine-grained: change sigA → only `[data-b="0"]` updates, `[data-b="1"]` unchanged
- [ ] Batching: 3 signal writes → 1 DOM update (check MutationObserver count)
- [ ] Cleanup: element removed → no subscriptions fire
- [ ] Nested template: `html`<div>${html`<span>${sig}</span>`}</div>``
- [ ] Computed: `computed(() => sigA.value + sigB.value)` → re-renders on either change
- [ ] Conditional: flag ? sigA : sigB → correct signal tracking after toggle
- [ ] AbortController: signal.aborted → unsubscribe → no re-render
- [ ] SSR safety: no `document.querySelector` or `shadowRoot` access during SSR

**Action**:

- [ ] Write 11 additional test cases (1 existing + 11 new = 12 total)
- [ ] Run `deno test packages/core/__tests__/reactive-dsd.test.ts`

**Files**: `packages/core/__tests__/reactive-dsd.test.ts`

**Effort**: ~2h

---

### P1.2: Expand template.test.ts

**Problem**: `template.test.ts` has **7 tests**. SOP-002 listed 8 required test cases, plus general template coverage.

**Additional test cases**:

- [ ] Text XSS vector escaped
- [ ] Attribute breakout escaped
- [ ] URL protocol attack rejected
- [ ] Boolean binding does not emit `false`
- [ ] Property binding does not serialize objects
- [ ] Event binding does not serialize function source
- [ ] `unsafeHTML()` passes through raw trusted HTML
- [ ] Nested templates do not double-escape

**Action**:

- [ ] Audit existing 7 tests against the 8 required cases
- [ ] Add missing cases
- [ ] Run `deno test packages/core/__tests__/template.test.ts`

**Files**: `packages/core/__tests__/template.test.ts`

**Effort**: ~1.5h

---

### P1.3: Add Streaming DSD Tests

**Problem**: No independent streaming test file exists. `renderDSDStream` is tested only through integration.

**Required test cases**:

- [ ] `renderDSDStream()` returns `ReadableStream<Uint8Array>`
- [ ] Shell chunk is first
- [ ] Footer chunk is last
- [ ] Component chunks preserve priority order
- [ ] Failed component emits fallback and stream continues
- [ ] TemplateResult output is escaped
- [ ] Metrics include chunk count and error count

**Action**:

- [ ] Create `packages/core/__tests__/streaming-dsd.test.ts`
- [ ] Run `deno test packages/core/__tests__/streaming-dsd.test.ts`

**Files**: `packages/core/__tests__/streaming-dsd.test.ts` (new)

**Effort**: ~1h

---

## P2 — Nice to Have Before v1.0

### P2.1: Physical Package Split (SOP-007)

**Problem**: compat-check/cem/style-sheet are thin re-export wrappers. Implementation still lives in `@openelement/core/src/`.

**Action**:

- [ ] Move `compatibility.ts` implementation from core to `@openelement/compat-check/src/`
- [ ] Move `cem-parser.ts` implementation from core to `@openelement/cem/src/`
- [ ] Move `style-sheet.ts` implementation from core to `@openelement/style-sheet/src/`
- [ ] Update core's re-export to import from new packages (reverse the dependency direction)
- [ ] Run full test suite

**Files**: `packages/core/src/compatibility.ts`, `cem-parser.ts`, `style-sheet.ts` → respective packages

**Effort**: ~3h

---

### P2.2: Split render-dsd.ts

**Problem**: 523 lines, mixing SSR + streaming + adapter dispatch.

**Action**:

- [ ] Extract `renderDSDStream()` and related types into `render-dsd-stream.ts` (~50 lines)
- [ ] Keep `renderDsd()`, `renderDSDByName()` in `render-dsd.ts`

**Files**: `packages/core/src/render-dsd.ts`, `packages/core/src/render-dsd-stream.ts` (new)

**Effort**: ~1h

---

### P2.3: Update SOP-001 Target Files List

**Problem**: SOP-001 lists `template-bindings.ts` and `render-dsd-stream.ts` as target files that don't exist.

**Action**:

- [ ] Update SOP-001 Target Files section → note that bindings are inlined in `template.ts` and streaming in `render-dsd.ts`

**Files**: `docs/sop/v0.21.0/SOP-001-dsdelement-signals.md`

**Effort**: ~15min

---

## P3 — Polish

### P3.1: Add try/catch to _patchBindings

**Problem**: If `this.render()` throws inside `_patchBindings()`, the exception is uncaught → silent failure.

**Action**:

- [ ] Wrap `_patchBindings()` body in try/catch
- [ ] Log warning on failure, leave last good DOM in place

**Files**: `packages/core/src/dsd-element.ts` (line 331-353)

**Effort**: ~30min

---

### P3.2: Namespace data-b Markers

**Problem**: User templates with `data-b="0"` could collide with internal markers.

**Action**:

- [ ] Change marker to `data-less-b="0"` (namespaced)
- [ ] Update `_patchBindings()` selector from `[data-b="${i}"]` to `[data-less-b="${i}"]`
- [ ] Update `renderTemplateToString()` marker emission

**Files**: `packages/core/src/template.ts`, `packages/core/src/dsd-element.ts`

**Effort**: ~30min

---

## Progress Dashboard

| ID   | Item                      | Priority | Status  | Effort |
| ---- | ------------------------- | -------- | ------- | ------ |
| P0.1 | Fix STATUS.md             | P0       | ⬜ Todo | 5min   |
| P0.2 | www signal migration      | P0       | ⬜ Todo | 1.5h   |
| P0.3 | Migration guide           | P0       | ⬜ Todo | 2h     |
| P1.1 | Expand reactive-dsd tests | P1       | ⬜ Todo | 2h     |
| P1.2 | Expand template tests     | P1       | ⬜ Todo | 1.5h   |
| P1.3 | Streaming DSD tests       | P1       | ⬜ Todo | 1h     |
| P2.1 | Physical package split    | P2       | ⬜ Todo | 3h     |
| P2.2 | Split render-dsd.ts       | P2       | ⬜ Todo | 1h     |
| P2.3 | Update SOP-001 targets    | P2       | ⬜ Todo | 15min  |
| P3.1 | try/catch _patchBindings  | P3       | ⬜ Todo | 30min  |
| P3.2 | Namespace data-b markers  | P3       | ⬜ Todo | 30min  |

**Total P0 effort**: ~3.5h
**Total P0+P1 effort**: ~8h
**Total all**: ~13h

## Verification

After all P0+P1 items complete:

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task test:e2e
```

Target: 760+ tests passing, zero regressions, DSD report clean.

## Exit Criteria

- [ ] STATUS.md accurate (16 packages, v0.21.0, 9 SOPs)
- [ ] less-search, less-toc, less-term use signals
- [ ] Migration guide exists and is linked
- [ ] reactive-dsd.test.ts ≥ 12 tests
- [ ] template.test.ts covers all 8 security cases
- [ ] streaming-dsd.test.ts covers 7 required cases
- [ ] All gate commands pass

## Related

- Comprehensive Review 2026-05-23: `C:\Users\Administrator\Documents\GitHub\lessjs-v0.21.0-comprehensive-review.md`
- SOP-001 through SOP-008
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`

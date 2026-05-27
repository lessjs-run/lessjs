# ADR-0051: Self-Built `html` Template System Strengthening

- Status: PROPOSED
- Date: 2026-05-27
- Supercedes: Extends ADR-0039 (DsdElement + Signals Reactive)
- Applies to: v0.24.0+

## Context

ADR-0039 established `html` tagged template as the unified rendering API for
DsdElement, replacing `hydrateEvents` and enabling declarative event binding
(`@click`) and Signal interpolation. The current implementation
(`packages/core/src/template.ts`, 309 lines) provides:

- `html` tagged template → `TemplateResult` (strings + values)
- SSR path: `renderTemplateToString()` → HTML string with `data-less-event-N` markers
- Client path: `applyRuntimeTemplateBindings()` → event binding via marker attributes
- Signal wrapping: Signal values wrapped in `<span data-less-b="N">` for fine-grained patching
- URL sanitization: `sanitizeUrl()` blocks `javascript:`/`data:`/`vbscript:` protocols

However, the deep evaluation report (2026-05-27) identified critical DX gaps:

1. **No template caching**: Every `render()` call rebuilds the string from scratch
2. **No class/style helpers**: Manual string concatenation for dynamic CSS classes
3. **No conditional/iteration primitives**: Ternary operators and `.map()` in templates are
   error-prone and produce unreadable code
4. **No ref directive**: Manual `querySelector()` for DOM node references
5. **Weak type inference**: `TemplateValue` union is too broad, losing type safety

More critically, the evaluation raised an architectural question: should LessJS
adopt Lit's `html` as the default template engine, or strengthen its own? The
concern is that baking Lit into the default path would break the framework's
ability to support FAST, Stencil, or other UI frameworks as equal citizens.

## Decision

**LessJS strengthens its own `html` tagged template as the framework-agnostic
default. Lit, FAST, and other template engines remain equal adapters via
`RendererProtocol`.**

The self-built `html` will gain the following primitives (target ~600 lines):

### 1. Template Caching

```ts
// Before: rebuilds string on every render()
// After: caches parsed template structure by TemplateStringsArray identity
const templateCache = new WeakMap<TemplateStringsArray, ParsedTemplate>();
```

Template strings arrays are frozen and identity-stable in JavaScript. A
`WeakMap` keyed by `TemplateStringsArray` provides zero-cost caching of
parsed static parts, while dynamic value slots are recomputed per render.

### 2. `classMap()` helper

```ts
import { classMap } from '@lessjs/core';

render() {
  return html`<div class=${classMap({
    'btn': true,
    'btn-primary': this.variant === 'primary',
    'disabled': this.disabled,
  })}>...</div>`;
}
// → <div class="btn btn-primary disabled">...</div>
```

### 3. `when()` / `choose()` conditionals

```ts
import { when, choose } from '@lessjs/core';

// when(condition, truthyTemplate, falsyTemplate?)
render() {
  return html`<div>
    ${when(this.loaded,
      () => html`<profile .user=${this.user}></profile>`,
      () => html`<loading-spinner></loading-spinner>`
    )}
  </div>`;
}

// choose(cases)
render() {
  return choose(this.status, [
    ['loading', () => html`<spinner></spinner>`],
    ['error',   () => html`<error-msg></error-msg>`],
    ['empty',   () => html`<empty-state></empty-state>`],
  ], () => html`<data-view></data-view>`); // default
}
```

### 4. `repeat()` iteration

```ts
import { repeat } from '@lessjs/core';

render() {
  return html`<ul>
    ${repeat(this.items, (item, index) => item.id, (item) => html`
      <li>${item.name}</li>
    `)}
  </ul>`;
}
```

Key-based identity tracking avoids re-rendering unchanged items. When a key
function is omitted, `repeat` falls back to index-based rendering.

### 5. `ref()` directive

```ts
import { ref } from '@lessjs/core';

render() {
  return html`<input ${ref(this._inputEl)} @input=${this._onInput}>`;
}
// this._inputEl is automatically set to the <input> element
```

Ref callbacks fire after DOM attachment and cleanup on detachment. This
replaces manual `this.shadowRoot!.querySelector(...)` patterns.

### 6. Type-safe template values

```ts
// Before: TemplateValue is a broad union
// After: Narrower types per context (attribute vs content vs event)
type AttrValue = string | number | boolean | null | undefined;
type ContentValue = string | number | TemplateResult | UnsafeHtmlValue | SignalLike;
type EventValue = EventListener | ((event: Event) => void);
```

### Architecture: Adapter Equality

```
@lessjs/core/html          ← framework-agnostic default (strengthened by this ADR)
       │
       ▼
RendererProtocol           ← adapter registration (unchanged)
       │
       ├── adapter-lit    → Lit's html`...` TemplateResult
       ├── adapter-fast   → FAST's html`...` ViewTemplate
       ├── adapter-react  → React's JSX.createElement
       └── adapter-vanilla → string passthrough
```

All adapters are **equal**. The self-built `html` is the default choice for
users who don't need a specific UI framework — not a "lesser" alternative.

## What This ADR Does NOT Do

1. **Does not adopt Lit's `html` as the default.** Lit remains an optional adapter.
2. **Does not add a directive system.** Beyond `ref()`, `when()`, `choose()`,
   `repeat()`, and `classMap()`, the self-built template stays minimal. Framework-specific
   directives (Lit's `live()`, `guard()`, `until()`; FAST's `slotted()`, `children()`) belong
   in their respective adapters.
3. **Does not change the SSR pipeline.** `renderTemplateToString()` and
   `applyRuntimeTemplateBindings()` remain the core SSR/client bridge.
4. **Does not break `render(): string`.** Static string rendering continues to work
   unchanged for components that don't need reactivity.

## Consequences

### Positive

- Users get a complete, pleasant template language without installing Lit or FAST
- Template caching reduces SSR render overhead (especially for repeated components)
- `classMap`/`when`/`choose`/`repeat`/`ref` cover 80%+ of real-world template needs
- The framework-agnostic story is preserved: Lit, FAST, React remain equal adapters
- Documentation can show a single set of template examples that work for all adapters
- Estimated ~600 lines total — minimal maintenance burden

### Negative

- Adds ~5 helper functions to `@lessjs/core`'s public API surface
- `repeat()` with key tracking requires diff/patch logic (~100 lines)
- Builds a feature set that strongly overlaps with lit-html's directive system
  (intentional: overlap is the price of framework independence)

### Neutral

- This decision does not change the `RendererProtocol` interface
- This decision does not affect existing Lit/FAST/React adapter code
- This decision does not require changes to `@lessjs/ui` components
  (current string-based renders continue to work)

## Related

- ADR-0039: DsdElement + Signals Reactive Architecture
- ADR-0036: Ocean-Island Architecture
- ADR-0052: Signal-DOM Deep Integration
- `packages/core/src/template.ts`: Current implementation (~309 lines)

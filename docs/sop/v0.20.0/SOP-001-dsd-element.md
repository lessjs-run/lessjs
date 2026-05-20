# SOP-001: DsdElement Base Class

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Owning SOP**: SOP-002 depends on this; SOP-004 through SOP-008 consume this.
> **Estimated time**: 0.5 day
> **Complexity**: 🟢 Low

---

## Objective

Create `DsdElement` — a zero-dependency native `HTMLElement` base class in `@lessjs/core` that replaces `DsdLitElement` for all DSD components.

---

## Pre-requisites

- [x] `renderDSD()` already supports `render(): string` (line 177-181)
- [x] `HydrateEventDescriptor` type already exists in `types.ts`
- [x] Current `createRenderRoot()` DSD detection pattern in `dsd-hydration.ts` is proven

---

## Files

| File                                          | Action                                  |
| --------------------------------------------- | --------------------------------------- |
| `packages/core/src/dsd-element.ts`            | **NEW** — DsdElement class (~150 lines) |
| `packages/core/src/index.ts`                  | **EDIT** — add `export { DsdElement }`  |
| `packages/core/__tests__/dsd-element.test.ts` | **NEW** — unit tests                    |

No changes to existing files in other packages.

---

## Step-by-Step

### Step 1: Create `packages/core/src/dsd-element.ts`

Copy the full implementation from ADR-0036 Appendix A / Architecture §2.2. Key points:

```typescript
export class DsdElement extends HTMLElement {
  static hydrateEvents?: HydrateEventDescriptor[];
  static styles?: CSSStyleSheet | CSSStyleSheet[];
  static observedAttributes?: string[];

  protected _dsdHydrated = false;
  private _hydrateAbortController?: AbortController;
  protected _internals?: ElementInternals;

  // createRenderRoot() — DSD detection (port from dsd-hydration.ts)
  // connectedCallback() — hydrateEvents + CSR fallback
  // disconnectedCallback() — AbortController cleanup
  // attributeChangedCallback() — stub, subclasses override
  // render(): string — SSR contract, override in subclasses
  // _hydrateEvents() — port from WithDsdHydration._hydrateEvents()
  // _styles getter — merge static styles CSSStyleSheet[]
}
```

**Critical implementation details:**

1. **`createRenderRoot()`**: Check `this.shadowRoot?.childElementCount > 0` → DSD pre-populated → `_dsdHydrated = true` → return existing root. Otherwise → `attachShadow({ mode: 'open' })` → apply adoptedStyleSheets.

2. **`connectedCallback()`**:
   - If no shadowRoot → call `createRenderRoot()` (CSR fallback)
   - If `!_dsdHydrated` → `shadowRoot.innerHTML = this.render()` (CSR only)
   - If `_dsdHydrated` → `this._hydrateEvents()` (DSD path)
   - If formAssociated → `this._internals = this.attachInternals()`
   - Call `super.connectedCallback()` first

3. **`_hydrateEvents()`**: Direct port from `WithDsdHydration._hydrateEvents()`. Use `AbortController` for cleanup. M-17 guard: skip methods starting with `__`.

4. **`render()`**: Default returns `''`. Subclasses MUST override.

### Step 2: Update `packages/core/src/index.ts`

```typescript
// Add after existing exports:
export { DsdElement } from './dsd-element.js';
export type { HydrateEventDescriptor } from './types.js';
```

### Step 3: Create unit tests

`packages/core/__tests__/dsd-element.test.ts` — test:

1. **SSR side**: `render()` returns string → SSR renderer uses it
2. **DSD detection**: Component with pre-populated shadowRoot sets `_dsdHydrated = true`
3. **CSR fallback**: Component without shadowRoot creates one + populates from `render()`
4. **hydrateEvents binding**: Events fire correctly for declared selectors
5. **AbortController cleanup**: Events removed on `disconnectedCallback`
6. **M-17 guard**: Methods starting with `__` are not bound
7. **CSSStyleSheet merge**: Multiple sheets in `static styles: CSSStyleSheet[]` merge correctly
8. **delegatesFocus**: When `static delegatesFocus = true`, shadow root has delegatesFocus

---

## Verification Checklist

- [ ] `npm run build` succeeds in `packages/core`
- [ ] Unit tests pass (`npm test` or `deno test`)
- [ ] `import { DsdElement } from '@lessjs/core'` works from external consumer
- [ ] Types are exported correctly (check with `tsc --noEmit`)
- [ ] No Lit import anywhere in `packages/core/src/dsd-element.ts`

---

## Dependencies

```
SOP-001 blocks: SOP-002, SOP-003, SOP-004, SOP-005, SOP-006, SOP-007, SOP-008
SOP-001 blocked by: nothing
```

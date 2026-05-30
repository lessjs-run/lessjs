# ADR-0065: Unified VNode Rendering Pipeline — SSR+CSR Signal-Aware Architecture

| Metadata | Value |
|---|---|
| **ADR** | 0065 |
| **Status** | Accepted |
| **Date** | 2026-05-30 |
| **Author** | Qi (Delivery Director) |
| **Deciders** | Zhi |
| **Supersedes** | ADR-0062 (partial — hydration path), ADR-0058 (integrated) |
| **Version** | v0.27.0 |

---

## Context

### Current State (Pre-v0.27)

LessJS maintains **two independent renderers** that traverse the same VNode tree with different logic:

1. **`renderToString`** (`jsx-render-string.ts`): Serializes VNode→HTML string. Signals are unwrapped to dead values (`signal(42)`→`'42'`). Signal identity is lost in serialization.

2. **`renderToDom`** (`jsx-render-dom.ts`): Renders VNode→DOM. Signals create effect bindings (`effect(() => el.textContent = signal.value)`).

3. **`_walkAndBind`** (`dsd-element.ts`): Hydration bridge. Walks DSD DOM and VNode tree in parallel, attempting to match positions. Uses `parent.childNodes` with comment/whitespace filtering. Fragile — any structural mismatch (comment nodes from Vite/Lit, whitespace from DSD spec) breaks alignment.

4. **`_layoutWorkaroundReRender`** (`dsd-element.ts`): Clears and rebuilds shadow root after `_walkAndBind` to fix a Chromium DSD layout bug. Destroys all effects created by `_walkAndBind`, then relies on `renderToDom` to recreate them — but nested `effectScope` may discard the recreated effects.

### Problem Manifestation

- **Counter stuck at 42**: `data-less-s` signal binding lost in `_layoutWorkaroundReRender` + `effectScope` nesting
- **SPA navigation crash**: `_loadContent` used `querySelector('less-layout')` that couldn't traverse DSD `<template>` content
- **Lang-switch full page reload**: Navigation API `navigate()` triggered real browser navigation instead of SPA swap
- **Conditional rendering broken**: `{signal && <div>}` evaluated at `render()` time only — DsdElement `render()` is statically called once

### Industry Reference

| Framework | SSR Model | Hydration Model | Signal Identity |
|---|---|---|---|
| React 18 | `renderToString(<App/>)` | `hydrateRoot(dom, <App/>)` — position match | N/A (VDOM, not signals) |
| Vue 3 | `renderToString(app)` | `hydrate(app, dom)` — VNode position match | N/A (VDOM, not signals) |
| Lit | `render()` → TemplateResult → HTML + digest markers | `hydrate(template, dom)` — digest→parts match | N/A (TemplateResult parts) |
| SolidJS | `renderToString` + markers | `hydrate()` — marker→signal binding | Preserved in markers |
| **LessJS (target)** | VNode → `data-less-s` HTML | `querySelector('[data-less-s]')` → signal binding | **Preserved in DOM attributes** |

Key insight: **All successful frameworks ensure SSR output identifies dynamic positions.** Position matching works for React/Vue because the component tree is identical on both sides. Explicit markers work for Lit/Solid because metadata is in the HTML.

LessJS's `renderToString` currently strips signal identity. Without `data-less-s` attributes, hydration relies on fragile position-guessing via `_walkAndBind`.

---

## Decision

### Principle

**Signal is the one true source of truth. VNode is the one intermediate representation.**

SSR (VNode→HTML) and CSR (VNode→DOM) are two serialization paths over the same VNode tree. Signal identity is preserved in SSR HTML via `data-less-s` attributes. Client hydration reads attributes to establish signal→DOM bindings — zero position guessing.

### Architecture

```
render() → VNode (ONE representation)
              │
              ├── SSR: VNode→HTML serializer  (renderToString)
              │         signal props → data-less-s="name" on element
              │         <span data-less-s="count">42</span>
              │
              └── CSR: VNode→DOM renderer     (renderToDom)
                        signal props → effect(el.prop = signal.value)

hydration: querySelectorAll('[data-less-s]')
            → read data-less-s → signalRegistry.get(name) → effect(el.prop = sig.value)
```

### Key Decisions

1. **`data-less-s` attribute** for signal identity in SSR HTML
2. **`data-less-on` attribute** for event identity in SSR HTML
3. **`signalRegistry`** on DsdElement — maps signal names to signal objects accessible by hydration code
4. **`hydrateSignals(root)`** replaces `_walkAndBind` traversal — `querySelectorAll('[data-less-s]')` + effect creation
5. **`hydrateEvents(root)`** replaces `_walkAndBind` event binding — `querySelectorAll('[data-less-on]')` + addEventListener
6. **`_layoutWorkaroundReRender` DELETED** — replaced by `requestAnimationFrame(() => void shadowRoot.offsetHeight)` for Chromium layout bug
7. **`_walkAndBind` DELETED** — traversal, index matching, comment/whitespace filtering all removed

---

## Consequences

### Positive

1. **Zero hydration mismatches**: Attribute-based lookup is position-independent. No traversal, no alignment guessing.
2. **No DOM rebuild**: `_layoutWorkaroundReRender` deleted. DSD DOM preserved through hydration.
3. **Counter works**: `data-less-s="count"` → `effect(el.textContent = signal.value)` — one line per signal, reliably triggered.
4. **Simplified code**: `_walkAndBind` (120+ lines of traversal logic) deleted. Replaced by ~20 lines of `querySelectorAll` + effect creation.
5. **Correct effectScope behavior**: Effects are created in a single `effectScope` block, no nested scope conflicts.
6. **Future-proof**: `data-less-s` attributes pave the way for signal-driven conditional rendering (`{signal && <div>}`) — metadata is already in the DOM.

### Negative

1. **HTML payload increases** by `data-less-s="name"` per signal binding (negligible — ~20 bytes each, GZIP'd to ~5 bytes)
2. **Migration cost**: `signalRegistry` must be populated in component constructors
3. **Breaking change**: Existing `{signal}` child patterns must migrate to `textContent={signal}` props (already done in v0.27.0 earlier commits)

### Deleted Code

| File | Deletion |
|---|---|
| `dsd-element.ts` | `_walkAndBind()` — 92 lines of traversal logic |
| `dsd-element.ts` | `_layoutWorkaroundReRender()` — 9 lines, Chromium hack |
| `dsd-element.ts` | `childNodes` filtering — comment/whitespace logic |
| `jsx-render-string.ts` | `textContent` child content logic (replaced by `data-less-s` attribute generation) |

### Added Code

| File | Addition |
|---|---|
| `dsd-element.ts` | `signalRegistry` — `Map<string, BaseSignal<unknown>>` |
| `dsd-element.ts` | `hydrateSignals(root)` — `querySelectorAll('[data-less-s]')` iterate + effect create |
| `dsd-element.ts` | `hydrateEvents(root)` — `querySelectorAll('[data-less-on]')` iterate + addEventListener |
| `jsx-render-string.ts` | `serializeAttrs` — `textContent` prop → `data-less-s="signalName"` attribute |
| `jsx-render-dom.ts` | No changes (already correct — signal→effect binding via applyProps) |

---

## Implementation Plan

See [SOP-004: Unified VNode Pipeline](./../sop/v0.27.0/SOP-004-unified-vnode-pipeline.md)

---

## References

- [Discussion: Unified VNode Model](./../conversation/unified-vnode-model.md)
- [ADR-0062: DSD-First Reactive DOM Signal Architecture](./ADR-0062-dsd-first-rdom-signal-architecture.md)
- [ADR-0058: Signal→DOM Direct Binding](./ADR-0058-signal-dom-direct-binding.md)
- [Lit SSR Client Usage](https://lit.dev/docs/ssr/client-usage/)
- [React 18 hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)

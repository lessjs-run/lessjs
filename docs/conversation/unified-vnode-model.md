# Discussion: Unified VNode Rendering Pipeline

> 2026-05-30 · Qi (Delivery Director) · v0.27.0 Architecture

## Problem Statement

LessJS currently maintains two independent renderers:

```
render() → VNode
           ├── renderToString()  → HTML string   (SSR path)
           └── renderToDom()     → DOM tree      (CSR path)
                     ↑                    ↑
              different logic     different logic
              signal→dead value   signal→effect
```

These two renderers **do not share the same model**. They independently traverse the VNode tree, handle signals differently, and serialize/render differently. The hydration bridge (`_walkAndBind`) tries to reconcile them by position-matching — and fails when the two paths produce structurally different outputs (comment nodes, whitespace, Element vs TextNode mismatch).

## Root Cause Analysis

### Signal Identity Loss During SSR

```ts
// renderToString: signal is unwrapped to a dead value
renderToString(signal(42))  →  '42'
// ^ signal identity GONE. HTML is <span>42</span> — no way to know it was signal('count')
```

The HTML carries the **value** but not the **identity**. Client hydration has to guess which DOM node corresponds to which signal — by walking VNode and DOM trees in parallel and hoping they align.

### `_layoutWorkaroundReRender` Destroys Bindings

```
_walkAndBind(VNode, DSD DOM)  → creates effect: signal → DOM
_layoutWorkaroundReRender:
  this.shadowRoot.innerHTML = ''   // effect bindings DESTROYED 💀
  renderToDom(render())           // creates new effects on new DOM
                                  // but nested effectScope may discard them
```

### Two Renderers, Divergent Behavior

| | renderToString | renderToDom |
|---|---|---|
| Signal→value | `renderToString(signal.value)` → dead string | `effect(el.textContent = signal.value)` |
| textContent={signal} | strips attribute, sets child content | `el.textContent = signal.value` (via applyStaticProp) |
| Boolean attrs | emits bare attribute or omits | setAttribute/removeAttribute |
| Style objects | inline CSS string | Object.assign(el.style) |
| Show/FOR | static snapshot | signal-driven reconcile |

These divergences are the source of hydration mismatches.

## How Other Frameworks Handle This

### React 18

```
Server: renderToString(<App/>) → HTML
Client: hydrateRoot(dom, <App/>)
         → walks VNode tree + DOM in parallel
         → position-matches (same <App/> on both sides)
         → after hydration: useState → reconcile(VNode, DOM) → patch

Key insight: SSR and CSR share the SAME <App/>. Position matching works because
the component tree is identical on both sides.
```

### Lit

```
Server: render() → TemplateResult → HTML with digest markers (<!--lit-part 0f2d3c-->)
Client: hydrate(template, dom)
         → scans digest markers → matches to TemplateResult.parts
         → @state change → requestUpdate → diff → patch

Key insight: TemplateResult.parts carries expression metadata.
Digest markers in HTML explicitly identify dynamic positions.
No position guessing needed.
```

### Vue 3

```
Same as React — VNode tree + DOM position matching.
Hydration mismatch → falls back to full CSR re-render.
```

### SolidJS

```
Server: renderToString → HTML with hydration markers
Client: hydrate() → markers identify signal bindings → direct DOM binding
         createSignal change → effect → DOM update (no VDOM)
```

## The Fundamental Insight

**All successful frameworks share one property: the SSR HTML knows which parts are dynamic.** Either through:

1. **Structural identity** (React/Vue): SSR and CSR run the same component tree → position matching works
2. **Explicit markers** (Lit/Solid): HTML contains metadata identifying dynamic expressions

LessJS has neither. `renderToString` strips signal identity. `_walkAndBind` guesses positions.

## Proposed Solution: Unified VNode Pipeline

### Core Principle

**Signal is the one true source of truth.** VNode is the one intermediate representation. SSR is VNode→HTML serialization. CSR is VNode→DOM instantiation. SSR HTML carries signal metadata via `data-less-s` attributes.

```
render() → VNode (ONE representation)
              │
              ├── SSR: VNode → HTML
              │         signal → data-less-s="signalName" attribute on element
              │         <span data-less-s="count">42</span>
              │         └── signal identity preserved in HTML
              │
              └── CSR: VNode → DOM
                        signal → effect(el.prop = signal.value)
                        direct binding, no position guess

hydration: querySelectorAll('[data-less-s]')
            → read attribute → find signal → effect() bind
            └── zero traversal matching, zero position guessing
```

### What Gets Deleted

| Current | Reason |
|---|---|
| `_layoutWorkaroundReRender` | Hack. Replaced by `requestAnimationFrame(() => void shadowRoot.offsetHeight)` |
| `_walkAndBind` traversal logic | Replaced by `querySelectorAll('[data-less-s]')` |
| `renderToString` signal unwrapping | Signal identity preserved as HTML attributes |
| `parent.children` / `parent.childNodes` filtering | Not needed — no parallel traversal |
| Index alignment, comment filtering | Not needed — attribute-based lookup, position-irrelevant |

### What Gets Added

| New | Purpose |
|---|---|
| `data-less-s="signalName"` in SSR HTML | Preserves signal identity across SSR→hydration boundary |
| `data-less-on="click:handlerName"` in SSR HTML | Preserves event bindings |
| `signalRegistry` on DsdElement | Maps signal names to signal objects for hydration lookup |
| `hydrateSignals(root)` | `querySelectorAll('[data-less-s]')` + create effects |
| `hydrateEvents(root)` | `querySelectorAll('[data-less-on]')` + addEventListeners |

### What Stays

| Component | Status |
|---|---|
| VNode type (`types.ts`, `vnode.ts`) | ✅ Stays — becomes the one intermediate representation |
| `renderToDom` | ✅ Stays — simplifies: doesn't need VNode→DOM with signal identity, just VNode→DOM |
| `applyProps` | ✅ Stays — signal→effect binding remains valid |
| `renderToString` | ✅ Stays but simplified — adds `data-less-s` attribute generation |
| `DsdElement` | ✅ Core stays — hydration path simplified |
| JSX runtime (`<Show>`, `<For>`, etc.) | ✅ Stays |

## Expected Outcomes

1. **Zero hydration mismatches**: No position guessing. Attribute-based lookup is position-independent.
2. **No DOM rebuild**: `_layoutWorkaroundReRender` deleted. DSD DOM preserved.
3. **Counter works**: `data-less-s="count"` → `effect(el.textContent = signal.value)` — one line, no traversal.
4. **Conditional rendering works**: Signal tracking + VNode diff (future phase) enables `{signal && <div>}`.
5. **Effect cleanup guaranteed**: One `effectScope` capture, one `dispose` call.

## References

- [React 18 Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Lit SSR Client Usage](https://lit.dev/docs/ssr/client-usage/)
- [Vue 3 SSR Hydration](https://vuejs.org/guide/scaling-up/ssr.html#client-hydration)
- [SolidJS SSR](https://docs.solidjs.com/guides/server-side-rendering)
- ADR-0062: DSD-First Reactive DOM Signal Architecture
- ADR-0058: Signal→DOM Direct Binding

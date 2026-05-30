# LessJS Signal Architecture — Comprehensive Design

> Version: v0.26.1\
> Date: 2026-05-30\
> Status: Implemented (G1-G2 fixed, G3-G6 P1/P2)\
> ADR: [ADR-0062](docs/adr/ADR-0062-dsd-first-rdom-signal-architecture.md)\
> SOP: [SOP-002](docs/sop/v0.26.1/SOP-002-signal-to-css-driven-visual.md)

---

## 1. Architecture Philosophy

```
HTML = skeleton (DSD once, never rebuilt)
CSS  = visual state (data-* + CSS selectors)
JS   = data + atomic DOM updates + cross-component communication
```

This is the **DSD-first Real DOM (RDOM)** approach. LessJS is uniquely positioned—DSD provides zero-JS first paint, so the framework only handles *reactive updates after hydration*. This is a simpler problem than what Solid/Svelte solve (they must handle initial render too).

---

## 2. Signal Power: alien-signals

LessJS uses [alien-signals](https://github.com/stackblitz/alien-signals) (1.6KB) — the same engine used by Vue 3.6 core and XState.

### Primitives exposed via @lessjs/signals

| Primitive | API | Usage |
|-----------|-----|-------|
| `signal` | `signal<T>(v)` → `{ value: T, subscribe }` | Mutable reactive value |
| `computed` | `computed<T>(fn)` → `{ value: T, subscribe }` | Derived reactive value |
| `effect` | `effect(fn)` → `() => void` | Reactive side effect (auto-tracks deps) |

### Primitives available in alien-signals but not yet exposed (P2)

| Primitive | Purpose |
|-----------|---------|
| `effectScope` | Grouped effect cleanup (replaces manual AbortController) |
| `startBatch` / `endBatch` | Atomic multi-signal updates |
| `untrack` | Read signal without creating dependency |
| `onCleanup` | Run cleanup when effect re-runs or disposes |

---

## 3. Signal→DOM Integration

### The Pipeline

```
signal.value = 'new-value'
  ↓
alien-signals notifies effect (created by applyProps)
  ↓
effect callback: el.setAttribute('data-theme', 'new-value')
  ↓
DOM updated — one attribute, one call
```

### applyProps — the core binding engine

File: `packages/core/src/jsx-render-dom.ts:140-186`

```typescript
applyProps(el, props, signal?) {
  for each prop:
    if isSignalLike(value):
      effect(() => {
        const v = unwrap(value.value)
        el.setAttribute(key, v)  // ← atomic DOM update
      })
      signal?.addEventListener('abort', dispose)  // ← auto-cleanup
    else:
      el.setAttribute(key, String(value))  // static, one-time
}
```

Key properties:
- **Atomic**: One effect = one attribute. No VNode comparison.
- **Cleanup**: AbortSignal passed from component lifecycle → all effects disposed on disconnect.
- **CSR + DSD**: Works identically in both paths (signal passed through `_walkAndBind`).

### Component Contract (ADR-0062)

| Rule | Rationale |
|------|-----------|
| `render()` accesses NO signal `.value` | Prevents structural signal access invisible to applyProps |
| Signal-driven state passed as `prop={signal}` | applyProps creates effect binding |
| Visual variants use `data-*` + CSS | Zero JS for visual state changes |
| Structural changes use `<Show>`/`<For>` (CSR) | Declarative control flow |

```tsx
// ❌ BAD — signal.value in render() body
render() {
  const theme = this._theme.value
  return <div class={theme === 'dark' ? 'dark' : 'light'}>...</div>
}

// ✅ GOOD — signal passed as prop, CSS handles visual
render() {
  return <div data-theme={this._theme}>...</div>
}
// CSS: div[data-theme="dark"] { ... }
```

---

## 4. DSD Lifecycle

```
SSG → DSD <template shadowrootmode> → browser attaches shadow DOM
  ↓
client.js → customElements.define() → upgrade
  ↓
connectedCallback():
  1. this.style.display = 'block'
  2. _applyStyles(ctor)  → adoptedStyleSheets
  3. _renderOrHydrate()
     ↓
     isDsd = shadowRoot.childNodes.length > 0  → DSD path
     ↓
     _hyrateExistingDom():
       a) this.render() → VNode
       b) create _templateAbortController (for effect cleanup)
       c) _walkAndBind(shadowRoot, result, signal)
          └→ applyProps for each element → effect bindings + event listeners
       d) _layoutWorkaroundReRender()
          └→ Chromium DSD layout fix: clear + rebuild via renderToDom
```

### ⚠️ Chromium DSD Layout Workaround

DSD shadow DOM content renders with correct DOM tree but host `getBoundingClientRect()` returns 0×0. Browser caches layout from initial parse (`display:inline`) and all reflow methods fail. Only full DOM replacement triggers correct layout.

`_layoutWorkaroundReRender()` runs **once** per lifecycle. After this initial render, per-prop bindings handle all subsequent updates. Remove when Chromium fixes DSD layout.

---

## 5. SignalContext — Cross-Component State

File: `packages/core/src/signal-context.ts`

```typescript
const contexts = new Map<symbol, Signal>()

// Provider (less-layout)
createContext(Symbol('theme'), 'dark')   // stores signal in Map
provideContext(host, ctx, 'light')       // sets Map signal value

// Consumer (any child component)
consumeContext(host, ctx)               // returns Map signal directly
  → effect(() => signal.value)          // auto-tracks provider changes
```

**v0.26.1 fix**: `consumeContext` now returns the **source signal from the Map**, not a copy. Provider changes are instantly reactive to all consumers.

---

## 6. Framework Comparison

| Framework | Signal→DOM | Context | Effect Cleanup | Batch | VNode? |
|-----------|-----------|---------|---------------|-------|--------|
| **LessJS** | Runtime `applyProps` per-prop effects | SignalContext Map (source ref) | AbortSignal chain | P2 (alien-signals) | No (DSD + one-time workaround) |
| SolidJS | Compile-time JSX→cloneNode + effects | Owner-tree Context (getter ref) | createRoot/onCleanup | batch() | No |
| Svelte 5 | Compile-time $state→DOM operations | setContext/getContext | $effect return fn | Built-in | No |
| Vue Vapor | Compile template→DOM + alien-signals | provide/inject | effectScope | Built-in | No |
| Preact Signals | JSX text→signal.value, else VDOM | Similar to React Context | effect return fn | batch() | Partial |
| Lit | @property → requestUpdate → render() | DOM-event Context protocol | ReactiveController | None | No (template) |

**LessJS's advantage**: DSD provides free SSR. Other frameworks must hydrate or CSR. LessJS starts with correct DOM and only adds reactivity.

---

## 7. Gap Status

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| G1 | Effect memory leak | P0 | ✅ Fixed — AbortSignal passed through `_walkAndBind` → `applyProps` |
| G2 | consumeContext dead copy | P0 | ✅ Fixed — returns source signal from Map |
| G3 | DSD text node binding | P1 | ⚠️ `_walkAndBind` skips text children; counter/home-console text CSR-reactive only |
| G4 | Show/For DSD hydration | P2 | ⚠️ CSR-only `renderToDom` constructs; DSD path needs comment-marker hydration |
| G5 | batch/expose more alien-signals | P2 | ⚠️ `effectScope`, `batch`, `untrack` available in alien-signals but not re-exported |
| G6 | No component-level effectScope | P2 | ⚠️ Manual AbortController; `effectScope` would be cleaner |

---

## 8. File Reference

| File | Role |
|------|------|
| `packages/signals/src/alien-engine.ts` | alien-signals adapter |
| `packages/signals/src/framework.ts` | Public API: `signal`, `computed`, `effect` |
| `packages/core/src/signal-like.ts` | Duck-type detection: `isSignalLike()` |
| `packages/core/src/signal-context.ts` | Context API: `createContext`, `provideContext`, `consumeContext` |
| `packages/core/src/jsx-render-dom.ts` | `applyProps` (signal→DOM), `renderToDom` (CSR) |
| `packages/core/src/jsx-runtime.ts` | JSX factory, Fragment, Show, For |
| `packages/core/src/dsd-element.ts` | `connectedCallback`, `_hyrateExistingDom`, `_walkAndBind`, `_layoutWorkaroundReRender` |
| `packages/core/src/jsx-types.d.ts` | JSX type declarations |
| `packages/ui/src/less-theme-toggle.tsx` | Example: CSS-driven signal (zero signal.value in render) |
| `packages/ui/src/less-layout.tsx` | Example: no signals in render (attribute-driven) |
| `www/app/islands/home-console.tsx` | Example: attribute-only computed signals |

---

## 9. Component Example: less-theme-toggle (v0.26.1)

```tsx
// render() — ZERO signal.value reads
render() {
  return (
    <button
      className="theme-toggle"
      data-theme={this._theme}    // ← signal as prop → applyProps creates effect
      onClick={() => this._handleToggle()}
    >
      <svg class="icon-sun">...</svg>
      <svg class="icon-moon">...</svg>
    </button>
  )
}

// CSS — handles all visual state
.theme-toggle[data-theme="light"] .icon-sun { display: none }
.theme-toggle[data-theme="light"] .icon-moon { display: block }

// Signal change: ONE setAttribute, NO re-render
this._theme.value = 'light'
  → effect → el.setAttribute('data-theme', 'light')
  → CSS selector matches → icon swaps
```

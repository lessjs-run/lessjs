---
title: Architecture
section: core
label: Architecture
order: 10
---

## Layer Model

LessJS has a strict three-layer architecture connected by ESM imports:

```
Application (www/)     ─  routes, islands, renderers
    │ ESM import
Builder (adapter-vite) ─  route scan, SSG pipeline, bundle
    │ ESM import  
Core (@lessjs/core)    ─  DsdElement, renderDsd, VNode, JSX
    │ ESM import
Signals (@lessjs/signals) ─  signal(), computed(), effect()
```

Each layer only knows the layer below. No layer imports from above.

## Rendering Pipeline

### renderDsd(input, props?) — The One API

```ts
// By tag name — auto-looks up from customElements registry
const result = await renderDsd('less-layout', {
  currentPath: '/guide/getting-started',
  locale: 'en',
})

// By class — direct use
const result = await renderDsd(LessLayout, { ... })

// result.html contains the full DSD output
console.log(result.html)
// → <less-layout>
//     <template shadowrootmode="open">
//       <style>...</style>
//       <div class="app-layout">...</div>
//     </template>
//   </less-layout>
```

### Single-Pass VNode Traversal

VNode trees are walked once. When a registered custom element is encountered, `renderDsd()` is called inline:

```
VNode tree
    ├─ <div class="app-header">
    │     ├─ <less-search>      → renderDsd('less-search')  inline
    │     └─ <less-theme-toggle> → renderDsd('less-theme-toggle') inline
    ├─ <slot></slot>             → light DOM projection
    └─ <div class="app-footer">...</div>
```

No parse5. No visited Set. No string flattening. One tree, one pass.

## Signal-Native Hydration

Signals are part of DsdElement, not a separate system:

```tsx
class MyCounter extends DsdElement {
  #count = signal(0)

  render() {
    // SSR: signal value written into HTML as data-signal attribute
    return <span data-signal="count">{this.#count.value}</span>
  }

  // CSR: _hydrateSignals() auto-binds effect() to DOM
  // → effect(() => el.textContent = this.#count.value)
}
```

Hydration markers: `data-signal`, `data-signal-html`, `data-signal-attr`, `data-signal-class`. Event binding: `data-on-click`, `data-on-input`, etc.

## Builder Pipeline

```
deno task build
  ├─ Route scanning    → entry-renderer generates SSR entry
  ├─ Client bundle     → Rolldown bundles island components  
  └─ SSG rendering     → renderRoute() for each page → write dist/
```

The SSG step imports the bundled SSR module and calls `renderRoute()` for every page. `renderRoute` renders the page component, processes renderer plugins, wraps in less-layout via `__renderAppShell`, and outputs complete HTML via `wrapInDocument()`.

## Component Model

```
DsdElement
├── static styles    → CSSStyleSheet, inlined into DSD template
├── render()         → VNode tree (JSX)
├── signalRegistry   → Map<name, Signal>
├── _hydrateSignals() → Attach effect() to DSD DOM
└── _bindEvents()    → Attach click/input/etc from data-on-* markers
```

## Key Design Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-0057 | JSX + Signal component model | Active |
| ADR-0065 | Unified VNode pipeline (SSR+CSR) | Active |
| ADR-0067 | Ocean (static) + Island (signal) architecture | Active |
| ADR-0071 | Single-pass VNode traversal, delete parse5 | Active |
| ADR-0072 | One renderDsd(), jsx on subpath only | Active |

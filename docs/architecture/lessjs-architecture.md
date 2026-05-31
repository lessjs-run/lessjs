# LessJS Architecture — v0.27.0

> **Status**: Current
> **Date**: 2026-05-31
> **Supersedes**: ADR-0062, ADR-0065, ADR-0067, ADR-0071, ADR-0072

---

## 1. Layer Model

```
┌─────────────────────────────────────────┐
│  Application (www/)                      │
│  ─ routes, islands, renderers, content  │
├─────────────────────────────────────────┤
│  Builder (@lessjs/adapter-vite)         │
│  ─ route scan, SSG pipeline, bundle     │
├─────────────────────────────────────────┤
│  UI (@lessjs/ui)                        │
│  ─ less-layout, less-button, etc.       │
├─────────────────────────────────────────┤
│  Core (@lessjs/core)                    │
│  ─ DsdElement, renderDsd, VNode, JSX   │
│  ─ renderDsdTree, signals bridge, props │
├─────────────────────────────────────────┤
│  Signals (@lessjs/signals)              │
│  ─ signal(), computed(), effect()       │
└─────────────────────────────────────────┘
```

Each layer consumes the layer below via ESM imports. No layer knows about the layer above.

---

## 2. Rendering Pipeline

### Single-Pass VNode Traversal (ADR-0071)

```
renderDsd(input, props?)
    │
    ├─ input = 'tag-name'  → customElements.get() → class
    ├─ input = DsdClass    → direct class
    │
    ▼
instantiate component → injectProps() → render()
    │
    ▼
VNode tree ← JSX compiled by Deno (jsxImportSource: @lessjs/core)
    │
    ▼
renderDsdTree(vnode)  ← single async traversal
    │
    ├─ Fragment    → expand children
    ├─ Show/For    → evaluate condition/list
    ├─ string tag + CE registered → renderDsd() inline (recursive)
    ├─ string tag + not CE        → serialize as HTML
    ├─ function    → instantiate class, render(), recurse
    └─ text node   → escape and emit
    │
    ▼
wrapDsdOutput(html, styles)
    │
    ▼
<tag>
  <template shadowrootmode="open">
    <style>...</style>
    <div class="app-header">...</div>
    ...
  </template>
  <!-- light DOM goes here for slot projection -->
</tag>
```

### CSR: Browser-Native DSD + Signal Hydration

```
Browser parses <template shadowrootmode="open">
    │
    ▼  zero JS
Shadow DOM attached automatically
    │
    ▼
connectedCallback()
    │
    ▼
_hydrateSignals()
    │
    ├─ querySelector('[data-signal="x"]') → effect(el.textContent = sig.value)
    ├─ querySelector('[data-signal-html="x"]') → effect(el.innerHTML = sig.value)
    ├─ querySelector('[data-signal-attr="x"]') → effect(el.setAttribute(name, sig.value))
    └─ querySelector('[data-signal-class="x"]') → effect(el.classList.toggle(name, sig.value))
    │
    ▼
_bindEvents()
    │
    └─ querySelector('[data-on-click="method"]') → addEventListener('click', this[method])
```

---

## 3. VNode → HTML → DSD Template

```
User writes:  render() { return <div class="x">hello</div> }
                    │
                    ▼  Deno JSX transform (jsxImportSource: @lessjs/core)
Becomes:       jsx('div', { class: 'x', children: 'hello' })
                    │
                    ▼  jsx() returns VNode
VNode:         { tag: 'div', props: { class: 'x' }, children: ['hello'] }
                    │
                    ▼  renderDsdTree(vnode)
HTML string:   <div class="x">hello</div>
                    │
                    ▼  wrapDsdOutput()
DSD template:  <my-tag>
                 <template shadowrootmode="open">
                   <style>...</style>
                   <div class="x">hello</div>
                 </template>
               </my-tag>
```

---

## 4. Signal System

```
User writes:
    #count = signal(0)
    #double = computed(() => this.#count.value * 2)

render() {
    // SSR: signal.value is read directly, written into HTML as data-signal attr
    return <span data-signal="count">{this.#count.value}</span>
}

CSR: _hydrateSignals()
    → finds data-signal="count" in shadow DOM
    → registerSignal('count', this.#count)
    → effect(() => {
        el.textContent = this.#count.value  // auto-updates on signal change
      })
```

Signals are **inside DsdElement**, not a separate system. `registerSignal()` and `_hydrateSignals()` are methods on DsdElement.

---

## 5. Builder Pipeline

```
deno task build
    │
    ├─ [1/3] Route scanning
    │   ─ entry-descriptor.ts: scan app/routes/
    │   ─ entry-renderer.ts: generate SSR entry (Hono + renderRoute)
    │   ─ entry-generators.ts: generate client island bundles
    │
    ├─ [2/3] Client island build
    │   ─ Rolldown bundles island components (less-search, less-theme-toggle, etc.)
    │   ─ Output: www/dist/client/islands/*.js
    │
    └─ [3/3] Static site generation
        ─ Rolldown bundles SSR entry → single .mjs bundle
        ─ SSG engine imports bundle, calls renderRoute() for each page
        ─ renderRoute → renderDsd(pageTag, props) → __renderAppShell()
        ─ __renderAppShell → renderDsdTree + renderDsd("less-layout")
        ─ wrapInDocument() → dist/{locale}/{path}/index.html
```

---

## 6. Component Model

```
DsdElement
├── static styles       CSSStyleSheet
├── static props        Reactive properties
├── render()            Returns VNode tree (JSX)
├── signalRegistry      Map<name, Signal>
├── registerSignal()    Register a signal for CSR hydration
├── _hydrateSignals()   Attach effect() bindings to DSD DOM
├── _bindEvents()       Attach event listeners (data-on-click etc.)
└── connectedCallback() Triggers _hydrateSignals + _bindEvents
```

---

## 7. Key Data Flow

### Page Request (SSR)

```
Browser → GET /zh/guide/getting-started
    → Hono → app.get('*', __ssr())
        → __ssr() → renderDsd('page-getting-started', params)
            → render() → VNode
            → renderDsdTree(VNode) → HTML with nested CE rendered
        → __renderAppShell(pageHtml, '/zh/guide/getting-started')
            → renderDsdTree(jsx node) → page HTML
            → renderDsd('less-layout', props) → layout DSD
            → combine: layout.html + pageHtml + '</less-layout>'
        → wrapInDocument() → complete HTML response
```

### Static Generation (SSG)

```
build-ssg.ts
    → import SSR bundle → renderRoute('/zh/guide/getting-started')
        → renderDsdTree(jsx('page-getting-started', props))
        → __renderAppShell(pageVNode)
            → renderDsdTree(pageVNode)
            → renderDsd('less-layout', props)
        → wrapInDocument()
        → writeFileSync('dist/zh/guide/getting-started/index.html')
```

---

## 8. Dependency Graph

```
@lessjs/create ──→ @lessjs/app ──→ @lessjs/adapter-vite ──→ @lessjs/core
                       │                                           │
                       └── @lessjs/ui ─────────────────────────────┘
                       └── @lessjs/content ──→ @lessjs/core
                       └── @lessjs/i18n ──→ @lessjs/core
                       └── @lessjs/router ──→ @lessjs/core
                       └── @lessjs/signals ────────────────── (zero deps)
                       └── @lessjs/runtime ──→ core + signals + style-sheet
```

Published to JSR. Zero node:* imports in core. Works in Deno, Node, Bun, Edge.

---

## 9. API Surface (v0.27.0)

### Public (root export)

```ts
import {
  DsdElement, // Base class
  Fragment, // JSX fragment
  renderDsd, // One function to rule them all
  renderToString, // Sync VNode→HTML (no nested CE)
} from '@lessjs/core';
```

### Compiler Protocol (jsx-runtime subpath)

```ts
import { For, jsx, jsxDEV, jsxs, Show } from '@lessjs/core/jsx-runtime';
```

### Internal (not publicly exported)

```
renderDsdTree     // VNode tree walk with inline CE rendering
renderDsdByName   // Thin wrapper, kept for backward compat
```

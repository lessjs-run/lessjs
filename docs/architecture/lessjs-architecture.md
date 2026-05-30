# LessJS Architecture — DSD-Native SSR/SSG Framework

> **Version**: v0.28.0 (target)
> **Status**: Architecture Definition
> **Date**: 2026-05-31
> **Author**: LessJS Architecture Team
> **Supersedes**: ADR-0058, ADR-0062, ADR-0065, ADR-0066
> **Related**: ADR-0057 (JSX+Signal), ADR-0059 (Show/For), ADR-0063 (Router)
>
> This document is the **single source of truth** for the LessJS architecture.
> It replaces all previous architecture ADRs that described partial or transitional states.

---

## Table of Contents

1. [Positioning](#1-positioning)
2. [Ocean + Island Model](#2-ocean--island-model)
3. [Architecture Layers](#3-architecture-layers)
4. [Rendering Pipeline](#4-rendering-pipeline)
5. [Signal-Native Hydration](#5-signal-native-hydration)
6. [SSG/SSR Dual Mode](#6-ssgssr-dual-mode)
7. [Component Model](#7-component-model)
8. [Control Flow (Show/For)](#8-control-flow-showfor)
9. [Router](#9-router)
10. [i18n](#10-i18n)
11. [Styling](#11-styling)
12. [Industry Comparison](#12-industry-comparison)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [FAQ](#14-faq)

---

## 1. Positioning

### LessJS is a DSD-native SSR/SSG framework

- **DSD-native**: Uses Declarative Shadow DOM (`<template shadowrootmode="open">`) as the serialization format. Browser creates real DOM from HTML with zero JavaScript.
- **SSR/SSG dual-mode**: Same `renderToString()` function. Called at build time → SSG (static files). Called at request time → SSR (dynamic data).
- **Signal-driven**: All interactive state is managed by signals (`@lessjs/signals`, powered by alien-signals). Signal changes trigger atomic DOM updates without virtual DOM or reconciliation.
- **Zero-JS by default**: Static pages (no signals) ship zero client JavaScript. Islands (pages with signals) ship ~2KB (alien-signals + hydration logic).

### What LessJS is NOT

- **NOT a virtual DOM framework**: No VNode diff, no reconciliation, no `effect(() => render())` cycle.
- **NOT SSG-only**: While SSG is the default output mode, `renderToString()` is a pure function that can be called at request time for SSR.
- **NOT a multi-framework island system**: LessJS has one component model (DsdElement + JSX + signals). No React/Vue/Svelte adapters in the island layer.

---

## 2. Ocean + Island Model

### Core Concept

Every page is composed of two kinds of content:

| | Ocean | Island |
|---|---|---|
| **What it is** | Static content, never changes after render | Interactive content, has state |
| **Has signals?** | ❌ No signals | ✅ Uses `signal()` / `computed()` |
| **Rendering** | Pure DSD HTML | DSD HTML + `data-signal` / `data-on` markers |
| **Client JS** | **0 bytes** | alien-signals (~1.6KB) + `_hydrateSignals()` (~0.4KB) |
| **SSG output** | Static HTML file | Static HTML file + `<script type="module">` |
| **SSR output** | HTML per request | HTML per request + `<script type="module">` |
| **Examples** | `/guide/core-concepts`, `/blog/*`, `/docs/*` | Home page (counter), search page, i18n layout |

### How the framework decides

The framework knows at build/request time whether a page needs client JS:

```
renderToString(component) → check: does this VNode tree contain any signals?
  ├── NO  → Ocean. Output pure DSD HTML. No <script> tags.
  └── YES → Island. Output DSD HTML + <script type="module" src="/client/islands/client.js">
```

This is **static analysis at render time** — not a heuristic, not a guess. The `renderToString()` function encounters `isSignalLike()` during serialization. If any prop or child is a signal, the page is an island.

### Island Detection Markers

Islands are explicitly declared via **two directory conventions** (user-visible) and **automatic detection** (framework-internal):

**User-visible**:

```
www/
  app/
    islands/           ← Island components (have signals)
      home-console.tsx
      less-search.tsx
      less-toc.tsx
      reactive-showcase.tsx
    ocean/             ← Ocean components (pure DSD, no signals) [OPTIONAL]
      page-layout.tsx
      docs-content.tsx
```

The `islands/` directory is the **source of truth** for which components may contain signals. Ocean components can live anywhere in `app/` — they are the default.

**Framework-internal**: `renderToString()` automatically detects signal presence. No manual opt-in required.

### Per-Page JS Budget

```
/guide/core-concepts          → 0 KB          (Ocean)
/                             → ~2 KB         (Island: home-console)
/en/guide/getting-started     → ~2 KB         (Island: less-layout i18n)
/registry                      → ~2 KB         (Island: less-search)
/guide/islands-and-ssr        → ~2 KB         (Island: reactive-showcase)
```

---

## 3. Architecture Layers

LessJS has exactly **three layers**, cleanly separated:

```
┌─────────────────────────────────────────────────────────┐
│                     Layer 3: DOM                         │
│                                                         │
│  DSD HTML → Browser creates real DOM                     │
│  Signal changes → effect() → atomic DOM update           │
│  Zero virtual DOM, zero reconciliation                   │
│                                                         │
│  Representation: <span data-signal="count">42</span>     │
│                  <button data-on-click="increment">+</button> │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ effect() bindings
                           │
┌─────────────────────────────────────────────────────────┐
│                    Layer 2: Signal                       │
│                                                         │
│  signal(42)         → fine-grained reactive state        │
│  computed(() => x)  → derived state                     │
│  effect(() => ...)  → side effect (DOM update)           │
│                                                         │
│  Engine: alien-signals (1.6KB)                          │
│  Wrapper: @lessjs/signals (alien-engine.ts)             │
│                                                         │
│  Signal is the ONE source of truth for ALL state.        │
│  No `this.setState()`, no `useState()`, no `@state`.    │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ signal() calls in constructors
                           │
┌─────────────────────────────────────────────────────────┐
│                   Layer 1: Component                     │
│                                                         │
│  DsdElement — Custom Element with DSD lifecycle          │
│                                                         │
│  render()          → JSX → VNode (called ONCE, at SSR)  │
│  connectedCallback → _hydrateSignals() (called ONCE)    │
│  disconnectedCallback → dispose effects                 │
│                                                         │
│  SSR: renderToString(vnode) → DSD HTML + data-* markers │
│  CSR: _hydrateSignals(root) → effect bindings            │
└─────────────────────────────────────────────────────────┘
```

### Key Principle: `render()` is called EXACTLY ONCE

During SSR (build time or request time). Never on the client. The returned VNode tree is serialized to DSD HTML with `data-signal` markers. Client-side hydration reads those markers and creates effect bindings. Signal changes trigger effects directly — `render()` is never re-invoked.

This eliminates the `effect(() => render())` cycle that ADR-0058 identified as the root cause of the VDOM/re-render loop.

---

## 4. Rendering Pipeline

### Single Pipeline, Two Outputs

```
                       JSX Source
                           │
                    Deno TS compiler
                    (jsxImportSource: "@lessjs/core")
                           │
                      VNode tree
                    { tag: 'span', props: { textContent: <Signal> }, children: [] }
                           │
                    renderToString()
                    (pure function, ~250 lines)
                           │
              ┌────────────┴────────────┐
              │                         │
         Build time                 Request time
         (SSG)                      (SSR)
              │                         │
         Static HTML                Dynamic HTML
         + data-signal              + data-signal
         + data-on                  + data-on
              │                         │
         Deploy to CDN              Serve via
         (Cloudflare Pages)         Deno Deploy / CF Workers
              │                         │
              └────────────┬────────────┘
                           │
                    Browser parses HTML
                    DSD → creates shadow DOM
                           │
                    client.js loads
                    (only for Island pages)
                           │
                    _hydrateSignals(root)
                     ├── querySelector('[data-signal]') → effect()
                     └── querySelector('[data-on-click]') → addEventListener()
                           │
                    Signal changes → effect fires → DOM updates
```

### What gets DELETED

| Legacy Code | Reason | Replacement |
|---|---|---|
| `_walkAndBind()` | Position-matching VNode→DOM (fragile) | `_hydrateSignals()` — marker-driven |
| `_layoutWorkaroundReRender()` | Chromium DSD layout hack (destroys effects) | `requestAnimationFrame(() => void (this as HTMLElement).offsetHeight)` |
| `effectScope()` in hydration | Alien-signals scope blocks nested effect firing | `Set<dispose>` manual tracking |
| `@lessjs/core/navigation` module | Hand-written navigation API | `@lessjs/router` Router.start() |
| `renderToString` / `renderToDom` dual renderer | Two diverging implementations | `renderToString` is the ONE renderer; `renderToDom` used only for CSR island creation (Show/For) |

### SSR Markers

```html
<!-- Static content: no markers needed -->
<div class="container">
  <h1>Getting Started</h1>
  <p>LessJS is a DSD-native framework...</p>
</div>

<!-- Signal-bound content: data-signal marker -->
<span class="counter-value" data-signal="count">42</span>

<!-- Event-bound element: data-on marker -->
<button data-on-click="increment">+</button>

<!-- Conditional rendering: SSR evaluated, marker preserved -->
<!-- When show=false, the div is not in the HTML -->
<!-- When client sets signal to true, Show component creates the DOM -->
```

### Why markers, not position matching

| Position Matching (old) | Marker Matching (new) |
|---|---|
| VNode + DOM parallel traversal | `querySelector('[data-signal]')` |
| Assumes index alignment | Reads attribute value |
| Breaks on comments/whitespace | Immune to DOM structure changes |
| Requires filtering childNodes | Direct lookup |
| ~60 lines of fragile code | ~30 lines of robust code |

---

## 5. Signal-Native Hydration

### Hydration Function

```ts
/**
 * Hydrate DSD DOM with signal bindings.
 * Replaces _walkAndBind — eliminates position matching.
 *
 * Called once in connectedCallback. Reads data-signal and data-on
 * markers from DSD shadow root, creates effect bindings.
 * Effects are tracked in #effectDisposers for batch cleanup.
 */
private _hydrateSignals(): void {
  if (!this.shadowRoot) return;

  // Dispose previous effects
  for (const d of this.#effectDisposers) d();
  this.#effectDisposers.clear();

  // Signal bindings: data-signal="name"
  for (const el of this.shadowRoot.querySelectorAll('[data-signal]')) {
    const name = el.getAttribute('data-signal')!;
    const sig = this.signalRegistry.get(name);
    if (!sig) continue;

    // Apply initial value
    (el as HTMLElement).textContent = String(sig.value);

    // Create effect for future changes
    const dispose = effect(() => {
      (el as HTMLElement).textContent = String(sig.value);
    });
    this.#effectDisposers.add(dispose);
  }

  // Event bindings: data-on-click="methodName"
  const eventAttrs = ['click', 'input', 'change', 'submit', 'keydown'];
  for (const event of eventAttrs) {
    for (const el of this.shadowRoot.querySelectorAll(`[data-on-${event}]`)) {
      const method = el.getAttribute(`data-on-${event}`)!;
      const handler = (this as any)[method]?.bind(this);
      if (handler) {
        el.addEventListener(event, handler);
        // Store for cleanup
        this.#eventCleanups.push(() => el.removeEventListener(event, handler));
      }
    }
  }

  // Chromium DSD layout fix: force layout without DOM rebuild
  requestAnimationFrame(() => {
    void (this as HTMLElement).offsetHeight;
  });
}
```

### Effect Lifecycle

```
connectedCallback:
  _hydrateSignals()
    ├── effect created (signal → DOM textContent)
    ├── stored in #effectDisposers
    └── signal changes → effect fires → DOM updates ✅

disconnectedCallback:
  for (d of #effectDisposers) d()    ← batch dispose
  #effectDisposers.clear()
  for (f of #eventCleanups) f()      ← remove listeners
  #eventCleanups = []
```

**No effectScope. No alien-signals scope interference.** Effects run at top level, signal changes always trigger, dispose is manual and explicit.

### Component Setup

```ts
class HomeConsole extends DsdElement {
  #count = signal(0);

  constructor() {
    super();
    // Register signals for hydration lookup
    this.registerSignal('count', this.#count);
  }

  override connectedCallback() {
    super.connectedCallback();  // calls _hydrateSignals()
    // ...theme context subscription...
  }

  override render() {
    return (
      <div class="counter">
        <span class="counter-value" data-signal="count" textContent={this.#count}></span>
        <button data-on-click="decrement">-</button>
        <button data-on-click="increment">+</button>
      </div>
    );
  }

  decrement() { this.#count.value--; }
  increment() { this.#count.value++; }
}
```

**`render()` is called ONCE (SSR). `_hydrateSignals()` is called ONCE (client). After that, signals own the DOM.**

---

## 6. SSG/SSR Dual Mode

### Same Function, Two Call Timings

```ts
// packages/core/src/jsx-render-string.ts
export function renderToString(vnode: VNode): string {
  // ... ~250 lines of pure string manipulation ...
  // NO side effects, NO network, NO filesystem
  return htmlString;
}
```

```
            renderToString(vnode)
                  │
      ┌───────────┴───────────┐
      │                       │
  Build time              Request time
  (deno task build)       (Hono route handler)
      │                       │
  Write to dist/           Response.body = html
  Static HTML files        Dynamic HTML
  (Cloudflare Pages)       (Deno Deploy / CF Workers)
```

### SSG Mode (Default)

```bash
deno task build:docs
# → renderToString() called for each route
# → HTML files written to dist/
# → Deploy static files
```

### SSR Mode (Per-Request)

```ts
// app/routes/index.tsx
import { renderToString } from '@lessjs/core/render-string';
import HomePage from './index.tsx';

export default async function handler(req: Request): Promise<Response> {
  const vnode = HomePage.render();
  const html = renderToString(vnode);
  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
}
```

### Hybrid Mode (Same Project, Mixed)

```
/                    → SSR  (dynamic counter data from API)
/guide/*             → SSG  (static documentation)
/blog/*              → SSG  (static blog posts)
/api/term            → API  (Hono route)
```

This is identical to Astro's `output: 'hybrid'` model. Static pages are pre-rendered at build time. Dynamic pages render at request time. Same `renderToString()` for both.

### Dev Server

In development, **every page is SSR**. Vite dev server calls `renderToString()` on every request — this is how you get HMR without rebuilding static files.

---

## 7. Component Model

### DsdElement — The Only Component Base Class

```ts
abstract class DsdElement extends HTMLElement {
  // Signal management
  protected signalRegistry: Map<string, Signal<unknown>>;
  protected registerSignal(name: string, sig: Signal<unknown>): void;

  // Effect tracking (batch dispose)
  #effectDisposers: Set<() => void>;
  #eventCleanups: Array<() => void>;

  // Lifecycle
  abstract render(): VNode | string | null;
  connectedCallback(): void;     // calls _hydrateSignals()
  disconnectedCallback(): void;  // batch dispose effects + events

  // Hydration
  private _hydrateSignals(): void;   // marker-driven, replaces _walkAndBind
  private _hydrateLayout(): void;    // RAF offsetHeight for Chromium bug

  // Styles
  static styles: StyleSheetLike[];
}
```

### Component Contract

1. **`render()` returns JSX** — called exactly once (SSR). No re-renders.
2. **Signals registered in constructor** — `this.registerSignal('name', this.#signal)`.
3. **Markers in JSX** — `data-signal="name"`, `data-on-click="method"`.
4. **Methods for events** — `decrement()`, `increment()`, `_onSearch()`, etc.
5. **No `attributeChangedCallback`** — signals replace observed attributes.

### Ocean Component (no signals)

```ts
class DocsPage extends DsdElement {
  override render() {
    return (
      <less-layout>
        <div class="container">
          <h1>Getting Started</h1>
          <p>Static content...</p>
        </div>
      </less-layout>
    );
  }
}
// Zero signals → Ocean → 0 KB client JS
```

### Island Component (with signals)

```ts
class HomeConsole extends DsdElement {
  #count = signal(0);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override render() {
    return (
      <div class="counter">
        <span data-signal="count" textContent={this.#count}></span>
        <button data-on-click="decrement">-</button>
        <button data-on-click="increment">+</button>
      </div>
    );
  }

  decrement() { this.#count.value--; }
  increment() { this.#count.value++; }
}
// Has signals → Island → ~2 KB client JS
```

---

## 8. Control Flow (Show/For)

Conditional and list rendering are handled by **runtime DOM managers**, not virtual DOM diffing.

### Show (conditional)

```tsx
<Show when={this.#open}>
  <div class="overlay">
    <input onInput={this._onSearch} />
    <div class="results">{this.#results.map(r => <Item r={r} />)}</div>
  </div>
</Show>
```

**SSR**: When `when=false`, Show outputs nothing. When `when=true`, outputs the children as DSD HTML.

**CSR**: Show creates an `effect()`:
```ts
effect(() => {
  if (when.value) {
    if (!mounted) { createDOM(); parent.appendChild(dom); mounted = true; }
  } else {
    if (mounted) { dom.remove(); mounted = false; }
  }
});
```

### For (list)

```tsx
<For each={this.#items}>
  {(item, index) => <li data-signal={`item-${index}`}>{item.name}</li>}
</For>
```

**SSR**: Outputs the initial list as DSD HTML with `data-signal` markers per item.

**CSR**: For creates an `effect()` that reconciles items by key:
```ts
effect(() => {
  const newItems = each.value;
  // Add new items, remove stale items, update existing items
  // Uses Map<key, DOMNode> for tracking
});
```

### Why Show/For, not VDOM diff

| VDOM diff | Show/For |
|---|---|
| Generic tree diff algorithm | Semantic — knows it's a condition or a list |
| O(n) tree walk on every change | O(1) mount/unmount or O(n) keyed reconciliation |
| Needs full VNode tree | Only needs the signal value |
| Handles all cases (over-engineered) | Handles the specific case (correct by construction) |

This is the **SolidJS approach**: signals drive semantic control flow, not generic VDOM reconciliation.

---

## 9. Router

### Single Router Instance

```tsx
class LessLayout extends DsdElement {
  #router = new Router({ locales: ['en', 'zh'], defaultLocale: 'en' });

  override connectedCallback() {
    super.connectedCallback();
    this.#router.start({
      contentLoader: async (path) => {
        const resp = await fetch(path);
        const html = await resp.text();
        const tmp = new DOMParser().parseFromString(html, 'text/html').body;
        const newLayout = this._findLessLayout(tmp);  // recursive DSD search
        // adopt + move children
        while (this.firstChild) this.removeChild(this.firstChild);
        for (const child of Array.from(newLayout.children)) {
          this.appendChild(document.adoptNode(child));
        }
      },
    });
  }
}
```

### What Router Handles

- **Click delegation**: All `<a>` clicks in shadow DOM → preventDefault → pushState → contentLoader
- **Navigation API intercept**: `navigation.addEventListener('navigate', e => e.intercept(...))`
- **Popstate**: Back/forward browser buttons
- **Locale switching**: `lang-switch` button → `replaceTo('/zh/...')` (no history entry)
- **Scroll restoration**: After content swap

### What was DELETED

- `@lessjs/core/navigation` module (entire file — 75 lines)
- `navigation.navigate()` → real browser navigation
- `onNavigate()` → post-navigation callback (too late for SPA)
- `_setupNavDelegation()` in less-layout

---

## 10. i18n

### Locale is a Signal

```ts
// In less-layout
#locale = signal('en');

// SSR: renderToString uses current locale
// CSR: lang-switch button changes #locale.value
// Effect: locale change → update <html lang="">, document title, visible content
```

### Lang-Switch

```html
<button data-on-click="switchToZh">中文</button>
<button data-on-click="switchToEn">EN</button>
```

```ts
switchToZh() {
  this.#router.navigateTo('/zh' + currentPath);  // SPA, no reload
}
```

### SSR i18n

```ts
// Route handler
export function render(req: Request) {
  const locale = extractLocale(req);  // from URL path or Accept-Language
  const vnode = Page.render({ locale });
  return renderToString(vnode);
}
```

---

## 11. Styling

### Design System

- **Open Props**: All design tokens via `openPropsTokenSheet`. No hardcoded values.
- **Shadow DOM encapsulation**: Styles are scoped to the component. No global CSS leakage.
- **Theme**: `data-theme` attribute on `<html>` propagated to all shadow roots.

### Component Styles

```ts
class HomeConsole extends DsdElement {
  static override styles = [
    openPropsTokenSheet,
    css`
      .counter {
        display: flex;
        gap: var(--size-2);
      }
      .counter-value {
        font-size: var(--font-size-3);
        font-weight: var(--font-weight-bold);
      }
    `,
  ];
}
```

**Zero hardcoded values.** All dimensions, colors, typography are Open Props tokens.

---

## 12. Industry Comparison

### Pipeline Comparison

| | SolidJS | Fresh 2.x | Astro | LessJS |
|---|---|---|---|---|
| **Compile** | Babel (4000 lines) | Deno native | Vite | **Deno native** |
| **SSR Engine** | solid-js SSR | Preact renderToString | Multi-framework | **renderToString (250 lines)** |
| **Initial DOM** | template().cloneNode() | SSR HTML | SSR HTML | **DSD (browser zero-JS)** |
| **Hydration** | None needed (create=bind) | reviver + Preact hydrate | Per-framework hydrate | **_hydrateSignals (30 lines)** |
| **0 JS Page** | ✅ | ✅ (v2.3+) | ✅ | ✅ |
| **Island JS** | solid-js runtime | Preact + signals | Per-framework runtime | **alien-signals (~1.6KB)** |
| **Encapsulation** | None (global DOM) | None (global HTML) | None (global) | **Shadow DOM** |
| **SSG/SSR** | SSG only | SSR only | Hybrid | **Hybrid (SSG default, SSR opt-in)** |

### Why DSD is the Architectural Advantage

Every other framework needs to **create** the initial DOM. SolidJS clones templates. Fresh and Astro send SSR HTML that the client must hydrate by matching against a framework runtime's component tree.

LessJS's DSD means the **browser creates the shadow DOM from HTML during parsing** — before any JavaScript loads. The client's only job is to find `data-signal` markers and bind effects. This eliminates:

1. The template cloning step (SolidJS)
2. The Preact hydration step (Fresh)
3. The per-framework adapter layer (Astro)

### Signal Engine Comparison

| | @preact/signals | alien-signals | TC39 Proposal |
|---|---|---|---|
| **API** | `signal.value` (property) | `s()` (function call) | `s.get()` / `s.set()` |
| **Size** | ~2.5KB | ~1.6KB | Native (0KB) |
| **effect()** | ✅ | ✅ | Framework implements |
| **Batch** | `batch()` | `startBatch/endBatch` | N/A |
| **Production Use** | Preact ecosystem | Vue 3.6, XState | Stage 1 |
| **LessJS Choice** | N/A | ✅ Current | Future target |

Alien-signals is chosen for: smallest bundle size, Vue core author pedigree, TC39 alignment path via `createReactiveSystem()`.

---

## 13. Implementation Roadmap

### Phase 1: Hydration Rewrite (v0.28.0)

| Step | Task | Files | Lines |
|---|---|---|---|
| 1 | Add `signalRegistry` + `registerSignal()` to DsdElement | `dsd-element.ts` | +15 |
| 2 | Implement `_hydrateSignals()` | `dsd-element.ts` | +40 |
| 3 | Add `data-on-click/input/change/submit` to `renderToString()` | `jsx-render-string.ts` | +10 |
| 4 | Replace `_hyrateExistingDom` to call `_hydrateSignals()` | `dsd-element.ts` | -60 +10 |
| 5 | DELETE `_walkAndBind()` | `dsd-element.ts` | -80 |
| 6 | DELETE `_layoutWorkaroundReRender()` | `dsd-element.ts` | -12 |
| 7 | DELETE `effectScope` import + usage | `dsd-element.ts` | -5 +3 |
| 8 | Add `#effectDisposers` + `#eventCleanups` tracking | `dsd-element.ts` | +10 |
| 9 | Migrate components to `registerSignal()` + `data-on-*` | `www/app/islands/*.tsx` | ~20/component |
| 10 | Build + Playwright e2e verification | CI | — |

### Phase 2: SSG/SSR Dual Mode (v0.29.0)

| Step | Task |
|---|---|
| 1 | SSR entry point (Hono route calling renderToString at request time) |
| 2 | `deno task serve:dynamic` (SSR dev server) |
| 3 | `deno task build:static` (SSG build → dist/) |
| 4 | Cloudflare Pages Functions / Deno Deploy adapter |
| 5 | Hybrid routing: per-route SSG/SSR opt-in |

### Phase 3: Control Flow (v0.30.0)

| Step | Task |
|---|---|
| 1 | `Show` component — effect-driven DOM mount/unmount |
| 2 | `For` component — keyed list reconciliation |
| 3 | SSR: `Show`/`For` output DSD HTML + data-signal markers |
| 4 | CSR: Show/For effect management with dispose tracking |

### Phase 4: Clean Architecture (v0.31.0+)

| Step | Task |
|---|---|
| 1 | DELETE remaining `renderToDom` usage in hydration path |
| 2 | DELETE `_renderIntoShadowRoot` effect cycle |
| 3 | Audit and remove all dead code |
| 4 | TC39 Signals proposal alignment (when Stage 2+) |

---

## 14. FAQ

### Q: Why not use React/Vue model (VDOM + diff)?

VDOM adds complexity without benefit when you have DSD. DSD already gives you real DOM. Signal→DOM direct binding is simpler and faster for fine-grained updates.

### Q: Is `data-signal` a proprietary protocol?

No. `data-*` attributes are a W3C standard (HTML5). Any tool, browser extension, or testing framework can read them. The values are plain signal names — no framework-specific encoding.

### Q: What about complex UI with many interacting signals?

SolidJS has proven that signal-driven fine-grained updates scale to production apps. Each signal's effect is independent — changing one signal only updates the DOM nodes bound to it. No cascading re-renders.

### Q: How do you handle forms?

Form inputs use `data-on-input` markers or direct signal binding via the `value` prop. The signal tracking works the same as `textContent`.

### Q: What if alien-signals has a bug?

The `@lessjs/signals` wrapper (`alien-engine.ts`) provides an abstraction layer. Swapping the engine requires changing one file (~50 lines). Preact signals or a future TC39 native implementation can be swapped in.

---

## Appendix A: Deleted Code Summary

| File | Code | Reason |
|---|---|---|
| `packages/core/src/dsd-element.ts` | `_walkAndBind()` (~80 lines) | Position matching → marker matching |
| `packages/core/src/dsd-element.ts` | `_layoutWorkaroundReRender()` (~12 lines) | DOM rebuild → RAF layout |
| `packages/core/src/dsd-element.ts` | `effectScope` usage (~10 lines) | Alien scope blocks effects → Set<dispose> |
| `packages/core/src/navigation.ts` | Entire file (~75 lines) | Hand-written nav → Router.start() |
| `packages/core/src/index.ts` | `navigation` re-exports (~3 lines) | Dead exports |
| `packages/core/deno.json` | `./navigation` subpath | Dead subpath |
| `packages/adapter-vite/deno.json` | `@lessjs/core/navigation` alias | Dead alias |
| `packages/ui/deno.json` | `@lessjs/core/navigation` alias | Dead alias |
| Multiple files | `data-less-*` attributes | Brand prefix → `data-signal` / `data-on` |
| Multiple files | `_signalRegistry` / `_registerSignal` | Underscore prefix → `signalRegistry` / `registerSignal` |

## Appendix B: Document Map

| Document | Purpose |
|---|---|
| **This file** | Architecture definition (single source of truth) |
| `docs/adr/0058-real-dom-signal-binding.md` | Signal→DOM binding decision (historical record) |
| `docs/adr/ADR-0062-dsd-first-rdom-signal-architecture.md` | DSD-first RDOM analysis (historical record) |
| `docs/adr/ADR-0065-unified-vnode-pipeline.md` | VNode unification attempt (historical record) |
| `docs/adr/ADR-0066-signal-native-hydration.md` | Hydration rewrite proposal (historical record) |
| `docs/conversation/unified-vnode-model.md` | Architecture discussion (reference) |

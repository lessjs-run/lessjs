# LessJS Signal→DOM Architecture Research

**Date**: 2026-05-30  
**Scope**: Migration from VDOM `effect(() => render())` to DSD-first RDOM with per-prop signal bindings  
**Baseline**: v0.26.1 codebase

---

## 1. System Overview

LessJS currently uses a dual-path rendering strategy:

```
SSR → DSD <template shadowrootmode> → browser attaches shadow DOM
                                       ↓
                              _renderOrHydrate()
                                       ↓
                    ┌──────────────────┴──────────────────┐
                    ↓                                      ↓
           _hyrateExistingDom()                   _renderIntoShadowRoot()
           (DSD path — DOM exists)                (CSR path — no DOM yet)
                    ↓                                      ↓
           _walkAndBind() + applyProps          renderToDom() + applyProps
           effect(() => render())               (creates real DOM)
```

The `effect(() => render())` in `_hyrateExistingDom()` (dsd-element.ts:327-340) is currently **required** for correctness. ADR-0058 attempted to remove it but was reverted as a hotfix.

---

## 2. Signal Access Points — Taxonomy

### 2.1 Signal → Value → VNode Attribute (attribute-only, bindable)

These are **properly handled** by `applyProps` signal detection (jsx-render-dom.ts:169-178):

| Component | Signal | Usage in JSX |
|-----------|--------|-------------|
| home-console | `computed(#graphTabClass)` | `class={this.#graphTabClass}` |
| home-console | `computed(#counterTabClass)` | `class={this.#counterTabClass}` |
| home-console | `computed(#graphPaneClass)` | `class={this.#graphPaneClass}` |
| home-console | `computed(#counterPaneClass)` | `class={this.#counterPaneClass}` |

**How it works**: The computed signal object itself is the prop value → `isSignalLike(value)` returns true → `effect()` binds signal → only that attribute updates.

### 2.2 Signal → Value → VNode Text Child (attribute-only after unwrap, CSR-fixed)

These go through `renderToDom` signal detection (jsx-render-dom.ts:211-218):

| Component | Signal | Usage in JSX |
|-----------|--------|-------------|
| counter-island | `signal(#count)` | `{this.#count}` |
| home-console | `signal(#count)` | `{this.#count}` |
| home-console | `computed(#tabTitle)` | `{this.#tabTitle}` |

**How it works**: `isSignalLike(childNode)` → creates reactive `TextNode` via `effect()`.  
**DSD gap**: In DSD, the text was rendered via SSR as a static string. The `effect(() => render())` replaces it with the CSR reactive TextNode. Without it, text would never update.

### 2.3 Signal → Value → Computed in render() → VNode Attribute (STRUCTURAL — NOT bindable)

These are the **critical problem** — signal.value is read during `render()`, producing a plain value:

| Component | Signal Access | VNode Output |
|-----------|--------------|-------------|
| less-theme-toggle | `this._theme.value === 'light' ? ' is-light' : ''` | `className="theme-toggle"` or `className="theme-toggle is-light"` |
| less-theme-toggle | `this._theme.value === 'light' ? 'Switch to dark theme' : 'Switch to light theme'` | `title="Switch to dark theme"` or `title="Switch to light theme"` |

**Why it's structural**: The decision tree (ternary) is in render(), so the VNode attribute value is **already resolved**. `applyProps` receives `className="theme-toggle is-light"` (a plain string), not a signal. No automatic binding is possible.

### 2.4 No Signal Access in Render

| Component | Notes |
|-----------|-------|
| less-layout | All state from attributes (`getAttribute()`, `_getStr()`, `_getBool()`). No signals in render(). |
| page-styles | Pure CSS string, no signals. |

### 2.5 Summary Distribution

```
                    Structural (2.3)
                    ┌──────────┐
                    │ Theme    │
                    │ Toggle   │  ← 1 component, 2 accesses
                    └──────────┘

         Attribute-only (2.1)        Text child (2.2)
         ┌─────────────────┐        ┌───────────────┐
         │ HomeConsole     │        │ HomeConsole   │
         │ 4 computed cls  │        │ tabTitle text │
         │ Counter         │   ← CSR-only
         │ Count text      │
         └─────────────────┘        └───────────────┘
```

---

## 3. `applyProps` Signal Binding — Deep Audit

### 3.1 Detection Chain (jsx-render-dom.ts:169-178)

```ts
if (isSignalLike(value)) {
  const dispose = effect(() => {
    const resolved = unwrapSignalLike(value.value);
    applyStaticProp(el, key, resolved);
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  continue;
}
```

**Correct**: Duck-type detects `{ value, subscribe }`. Creates `effect()` for auto-tracking.  
**Correct**: Cleanup via AbortController on component disconnect.  
**Correct**: Only that single attribute is modified — no VDOM diff, no full re-render.

### 3.2 Edge Cases — Present But Low-Risk

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | `applyStaticProp` returns early on `null` (line 99) — doesn't remove attribute | Medium | If signal produces `null` from non-null, attribute persists stale |
| 2 | `className`/`class` merging (line 112) — signal overwrites ALL classes via `setAttribute` | Medium | Static classes get lost if signal replaces className entirely (but current components pass single source-of-truth) |
| 3 | Style object properties that are signals (line 105) — `unwrapSignalLike` unwraps once but no effect binding for per-property signals | Low | No current component uses signal-valued style properties |
| 4 | Boolean attribute toggling (lines 115-121) — works correctly; `false` removes attribute, `true` sets empty | OK | — |

### 3.3 Edge Cases — Missing (High-Risk)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| **M1** | **No signal tracking inside render() body** — `isSignalLike` only detects signals passed as prop VALUES. If `render()` reads `signal.value` and computes a derived value (ternary, string interpolation), the result is a plain value, invisible to `applyProps`. | **CRITICAL** | Theme toggle, any component reading signal.value inside render() |
| **M2** | **DSD text children are static** — SSR produces `{this.#count}` as a text string like `"42"`. DSD shadow DOM has `<span class="count">42</span>`. `_walkAndBind` applies props but does NOT walk text nodes. No effect binding for text updates. | **HIGH** | Counter island, home-console tab title; text never updates in pure-DSD path |
| **M3** | **No initial-apply skip** — the effect fires on creation (immediately after `effect()`), so it's correct for CSR. But if DSD DOM already has the right value, the first fire is a no-op write. Not harmful, just wasteful. | LOW | Performance only |

---

## 4. Show/For Control Flow — DSD Hydration Analysis

### 4.1 Implementation (jsx-render-dom.ts)

**Show** (lines 237-263):
```ts
// Comment marker + effect() + DOM insertBefore/remove
const dispose = effect(() => swap());
```

**For** (lines 265-295):
```ts
// Comment marker + effect() + removeAll + renderEach
const dispose = effect(() => reconcile());
```

Both use `effect()` internally — they are inherently **reactive via signals**, not via VNode re-render.

### 4.2 DSD Hydration Path Compatibility

Current flow for DSD:
```
_hydrateExistingDom()
  → this.render() returns VNode
  → _walkAndBind(shadowRoot, result)  // binds events + signal→DOM
  → effect(() => render())  // CSR-style full re-render for structural signals
```

**Key finding**: In the DSD path, Show/For are **NOT** part of the hydrated DOM because:
1. SSR doesn't emit Show/For (they are runtime VNode directives, not HTML elements)
2. The DSD shadow DOM has the rendered output (e.g., the truthy branch of Show)
3. `_walkAndBind` only matches DOM nodes to VNode children — it never encounters Show/For

**Conclusion**: Show/For currently work ONLY because `effect(() => render())` replaces DSD content with CSR-rendered DOM, where `renderToDom()` processes Show/For VNodes. Without it, Show/For on DSD-hydrated components would be dead.

### 4.3 What's Needed for DSD-Native Show/For

If Show/For are to work in pure DSD (no CSR fallback):
1. The **rendered branch** must be in the DSD shadow DOM (SSR must process Show)
2. `_walkAndBind` must find the branch and wire the signal that controls Show
3. The Show/For effect must manipulate DOM that already exists, not create it fresh

Currently impossible — Show/For are CSR-only `renderToDom` pathways.

---

## 5. Browser Layout Bug: 0×0 Host Bounding Rect

### 5.1 Reproduction Chain

1. HTML server sends:
```html
<counter-island>
  <template shadowrootmode="open">
    <div class="counter">
      <button type="button">−</button>
      <span class="count">0</span>
      <button type="button">+</button>
    </div>
  </template>
</counter-island>
```

2. Browser parses HTML, encounters `<template shadowrootmode="open">`, attaches shadow root, populates DOM

3. **At this point**: Custom element is NOT yet defined/upgraded

4. Script loads, `customElements.define('counter-island', CounterIsland)` triggers upgrade

5. `connectedCallback()` fires:
   - `createRenderRoot()` detects existing shadowRoot with children → DSD path
   - `this.style.display = 'block'` (line 243)
   - `_applyStyles()` sets `adoptedStyleSheets`
   - `_renderOrHydrate()` → `_hyrateExistingDom()`

6. During upgrade, the browser has **already performed first layout** — the element was `display: inline` at that time

### 5.2 Why It's 0×0

Web Components spec default: custom elements are `display: inline` unless overridden.

Timeline:
```
t0:  Browser parses HTML, encounters <counter-island>
t1:  Browser attaches shadow root from DSD template
t2:  Browser performs initial layout (counter-island = display:inline, 0×0)
t3:  Script loads, customElements.define()
t4:  connectedCallback: this.style.display = 'block' (line 243)
t5:  adoptedStyleSheets applied (:host { display: block })
t6:  Browser does NOT re-layout automatically
```

The `display: block` CSS from adoptedStyleSheets IS applied, but the **layout was cached** at t2 when the element was `display: inline`.

### 5.3 What `effect(() => render())` Fixes

At line 327-340:
```ts
this._vnodeEffectDispose = effect(() => {
  const updated = this.render();
  while (this.shadowRoot!.firstChild) {
    this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
  }
  this.shadowRoot!.appendChild(
    renderToDom(updated, this._templateAbortController.signal),
  );
});
```

This:
1. Clears shadowRoot completely (DOM mutation → forces layout invalidation)
2. Appends fresh DOM via `renderToDom()` (another DOM mutation)
3. Browser now recalculates layout, sees `display: block` + real content dimensions

**Root cause**: The style fix `this.style.display = 'block'` (line 243) is applied **after** initial layout. The DOM mutation of clearing + re-populating the shadow root is what triggers the browser to re-layout.

### 5.4 Proper Fix

Instead of relying on `effect(() => render())` to trigger re-layout:

1. **Set `display: block` before attachShadow** — but this isn't possible because DSD shadow root is attached by the browser during parsing, before script execution.

2. **Force layout recalculation without DOM destruction**:
```ts
// After _applyStyles in createRenderRoot:
void this.offsetHeight; // Force synchronous layout reflow
```

3. **Use `contain: layout style` in CSS**:
```css
:host {
  display: block;
  contain: layout style;
}
```
This tells the browser the host's layout is independent of ancestors and content changes will trigger re-layout.

4. **CSS `min-height` as safety net**:
```css
:host {
  display: block;
  min-height: 1px;
}
```
Even if the computed height is wrong, `min-height: 1px` ensures at least a sliver is visible.

---

## 6. Component Migration Checklist

### counter-island.tsx

| Signal | Access Pattern | Category | Current Status |
|--------|---------------|----------|---------------|
| `#count` (signal<number>) | `{this.#count}` → JSX text child | Structural (text) | CSR: reactive TextNode via `renderToDom` (line 211). DSD: static text, requires `effect(() => render())` to update. |

**Migration to attribute-only**:
```tsx
// Before (structural — signal in text child)
<span class="count">{this.#count}</span>

// After (attribute-only — signal as prop)
<span class="count" data-value={this.#count}>
  {String(this.#count.value)}  // Initial SSR value
</span>
```
CSS: `span.count::after { content: attr(data-value); }`
But: `attr()` doesn't work for dynamic text in all browsers.  
**Recommendation**: Keep `{this.#count}` as-is. `renderToDom` creates reactive TextNode on CSR. For DSD, need a text-node-binding mechanism (see §7).

### home-console.tsx

| Signal | Access | Category | Migration |
|--------|--------|----------|-----------|
| `computed(#graphTabClass)` | `class={this.#graphTabClass}` | **Attribute-only** ✓ | Already correct — `applyProps` creates effect binding |
| `computed(#counterTabClass)` | `class={this.#counterTabClass}` | **Attribute-only** ✓ | Already correct |
| `computed(#graphPaneClass)` | `class={this.#graphPaneClass}` | **Attribute-only** ✓ | Already correct |
| `computed(#counterPaneClass)` | `class={this.#counterPaneClass}` | **Attribute-only** ✓ | Already correct |
| `computed(#tabTitle)` | `{this.#tabTitle}` → text child | Structural (text) | See text-child migration below |
| `#count` (signal<number>) | `{this.#count}` → text child | Structural (text) | See text-child migration below |

**tabTitle text migration**:
```tsx
// Before
<span class="rp-title">{this.#tabTitle}</span>

// After (data attr + CSS ::after)
<span class="rp-title" data-title={this.#tabTitle}>
  {this.#tabTitle.peek()}  {/* initial SSR value */}
</span>
// CSS: .rp-title::after { content: attr(data-title); }
```

**count text migration**:
```tsx
// Before
<span class="counter-value">{this.#count}</span>

// After (data attr + CSS)
<span class="counter-value" data-value={this.#count}>
  {String(this.#count.peek())}
</span>
// CSS: .counter-value::after { content: attr(data-value); }
```

**Caveat**: CSS `content: attr()` has limitations — no number formatting, no i18n. For complex text, a reactive TextNode mechanism is needed (see §8.1).

### less-theme-toggle.tsx

| Signal Access | Category | Pattern |
|--------------|----------|---------|
| `this._theme.value === 'light' ? ' is-light' : ''` | **Structural** (class toggling via className) | `render()` reads signal.value, computes string |
| `this._theme.value === 'light' ? 'Switch to dark theme' : 'Switch to light theme'` | **Structural** (title attribute) | `render()` reads signal.value, computes string |

**Migration — CSS-driven approach** (preferred):

```tsx
override render() {
  // No signal.value reads in render()!
  return (
    <button
      type="button"
      className="theme-toggle"
      part="toggle"
      aria-label="Toggle theme"
      data-theme={this._theme}  // ← signal passed as prop!
      onClick={() => this._handleToggle()}
    >
      <svg class="icon-sun" ...>...</svg>
      <svg class="icon-moon" ...>...</svg>
    </button>
  );
}
```

CSS:
```css
.theme-toggle { /* base */ }
.theme-toggle[data-theme="light"] .icon-sun { display: none; }
.theme-toggle[data-theme="light"] .icon-moon { display: block; }

/* title via pseudo-element */
.theme-toggle::after {
  /* For accessible title — use aria-label instead */
}
```

Or use Show/For:
```tsx
<button ... data-theme={this._theme}>
  <Show when={computed(() => this._theme.value === 'dark')}>
    <svg class="icon-sun" ...>...</svg>
  </Show>
  <Show when={computed(() => this._theme.value === 'light')}>
    <svg class="icon-moon" ...>...</svg>
  </Show>
</button>
```

But this requires Show to work in DSD path (currently doesn't — see §4).

**title attribute migration**: Use a `data-theme` attribute on the button, then set `aria-label` via `applyProps` signal binding:
```tsx
<button aria-label={computed(() => 
  this._theme.value === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
)}>
```
Wait — `aria-label` is an attribute, and computed is a signal. `applyProps` handles this! Just pass the computed signal directly as a prop.

### less-layout.tsx

**No signals in render()**. All state from attributes. No migration needed.

Migration score: **5/5** — no changes.

---

## 7. Architecture Gaps Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                    Current Architecture                          │
│                                                                  │
│  render()                                                        │
│    ↓                                                             │
│  VNode tree                                                      │
│    ↓                                                             │
│  ┌─────────────────┬──────────────────┬──────────────────────┐  │
│  │ Signal props    │ Static props     │ Text children        │  │
│  │ (applyProps)    │ (setAttribute)   │ (renderToDom text)   │  │
│  │ ✓ auto-binding  │ ✓ one-time       │ ← CSR: effect() ✓   │  │
│  │ ✓ CSR & DSD     │                  │   DSD: dead text     │  │
│  └─────────────────┴──────────────────┴──────────────────────┘  │
│                                                                  │
│  GAPS:                                                           │
│  1. DSD text children are static (no effect binding)             │
│  2. render()-body signal reads produce dead VNode values        │
│  3. DSD layout may produce 0×0 host without force-reflow        │
│  4. Show/For only work via CSR re-render, not DSD hydration     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 8. Recommendations — Path to Pure RDOM

### 8.1 DSD Text Node Binding

Add a `_walkAndBind` text-node path that creates TextNode effect bindings for DSD:

```ts
// In _walkAndBind, after the child loop:
if (vChild is Signal signal-valued text) {
  const existingTextNode = domChild.firstChild; // or create one
  effect(() => { existingTextNode.textContent = signal.value; });
}
```

### 8.2 Signal→Attribute Pattern for Derived Values

Components must pass **signal objects** directly as props, never read `.value` in render():

```tsx
// BAD — signal read in render()
className={this._theme.value === 'light' ? 'btn is-light' : 'btn'}

// GOOD — pass computed signal as prop
className={computed(() => 
  this._theme.value === 'light' ? 'btn is-light' : 'btn'
)}

// BEST — CSS-driven, no JS
// Use data-attr + CSS selectors to toggle states
<button data-theme={this._theme}>  // signal passed as prop
// CSS: button[data-theme="light"] { ... }
```

### 8.3 Layout Fix Without CSR Fallback

```ts
// In createRenderRoot, after DSD detection:
if (this.shadowRoot && this.shadowRoot.childNodes.length > 0) {
  // Force layout reflow after adoptedStyleSheets
  this._applyStyles(ctor);
  this.style.display = 'block';
  void this.offsetHeight;  // ← forces synchronous layout
}
```

Plus CSS safety net:
```css
:host {
  display: block;
  min-height: 1px;
  contain: layout style;
}
```

### 8.4 Show/For DSD Hydration

Two paths forward:

**A. SSR-time Show/For expansion** (simpler):
- During SSR, resolve Show/For signal values and render only the active branch
- DSD shadow DOM contains the resolved branch
- `_walkAndBind` wires signals to future Show/For state changes
- Requires Show/For to support both render-time (SSR) and hydrate-time (CSR) modes

**B. DSD comment-marker hydration** (more complete):
- SSR emits comment markers like `<!--show-->`
- `_walkAndBind` finds markers, creates Show/For effect that manipulates adjacent DOM
- Follows SolidJS/Svelte hydration pattern

### 8.5 Migration Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | DSD layout fix (force reflow) | 1 line | Eliminates layout bug, enables removing `effect(() => render())` |
| **P0** | less-theme-toggle CSs-driven rewrite | ~10 lines | Removes 2 structural signal accesses |
| **P1** | DSD text node binding in `_walkAndBind` | ~20 lines | Enables counter/text to update in DSD path |
| **P2** | Show/For SSR expansion | ~50 lines | Enables structural Show/For in DSD |
| **P3** | Computed-as-prop convention enforcement | Documentation | Prevents new structural accesses |

---

## 9. File Reference Index

| File | Lines of Interest | Content |
|------|------------------|---------|
| `packages/core/src/dsd-element.ts` | 277-341 | `_renderOrHydrate()`, `_hyrateExistingDom()` — hotfix at 312-340 |
| `packages/core/src/dsd-element.ts` | 225-272 | `connectedCallback()`, DSD detection, `display:block` fix at 243 |
| `packages/core/src/jsx-render-dom.ts` | 140-186 | `applyProps()` — signal detection + effect binding |
| `packages/core/src/jsx-render-dom.ts` | 197-338 | `renderToDom()` — Show/For/component/signal children |
| `packages/core/src/jsx-runtime.ts` | 30-54 | Show/For factory functions (VNode creators) |
| `packages/core/src/signal-like.ts` | 10-33 | `isSignalLike()` / `unwrapSignalLike()` duck-type detection |
| `packages/core/src/signal-context.ts` | 1-56 | Context API — signal-based provider/consumer pattern |
| `packages/core/src/vnode.ts` | 1-50 | VNode interface — 5 fixed fields, no diff |
| `packages/ui/src/less-theme-toggle.tsx` | 151-196 | `render()` — critical structural signal access at 152-153 |
| `packages/ui/src/less-layout.tsx` | 425-849 | `render()` → `_renderLayout()` — no signals in render() |
| `www/app/islands/home-console.tsx` | 141-357 | `render()` — 4 attribute-only + 2 structural signal accesses |
| `www/app/islands/counter-island.tsx` | 77-89 | `render()` — 1 structural text child signal access |
| `www/app/components/page-styles.ts` | 19-353 | `:host { display: block; }` at line 20 — CSS for host layout |

---

*Report generated by general-purpose-1 agent for the LessJS v0.26.1 RDOM migration research task.*

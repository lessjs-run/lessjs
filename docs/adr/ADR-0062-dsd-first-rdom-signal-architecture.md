# ADR-0062: DSD-First Real DOM Signal Architecture

> Status: PROPOSED\
> Date: 2026-05-30\
> Target: v0.26.1 (layout + theme-toggle) → v0.27 (text binding + Show/For DSD)\
> Revises: ADR-0058 (SOP-001) — Real DOM Signal Binding\
> Relates: ADR-0057 (JSX+Signal), ADR-0059 (Show/For), ADR-0060 (SignalContext)\
> Research: [signal-rdom-architecture-research.md](../conversation/v0.26.1/signal-rdom-architecture-research.md)

## Context

### What happened (2026-05-30)

`dev.lessjs.pages.dev` went blank. Git bisect traced to commit `7989e8e8` (ADR-0058), which removed `effect(() => render())` from `_hyrateExistingDom()`. Restoring it fixed the page, but raised the question: is the VDOM approach correct, or should LessJS adopt RDOM (Real DOM)?

Deep architecture research revealed two independent failure modes:

### Failure Mode 1: Browser Layout Bug (primary cause of blank screen)

| Step | What happens                                                             |
| ---- | ------------------------------------------------------------------------ |
| t0   | Browser parses HTML, encounters `<docs-home>`                            |
| t1   | Browser attaches shadow root from DSD template                           |
| t2   | Browser performs first layout: `<docs-home>` is `display:inline` → 0×0   |
| t3   | Script loads, `customElements.define()` triggers upgrade                 |
| t4   | `connectedCallback()`: `this.style.display = 'block'` + `_applyStyles()` |
| t5   | CSS rules apply, but **browser caches layout from t2** — host stays 0×0  |

The `effect(() => render())` "fixed" this accidentally: clearing shadow root + re-appending DOM forced layout invalidation. The actual fix is much simpler: **force synchronous reflow** after style application.

### Failure Mode 2: Structural Signal Access (only 1 component)

ADR-0058 assumed all components use per-prop signal bindings. Research found only 2 structural signal accesses, both in `less-theme-toggle.tsx`:

```tsx
// reads signal.value in render() — invisible to applyProps
className={this._theme.value === 'light' ? ' is-light' : ''}
title={this._theme.value === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
```

**`less-layout` has ZERO signals in `render()`** — it was never the cause. All its state comes from attributes.

### Component taxonomy

| Component         | Signal type                         | Count | Status                    |
| ----------------- | ----------------------------------- | ----- | ------------------------- |
| home-console      | attribute-only (computed→class)     | 4     | ✅ already RDOM           |
| home-console      | text child (signal→text)            | 2     | ⚠️ CSR-reactive, DSD dead |
| counter-island    | text child (signal→text)            | 1     | ⚠️ CSR-reactive, DSD dead |
| less-theme-toggle | structural (signal.value in render) | 2     | ❌ needs rewrite          |
| less-layout       | none                                | 0     | ✅ no signal access       |

## Decision

### Architecture principle

```
HTML = skeleton (DSD once, never rebuilt)
CSS  = visual state (data-* + CSS selectors)
JS   = data + atomic DOM updates + cross-component communication
```

### Implementation plan

#### P0: Layout fix (v0.26.1)

Replace `effect(() => render())` with a **forced reflow** after `_applyStyles`:

```typescript
// In connectedCallback(), after _applyStyles(ctor):
if (this.shadowRoot && this.shadowRoot.childNodes.length > 0) {
  void this.offsetHeight; // Force browser to recalculate layout
}
```

Plus CSS safety net in `openPropsTokenSheet`:

```css
:host {
  display: block;
  min-height: 1px;
  contain: layout style;
}
```

#### P0: Theme-toggle CSS rewrite (v0.26.1)

Replace signal.value reads with CSS-driven visual state:

```tsx
// Before (broken)
className={this._theme.value === 'light' ? ' is-light' : ''}

// After (CSS-driven)
data-theme={this._theme} // signal passed as prop → applyProps binds effect
```

```css
.theme-toggle[data-theme='light'] .icon-sun {
  display: none;
}
.theme-toggle[data-theme='light'] .icon-moon {
  display: block;
}
```

#### P1: DSD text node binding (v0.26.1 → v0.27)

Add reactive TextNode binding in `_walkAndBind` for DSD-hydrated text children. Counter and home-console count/title text currently work via CSR only (`renderToDom` signal→TextNode effect). DSD path needs the same.

#### P2: Show/For DSD hydration (v0.27)

Show/For are currently CSR-only (`renderToDom` constructs DOM from scratch). DSD hydration requires either:

- **A. SSR expansion**: resolve Show/For at SSR time, emit resolved branch in DSD template
- **B. Comment-marker hydration**: SSR emits `<!--show-->` markers, `_walkAndBind` finds and wires them

### Component contract

| Rule                                                         | Rationale                               |
| ------------------------------------------------------------ | --------------------------------------- |
| `render()` accesses NO signal `.value`                       | Prevents structural signal access       |
| All signal-driven state is passed as **prop={signalObject}** | `applyProps` can create effect bindings |
| Visual variants use `data-*` attributes + CSS                | Zero JS for visual changes              |
| Structural changes use `<Show>`/`<For>`                      | Declarative control flow                |
| Text content from signals uses reactive TextNode             | Fine-grained text update                |

## Consequences

### Bugs found and fixed (v0.26.1)

| Bug                                         | Discovery                                                                                                     | Root cause                                                                                                                     | Fix                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **G1**: Effect memory leak                  | Per-prop signal→DOM effects created during DSD hydration never disposed                                       | `_walkAndBind` called `applyProps(el, props)` without AbortSignal; effects lived forever after disconnect                      | Pass AbortSignal through `_walkAndBind` → `applyProps`; abort on disconnect via `_templateAbortController` |
| **G2**: consumeContext dead copy            | `consumeContext` returned `signal(value)` — a new independent signal. Provider updates invisible to consumers | Central `contexts` Map stores the source signal; consumer received a copy                                                      | Return the source signal from `contexts` Map directly                                                      |
| **B1**: `Unexpected identifier 'as'`        | JS error on every page load, traced via CDP to `index.html:40`                                                | DSD polyfill template literal (TypeScript) contained `tpl.parentNode as HTMLElement` — injected as inline `<script>` into HTML | Remove TypeScript `as` assertion from polyfill string                                                      |
| **B2**: SignalContext subpath build failure | CI client build: `@lessjs/core/signal-context` → `packages/core/src/index.ts/signal-context` (ENOTDIR)        | Rolldown resolves `@lessjs/core` to file path then appends `/signal-context`                                                   | Import from `@lessjs/core` main entry (which re-exports signal-context)                                    |

### Gap status

| #  | Gap                        | Severity | Status                                                                                           |
| -- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| G1 | Effect memory leak         | P0       | ✅ Fixed — AbortSignal chain through `_walkAndBind`                                              |
| G2 | consumeContext dead copy   | P0       | ✅ Fixed — returns source signal from Map                                                        |
| G3 | DSD text node binding      | P1       | ⚠️ `_walkAndBind` skips text children; counter/home-console text only CSR-reactive               |
| G4 | Show/For DSD hydration     | P2       | ⚠️ CSR-only `renderToDom` constructs                                                             |
| G5 | Batch/effectScope exposure | P2       | ⚠️ alien-signals has `effectScope`/`batch`/`untrack`; `@lessjs/signals` facade doesn't re-export |
| G6 | JSX element type           | Done     | ✅ `JSX.Element.children` aligned with `VNode.children`                                          |

### Positive

- Zero full re-renders after hydration — `render()` called once, per-prop bindings handle updates
- Reactive context — `provideContext` + `consumeContext` form a live signal chain
- Effect lifecycle — all signal→DOM effects auto-disposed on component disconnect
- No JS errors — `as` assertion removed from DSD polyfill
- CSS-driven theme switching with zero JS (`data-theme={signal}` + CSS selectors)
- Migration scope small — 2 signal accesses (theme-toggle), ~10 line rewrite

### Negative

- `_layoutWorkaroundReRender()` required for Chromium DSD layout bug (one-time DOM replacement)
- DSD text binding mechanism needs ~20 lines (G3, P1)
- Show/For DSD hydration needs ~50 lines (G4, P2)
- alien-signals `effectScope` not yet exposed through `@lessjs/signals` (G5, P2)

## Related

- ADR-0058: Real DOM Signal Binding (attempted, incomplete — missing layout fix + theme-toggle migration)
- ADR-0059: Show/For Control Flow (needs DSD hydration path)
- ADR-0057: JSX+Signal Component Model
- ADR-0060: SignalContext
- SOP-002: Signal-to-CSS-Driven Visual Migration
- [Signal Architecture Comprehensive](../conversation/v0.26.1/signal-architecture-comprehensive.md)
- [Signal→DOM Architecture Research](../conversation/v0.26.1/signal-rdom-architecture-research.md)
- [Framework Signal Comparison](../conversation/v0.26.1/framework-signal-comparison.md)
- [alien-signals Capability Audit](../conversation/v0.26.1/alien-signals-capability-audit.md)
- [GitHub Issue #28](https://github.com/lessjs-run/lessjs/issues/28) — Chromium DSD layout bug

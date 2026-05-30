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

| Step | What happens |
|------|-------------|
| t0 | Browser parses HTML, encounters `<docs-home>` |
| t1 | Browser attaches shadow root from DSD template |
| t2 | Browser performs first layout: `<docs-home>` is `display:inline` → 0×0 |
| t3 | Script loads, `customElements.define()` triggers upgrade |
| t4 | `connectedCallback()`: `this.style.display = 'block'` + `_applyStyles()` |
| t5 | CSS rules apply, but **browser caches layout from t2** — host stays 0×0 |

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

| Component | Signal type | Count | Status |
|-----------|------------|-------|--------|
| home-console | attribute-only (computed→class) | 4 | ✅ already RDOM |
| home-console | text child (signal→text) | 2 | ⚠️ CSR-reactive, DSD dead |
| counter-island | text child (signal→text) | 1 | ⚠️ CSR-reactive, DSD dead |
| less-theme-toggle | structural (signal.value in render) | 2 | ❌ needs rewrite |
| less-layout | none | 0 | ✅ no signal access |

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
:host { display: block; min-height: 1px; contain: layout style; }
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
.theme-toggle[data-theme="light"] .icon-sun { display: none; }
.theme-toggle[data-theme="light"] .icon-moon { display: block; }
```

#### P1: DSD text node binding (v0.26.1 → v0.27)

Add reactive TextNode binding in `_walkAndBind` for DSD-hydrated text children. Counter and home-console count/title text currently work via CSR only (`renderToDom` signal→TextNode effect). DSD path needs the same.

#### P2: Show/For DSD hydration (v0.27)

Show/For are currently CSR-only (`renderToDom` constructs DOM from scratch). DSD hydration requires either:
- **A. SSR expansion**: resolve Show/For at SSR time, emit resolved branch in DSD template
- **B. Comment-marker hydration**: SSR emits `<!--show-->` markers, `_walkAndBind` finds and wires them

### Component contract

| Rule | Rationale |
|------|-----------|
| `render()` accesses NO signal `.value` | Prevents structural signal access |
| All signal-driven state is passed as **prop={signalObject}** | `applyProps` can create effect bindings |
| Visual variants use `data-*` attributes + CSS | Zero JS for visual changes |
| Structural changes use `<Show>`/`<For>` | Declarative control flow |
| Text content from signals uses reactive TextNode | Fine-grained text update |

## Consequences

### Positive

- Zero full re-renders — `render()` is called once per lifecycle
- DSD content preserved through hydration — no DOM identity loss
- Browser correctly computes layout via forced reflow
- CSS-driven theme switching with zero JS
- Migration scope is 2 signal accesses (theme-toggle), not a full rewrite

### Negative

- `less-theme-toggle` needs ~10 line rewrite
- DSD text binding mechanism needs ~20 lines of new code (if used without CSR fallback)
- Browser layout quirk requires explicit reflow — a web platform workaround
- Until Show/For DSD hydration (P2), structural Show/For in DSD path requires CSR fallback

### Risk

- Forced reflow (`void this.offsetHeight`) is a micro-optimization anti-pattern but necessary for DSD layout
- Mitigation: the reflow only fires once per component lifecycle (in `connectedCallback`), not in hot paths

## Related

- ADR-0058: Real DOM Signal Binding (attempted, incomplete — missing layout fix + theme-toggle migration)
- ADR-0059: Show/For Control Flow (needs DSD hydration path)
- ADR-0057: JSX+Signal Component Model
- ADR-0060: SignalContext
- [Signal→DOM Architecture Research](../conversation/v0.26.1/signal-rdom-architecture-research.md)

## Summary

DSD (Declarative Shadow DOM) shadow root content renders with correct DOM tree but the host element produces 0x0 bounding rect. This requires a DOM-replacement workaround after connectedCallback() upgrade. Continuous effect(() => render()) degraded to one-time _layoutWorkaroundReRender() but the underlying Chromium bug remains.

## Timeline

| Commit   | Date       | What                                                                                                                                                  |
| -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| adcf064c | before     | status quo -- effect(() => render()) for both DSD hydration and CSR updates                                                                           |
| 7989e8e8 | 2026-05-30 | ADR-0058: removed effect from DSD path, replaced with per-prop signal-to-DOM bindings. Broke the page -- white screen on dev.lessjs.pages.dev         |
| 3b69bb5a | 2026-05-30 | Hotfix: restored effect in _hyrateExistingDom(). Page visible but nav unclickable, continuous re-render degrades performance                          |
| bf2a34c3 | 2026-05-30 | SOP-002: replaced continuous effect with one-time _layoutWorkaroundReRender(). Per-prop bindings handle all subsequent updates. Page fully functional |

## Root Cause

Chromium caches layout computed during initial HTML parse when the custom element is display:inline (default). After customElements.define() upgrade applies display:block via CSS and inline styles, the browser does NOT recalculate the host bounding rect. All tested reflow approaches fail:

- void this.offsetHeight / getBoundingClientRect() -- no effect
- this.shadowRoot.innerHTML = this.shadowRoot.innerHTML -- no effect
- removeChild + appendChild (detach-reattach) -- no effect
- contain: layout style CSS -- no effect
- min-height: 1px -- gives 1px but content does not expand

Only full DOM replacement (clear all children, append new nodes via renderToDom) forces Chromium to compute correct layout.

## Component Audit

All LessJS components now satisfy the RDOM contract (zero signal.value reads in render()):

| Component         | Signal type                     | Status                                   |
| ----------------- | ------------------------------- | ---------------------------------------- |
| less-layout       | none                            | OK -- never accessed signals in render() |
| home-console      | attribute-only (computed-class) | OK -- applyProps handles                 |
| home-console      | text child                      | CSR-reactive, DSD dead (P1)              |
| counter-island    | text child                      | CSR-reactive, DSD dead (P1)              |
| less-theme-toggle | structural (was signal.value)   | FIXED -- data-theme={signal} + CSS       |

## Current Fix

_layoutWorkaroundReRender() in packages/core/src/dsd-element.ts:

- Called ONCE per lifecycle (in connectedCallback() DSD path)
- Clears shadow root and rebuilds via renderToDom
- After this initial render, all subsequent signal-driven updates use per-prop applyProps bindings -- zero full re-renders

## Related Docs

- ADR-0062: DSD-First Real DOM Signal Architecture
- SOP-002: Signal-to-CSS-Driven Visual Migration
- Signal Architecture Research (docs/conversation/v0.26.1/)

## Desired Fix (Chromium)

DSD-upgraded custom elements with :host { display: block } in adoptedStyleSheets should produce correct getBoundingClientRect() without requiring DOM replacement. The browser should invalidate cached layout when the computed display changes from inline (default) to block (CSS).

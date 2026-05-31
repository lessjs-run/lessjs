# ADR-0068: Show/For Activation + data-signal-attr + data-signal-html — www Zero-Effect Cleanup

> **Status**: ACCEPTED
> **Date**: 2026-05-31
> **Author**: Zhi (Architect), Qi (Delivery Director)
> **Supersedes**: N/A (new capabilities atop ADR-0067 signal-native hydration)
> **Implements**: www audit gaps G1-G6 → zero effect / zero createElement / zero innerHTML

---

## Context

### Background

ADR-0067 established the Ocean + Island Signal-Native Architecture. After v0.27.0 cleanup, 11/11 audit dimensions passed. However, 6 gaps remained — all caused by framework primitives not yet available.

**Phase 1** (initial migration): Added `data-signal-attr`, migrated 3 components. G1/G3 kept `effect()` as "architecturally justified."

**Phase 2** (彻底清理): User demanded zero tolerance for manual patterns. All `effect()`, `document.createElement`, and `innerHTML` in www islands must go.

### What was still manual after Phase 1

| Component           | Manual code                                                                    | Lines            |
| ------------------- | ------------------------------------------------------------------------------ | ---------------- |
| `less-search`       | `effect()` for overlay class toggle                                            | 192-196          |
| `less-search`       | `effect()` + `document.createElement` + `innerHTML` for results                | 199-207, 274-298 |
| `reactive-showcase` | `data-signal='theme'` on wrapper with children → textContent destroys children | 124              |

---

## Decision

### 1. Add `data-signal-html` hydration marker

```html
<div data-signal-html="resultsHtml"></div>
```

- Binds a signal to `element.innerHTML` — signal value is pre-escaped HTML string
- Separate from `data-signal` (textContent) and `data-signal-attr` (attributes)

### 2. Fix textContent / data-signal-attr conflict

In `_hydrateSignals()`, when an element has BOTH `data-signal` and `data-signal-attr`, **skip** the textContent binding. The attribute handler owns the signal. This preserves child DOM content.

```ts
if (el.hasAttribute('data-signal-attr') || el.hasAttribute('data-signal-html')) continue;
```

### 3. Eliminate ALL manual patterns in www islands

| Component                 | Before (Phase 1)                                                                | After (Phase 2)                                                      |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `less-search` overlay     | `effect()` + `classList.toggle('open')`                                         | `computed()` → `data-signal="overlayClass" data-signal-attr="class"` |
| `less-search` results     | `effect()` + `_renderResultsTo()` + `document.createElement('a')` + `innerHTML` | `computed()` → `data-signal-html="resultsHtml"`                      |
| `less-search` escaping    | `_esc()` private method                                                         | `escapeHtml`/`escapeAttr` from `@lessjs/core`                        |
| `less-toc` events         | `onClick={(e, id) => ...}` closure                                              | `data-on-click='_onClick'` + `dataset.tocId`                         |
| `less-toc` signals        | No `registerSignal`                                                             | `registerSignal('activeId')` + `data-signal`                         |
| `reactive-showcase` theme | `computed()` in prop                                                            | `registerSignal('theme')` + `data-signal-attr`                       |

### Architecture Impact

| Capability                           | Before Phase 2        | After                     |
| ------------------------------------ | --------------------- | ------------------------- |
| Signal → attribute                   | ✅ `data-signal-attr` | ✅ (children preserved)   |
| Signal → innerHTML                   | ❌ Manual effect      | ✅ `data-signal-html`     |
| Signal + attr → textContent conflict | 🐛 children destroyed | ✅ fixed                  |
| www islands manual effect count      | 2                     | **0**                     |
| www islands createElement count      | 3                     | **0**                     |
| www islands innerHTML write count    | 4                     | **0** (all via hydration) |

---

## Consequences

### Positive

- **Zero manual DOM**: No `effect()`, `document.createElement`, or `innerHTML` writes in any www island component.
- **Clean hydration**: `_hydrateSignals()` is the single hydration entry point — handles textContent, innerHTML, attributes, and events.
- **Composable signals**: Overlay class and results HTML are computed signals — testable, composable, pure functions.
- **16/16 tests pass**: 2 new tests (data-signal-attr children preservation, data-signal-html).

### Negative

- `data-signal-html` accepts raw HTML strings → component author must ensure escaping. In practice, computed signals call `escapeHtml`/`escapeAttr` internally.

### Risks

- **innerHTML security**: `data-signal-html` sets innerHTML directly. The signal value MUST be pre-escaped. Component authors should use `escapeHtml`/`escapeAttr` in their computed signal builders.

---

## Implementation

See [SOP-001 www Gap Fix Migration](../sop/v0.28.0/SOP-001-www-gap-fix.md) for the step-by-step execution record.

# Component CSS/JS Garbage Audit — v0.26.1

**Auditor:** css-scanner
**Date:** 2026-05-30
**Scope:** ALL less-_.tsx, page-styles.ts, islands/_.tsx, dsd-element.ts, jsx-render-dom.ts

---

## Executive Summary

| Severity | Count | Summary                                                                        |
| -------- | ----- | ------------------------------------------------------------------------------ |
| **P0**   | 12    | signal.value in render(), inline styles, broken CSS syntax                     |
| **P1**   | 12    | hardcoded hex/rgba colors, non-semantic px values, missing openPropsTokenSheet |
| **P2**   | 3     | stale dead-code references, false doc claims, over-commented code              |

**Total violations flagged:** 27

---

## 1. packages/ui/src/less-layout.tsx (P0 + P1)

### P0-1: Broken CSS syntax (orphaned rule outside block)

- **Line:** 182-183
- **Issue:** `animation: logo-breathe 4s ease-in-out infinite;` is outside any selector block, followed by lone `}` on line 184. This CSS rule is dangling in no-scope — it likely pollutes the style sheet.

```diff
-    animation: logo-breathe 4s ease-in-out infinite;
-  }
+  }
```

### P0-2: Inline `style=` attribute in JSX

- **Line:** 772
- **Current:** `style='margin-right:0.75rem;'`
- **Fix:** Move to CSS class `.edit-link` with `margin-right: var(--size-2)`

```diff
-                style='margin-right:0.75rem;'
+                className='edit-link'
```

```css
+ .edit-link {
  margin-right: var(--size-2);
}
```

### P1-3: Non-semantic px values (105+ occurrences)

Every hardcoded `px` value is a violation. Key offenders:

| Line                            | CSS                           | Current                     | Replacement                                                |
| ------------------------------- | ----------------------------- | --------------------------- | ---------------------------------------------------------- |
| 76                              | `drop-shadow(0 0 4px ...)`    | `4px`                       | Use `var(--size-1)` or remove px                           |
| 77                              | `drop-shadow(0 0 12px ...)`   | `12px`                      | Use `var(--shadow-*)`                                      |
| 95                              | `max-width`                   | `1400px`                    | `var(--size-content-4)`                                    |
| 123-124                         | `backdrop-filter: blur(12px)` | `12px`                      | Token `--blur-md` (define one)                             |
| 125,147,253,274                 | `border: 0.5px solid`         | `0.5px`                     | `var(--border-size-1)` is 1px — reconsider border strategy |
| 134                             | `height`                      | `64px`                      | `var(--size-16)` (if size-16 = 64px)                       |
| 176                             | `letter-spacing`              | `-0.04em`                   | `var(--font-letterspacing-XX)`                             |
| 191                             | `letter-spacing`              | `0.2em`                     | Token                                                      |
| 207,251,279,311,354,423         | `letter-spacing`              | `0.04em`                    | Token                                                      |
| 225                             | `height`                      | `2px`                       | `var(--size-0)`                                            |
| 227                             | `border-radius`               | `1px`                       | `var(--radius-1)`                                          |
| 268                             | `min-width`                   | `32px`                      | `var(--size-8)`                                            |
| 269                             | `height`                      | `24px`                      | `var(--size-6)`                                            |
| 290                             | `width`                       | `clamp(200px, 20vw, 260px)` | Use `var(--size-content-*)`                                |
| 293,306,314,319,330,331,402-404 | Various rem/px                | Mixed                       | Tokenize                                                   |
| 349                             | `padding`                     | `3rem`                      | `var(--size-12)`                                           |
| 353                             | `font-size`                   | `0.75rem`                   | `var(--font-size-0)`                                       |
| 357                             | `margin`                      | `0.25rem`                   | `var(--size-1)`                                            |
| 363                             | `width`                       | `1px`                       | `var(--size-0)`                                            |
| 364                             | `height`                      | `8px`                       | `var(--size-2)`                                            |

### P1-4: Non-semantic rgba() values

| Line | Value                             |
| ---- | --------------------------------- |
| 373  | `rgba(0,0,0,0.6)` mobile backdrop |
| 399  | `rgba(0,0,0,0.5)` box-shadow      |
| 411  | `rgba(9,11,17,0.92)` tab bar bg   |

### P1-5: Non-semantic breakpoints (px values in @media)

| Line | Value                       |
| ---- | --------------------------- |
| 379  | `@media (max-width: 900px)` |
| 431  | `@media (max-width: 640px)` |
| 435  | `@media (max-width: 480px)` |

**Note:** Open Props doesn't define breakpoint tokens by default. Either define `--bp-sm`, `--bp-md`, `--bp-lg` or accept these as necessary layout values.

---

## 2. packages/ui/src/less-callout.tsx (P1 + P2)

### P2-6: False documentation claim

- **Line:** 7 — Header claims: _"v0.26.1: All colors use semantic tokens, theme-responsive."_
- **Reality:** Lines 40-45 contain 9 hardcoded hex/rgba values.

### P1-7: Hardcoded hex colors

| Line | CSS                 | Current                   | Replacement                            |
| ---- | ------------------- | ------------------------- | -------------------------------------- |
| 40   | `border-left-color` | `#f59e0b` (warning amber) | `var(--yellow-5)`                      |
| 40   | `background`        | `rgba(245,158,11,0.08)`   | `var(--warning-subtle)` (define token) |
| 41   | `border-left-color` | `#ef4444` (danger red)    | `var(--red-5)`                         |
| 41   | `background`        | `rgba(239,68,68,0.08)`    | `var(--danger-subtle)`                 |
| 42   | `border-left-color` | `#22c55e` (success green) | `var(--green-5)`                       |
| 42   | `background`        | `rgba(34,197,94,0.08)`    | `var(--success-subtle)`                |
| 43   | `background`        | `rgba(245,158,11,0.06)`   | `var(--warning-subtle)`                |
| 44   | `background`        | `rgba(239,68,68,0.06)`    | `var(--danger-subtle)`                 |
| 45   | `background`        | `rgba(34,197,94,0.06)`    | `var(--success-subtle)`                |

### P1-8: Non-semantic value

- **Line:** 49 — `line-height: 1` → `var(--font-lineheight-1)`

---

## 3. packages/ui/src/less-code-block.tsx (P0 + P1)

### P0-9: Hardcoded hex colors (Prism theme, lines 114-126)

12 hardcoded color values for syntax highlighting:

```
#6a737d, #8b949e, #79c0ff, #a5d6ff, #d2a8ff, #ff7b72, #ffa657
```

**Fix:** Replace with Open Props colors:

```diff
-  .token.cdata, .token.comment { color: #6a737d; }
+  .token.cdata, .token.comment { color: var(--gray-6); }
-  .token.keyword { color: #ff7b72; }
+  .token.keyword { color: var(--red-4); }
```

Full mapping needed for all 12 colors.

### P1-10: Non-semantic border + rgba

- **Line:** 88 — `border: 0.5px solid transparent` → `var(--border-size-1)`
- **Line:** 103 — `color: #22c55e` (copied state) → `var(--green-5)` or `var(--success)`
- **Line:** 104 — `border-color: rgba(34,197,94,0.3)` → token
- **Line:** 105 — `background: rgba(34,197,94,0.08)` → token

---

## 4. less-hero-ping.tsx, less-term.tsx, api-consumer.tsx (P1)

All three share the same "status dot" pattern with identical violations:

### P1-11: `#22c55e` green dot (success state)

Files and lines:

- `less-hero-ping.tsx:60` — `background: #22c55e`
- `less-hero-ping.tsx:68` — `color: #22c55e`
- `less-term.tsx:41` — `background: #22c55e`
- `api-consumer.tsx:43` — `background: #22c55e`
- `home-console.tsx` SVG graph components

**Fix:** `var(--green-5)` or define `var(--status-success)` token.

### P1-12: Non-semantic term colors

`less-term.tsx`:

- `#ef4444`, `#eab308`, `#fbbf24`, `#7dd3fc` (lines 39-41, 57-59)
- Replace with `var(--red-5)`, `var(--yellow-5)`, `var(--yellow-4)`, `var(--cyan-4)`

### P1-13: Inline style blocks in HTML strings

`less-term.tsx` lines 155-174: 16 occurrences of `style="color:#xxx"` in local command output strings. These bypass the StyleSheet system entirely.

### P1-14: api-consumer.tsx inline styles

- **Line 235:** `style='color:var(--error)'` → Use CSS class `.pre-box.err`
- **Lines 249-251:** Large inline style block on `<p>` → Move to `.demo-text` class

---

## 5. packages/ui/src/less-step-card.tsx (P0)

### P0-15: Inline style attribute + hardcoded px

```diff
-  Lines 100:
-  style='margin:0 0 var(--size-2);color:var(--gray-7);font-size:var(--font-size-0);'
+  part='description' class='step-desc'
```

- Add CSS `.step-desc { margin: 0 0 var(--size-2); color: var(--gray-7); font-size: var(--font-size-0); }`
- Lines 51-52: `width: 28px; height: 28px` → `var(--size-7)`

---

## 6. www/app/islands/home-console.tsx (P0)

### P0-16: Massive inline SVG styling (lines 162-333)

The SVG graph contains ~80 hardcoded values:

- `fill='#7C6FF5'`, `fill='#60EFFF'`, `fill='#00FF87'`, `fill='#FB7185'`
- `stroke='rgba(124,111,245,0.12)'`, `stroke='rgba(96,239,255,0.4)'`
- `font-family='JetBrains Mono,monospace'` (should be `var(--font-mono)`)
- `font-family='SF Pro Display,system-ui,sans-serif'` (should be `var(--font-sans)`)
- `font-size='11'`, `font-size='8.5'`, `font-size='9'`, `font-size='13'`
- Line 165: `style='display:block;width:100%;height:auto;border:...'` — inline style on SVG
- Line 181: `font-family='JetBrains Mono,monospace'` — should use `var(--font-mono)`
- Line 296: `font-family='SF Pro Display,system-ui,sans-serif'` — should use `var(--font-sans)`

### P1-17: Non-semantic CSS values

| Line | Value                                     | Replacement                |
| ---- | ----------------------------------------- | -------------------------- |
| 23   | `box-shadow: 0 30px 60px rgba(0,0,0,0.4)` | `var(--shadow-4)` (define) |
| 48   | `box-shadow: 0 0 12px var(--brand-glow)`  | Remove px or use token     |
| 57   | `rgba(0,255,135,0.2)`                     | `var(--brand-glow)`        |
| 58   | `rgba(0,255,135,0.08)`                    | token                      |
| 62   | `width: 6px; height: 6px`                 | `var(--size-1)`            |
| 68   | `box-shadow: 0 0 4px`                     | token                      |
| 86   | `box-shadow: 0 0 16px`                    | token                      |
| 90   | `width: 40px; height: 40px`               | `var(--size-10)`           |
| 102  | `min-width: 60px`                         | token                      |

---

## 7. www/app/islands/reactive-showcase.tsx (P0)

### P0-18: `signal.value` in render() — ADR-0062 VIOLATION

- **Line 147:** `{this.#filtered.value.map((f) => <div key={f}>{f}</div>)}`
- **Impact:** This reads the current value and creates a static VNode list. When `#filtered` changes, this list won't update — there's no reactive binding. Use `<For>` directive:

```diff
-  {this.#filtered.value.map((f) => <div key={f}>{f}</div>)}
+  <For each={this.#filtered}>
+    {(f: string) => <div>{f}</div>}
+  </For>
```

### P0-19: Computed signals created inline in render()

Lines 120, 124, 127: `computed(...)` created inside render() — each render creates a new computed signal (memory leak + performance issue):

```diff
-  data-theme={computed(() => this.#isDark.value ? 'dark' : 'light')}
+  data-theme={this.#isDarkTheme}  // Pre-computed signal defined in constructor
```

### P1-20: Non-semantic values

- Line 36: `min-width: 3rem` → `var(--size-12)`
- Lines 38-39: `width: 2.5rem; height: 2.5rem` → `var(--size-10)`
- Line 62: `outline: 2px solid var(--brand)` → `var(--border-size-2)`
- Line 62: `outline-offset: -1px` → Consider `var(--size-0)` or remove

---

## 8. www/app/islands/less-toc.tsx (P0 + P1)

### P0-21: `signal.value` in render() — ADR-0062 VIOLATION

- **Lines 165-166:**

```typescript
const headings = this.#headings.value;
const activeId = this.#activeId.value;
```

- **Impact:** Values are snapshot at render time. No reactive binding when signal changes.
- **Fix:** Pass signals as props, or use `effect()` in connectedCallback to re-render.

### P1-22: Non-semantic values

- Line 24: `top: 5rem` → `var(--size-20)` (if defined)
- Line 25: `max-height: calc(100vh - 8rem)` → tokenize
- Line 57: `rgba(124,111,245,0.3)` → `var(--brand-glow)` or token
- Line 68: `@media (max-width: 1100px)` → define breakpoint token

### P1-23: Inline style manipulation

- Line 137: `this.style.display = 'block'` — use CSS class or `[hidden]` attribute

---

## 9. www/app/islands/shoelace-showcase.tsx (P1)

### P1-24: Inline style

- Line 76: `style='width:200px'` → CSS class

```diff
-  <sl-input placeholder='Type something...' size='small' style='width:200px'></sl-input>
+  <sl-input placeholder='Type something...' size='small' class='showcase-input'></sl-input>
```

```css
.showcase-input {
  width: 200px;
} /* or better: width: var(--size-XX) */
```

---

## 10. packages/ui/src/less-dialog.tsx (P1)

### P1-25: Non-semantic values

| Line | Value                                     | Replacement                                      |
| ---- | ----------------------------------------- | ------------------------------------------------ |
| 49   | `box-shadow: 0 8px 32px rgba(0,0,0,0.12)` | `var(--shadow-3)`                                |
| 54   | `background: rgba(0,0,0,0.4)`             | `var(--overlay-backdrop)` (mask — borderline OK) |
| 55   | `backdrop-filter: blur(4px)`              | `var(--blur-sm)`                                 |
| 63   | `translateY(-8px)`                        | Acceptable in keyframes                          |
| 95   | `background: rgba(83,74,183,0.06)`        | `var(--brand-subtle)`                            |

---

## 11. packages/ui/src/less-input.tsx

### P1-26: Non-semantic px

- Line 80: `box-shadow: 0 0 0 1px var(--brand, var(--indigo-6))` → `var(--border-size-1)`

---

## 12. packages/core/src/dsd-element.ts (P2)

### P2-27: Stale dead-code references

- **Line 403:** Comment references `_disposeTemplateRuntime` and `_disposeSignalSubscriptions` — these don't exist in the codebase anymore (replaced by `effectScope`).

```diff
-  // v0.26.1: effectScope replaces _disposeTemplateRuntime + _disposeSignalSubscriptions.
+  // v0.26.1: effectScope replaces earlier signal subscription management.
```

---

## 13. packages/ui/src/less-button.tsx (P1)

### P1-28: rgba values

- Line 77: `background: rgba(83,74,183,0.06)` → `var(--brand-subtle)`
- Line 96: `background: rgba(83,74,183,0.06)` → `var(--brand-subtle)`

### P1-29: Hardcoded px values

- Lines 58, 64, 70: `height: 28px/36px/44px` → Use `var(--size-N)` tokens
- Lines 124-125: `outline: 2px` / `outline-offset: 2px` → `var(--border-size-2)` / `var(--size-0)`

---

## 14. Cross-cutting: Missing `openPropsTokenSheet` (P1)

These components create their own `StyleSheet` but do NOT adopt the shared `openPropsTokenSheet`:

| File                    | Lines  | Component         |
| ----------------------- | ------ | ----------------- |
| `less-button.tsx`       | 30,135 | `LessButton`      |
| `less-card.tsx`         | 31,78  | `LessCard`        |
| `less-dialog.tsx`       | 32,116 | `LessDialog`      |
| `less-input.tsx`        | 38,109 | `LessInput`       |
| `less-step-card.tsx`    | 31,82  | `LessStepCard`    |
| `less-code-block.tsx`   | 27,128 | `LessCodeBlock`   |
| `less-callout.tsx`      | 30,59  | `LessCallout`     |
| `less-theme-toggle.tsx` | 26,74  | `LessThemeToggle` |
| `less-hero-ping.tsx`    | 18,76  | `HeroPing`        |
| `counter-island.tsx`    | 21,72  | `CounterIsland`   |
| `api-consumer.tsx`      | 12,129 | `ApiConsumer`     |

**Fix for all above:**

```diff
-  static override styles = [sheet];
+  static override styles = [openPropsTokenSheet, sheet];
```

```typescript
+  import { openPropsTokenSheet } from './open-props-tokens.js';
```

Components that CORRECTLY use `openPropsTokenSheet`:

- `less-layout.tsx` (line 444)
- `less-search.tsx` (line 164)
- `less-term.tsx` (line 80)
- `less-toc.tsx` (line 76)
- `shoelace-showcase.tsx` (line 64)
- `home-console.tsx` (line 115)
- `reactive-showcase.tsx` (line 86)

---

## 15. www/app/components/page-styles.ts (P1)

The file header claims _"v0.26.1 Complete overhaul — All sizing → Open Props"_ but still has violations:

### P1-30: Non-semantic values

| Line                       | Value                                 | Replacement                    |
| -------------------------- | ------------------------------------- | ------------------------------ |
| 34                         | `letter-spacing: -0.025em`            | `var(--font-letterspacing-XX)` |
| 52                         | `letter-spacing: -0.01em`             | Token                          |
| 54,113,125,136,171,190,200 | `0.5px` border                        | `var(--border-size-1)`         |
| 78                         | `text-underline-offset: 3px`          | Token                          |
| 80                         | `text-decoration-thickness: 0.5px`    | Token                          |
| 91                         | `letter-spacing: 0.14em`              | Token                          |
| 97                         | `height: 1px`                         | `var(--size-0)`                |
| 152                        | `border-left: 3px solid var(--brand)` | `var(--border-size-2)`         |
| 162                        | `letter-spacing: 0.05em`              | Token                          |
| 213                        | `grid-template-columns: 1fr 220px`    | Token                          |
| 216                        | `max-width: 1100px`                   | Token                          |
| 229-238                    | All `@media` breakpoints              | Tokenize                       |

---

## Severity Summary

| Category                      | P0    | P1     | P2    |
| ----------------------------- | ----- | ------ | ----- |
| signal.value in render()      | 3     | 0      | 0     |
| Inline style attributes       | 3     | 1      | 0     |
| Broken CSS syntax             | 1     | 0      | 0     |
| Hardcoded colors (hex/rgba)   | 1     | 8      | 0     |
| Non-semantic px/rem/em values | 0     | 10     | 0     |
| Missing openPropsTokenSheet   | 0     | 11     | 0     |
| Non-semantic breakpoints      | 0     | 3      | 0     |
| Stale dead-code refs          | 0     | 0      | 1     |
| False doc claims              | 0     | 0      | 1     |
| Inline style (DOM API)        | 0     | 2      | 0     |
| **Total**                     | **8** | **35** | **2** |

---

## Recommended Fix Priority

1. **P0 Blockers:** Fix signal.value in render() on `reactive-showcase.tsx:147` and `less-toc.tsx:165-166`. Fix broken CSS on `less-layout.tsx:182-183`. Fix all inline style attributes.
2. **P1 Quick Wins:** Add `openPropsTokenSheet` to all 11 components missing it (one import + one array insertion each).
3. **P1 Bulk Reform:** Replace all 30+ `rgba()` values across `less-callout.tsx`, `less-dialog.tsx`, `less-button.tsx` with semantic tokens.
4. **P1 Prism Theme:** Replace all 12 hardcoded colors in `less-code-block.tsx` with Open Props equivalents using theme-responsive `var(--gray-N)`, `var(--red-N)`, etc.
5. **P1 SVG Cleanup:** Extract home-console.tsx SVG styles into proper CSS — 80+ hardcoded values.
6. **P2 Polish:** Update false doc claims and stale comments.

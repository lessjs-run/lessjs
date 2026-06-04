# Island Component Audit — v0.27.0

Thorough audit of ALL island components, core pages, and UI components for
DsdElement + Signal + Router + OpenProps compliance.

---

## Summary

| Category      | Files Audited | Critical | Warning | Info   |
| ------------- | ------------- | -------- | ------- | ------ |
| Islands       | 12            | 1        | 6       | 5      |
| Core Pages    | 2             | 6        | 2       | 0      |
| UI Components | 10            | 0        | 5       | 5      |
| **Total**     | **24**        | **7**    | **13**  | **10** |

### Critical Findings

1. **demo-idle, demo-load, demo-only, demo-visible** (4 files) — EXTENDS HTMLElement, never imported by any route (**DEAD CODE**)
2. **media-chrome-showcase.ts** — never imported by any route (**DEAD CODE**)
3. **docs-page.tsx** — render() returns raw HTML template string, not JSX
4. **docs-page.tsx** — hardcoded `background: #fff` in production page

---

## I. Islands (www/app/islands/)

### 1. home-console.tsx

| File             | Issue                              | Line | Current Code                                       | Fix                                                    | Severity |
| ---------------- | ---------------------------------- | ---- | -------------------------------------------------- | ------------------------------------------------------ | -------- |
| home-console.tsx | OpenProps: raw transition timing   | 44   | `transition: all 0.2s ease;`                       | `transition: all var(--ease-2) var(--duration-2);`     | WARNING  |
| home-console.tsx | OpenProps: raw transition timing   | 94   | `transition: color 0.2s ease;`                     | `transition: color var(--ease-2) var(--duration-2);`   | WARNING  |
| home-console.tsx | Signal: theme.subscribe no cleanup | 136  | `theme.subscribe((t) => ...)` in connectedCallback | Store unsubscribe handle, call in disconnectedCallback | WARNING  |

### 2. reactive-showcase.tsx

| File                  | Issue                                      | Line          | Current Code                                            | Fix                                                                          | Severity |
| --------------------- | ------------------------------------------ | ------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| reactive-showcase.tsx | Signal: computed() created inside render() | 120, 124, 127 | `computed(() => this.#isDark.value ? 'dark' : 'light')` | Move to class fields like home-console.tsx (#themeClass, #toggleLabel, etc.) | CRITICAL |
| reactive-showcase.tsx | OpenProps: raw transition timing           | 41            | `transition: background 0.15s;`                         | `transition: background var(--ease-2) var(--duration-2);`                    | WARNING  |
| reactive-showcase.tsx | OpenProps: hardcoded size                  | 38            | `width: 2.5rem; height: 2.5rem;`                        | Use `--size-X` token or define inline                                        | INFO     |

### 3. less-search.tsx

| File            | Issue                               | Line     | Current Code                                 | Fix                                                                                                    | Severity |
| --------------- | ----------------------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| less-search.tsx | innerHTML: runtime results          | 282, 320 | `results.innerHTML = this._getResultsHtml()` | Build-time sanitized (search-index.json entries), user query is _escapeHtml'd. **ACCEPTED (ADR-0064)** | INFO     |
| less-search.tsx | innerHTML: user query in no-results | 340-342  | `this._escapeHtml(this.#query.value)`        | Already escaped via _escapeHtml. **OK**                                                                | INFO     |

### 4. less-toc.tsx

| File         | Issue                            | Line | Current Code                                             | Fix                                                                                                | Severity |
| ------------ | -------------------------------- | ---- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| less-toc.tsx | OpenProps: raw transition timing | 51   | `transition: color 0.15s ease, border-color 0.15s ease;` | `transition: color var(--ease-2) var(--duration-2), border-color var(--ease-2) var(--duration-2);` | WARNING  |
| less-toc.tsx | OpenProps: hardcoded rgba color  | 57   | `border-left-color: rgba(124,111,245,0.3);`              | `border-left-color: var(--brand-glow);`                                                            | WARNING  |
| less-toc.tsx | OpenProps: hardcoded rem         | 24   | `top: 5rem;`                                             | `top: var(--size-20);` (or define `--toc-top: 5rem` token)                                         | INFO     |
| less-toc.tsx | OpenProps: hardcoded calc        | 25   | `max-height: calc(100vh - 8rem);`                        | `max-height: calc(100vh - var(--size-32));`                                                        | INFO     |

### 5. counter-island.tsx

| File               | Issue                                   | Line | Current Code                                           | Fix                                                                                              | Severity |
| ------------------ | --------------------------------------- | ---- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------- |
| counter-island.tsx | DsdElement: missing openPropsTokenSheet | 73   | `static override styles = counterStyles;`              | `static override styles = [openPropsTokenSheet, counterStyles];`                                 | CRITICAL |
| counter-island.tsx | OpenProps: hardcoded rem                | 38   | `min-width: 3.5rem;`                                   | Use token or define in stylesheet                                                                | WARNING  |
| counter-island.tsx | OpenProps: hardcoded rem                | 57   | `min-width: 2.5rem;`                                   | Use token or define in stylesheet                                                                | WARNING  |
| counter-island.tsx | OpenProps: raw transition timing        | 55   | `transition: background 0.15s ease, color 0.15s ease;` | `transition: background var(--ease-2) var(--duration-2), color var(--ease-2) var(--duration-2);` | WARNING  |

### 6. scroll-reveal.ts

| File             | Issue                                   | Line  | Current Code                                                                      | Fix                                                                                               | Severity |
| ---------------- | --------------------------------------- | ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| scroll-reveal.ts | DsdElement: missing openPropsTokenSheet | 36    | `static override styles = styles;`                                                | `static override styles = [openPropsTokenSheet, styles];`                                         | WARNING  |
| scroll-reveal.ts | DsdElement: render returns string       | 67-69 | `override render(): string { return '<div class="reveal"><slot></slot></div>'; }` | Convert to JSX: `return (<div class='reveal'><slot></slot></div>);`                               | WARNING  |
| scroll-reveal.ts | OpenProps: raw transition timing        | 20    | `transition: opacity 0.4s ease-out, transform 0.4s ease-out;`                     | `transition: opacity var(--ease-2) var(--duration-4), transform var(--ease-2) var(--duration-4);` | WARNING  |
| scroll-reveal.ts | OpenProps: hardcoded px                 | 19    | `transform: translateY(16px);`                                                    | Could use `var(--size-4)` (16px)                                                                  | INFO     |

### 7. demo-idle.ts / demo-load.ts / demo-only.ts / demo-visible.ts

| File           | Issue                                | Line | Current Code                                               | Fix                                           | Severity |
| -------------- | ------------------------------------ | ---- | ---------------------------------------------------------- | --------------------------------------------- | -------- |
| demo-*.ts (x4) | DsdElement: extends HTMLElement      | 7    | `class DemoXxx extends HTMLElement`                        | Should extend DsdElement                      | CRITICAL |
| demo-*.ts (x4) | DsdElement: manual shadow DOM attach | 9-10 | `this.attachShadow({ mode: 'open' })`                      | DsdElement handles this via hydrate-in-shadow | CRITICAL |
| demo-*.ts (x4) | innerHTML: writes to shadowRoot      | 21   | `this.shadowRoot!.innerHTML = this.render()`               | Replace with DsdElement render() + JSX        | CRITICAL |
| demo-*.ts (x4) | DEAD CODE: not imported by any route | all  | —                                                          | **DELETE all 4 files**                        | CRITICAL |
| demo-*.ts (x4) | OpenProps: hardcoded colors          | 14   | `border:2px solid #f59e0b`, `background:#f59e0b`, etc.     | Moot — should be deleted                      | INFO     |
| demo-*.ts (x4) | OpenProps: hardcoded px              | 14   | `padding:1rem`, `margin:0.5rem`, `font-size:0.75rem`, etc. | Moot — should be deleted                      | INFO     |

### 8. react-showcase.ts

| File              | Issue                                | Line  | Current Code                         | Fix                                                             | Severity |
| ----------------- | ------------------------------------ | ----- | ------------------------------------ | --------------------------------------------------------------- | -------- |
| react-showcase.ts | Non-DsdElement by design             | —     | Uses `WithDsdHydration(HTMLElement)` | **OK** — React adapter uses its own hydration mixin             | INFO     |
| react-showcase.ts | Hardcoded colors in React components | 27-34 | `primary: '#6366f1'`, etc.           | **OK** — React showcase uses opinionated inline styles for demo | INFO     |

### 9. media-chrome-showcase.ts

| File                     | Issue                                | Line       | Current Code                                | Fix                                            | Severity |
| ------------------------ | ------------------------------------ | ---------- | ------------------------------------------- | ---------------------------------------------- | -------- |
| media-chrome-showcase.ts | DEAD CODE: not imported by any route | all        | —                                           | **DELETE** or add to a route                   | CRITICAL |
| media-chrome-showcase.ts | innerHTML: writes to shadowRoot      | 52, 62, 69 | `this.shadowRoot.innerHTML = this.render()` | Migrate to DsdElement render() + JSX (if kept) | CRITICAL |
| media-chrome-showcase.ts | DsdElement: manual shadow DOM        | 44-46      | `this.attachShadow({ mode: 'open' })`       | DsdElement handles this                        | WARNING  |
| media-chrome-showcase.ts | render() returns string              | 75-139     | Template literal string                     | Should use JSX (if kept)                       | WARNING  |
| media-chrome-showcase.ts | OpenProps: hardcoded colors          | 84-107     | `background: #000`, `color: #a1a1aa`, etc.  | Use OpenProps tokens                           | WARNING  |
| media-chrome-showcase.ts | OpenProps: hardcoded px              | 98-109     | `font-size: 11px`, `margin-top: 6px`, etc.  | Use OpenProps tokens                           | INFO     |

---

## II. Core Pages (www/app/routes/)

### 1. routes/index/index.tsx (docs-home.tsx equivalent)

| File            | Issue                                    | Line          | Current Code                                                               | Fix                                                                                                       | Severity |
| --------------- | ---------------------------------------- | ------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| index/index.tsx | Signal: subscribe no cleanup             | 171           | `theme.subscribe((t) => ...)`                                              | Store unsubscribe handle, clean up in disconnectedCallback                                                | WARNING  |
| index/index.tsx | OpenProps: missing font-lineheight token | 47            | `line-height: var(--font-lineheight-00);`                                  | `--font-lineheight-00` not defined in open-props-tokens.ts. Define it or use `--font-lineheight-1` (0.95) | CRITICAL |
| index/index.tsx | OpenProps: hardcoded px/rem              | 36            | `max-width: 1200px;`                                                       | Use `--size-X` or document that 1200px is a layout constant                                               | INFO     |
| index/index.tsx | OpenProps: hardcoded px                  | 37            | `grid-template-columns: 1fr 480px;`                                        | 480px is a layout constant — acceptable but document                                                      | INFO     |
| index/index.tsx | OpenProps: hardcoded rem                 | 47            | `font-size: clamp(3.5rem, 8vw, 5.5rem);`                                   | Hero headline uses custom scale — acceptable for hero                                                     | INFO     |
| index/index.tsx | OpenProps: raw transition timing         | 132, 136, 148 | `transition: all 0.2s ease;`                                               | `transition: all var(--ease-2) var(--duration-2);`                                                        | WARNING  |
| index/index.tsx | OpenProps: raw transition timing         | 123           | `transition: background 0.3s ease;`                                        | `transition: background var(--ease-2) var(--duration-3);`                                                 | WARNING  |
| index/index.tsx | OpenProps: hardcoded colors in gradients | 65            | `linear-gradient(90deg, rgba(255,255,255,0.06), rgba(96,239,255,0.5) ...)` | Hero decorative gradients — acceptable                                                                    | INFO     |

### 2. routes/docs/index.tsx (docs-page.tsx equivalent)

| File           | Issue                                  | Line  | Current Code                                                                    | Fix                                                                                     | Severity |
| -------------- | -------------------------------------- | ----- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| docs/index.tsx | DsdElement: render returns raw string  | 99    | `override render() { return \`...\`; }`                                         | MUST convert to JSX: `return (<open-layout ...>...</open-layout>);`                     | CRITICAL |
| docs/index.tsx | OpenProps: HARDCODED COLOR             | 52    | `background: #fff;`                                                             | `background: var(--bg-elevated);`                                                       | CRITICAL |
| docs/index.tsx | OpenProps: hardcoded px                | 24    | `padding: 44px var(--size-6) 72px;`                                             | Use `--size-X` tokens                                                                   | CRITICAL |
| docs/index.tsx | OpenProps: hardcoded px                | 30    | `font-size: clamp(2.5rem, 7vw, 5rem);`                                          | Hero headline — acceptable custom scale                                                 | INFO     |
| docs/index.tsx | OpenProps: hardcoded px                | 36    | `max-width: 680px;`                                                             | Use token or document                                                                   | WARNING  |
| docs/index.tsx | OpenProps: hardcoded px                | 37    | `margin: 18px 0 0;`                                                             | `margin: var(--size-4) 0 0;` (18px ≈ 16px + 2px)                                        | CRITICAL |
| docs/index.tsx | OpenProps: hardcoded px                | 43    | `margin-top: 38px;`                                                             | Use `--size-X` token                                                                    | WARNING  |
| docs/index.tsx | OpenProps: hardcoded px                | 46    | `gap: 14px;`                                                                    | `gap: var(--size-3);` (12px) or define custom                                           | CRITICAL |
| docs/index.tsx | OpenProps: not using border-size token | 50    | `border: 1px solid var(--border);`                                              | `border: var(--border-size-1) solid var(--border);`                                     | CRITICAL |
| docs/index.tsx | OpenProps: hardcoded px                | 53    | `padding: 22px;`                                                                | `padding: var(--size-5);` (20px) or `var(--size-6)` (24px)                              | WARNING  |
| docs/index.tsx | OpenProps: hardcoded px font-size      | 65    | `font-size: 17px;`                                                              | `font-size: var(--font-size-2);` (1.25rem = 20px) or `var(--font-size-1)` (1rem = 16px) | WARNING  |
| docs/index.tsx | OpenProps: hardcoded line-height       | 73    | `line-height: 1.65;`                                                            | `line-height: var(--font-lineheight-3);` or define token                                | WARNING  |
| docs/index.tsx | OpenProps: hardcoded px                | 78-86 | `min-height: 26px`, `border-radius: 5px`, `font-size: 11px`, `font-weight: 750` | Use OpenProps tokens                                                                    | CRITICAL |

---

## III. UI Components (packages/ui/src/)

### 1. less-layout.tsx

| File            | Issue                                    | Line      | Current Code                                         | Fix                                                                                            | Severity |
| --------------- | ---------------------------------------- | --------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| less-layout.tsx | Router: suspicious `_r` reference        | 845, 1031 | `const { locale } = this._r;`                        | `this._r` is not a declared property; should use `this.routing.locale` via Router's public API | WARNING  |
| less-layout.tsx | OpenProps: hardcoded px                  | 138       | `height: 64px;`                                      | Document as layout constant                                                                    | INFO     |
| less-layout.tsx | OpenProps: hardcoded px                  | 292       | `width: clamp(200px, 20vw, 260px);`                  | Sidebar width — document as layout constant                                                    | INFO     |
| less-layout.tsx | OpenProps: hardcoded rem                 | 295       | `padding: 2rem 0;`                                   | `padding: var(--size-8) 0;` (32px ≈ 2rem)                                                      | WARNING  |
| less-layout.tsx | OpenProps: raw transition timing         | 335       | `transition: color 0.15s ease...`                    | `transition: color var(--ease-2) var(--duration-2)...`                                         | WARNING  |
| less-layout.tsx | OpenProps: not using border-size-2 token | 334       | `border-left: 2px solid transparent;`                | `border-left: var(--border-size-2) solid transparent;`                                         | INFO     |
| less-layout.tsx | OpenProps: hardcoded px in media queries | 382-443   | Multiple `1rem`, `0.75rem`, `0.5rem`, `56px`, `10px` | Use OpenProps tokens where possible                                                            | INFO     |

### 2. less-theme-toggle.tsx

| File                  | Issue                      | Line | Current Code                 | Fix                                       | Severity |
| --------------------- | -------------------------- | ---- | ---------------------------- | ----------------------------------------- | -------- |
| less-theme-toggle.tsx | OpenProps: 32px = --size-8 | 37   | `width: 32px; height: 32px;` | Equivalent to `var(--size-8)` — docs only | INFO     |

### 3. less-button.tsx

| File            | Issue                            | Line       | Current Code                     | Fix                                                        | Severity |
| --------------- | -------------------------------- | ---------- | -------------------------------- | ---------------------------------------------------------- | -------- |
| less-button.tsx | OpenProps: hardcoded px heights  | 59, 66, 72 | `height: 28px/36px/44px;`        | Document as component layout constants or use custom props | INFO     |
| less-button.tsx | OpenProps: raw transition timing | 50         | `transition: color 0.2s ease...` | `transition: color var(--ease-2) var(--duration-2)...`     | WARNING  |

### 4. less-card.tsx

| File          | Issue                            | Line | Current Code                                             | Fix                                                                                                  | Severity |
| ------------- | -------------------------------- | ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| less-card.tsx | OpenProps: raw transition timing | 40   | `transition: box-shadow 0.2s ease, transform 0.2s ease;` | `transition: box-shadow var(--ease-2) var(--duration-2), transform var(--ease-2) var(--duration-2);` | WARNING  |

### 5. less-dialog.tsx

| File            | Issue                            | Line | Current Code                                  | Fix                                                        | Severity |
| --------------- | -------------------------------- | ---- | --------------------------------------------- | ---------------------------------------------------------- | -------- |
| less-dialog.tsx | OpenProps: raw transition timing | 91   | `transition: color 0.15s ease;`               | `transition: color var(--ease-2) var(--duration-2);`       | WARNING  |
| less-dialog.tsx | OpenProps: hardcoded box-shadow  | 50   | `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);` | `box-shadow: var(--shadow-2);` or define `--dialog-shadow` | INFO     |

### 6. less-input.tsx

| File           | Issue                            | Line | Current Code                                                | Fix                                                                                                     | Severity |
| -------------- | -------------------------------- | ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| less-input.tsx | OpenProps: raw transition timing | 67   | `transition: border-color 0.2s ease, box-shadow 0.2s ease;` | `transition: border-color var(--ease-2) var(--duration-2), box-shadow var(--ease-2) var(--duration-2);` | WARNING  |

### 7. less-step-card.tsx

| File               | Issue                                           | Line  | Current Code                 | Fix                                            | Severity |
| ------------------ | ----------------------------------------------- | ----- | ---------------------------- | ---------------------------------------------- | -------- |
| less-step-card.tsx | OpenProps: hardcoded px                         | 52-53 | `width: 28px; height: 28px;` | `width: var(--size-7); height: var(--size-7);` | INFO     |
| less-step-card.tsx | OpenProps: inline style with non-semantic color | 101   | `color:var(--gray-7)`        | `color: var(--text-secondary);`                | INFO     |

### 8. less-code-block.tsx

| File                | Issue                         | Line    | Current Code                                                           | Fix                                                                             | Severity |
| ------------------- | ----------------------------- | ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| less-code-block.tsx | innerHTML: Prism highlighting | 233     | `highlightedCode.innerHTML = html;`                                    | Build-time sanitized source code via Prism.highlight(). **ACCEPTED (ADR-0064)** | INFO     |
| less-code-block.tsx | OpenProps: hardcoded green    | 104     | `color: #22c55e;`                                                      | Define `--copy-success: #22c55e` token in token sheet                           | INFO     |
| less-code-block.tsx | OpenProps: hardcoded rgba     | 105-106 | `border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08);` | Define semantic copy-state tokens                                               | INFO     |
| less-code-block.tsx | Prism token colors            | 115-126 | `color: #6a737d`, `#79c0ff`, etc.                                      | **EXCLUDED** — syntax highlighting colors are per guidelines                    | —        |

### 9. less-hero-ping.tsx

| File               | Issue                            | Line          | Current Code                                                             | Fix                                                                                | Severity |
| ------------------ | -------------------------------- | ------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- |
| less-hero-ping.tsx | Signal: no signal() usage        | 81-83, 97-118 | Uses plain `_state: string`, `_msg: string` with manual `_renderToDom()` | Migrate to `#state = signal('idle')`, `#msg = signal('')`, remove `_renderToDom()` | WARNING  |
| less-hero-ping.tsx | OpenProps: hardcoded green       | 61, 69        | `background: #22c55e;`, `color: #22c55e;`                                | Define `--status-ok: #22c55e` token                                                | WARNING  |
| less-hero-ping.tsx | OpenProps: raw transition timing | 36            | `transition: all 0.15s;`                                                 | `transition: all var(--ease-2) var(--duration-2);`                                 | WARNING  |
| less-hero-ping.tsx | OpenProps: hardcoded px          | 50-51         | `width: 7px; height: 7px;`                                               | `width: var(--size-1); height: var(--size-1);` (4px ≈ needs custom 7px)            | INFO     |

### 10. less-callout.tsx

| File             | Issue                               | Line  | Current Code                                                          | Fix                                                                                                                          | Severity |
| ---------------- | ----------------------------------- | ----- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| less-callout.tsx | OpenProps: hardcoded callout colors | 41-43 | `border-left-color: #f59e0b; background: rgba(245,158,11,0.08);` etc. | Define `--callout-warn`, `--callout-danger`, `--callout-tip` semantic tokens in open-props-tokens.ts or component stylesheet | WARNING  |

---

## IV. OpenProps Token Sheet Issues

| File                 | Issue                             | Line | Current Code                                               | Fix                                             | Severity |
| -------------------- | --------------------------------- | ---- | ---------------------------------------------------------- | ----------------------------------------------- | -------- |
| open-props-tokens.ts | Missing token: font-lineheight-00 | —    | Used in index/index.tsx line 47 but not defined            | Add `--font-lineheight-00: 0.85;`               | CRITICAL |
| open-props-tokens.ts | Missing token: shadow-2           | —    | Used in less-button.tsx line 108 but only shadow-1 defined | Add `--shadow-2: 0 4px 12px rgb(0 0 0 / 0.15);` | WARNING  |

---

## V. innerHTML Usage Summary

| File                     | Line(s)    | Content Type                                        | Verdict                 |
| ------------------------ | ---------- | --------------------------------------------------- | ----------------------- |
| less-search.tsx          | 282, 320   | Search results from build-time JSON + escaped query | ACCEPTED (ADR-0064)     |
| less-code-block.tsx      | 233        | Prism-highlighted source code                       | ACCEPTED (ADR-0064)     |
| demo-idle.ts             | 21         | Static demo content                                 | DELETE (dead code)      |
| demo-load.ts             | 21         | Static demo content                                 | DELETE (dead code)      |
| demo-only.ts             | 21         | Static demo content                                 | DELETE (dead code)      |
| demo-visible.ts          | 21         | Static demo content                                 | DELETE (dead code)      |
| media-chrome-showcase.ts | 52, 62, 69 | Static template + dynamic state                     | DELETE + redo if needed |

---

## VI. Dead Code Summary

### Confirmed Dead (5 files — never imported by any route)

- `www/app/islands/demo-idle.ts`
- `www/app/islands/demo-load.ts`
- `www/app/islands/demo-only.ts`
- `www/app/islands/demo-visible.ts`
- `www/app/islands/media-chrome-showcase.ts`

### Unused Methods (no unused methods found in active components)

---

## VII. Priority Remediation Plan

### Blocker (v0.27.0)

1. **docs-page.tsx**: Convert render() from string template to JSX
2. **docs-page.tsx**: Fix `background: #fff` → `var(--bg-elevated)`
3. **docs-page.tsx**: Fix all hardcoded px values
4. **open-props-tokens.ts**: Add `--font-lineheight-00` token
5. **counter-island.tsx**: Add `openPropsTokenSheet` to static styles

### High Priority

6. Delete 5 dead demo + media-chrome files
7. **reactive-showcase.tsx**: Move inline computed() to class fields
8. **home-console.tsx**: Add theme.subscribe cleanup
9. **scroll-reveal.ts**: Convert render() to JSX, add openPropsTokenSheet

### Medium Priority

10. **less-hero-ping.tsx**: Migrate to signal() state management
11. **less-callout.tsx**: Define callout color tokens (or accept as component-internal)
12. **less-layout.tsx**: Investigate `this._r` vs `this.routing` usage

### Low Priority

13. All raw `transition: 0.15s/0.2s` → `var(--ease-2) var(--duration-2)` conversions
14. Hardcoded px values → OpenProps token conversions across all files

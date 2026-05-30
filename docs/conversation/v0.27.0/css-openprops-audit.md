# CSS OpenProps Compliance Audit -- v0.27.0

**Auditor:** css-auditor
**Scope:** www/app/routes/ (all .tsx), www/app/islands/ (all .tsx/.ts), www/app/components/ (all .ts), packages/ui/src/ (all .tsx)
**Date:** 2026-05-30

---

## Executive Summary

| Domain              | Files Scanned | Clean  | Violations |
| ------------------- | ------------- | ------ | ---------- |
| www/app/routes/     | 32            | 6      | 26         |
| www/app/islands/    | 12            | 5      | 7          |
| www/app/components/ | 1             | 1      | 0          |
| packages/ui/src/    | 11            | 3      | 8          |
| **TOTAL**           | **56**        | **15** | **41**     |

**Total estimated violations: ~350+ individual occurrences**

---

## OpenProps Token Reference (for context)

```css
/* Available tokens */
--brand: #534ab7 --brand-hover: #4039a0 --brand-light: #6d5ce8 --brand-pale: #8b7cf6 --brand-deep:
  #26215c --brand-subtle: rgba(83, 74, 183, 0.1) --brand-glow: rgba(83, 74, 183, 0.15)
  --text-primary: var(--gray-9) --text-secondary: var(--gray-6) --text-muted: var(--gray-5)
  --bg-base: var(--gray-0) --bg-surface: var(--gray-1) --bg-card: var(--gray-0) --bg-code: #1e1e2e
  --bg-elevated: #ffffff --bg-hover: var(--gray-2) --border: var(--gray-3) --border-hover:
  var(--gray-4) --code-border: rgba(255, 255, 255, 0.06) --error: #dc3545 --size-1: 4px through
  --size-16: 64px --radius-1: 4px through --radius-4: 16px, --radius-round: 9999px --font-size-00:
  0.75rem through --font-size-8: 4rem --font-weight-4: 400 through --font-weight-9: 900 --font-sans:
  system-ui, ... --font-mono: 'SF Mono', ... --font-lineheight-1: 0.95 --font-lineheight-4: 1.75
  --ease-1/2/3 --duration-2: 200ms --gray-0 through --gray-12;
```

**Missing tokens (gaps requiring manual resolution):**

- No `--success` / `--warning` / `--danger` semantic color tokens (currently using `--error` only)
- No `--size-content-*` tokens defined
- No `--font-letterspacing-0` / `--font-letterspacing-2` (used in some files but not in token sheet)
- No `--font-lineheight-0` / `--font-lineheight-00` / `--font-lineheight-3` (used but not defined)

---

## 1. www/app/components/page-styles.ts -- CLEAN (0 violations)

This file is the gold standard. All properties use semantic tokens. No violations.

---

## 2. packages/ui/src/ -- Violations by File

### 2.1 less-code-block.tsx (3 violations)

| Line | Issue                | Current                              | Should Be                                           |
| ---- | -------------------- | ------------------------------------ | --------------------------------------------------- |
| 104  | color: #22c55e       | `color: #22c55e;`                    | `color: var(--success, #22c55e);` (needs new token) |
| 105  | border-color: rgba() | `border-color: rgba(34,197,94,0.3);` | needs semantic success-border token                 |
| 106  | background: rgba()   | `background: rgba(34,197,94,0.08);`  | needs semantic success-subtle token                 |

**Note:** Lines 115+ are syntax highlighting colors (Prism theme) -- EXCLUDED per audit rules.

### 2.2 less-button.tsx (4 violations)

| Line | Issue              | Current                                                                      | Should Be                          |
| ---- | ------------------ | ---------------------------------------------------------------------------- | ---------------------------------- |
| 50   | transition timing  | `transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;` | `var(--ease-3) var(--duration-2)`  |
| 78   | background: rgba() | `background: rgba(83,74,183,0.06);`                                          | `background: var(--brand-subtle);` |
| 97   | background: rgba() | `background: rgba(83,74,183,0.06);`                                          | `background: var(--brand-subtle);` |

### 2.3 less-card.tsx (1 violation)

| Line | Issue             | Current                                                  | Should Be                         |
| ---- | ----------------- | -------------------------------------------------------- | --------------------------------- |
| 40   | transition timing | `transition: box-shadow 0.2s ease, transform 0.2s ease;` | `var(--ease-3) var(--duration-2)` |

### 2.4 less-callout.tsx (8 violations)

| Line  | Issue              | Current                                                          | Should Be                             |
| ----- | ------------------ | ---------------------------------------------------------------- | ------------------------------------- |
| 41    | border-color + bg  | `border-left-color: #f59e0b; background: rgba(245,158,11,0.08);` | needs --warning / --warning-subtle    |
| 42    | border-color + bg  | `border-left-color: #ef4444; background: rgba(239,68,68,0.08);`  | `var(--error)` / needs --error-subtle |
| 43    | border-color + bg  | `border-left-color: #22c55e; background: rgba(34,197,94,0.08);`  | needs --success / --success-subtle    |
| 44-46 | background: rgba() | (light theme overrides: same 3)                                  | same as above                         |

### 2.5 less-dialog.tsx (1 violation)

| Line | Issue             | Current                         | Should Be                         |
| ---- | ----------------- | ------------------------------- | --------------------------------- |
| 91   | transition timing | `transition: color 0.15s ease;` | `var(--ease-2) var(--duration-2)` |

### 2.6 less-hero-ping.tsx (3 violations)

| Line | Issue              | Current                  | Should Be                         |
| ---- | ------------------ | ------------------------ | --------------------------------- |
| 36   | transition timing  | `transition: all 0.15s;` | `var(--ease-2) var(--duration-2)` |
| 61   | background: #color | `background: #22c55e;`   | needs --success token             |
| 69   | color: #color      | `color: #22c55e;`        | needs --success token             |

### 2.7 less-input.tsx (1 violation)

| Line | Issue             | Current                                                     | Should Be                         |
| ---- | ----------------- | ----------------------------------------------------------- | --------------------------------- |
| 67   | transition timing | `transition: border-color 0.2s ease, box-shadow 0.2s ease;` | `var(--ease-3) var(--duration-2)` |

### 2.8 less-layout.tsx (17 violations)

| Line | Issue              | Current                                                                         | Should Be                                                           |
| ---- | ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 229  | border-radius      | `border-radius: 1px;`                                                           | `var(--radius-1)` (4px is closest, but 1px is intentional)          |
| 308  | margin-bottom      | `margin-bottom: 1.5rem;`                                                        | `var(--size-6)`                                                     |
| 310  | font-size          | `font-size: 0.625rem;`                                                          | needs `var(--font-size-000)` or use 10px rem                        |
| 311  | font-weight        | `font-weight: 800;`                                                             | `var(--font-weight-8)`                                              |
| 315  | padding            | `padding: 0 1.5rem;`                                                            | `padding: 0 var(--size-6);`                                         |
| 316  | margin-bottom      | `margin-bottom: 0.5rem;`                                                        | `margin-bottom: var(--size-2);`                                     |
| 332  | font-size          | `font-size: 0.85rem;`                                                           | nearest: `var(--font-size-0)` (0.875rem)                            |
| 333  | padding            | `padding: 0.35rem 1.5rem;`                                                      | manual calculation needed                                           |
| 335  | transition timing  | `transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;` | `var(--ease-2) var(--duration-2)`                                   |
| 346  | font-weight        | `font-weight: 600;`                                                             | `var(--font-weight-6)`                                              |
| 359  | margin             | `margin: 0.25rem 0;`                                                            | `margin: var(--size-1) 0;`                                          |
| 370  | margin             | `margin: 0 1rem;`                                                               | `margin: 0 var(--size-4);`                                          |
| 376  | background: rgba() | `background: rgba(0,0,0,0.6);`                                                  | needs overlay/mask token                                            |
| 378  | transition timing  | `transition: opacity 0.3s ease;`                                                | `var(--ease-1)` + new duration token                                |
| 395  | padding            | `padding: 1rem 0;`                                                              | `padding: var(--size-4) 0;`                                         |
| 397  | transition         | `transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);`                        | `var(--ease-2)`                                                     |
| 402  | box-shadow: rgba() | `box-shadow: 8px 0 40px rgba(0,0,0,0.5);`                                       | needs shadow token                                                  |
| 405  | margin-bottom      | `margin-bottom: 0.5rem;`                                                        | `margin-bottom: var(--size-2);`                                     |
| 407  | padding            | `padding: 0.5rem 1rem 0.5rem 2rem;`                                             | `padding: var(--size-2) var(--size-4) var(--size-2) var(--size-8);` |
| 409  | padding            | `padding: 2rem 1rem;`                                                           | `padding: var(--size-8) var(--size-4);`                             |
| 414  | background: rgba() | `background: rgba(9,11,17,0.92);`                                               | needs overlay token                                                 |
| 425  | font-size          | `font-size: 10px;`                                                              | `var(--font-size-00)` (0.75rem = 12px, not exact match)             |
| 425  | font-weight        | `font-weight: 600;`                                                             | `var(--font-weight-6)`                                              |
| 426  | transition timing  | `transition: color 0.2s ease;`                                                  | `var(--ease-3) var(--duration-2)`                                   |
| 427  | padding            | `padding: 4px 0;`                                                               | `padding: var(--size-1) 0;`                                         |

### 2.9 less-step-card.tsx -- CLEAN (0 violations)

All uses var() tokens.

### 2.10 less-theme-toggle.tsx -- CLEAN (0 violations)

All uses var() tokens.

### 2.11 open-props-tokens.ts -- REFERENCE ONLY (not audited as "CSS in use")

---

## 3. www/app/islands/ -- Violations by File

### 3.1 demo-idle.ts (7 violations)

| Line | Issue             | Current                    | Should Be                                           |
| ---- | ----------------- | -------------------------- | --------------------------------------------------- |
| 14   | border-color: #   | `border:2px solid #f59e0b` | needs --warning token                               |
| 14   | border-radius: px | `border-radius:8px`        | `var(--radius-2)`                                   |
| 14   | padding: rem      | `padding:1rem`             | `var(--size-4)`                                     |
| 14   | margin: rem       | `margin:0.5rem 0`          | `var(--size-2) 0`                                   |
| 15   | background: #     | `background:#f59e0b`       | needs --warning token                               |
| 15   | color: #          | `color:#000`               | should use `var(--text-primary)` or dedicated token |
| 15   | padding: px       | `padding:2px 8px`          | `var(--size-1) var(--size-2)`                       |
| 15   | border-radius: px | `border-radius:4px`        | `var(--radius-1)`                                   |
| 15   | font-size: rem    | `font-size:0.75rem`        | `var(--font-size-00)`                               |
| 15   | font-weight       | `font-weight:bold`         | `var(--font-weight-7)`                              |

### 3.2 demo-load.ts (8 violations)

Same pattern as demo-idle.ts but with #22c55e (green):

| Line | Issue             | Current                    | Should Be                     |
| ---- | ----------------- | -------------------------- | ----------------------------- |
| 14   | border-color: #   | `border:2px solid #22c55e` | needs --success token         |
| 14   | border-radius: px | `border-radius:8px`        | `var(--radius-2)`             |
| 14   | padding: rem      | `padding:1rem`             | `var(--size-4)`               |
| 14   | margin: rem       | `margin:0.5rem 0`          | `var(--size-2) 0`             |
| 15   | background: #     | `background:#22c55e`       | needs --success token         |
| 15   | color: #          | `color:#fff`               | needs semantic token          |
| 15   | padding: px       | `padding:2px 8px`          | `var(--size-1) var(--size-2)` |
| 15   | border-radius: px | `border-radius:4px`        | `var(--radius-1)`             |
| 15   | font-size: rem    | `font-size:0.75rem`        | `var(--font-size-00)`         |
| 15   | font-weight       | `font-weight:bold`         | `var(--font-weight-7)`        |

### 3.3 demo-only.ts (8 violations)

Same pattern as demo-idle.ts but with #ef4444 (red):

| Line | Issue             | Current                    | Should Be                     |
| ---- | ----------------- | -------------------------- | ----------------------------- |
| 14   | border-color: #   | `border:2px solid #ef4444` | `var(--error)`                |
| 14   | border-radius: px | `border-radius:8px`        | `var(--radius-2)`             |
| 14   | padding: rem      | `padding:1rem`             | `var(--size-4)`               |
| 14   | margin: rem       | `margin:0.5rem 0`          | `var(--size-2) 0`             |
| 15   | background: #     | `background:#ef4444`       | `var(--error)`                |
| 15   | color: #          | `color:#fff`               | needs semantic token          |
| 15   | padding: px       | `padding:2px 8px`          | `var(--size-1) var(--size-2)` |
| 15   | border-radius: px | `border-radius:4px`        | `var(--radius-1)`             |
| 15   | font-size: rem    | `font-size:0.75rem`        | `var(--font-size-00)`         |
| 15   | font-weight       | `font-weight:bold`         | `var(--font-weight-7)`        |

### 3.4 demo-visible.ts (8 violations)

Same pattern but with #3b82f6 (blue):

| Line | Issue             | Current                    | Should Be                     |
| ---- | ----------------- | -------------------------- | ----------------------------- |
| 14   | border-color: #   | `border:2px solid #3b82f6` | needs --info token            |
| 14   | border-radius: px | `border-radius:8px`        | `var(--radius-2)`             |
| 14   | padding: rem      | `padding:1rem`             | `var(--size-4)`               |
| 14   | margin: rem       | `margin:0.5rem 0`          | `var(--size-2) 0`             |
| 15   | background: #     | `background:#3b82f6`       | needs --info token            |
| 15   | color: #          | `color:#fff`               | needs semantic token          |
| 15   | padding: px       | `padding:2px 8px`          | `var(--size-1) var(--size-2)` |
| 15   | border-radius: px | `border-radius:4px`        | `var(--radius-1)`             |
| 15   | font-size: rem    | `font-size:0.75rem`        | `var(--font-size-00)`         |
| 15   | font-weight       | `font-weight:bold`         | `var(--font-weight-7)`        |

### 3.5 counter-island.tsx (2 violations)

| Line | Issue             | Current                                                | Should Be                         |
| ---- | ----------------- | ------------------------------------------------------ | --------------------------------- |
| 55   | transition timing | `transition: background 0.15s ease, color 0.15s ease;` | `var(--ease-2) var(--duration-2)` |

### 3.6 home-console.tsx (5 violations)

| Line                            | Issue                  | Current                                    | Should Be                         |
| ------------------------------- | ---------------------- | ------------------------------------------ | --------------------------------- |
| 23                              | box-shadow: rgba()     | `box-shadow: 0 30px 60px rgba(0,0,0,0.4);` | needs shadow token                |
| 43                              | transition timing      | `transition: all 0.2s ease;`               | `var(--ease-3) var(--duration-2)` |
| 58                              | background: rgba()     | `background: rgba(0,255,135,0.08);`        | needs accent-subtle token         |
| 93                              | transition timing      | `transition: color 0.2s ease;`             | `var(--ease-3) var(--duration-2)` |
| 177,194,215,236,256,276,287,311 | SVG fill/stroke rgba() | (SVG attributes)                           | EXCLUDED                          |

### 3.7 less-search.tsx (2 violations)

| Line | Issue              | Current                        | Should Be                                         |
| ---- | ------------------ | ------------------------------ | ------------------------------------------------- |
| 88   | background: rgba() | `background: rgba(0,0,0,0.4);` | needs overlay token                               |
| 92   | padding-top        | `padding-top: 15vh;`           | VIEWPORT unit -- intentional layout; LOW PRIORITY |

### 3.8 less-toc.tsx (2 violations)

| Line | Issue                | Current                                                  | Should Be                                                      |
| ---- | -------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 51   | transition timing    | `transition: color 0.15s ease, border-color 0.15s ease;` | `var(--ease-2) var(--duration-2)`                              |
| 57   | border-color: rgba() | `border-left-color: rgba(124,111,245,0.3);`              | SHOULD BE `rgba(83,74,183,0.3)` using --brand values, or token |

### 3.9 scroll-reveal.ts (2 violations)

| Line | Issue             | Current                                                       | Should Be                              |
| ---- | ----------------- | ------------------------------------------------------------- | -------------------------------------- |
| 20   | transition timing | `transition: opacity 0.4s ease-out, transform 0.4s ease-out;` | `var(--ease-1)` + new duration-4 token |

### 3.10 react-showcase.ts (12 violations)

| Line | Issue                               | Current                                            | Should Be                                 |
| ---- | ----------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| 72   | background: rgba()                  | `rgba(239,68,68,0.15)` and `rgba(99,102,241,0.15)` | needs --error-subtle / --info-subtle      |
| 98   | background: rgba() + border + color | `rgba(99,102,241,0.1)` / `#6366f1` / `#a5b4fc`     | needs semantic info tokens                |
| 99   | background: rgba() + border + color | `rgba(16,185,129,0.1)` / `#10b981` / `#6ee7b7`     | needs --success-subtle / --success tokens |
| 100  | background: rgba() + border + color | `rgba(245,158,11,0.1)` / `#f59e0b` / `#fcd34d`     | needs --warning-subtle / --warning tokens |

### 3.11 media-chrome-showcase.ts

| Line   | Issue                       | Current                                                       | Should Be                                            |
| ------ | --------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| 84-109 | Various hardcoded colors    | `#000`, `#e0e0e0`, `#6366f1`, `#a1a1aa`, `#f59e0b`, `#71717a` | LOW PRIORITY -- media-chrome component customization |
| 85     | border-radius: px           | `border-radius: 8px;`                                         | `var(--radius-2)`                                    |
| 92-96  | --media-* custom properties | (component library bindings)                                  | ACCEPTABLE -- these are media-chrome API properties  |

### 3.12 reactive-showcase.tsx -- CLEAN (0 violations)

---

## 4. www/app/routes/ -- Violations by File

### 4.1 404.tsx -- CLEAN (0 violations)

One exception: `font-size: 4rem` on line 48 could be `var(--font-size-8)`.

### 4.2 apilist.tsx (6 violations)

| Line | Issue                 | Current                             | Should Be                                            |
| ---- | --------------------- | ----------------------------------- | ---------------------------------------------------- |
| 18   | margin in rem         | `margin-bottom: 2rem;`              | `margin-bottom: var(--size-8);`                      |
| 20   | margin in rem         | `margin: 1rem 0 0.75rem;`           | `margin: var(--size-4) 0 var(--size-3);`             |
| 22   | font-family hardcoded | `font-family: "JetBrains Mono",...` | `font-family: var(--font-mono);`                     |
| 23   | font-size in rem      | `font-size: 0.8125rem;`             | `var(--font-size-00)` (0.75rem closest) or new token |
| 25   | margin in rem         | `margin-bottom: 0.25rem;`           | `margin-bottom: var(--size-1);`                      |
| 28   | font-size in rem      | `font-size: 0.875rem;`              | `var(--font-size-0)`                                 |
| 30   | line-height           | `line-height: 1.6;`                 | `var(--font-lineheight-4)` (1.75) is closest         |

### 4.3 architecture/architecture.tsx (13 violations)

| Line | Issue                 | Current                             | Should Be                                              |
| ---- | --------------------- | ----------------------------------- | ------------------------------------------------------ |
| 54   | border-color: rgba()  | `rgba(81,72,184,0.28)`              | `var(--brand)` with opacity, or new brand-border token |
| 55   | background: rgba()    | `rgba(81,72,184,0.08)`              | `var(--brand-subtle)` is 0.1 -- close but not exact    |
| 60   | border-color: rgba()  | `rgba(19,121,91,0.26)`              | needs semantic success-border token                    |
| 61   | background: rgba()    | `rgba(19,121,91,0.08)`              | needs semantic success-subtle token                    |
| 85   | box-shadow: rgba()    | `0 20px 54px rgba(20,24,36,0.1)`    | needs shadow token                                     |
| 110  | font-family hardcoded | `font-family: "JetBrains Mono",...` | `font-family: var(--font-mono);`                       |
| 68   | line-height           | `line-height: 0.95;`                | `var(--font-lineheight-1)`                             |
| 106  | line-height           | `line-height: 1.65;`                | `var(--font-lineheight-4)` (1.75 closest)              |
| 136  | line-height           | `line-height: 1.08;`                | needs new token                                        |
| 20   | padding in px         | `padding: 44px var(--size-6) 72px;` | needs token for 44px and 72px                          |
| 92   | padding in px         | `padding: 14px var(--size-4);`      | needs size token                                       |
| 159  | padding in px         | `padding: 14px var(--size-4);`      | as above                                               |

### 4.4 architecture/benchmark.tsx -- CLEAN (0 violations)

### 4.5 architecture/comparison.tsx -- CLEAN (0 violations)

### 4.6 architecture/design-system.tsx (PRIMARILY EXCLUDED + minor violations)

The bulk of this file (lines 284-467) are swatch `<div>` elements displaying design system color tokens -- these are EXCLUDED per audit rules. However, the layout CSS has violations:

| Line | Issue                 | Current                                     | Should Be                                               |
| ---- | --------------------- | ------------------------------------------- | ------------------------------------------------------- |
| 27   | margin-bottom         | `margin-bottom: 3.5rem;`                    | `margin-bottom: var(--size-14);` (not defined, or calc) |
| 86   | border: rgba()        | `border: 1px solid rgba(255,255,255,0.08);` | token border (demo framework CSS)                       |
| 89   | border: rgba()        | `border: 1px solid rgba(0,0,0,0.08);`       | token border (demo framework CSS)                       |
| 92   | font-size in rem      | `font-size: 0.5625rem;`                     | needs token (9px)                                       |
| 134  | font-size in rem      | `font-size: 0.5625rem;`                     | as above                                                |
| 162  | font-size in rem      | `font-size: 0.5625rem;`                     | as above                                                |
| 167  | border-radius: px     | `border-radius: 3px;`                       | closest: `var(--radius-1)` (4px)                        |
| 190  | margin-top            | `margin-top: 3.5rem;`                       | needs size token                                        |
| 198  | font-size in rem      | `font-size: 0.9375rem;`                     | needs token (15px)                                      |
| 211  | font-family hardcoded | `font-family: "SF Mono", monospace;`        | `font-family: var(--font-mono);`                        |
| 225  | margin-bottom         | `margin-bottom: 2.5rem;`                    | needs size token                                        |

### 4.7 architecture/dsd.tsx (2 violations)

| Line | Issue             | Current                                           | Should Be           |
| ---- | ----------------- | ------------------------------------------------- | ------------------- |
| 24   | transition timing | `transition: border-color 0.2s, box-shadow 0.2s;` | `var(--duration-2)` |

### 4.8 architecture/islands.tsx (2 violations)

| Line | Issue             | Current                                           | Should Be           |
| ---- | ----------------- | ------------------------------------------------- | ------------------- |
| 22   | transition timing | `transition: border-color 0.2s, box-shadow 0.2s;` | `var(--duration-2)` |

### 4.9 architecture/islands-deep.tsx (5 violations)

| Line | Issue             | Current                    | Should Be                  |
| ---- | ----------------- | -------------------------- | -------------------------- |
| 13   | font-size in rem  | `font-size: 0.6875rem;`    | needs token (11px)         |
| 18   | border-radius: px | `border-radius: 3px;`      | `var(--radius-1)` (approx) |
| 12   | margin in rem     | `margin: var(--size-4) 0;` | OK (already uses var)      |

### 4.10 architecture/package-compatibility.tsx -- CLEAN

### 4.11 architecture/standards-registry.tsx -- CLEAN

### 4.12 blog/index.tsx (12 violations)

| Line | Issue             | Current                                             | Should Be                                    |
| ---- | ----------------- | --------------------------------------------------- | -------------------------------------------- |
| 28   | transition timing | `transition: border-color 0.15s, background 0.15s;` | `var(--duration-2)`                          |
| 46   | font-size in rem  | `font-size: 0.6875rem;`                             | needs token (11px)                           |
| 60   | padding in rem    | `padding: 0.125rem 0.375rem;`                       | `var(--size-1) var(--size-2)` approx         |
| 61   | border-radius: px | `border-radius: 2px;`                               | `var(--radius-1)` (4px) is different; manual |
| 68   | font-size in rem  | `font-size: 0.5rem;`                                | needs token (8px)                            |
| 71   | padding in rem    | `padding: 0.0625rem 0.3125rem;`                     | manual                                       |
| 72   | border-radius: px | `border-radius: 2px;`                               | manual                                       |

### 4.13 blog/[slug].tsx (6 violations)

| Line | Issue             | Current                       | Should Be                                                                   |
| ---- | ----------------- | ----------------------------- | --------------------------------------------------------------------------- |
| 29   | padding in rem    | `padding: 0.125rem 0.375rem;` | `var(--size-1) var(--size-2)`                                               |
| 29   | border-radius: px | `border-radius: 2px;`         | manual                                                                      |
| 31   | font-size in rem  | `font-size: 1.125rem;`        | needs token (18px) -- between --font-size-1 (16px) and --font-size-2 (20px) |
| 37   | padding in rem    | `padding: 0.125rem 0.375rem;` | `var(--size-1) var(--size-2)`                                               |
| 37   | border-radius: px | `border-radius: 2px;`         | manual                                                                      |
| 39   | line-height       | `line-height: 1.6;`           | `var(--font-lineheight-4)` (1.75) is closest                                |
| 42   | font-size in rem  | `font-size: 0.6875rem;`       | needs token (11px)                                                          |

### 4.14 changelog.tsx (12 violations)

| Line | Issue             | Current                                                        | Should Be                     |
| ---- | ----------------- | -------------------------------------------------------------- | ----------------------------- |
| 68   | padding in rem    | `padding: 0.25rem var(--size-6) var(--size-2) var(--size-10);` | `var(--size-1)` for 0.25rem   |
| 75   | padding in rem    | `padding: 0.375rem 0 0.375rem var(--size-5);`                  | needs token                   |
| 90   | padding in rem    | `padding: 0.25rem var(--size-6);`                              | `var(--size-1) var(--size-6)` |
| 107  | padding in rem    | `padding: 0.125rem 0.375rem;`                                  | `var(--size-1) var(--size-2)` |
| 108  | border-radius: px | `border-radius: 3px;`                                          | manual                        |

### 4.15 docs/index.tsx (14 violations)

| Line | Issue                | Current                          | Should Be                                                                         |
| ---- | -------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| 43   | margin-top: px       | `margin-top: 38px;`              | needs size token or calc                                                          |
| 52   | background: #        | `background: #fff;`              | `var(--bg-elevated)` (already #ffffff, OK -- but check dark mode!)                |
| 53   | padding: px          | `padding: 22px;`                 | needs token                                                                       |
| 59   | border-color: rgba() | `rgba(81,72,184,0.28)`           | `var(--brand)` opacity                                                            |
| 65   | font-size: px        | `font-size: 17px;`               | needs token                                                                       |
| 72   | line-height          | `line-height: 1.65;`             | `var(--font-lineheight-4)`                                                        |
| 81   | border-radius: px    | `border-radius: 5px;`            | `var(--radius-1)` (4px) or `var(--radius-2)` (8px)                                |
| 82   | font-size: px        | `font-size: 11px;`               | needs token                                                                       |
| 83   | font-weight          | `font-weight: 750;`              | `var(--font-weight-7)` (700) or `var(--font-weight-8)` (800) -- 750 doesn't exist |
| 85   | border: rgba()       | `1px solid rgba(81,72,184,0.22)` | need brand-border token                                                           |
| 86   | background: rgba()   | `rgba(81,72,184,0.06)`           | `var(--brand-subtle)` (0.1 is close)                                              |

### 4.16 hub/index.tsx (14 violations)

| Line | Issue                | Current                          | Should Be                                        |
| ---- | -------------------- | -------------------------------- | ------------------------------------------------ |
| 34   | font-size: px        | `font-size: 16px;`               | `var(--font-size-1)` (1rem = 16px)               |
| 39   | margin-top: px       | `margin-top: 38px;`              | needs token                                      |
| 47   | border-radius: px    | `border-radius: 8px;`            | `var(--radius-2)`                                |
| 48   | background: #        | `background: #fff;`              | `var(--bg-elevated)`                             |
| 49   | padding: px          | `padding: 22px;`                 | needs token                                      |
| 54   | border-color: rgba() | `rgba(81,72,184,0.28)`           | brand opacity                                    |
| 62   | margin-bottom: px    | `margin-bottom: 12px;`           | `var(--size-3)`                                  |
| 63   | padding: px          | `padding: 0 8px;`                | `padding: 0 var(--size-2);`                      |
| 64   | border-radius: px    | `border-radius: 5px;`            | `var(--radius-1)` (4px) or manual                |
| 65   | font-size: px        | `font-size: 11px;`               | needs token                                      |
| 66   | font-weight          | `font-weight: 750;`              | `var(--font-weight-7)` or `var(--font-weight-8)` |
| 68   | border: rgba()       | `1px solid rgba(81,72,184,0.22)` | brand-border token                               |
| 69   | background: rgba()   | `rgba(81,72,184,0.06)`           | brand-subtle                                     |

### 4.17 index/index.tsx (12 violations)

| Line  | Issue                   | Current                             | Should Be                              |
| ----- | ----------------------- | ----------------------------------- | -------------------------------------- |
| 30-32 | background-image rgba() | Hero grid pattern (decorative)      | LOW PRIORITY -- visual effect          |
| 65    | background rgba()       | Laser line effect                   | LOW PRIORITY -- visual effect          |
| 71    | box-shadow: rgba()      | `0 0 12px rgba(96,239,255,0.6)`     | needs --laser-cyan glow token          |
| 74    | box-shadow: rgba()      | `0 0 8px rgba(96,239,255,0.4)`      | as above                               |
| 75    | box-shadow: rgba()      | `0 0 20px rgba(96,239,255,0.8)`     | as above                               |
| 122   | transition timing       | `transition: background 0.3s ease;` | `var(--ease-1)`                        |
| 125   | background: rgba()      | `rgba(124,111,245,0.08)`            | `var(--brand-subtle)`                  |
| 136   | transition timing       | `transition: all 0.2s ease;`        | `var(--ease-3) var(--duration-2)`      |
| 146   | transition timing       | `transition: all 0.2s ease;`        | `var(--ease-3) var(--duration-2)`      |
| 159   | font-size: rem          | `font-size: 2.8rem;`                | `var(--font-size-6)` (3rem) is closest |

### 4.18 registry/index.tsx (~50 violations)

**COLORS (hardcoded hex -- high priority):**

| Line | Current           | Should Be                                            |
| ---- | ----------------- | ---------------------------------------------------- |
| 154  | `color: #fff;`    | needs semantic contrast token                        |
| 277  | `color: #22c55e;` | needs --success token                                |
| 282  | `color: #ef4444;` | `var(--error)` (but --error is #dc3545, not #ef4444) |
| 294  | `color: #6366f1;` | needs --info token                                   |

**rgba() backgrounds:**

| Line    | Current                                    | Should Be                       |
| ------- | ------------------------------------------ | ------------------------------- |
| 179     | `box-shadow: 0 1px 4px rgba(0,0,0,0.04);`  | needs shadow token              |
| 276     | `background: rgba(34,197,94,0.1);`         | needs --success-subtle          |
| 281     | `background: rgba(239,68,68,0.1);`         | needs --error-subtle            |
| 293     | `background: rgba(99,102,241,0.1);`        | needs --info-subtle             |
| 563,571 | `background:#22c55e`, `background:#f59e0b` | semantic success/warning tokens |

**SIZING:**

| Line | Current                            | Should Be                                       |
| ---- | ---------------------------------- | ----------------------------------------------- |
| 47   | `margin-bottom: 2rem;`             | `var(--size-8)`                                 |
| 51   | `font-size: 2rem;`                 | `var(--font-size-4)`                            |
| 52   | `font-weight: 700;`                | `var(--font-weight-7)`                          |
| 59   | `font-size: 0.9375rem;`            | needs token (15px)                              |
| 64   | `font-size: 0.625rem;`             | needs token (10px)                              |
| 65   | `font-weight: 600;`                | `var(--font-weight-6)`                          |
| 69   | `border-radius: 4px;`              | `var(--radius-1)`                               |
| 78   | `font-size: 0.8125rem !important;` | needs token (13px)                              |
| 92   | `margin-bottom: 1.5rem;`           | `var(--size-6)`                                 |
| 101  | `border-radius: 6px;`              | needs token (between --radius-1 and --radius-2) |
| 104  | `font-size: 0.875rem;`             | `var(--font-size-0)`                            |
| 127  | `border-radius: 14px;`             | needs token                                     |
| 130  | `font-size: 0.75rem;`              | `var(--font-size-00)`                           |
| 137  | `border-radius: 14px;`             | as above                                        |
| 140  | `font-size: 0.75rem;`              | `var(--font-size-00)`                           |
| 159  | `font-size: 0.8125rem;`            | needs token                                     |
| 161  | `margin-bottom: 1rem;`             | `var(--size-4)`                                 |
| 175  | `padding: 1.25rem;`                | `var(--size-5)` (20px)                          |
| 177  | `border-radius: 10px;`             | needs token                                     |
| 198  | `font-size: 1rem;`                 | `var(--font-size-1)`                            |
| 199  | `font-weight: 600;`                | `var(--font-weight-6)`                          |
| 208  | `font-size: 0.875rem;`             | `var(--font-size-0)`                            |
| 211  | `border-radius: 3px;`              | needs token                                     |
| 215  | `font-size: 0.75rem;`              | `var(--font-size-00)`                           |
| 217  | `font-weight: 400;`                | `var(--font-weight-4)`                          |
| 221  | `font-size: 0.8125rem;`            | needs token                                     |
| 244  | `border-radius: 10px;`             | needs token                                     |
| 245  | `font-size: 0.6875rem;`            | needs token (11px)                              |
| 246  | `font-weight: 500;`                | `var(--font-weight-5)`                          |
| 261  | `border-radius: 3px;`              | needs token                                     |
| 262  | `font-size: 0.6875rem;`            | needs token                                     |
| 270  | `font-size: 0.6875rem;`            | needs token                                     |
| 272  | `border-radius: 3px;`              | needs token                                     |
| 289  | `font-size: 0.625rem;`             | needs token                                     |
| 290  | `font-weight: 600;`                | `var(--font-weight-6)`                          |
| 292  | `border-radius: 6px;`              | needs token                                     |
| 303  | `font-size: 0.6875rem;`            | needs token                                     |
| 322  | `padding: 3rem 1rem;`              | `padding: var(--size-12) var(--size-4);`        |
| 324  | `font-size: 0.9375rem;`            | needs token                                     |

### 4.19 registry/[package]/[component].tsx (~60 violations)

**COLORS (hardcoded hex):**

| Line    | Current                      | Should Be                                          |
| ------- | ---------------------------- | -------------------------------------------------- |
| 186     | `background: #fff;`          | `var(--bg-elevated)`                               |
| 198     | `background: #fff;`          | `var(--bg-elevated)`                               |
| 269     | `color: #ef4444;`            | `var(--error)` (different shade)                   |
| 270     | `color: #f59e0b;`            | needs --warning token                              |
| 286     | `color: #ef4444;`            | `var(--error)`                                     |
| 287     | `color: #22c55e;`            | needs --success token                              |
| 290     | `background: #22c55e;`       | needs --success token                              |
| 291     | `background: #f59e0b;`       | needs --warning token                              |
| 292     | `background: #ef4444;`       | `var(--error)`                                     |
| 293     | `background: #8b5cf6;`       | needs --experimental token                         |
| 294     | `background: #888;`          | `var(--text-muted)` (close)                        |
| 296-300 | rgba() backgrounds + borders | compat badges -- needs semantic tokens             |
| 302-306 | rgba() backgrounds + borders | compat badges small -- needs semantic tokens       |
| 389     | HTML demo wrapper            | `color:#1a1a2e;background:#fff;font-size:14px;...` |

**rgba():**

| Line | Current                                         | Should Be          |
| ---- | ----------------------------------------------- | ------------------ |
| 141  | `box-shadow: 0 1px 3px rgba(0,0,0,0.03);`       | needs shadow token |
| 192  | `box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);` | needs shadow token |

**SIZING:**

| Line | Current                  | Should Be                                |
| ---- | ------------------------ | ---------------------------------------- |
| 121  | `margin-bottom: 2rem;`   | `var(--size-8)`                          |
| 124  | `font-size: 0.8125rem;`  | needs token                              |
| 137  | `border-radius: 10px;`   | needs token                              |
| 138  | `padding: 1.5rem;`       | `var(--size-6)`                          |
| 139  | `margin-bottom: 1.5rem;` | `var(--size-6)`                          |
| 144  | `font-size: 1rem;`       | `var(--font-size-1)`                     |
| 145  | `font-weight: 600;`      | `var(--font-weight-6)`                   |
| 157  | `margin-bottom: 1rem;`   | `var(--size-4)`                          |
| 160  | `font-size: 1.5rem;`     | `var(--font-size-3)`                     |
| 161  | `font-weight: 700;`      | `var(--font-weight-7)`                   |
| 170  | `border-radius: 14px;`   | needs token                              |
| 171  | `font-size: 0.8125rem;`  | needs token                              |
| 172  | `font-weight: 600;`      | `var(--font-weight-6)`                   |
| 184  | `border-radius: 10px;`   | needs token                              |
| 185  | `padding: 1.5rem;`       | `var(--size-6)`                          |
| 199  | `border-radius: 6px;`    | needs token                              |
| 203  | `font-size: 0.8125rem;`  | needs token                              |
| 207  | `font-size: 0.75rem;`    | `var(--font-size-00)`                    |
| 213  | `font-size: 0.75rem;`    | `var(--font-size-00)`                    |
| 216  | `font-weight: 500;`      | `var(--font-weight-5)`                   |
| 222  | `border-radius: 6px;`    | needs token                              |
| 223  | `padding: 1rem;`         | `var(--size-4)`                          |
| 225  | `font-size: 0.8125rem;`  | needs token                              |
| 239  | `font-size: 0.8125rem;`  | needs token                              |
| 244  | `font-weight: 500;`      | `var(--font-weight-5)`                   |
| 252  | `padding: 3rem 1rem;`    | `padding: var(--size-12) var(--size-4);` |
| 258  | `margin-bottom: 1rem;`   | `var(--size-4)`                          |
| 259  | `font-size: 0.8125rem;`  | needs token                              |
| 269  | `font-size: 0.8125rem;`  | needs token (WITH color violation)       |
| 270  | `font-size: 0.8125rem;`  | needs token (WITH color violation)       |
| 272  | `font-size: 0.875rem;`   | `var(--font-size-0)`                     |
| 273  | `font-size: 0.75rem;`    | `var(--font-size-00)`                    |
| 276  | `font-size: 0.8125rem;`  | needs token                              |
| 278  | `font-size: 0.8125rem;`  | needs token                              |
| 280  | `font-size: 0.8125rem;`  | needs token                              |

### 4.20 registry/[package].tsx (~35 violations)

**COLORS:**

| Line    | Current                | Should Be             |
| ------- | ---------------------- | --------------------- |
| 152     | `background: #ef4444;` | `var(--error)`        |
| 153     | `background: #22c55e;` | needs --success       |
| 154     | `background: #f59e0b;` | needs --warning       |
| 155     | `color: #ef4444;`      | `var(--error)`        |
| 156     | `color: #f59e0b;`      | needs --warning       |
| 161-165 | compat dot backgrounds | needs semantic tokens |
| 166-170 | compat badge rgba()    | needs semantic tokens |

**SIZING:**

| Line    | Current                                                                                                 | Should Be                                     |
| ------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 104     | `margin-bottom: 2rem;`                                                                                  | `var(--size-8)`                               |
| 109     | `font-size: 1.75rem; font-weight: 700;`                                                                 | `var(--font-size-3)` + `var(--font-weight-7)` |
| 111     | `font-size: 0.8125rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 14px; gap: 0.375rem;` | multiple violations                           |
| 114     | `font-size: 0.8125rem; gap: 1rem; margin-bottom: 0.5rem;`                                               | multiple                                      |
| 118     | `font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; gap: 0.5rem;`                                  | multiple                                      |
| 119     | `padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem;`                                            | multiple                                      |
| 120-121 | rgba() backgrounds                                                                                      | needs semantic tokens                         |
| 140     | `font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;`                                        | multiple                                      |
| 143     | `font-size: 0.75rem;`                                                                                   | `var(--font-size-00)`                         |
| 145     | `font-size: 0.75rem;`                                                                                   | `var(--font-size-00)`                         |
| 149     | `font-size: 0.8125rem;`                                                                                 | needs token                                   |
| 155     | `font-size: 0.6875rem;`                                                                                 | needs token (WITH color)                      |
| 156     | `font-size: 0.6875rem;`                                                                                 | needs token (WITH color)                      |

### 4.21 roadmap.tsx (18 violations)

| Line | Issue                | Current                 | Should Be                                              |
| ---- | -------------------- | ----------------------- | ------------------------------------------------------ |
| 23   | background: #        | `background: #11131a;`  | needs dark bg token                                    |
| 37   | padding in px        | `padding-bottom: 30px;` | needs token                                            |
| 60   | background: #        | `background: #fff;`     | `var(--bg-elevated)`                                   |
| 70   | border: rgba()       | `rgba(81,72,184,0.28)`  | brand border token                                     |
| 72   | background: rgba()   | `rgba(81,72,184,0.08)`  | brand-subtle                                           |
| 75   | font-weight          | `font-weight: 750;`     | needs `var(--font-weight-7)` or `var(--font-weight-8)` |
| 81   | font-size: px        | `font-size: 18px;`      | needs token                                            |
| 104  | background: #        | `background: #fff;`     | `var(--bg-elevated)`                                   |
| 135  | font-weight          | `font-weight: 750;`     | as above                                               |
| 141  | border-color: rgba() | `rgba(19,121,91,0.26)`  | success token                                          |
| 142  | background: rgba()   | `rgba(19,121,91,0.08)`  | success-subtle                                         |
| 147  | border-color: rgba() | `rgba(81,72,184,0.28)`  | brand                                                  |
| 148  | background: rgba()   | `rgba(81,72,184,0.08)`  | brand-subtle                                           |
| 153  | border-color: rgba() | `rgba(160,90,0,0.24)`   | warning token                                          |
| 154  | background: rgba()   | `rgba(160,90,0,0.08)`   | warning-subtle                                         |
| 158  | margin-top: px       | `margin-top: 34px;`     | needs token                                            |
| 167  | background: #        | `background: #fff;`     | `var(--bg-elevated)`                                   |
| 190  | padding-left: px     | `padding-left: 18px;`   | needs token                                            |
| 194  | margin-top: px       | `margin-top: 34px;`     | needs token                                            |
| 206  | border-radius: px    | `border-radius: 7px;`   | `var(--radius-2)` (8px) is close                       |

### 4.22 guide/* files -- Mostly clean

**guide/configuration.tsx:** Lines 118, 247 contain `theme-color` meta tags with `#050505` -- these are Google Chrome `theme-color` meta tag values, NOT CSS properties. EXCLUDED per rules.

**guide/architecture.tsx:** Lines 22-23 use inline style with var() tokens -- CLEAN.

**guide/deployment.tsx:** Line 26 has `margin: 0 0 0.4rem;` -- `margin: 0 0 var(--size-2);` (8px vs ~6.4px). Line 131/226 are just text content, not CSS.

Other guide files (api, core-concepts, error-handling, getting-started, islands-and-ssr, routing-and-data, testing) are CLEAN.

### 4.23 contribung.tsx -- CLEAN

### 4.24 registry/index.tsx -- already covered above

---

## 5. Additional Findings

### 5.1 Hub data file (out of scope but notable)

`www/app/data/registry/hub-data.ts` contains ~40 inline HTML preview strings with hardcoded `#d0d0d0`, `#999`, `#fafafa`, `border-radius:6px`, `font-size:0.8125rem`, `font-family:monospace`, `padding:0.75rem 1.25rem`. This is a data file, not in audit scope, but should be cleaned up eventually.

### 5.2 Missing OpenProps tokens (required before mechanical fixes)

The following values have NO corresponding OpenProps token and would need new tokens:

**Sizes not in scale:**

- 2px, 3px, 5px, 6px, 7px, 10px, 14px, 18px, 22px, 30px, 34px, 38px, 44px, 72px, 1.25rem, 2.5rem, 3.5rem

**Font sizes not in scale:**

- 0.5rem (8px), 0.5625rem (9px), 0.625rem (10px), 0.6875rem (11px), 0.8125rem (13px), 0.85rem (13.6px), 0.875rem (14px), 0.9375rem (15px), 1.125rem (18px), 1.75rem (28px), 2.8rem (44.8px), 17px, 18px

**Font weights not in scale:**

- 750 (between --font-weight-7 (700) and --font-weight-8 (800))

**Radius not in scale:**

- 2px, 3px, 5px, 6px, 7px, 10px, 14px

**Line heights not in scale:**

- 1.08, 1.6, 1.65, 0.95 (0.95 IS defined as --font-lineheight-1 but 1.08 is not)

**Missing semantic color tokens:**

- --success / --success-subtle / --success-border
- --warning / --warning-subtle / --warning-border
- --info / --info-subtle / --info-border
- --experimental / --experimental-subtle / --experimental-border
- --overlay / --overlay-strong (for backdrop/rgba(0,0,0,0.6))
- --shadow-card / --shadow-elevated / --shadow-glow

### 5.3 var() fallback patterns -- CLEAN

No `var(--xxx, #fallback)` patterns found. All uses of var() are clean.

### 5.4 Custom CSS variables duplicating OpenProps -- CLEAN

No custom `--ink`, `--muted`, or other pseudo-semantic variables found duplicating OpenProps. The `--cyber-green`, `--laser-cyan` variables in index/index.tsx are genuine custom variables (hero section sci-fi theme), not duplicates.

---

## 6. Violation Count by File (summary)

| File                               | Colors | Sizing | Radius | Transition | Typography | rgba() | Total |
| ---------------------------------- | ------ | ------ | ------ | ---------- | ---------- | ------ | ----- |
| **packages/ui/src/**               |        |        |        |            |            |        |       |
| less-code-block.tsx                | 1      | 0      | 0      | 0          | 0          | 2      | 3     |
| less-button.tsx                    | 0      | 0      | 0      | 1          | 0          | 2      | 3     |
| less-card.tsx                      | 0      | 0      | 0      | 1          | 0          | 0      | 1     |
| less-callout.tsx                   | 3      | 0      | 0      | 0          | 0          | 5      | 8     |
| less-dialog.tsx                    | 0      | 0      | 0      | 1          | 0          | 0      | 1     |
| less-hero-ping.tsx                 | 2      | 0      | 0      | 1          | 0          | 0      | 3     |
| less-input.tsx                     | 0      | 0      | 0      | 1          | 0          | 0      | 1     |
| less-layout.tsx                    | 0      | 13     | 1      | 3          | 2          | 3      | 22    |
| **www/app/islands/**               |        |        |        |            |            |        |       |
| demo-idle.ts                       | 2      | 3      | 2      | 0          | 2          | 0      | 9     |
| demo-load.ts                       | 2      | 3      | 2      | 0          | 2          | 0      | 9     |
| demo-only.ts                       | 2      | 3      | 2      | 0          | 2          | 0      | 9     |
| demo-visible.ts                    | 2      | 3      | 2      | 0          | 2          | 0      | 9     |
| counter-island.tsx                 | 0      | 0      | 0      | 2          | 0          | 0      | 2     |
| home-console.tsx                   | 0      | 0      | 0      | 2          | 0          | 3      | 5     |
| less-search.tsx                    | 0      | 0      | 0      | 0          | 0          | 1      | 1     |
| less-toc.tsx                       | 0      | 0      | 0      | 1          | 0          | 1      | 2     |
| scroll-reveal.ts                   | 0      | 0      | 0      | 2          | 0          | 0      | 2     |
| react-showcase.ts                  | 3      | 0      | 0      | 0          | 0          | 3      | 6     |
| media-chrome-showcase.ts           | 5      | 1      | 1      | 0          | 2          | 0      | 9     |
| **www/app/routes/**                |        |        |        |            |            |        |       |
| apilist.tsx                        | 0      | 1      | 0      | 0          | 4          | 0      | 5     |
| architecture/architecture.tsx      | 0      | 3      | 0      | 0          | 5          | 5      | 13    |
| architecture/design-system.tsx     | 0      | 4      | 1      | 0          | 4          | 2      | 11    |
| architecture/dsd.tsx               | 0      | 0      | 0      | 2          | 0          | 0      | 2     |
| architecture/islands.tsx           | 0      | 0      | 0      | 2          | 0          | 0      | 2     |
| architecture/islands-deep.tsx      | 0      | 2      | 2      | 0          | 2          | 0      | 6     |
| blog/index.tsx                     | 0      | 5      | 3      | 1          | 2          | 0      | 11    |
| blog/[slug].tsx                    | 0      | 5      | 2      | 0          | 3          | 0      | 10    |
| changelog.tsx                      | 0      | 7      | 1      | 0          | 4          | 0      | 12    |
| docs/index.tsx                     | 1      | 4      | 1      | 0          | 3          | 3      | 12    |
| hub/index.tsx                      | 1      | 4      | 2      | 0          | 3          | 3      | 13    |
| index/index.tsx                    | 0      | 1      | 0      | 3          | 1          | 8      | 13    |
| registry/index.tsx                 | 8      | 18     | 7      | 0          | 10         | 4      | 47    |
| registry/[package]/[component].tsx | 15     | 22     | 5      | 0          | 8          | 2      | 52    |
| registry/[package].tsx             | 10     | 15     | 4      | 0          | 7          | 4      | 40    |
| roadmap.tsx                        | 4      | 6      | 2      | 0          | 3          | 6      | 21    |
| 404.tsx                            | 0      | 0      | 0      | 0          | 1          | 0      | 1     |
| guide/deployment.tsx               | 0      | 1      | 0      | 0          | 0          | 0      | 1     |

---

## 7. Batch sed Commands for Mechanical Replacements

### 7.1 Transition timing (mechanical -- safe to batch)

```bash
# 0.2s ease → var(--ease-3) var(--duration-2)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/transition: \(.*\) 0\.2s ease\([,;]\)/transition: \1 var(--ease-3) var(--duration-2)\2/g' {} +

# 0.15s ease → var(--ease-2) var(--duration-2)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/transition: \(.*\) 0\.15s ease\([,;]\)/transition: \1 var(--ease-2) var(--duration-2)\2/g' {} +

# 0.3s ease → var(--ease-1) var(--duration-2) (closest match)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/transition: \(.*\) 0\.3s ease\([,;]\)/transition: \1 var(--ease-1) var(--duration-2)\2/g' {} +

# 0.4s ease-out → var(--ease-1) (duration needs new token, leave as-is for now)
# MANUAL: 0.4s in scroll-reveal.ts is intentional stagger timing
```

### 7.2 Font-weight (mechanical -- safe to batch)

```bash
# font-weight: 400; → var(--font-weight-4)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/font-weight: 400;/font-weight: var(--font-weight-4);/g' {} +

# font-weight: 500; → var(--font-weight-5)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/font-weight: 500;/font-weight: var(--font-weight-5);/g' {} +

# font-weight: 600; → var(--font-weight-6)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/font-weight: 600;/font-weight: var(--font-weight-6);/g' {} +

# font-weight: 700; → var(--font-weight-7)  (EXCLUDE less-code-block.tsx line 124, syntax highlighting)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -not -path "*/less-code-block.tsx" -exec sed -i 's/font-weight: 700;/font-weight: var(--font-weight-7);/g' {} +

# font-weight: 800; → var(--font-weight-8)
find www/app packages/ui/src -name "*.tsx" -name "*.ts" -exec sed -i 's/font-weight: 800;/font-weight: var(--font-weight-8);/g' {} +

# font-weight: bold; → var(--font-weight-7) (in demo-*.ts files)
sed -i 's/font-weight:bold;/font-weight:var(--font-weight-7);/g' www/app/islands/demo-*.ts
```

### 7.3 Font-size -- exact matches only (mechanical)

```bash
# font-size: 1rem; → var(--font-size-1)
find www/app -name "*.tsx" -exec sed -i 's/font-size: 1rem;/font-size: var(--font-size-1);/g' {} +

# font-size: 0.875rem; → var(--font-size-0)
find www/app -name "*.tsx" -exec sed -i 's/font-size: 0\.875rem;/font-size: var(--font-size-0);/g' {} +

# font-size: 0.75rem; → var(--font-size-00)
find www/app -name "*.tsx" -name "*.ts" -exec sed -i 's/font-size: 0\.75rem;/font-size: var(--font-size-00);/g' {} +
```

### 7.4 Border-radius -- exact matches only (mechanical)

```bash
# border-radius: 8px; → var(--radius-2)
find www/app -name "*.tsx" -name "*.ts" -exec sed -i 's/border-radius: 8px;/border-radius: var(--radius-2);/g' {} +

# border-radius: 4px; → var(--radius-1)
find www/app -name "*.tsx" -name "*.ts" -exec sed -i 's/border-radius: 4px;/border-radius: var(--radius-1);/g' {} +
```

### 7.5 Padding/margin -- exact matches (mechanical)

```bash
# padding: 1rem; → var(--size-4)
find www/app -name "*.tsx" -exec sed -i 's/padding: 1rem;/padding: var(--size-4);/g' {} +

# margin-bottom: 1rem; → var(--size-4)
find www/app -name "*.tsx" -exec sed -i 's/margin-bottom: 1rem;/margin-bottom: var(--size-4);/g' {} +

# margin-bottom: 2rem; → var(--size-8)
find www/app -name "*.tsx" -exec sed -i 's/margin-bottom: 2rem;/margin-bottom: var(--size-8);/g' {} +

# padding: 2px 8px; → var(--size-1) var(--size-2) (in demo-*.ts)
sed -i 's/padding:2px 8px;/padding:var(--size-1) var(--size-2);/g' www/app/islands/demo-*.ts
```

---

## 8. Items That MUST Be Done Manually

### 8.1 Colors requiring new semantic tokens (CANNOT batch replace)

These require first defining NEW tokens in open-props-tokens.ts:

```
--success: #22c55e;      --success-subtle: rgba(34,197,94,0.1);
--warning: #f59e0b;      --warning-subtle: rgba(245,158,11,0.1);
--info: #6366f1;         --info-subtle: rgba(99,102,241,0.1);
--experimental: #8b5cf6; --experimental-subtle: rgba(139,92,246,0.1);
```

Once defined, the compat badge system (registry/*.tsx, less-callout.tsx) can use these tokens.

### 8.2 Non-standard sizes (CANNOT batch to existing tokens)

These values have NO matching OpenProps token. Either add tokens or use calc():

- **13px (0.8125rem):** Used ~25 times across registry files. ADD `--font-size-00-5: 0.8125rem` to scale.
- **11px (0.6875rem):** Used ~10 times (blog tags, badge labels). ADD `--font-size-000: 0.6875rem`.
- **15px (0.9375rem):** Used ~4 times. ADD `--font-size-1-5: 0.9375rem`.
- **9px (0.5625rem):** Used in design-system.tsx label text. ADD `--font-size-0000: 0.5625rem`.
- **10px (0.625rem):** Used ~5 times. ADD `--font-size-00000: 0.625rem` or use 0.75rem.
- **8px (0.5rem):** Used in blog/index.tsx. Use `var(--font-size-00)` (0.75rem = 12px) instead -- review visual.

**Margin/padding sizes not in scale:**

- `38px`, `44px`, `72px`, `22px`, `30px`, `34px`, `18px`, `14px`
- Consider: replace 22px→`var(--size-5)` (20px, slight shift) or add tokens
- 44px and 72px are page-level layout values -- keep as explicit px for now or add `--size-11`/`--size-18`

### 8.3 rba() values that don't match existing brand tokens

These use brand color `rgba(81,72,184,N)` instead of `rgba(83,74,183,N)` (the token value). Slightly different shade:

| Files                               | Current Values                                  |   |
| ----------------------------------- | ----------------------------------------------- | - |
| architecture/architecture.tsx:54,55 | `rgba(81,72,184,0.28)` / `rgba(81,72,184,0.08)` |   |
| docs/index.tsx:59,85,86             | `rgba(81,72,184,0.28/0.22/0.06)`                |   |
| hub/index.tsx:54,68,69              | `rgba(81,72,184,0.28/0.22/0.06)`                |   |
| roadmap.tsx:70,72                   | `rgba(81,72,184,0.28/0.08)`                     |   |

**ACTION:** Audit whether `rgba(81,72,184,N)` and `rgba(83,74,183,N)` are visually identical. If so, batch replace with `var(--brand)` with opacity. If not, update open-props-tokens.ts to match the actual used shade OR update all usage to match the token.

### 8.4 background: #fff → var(--bg-elevated)

`var(--bg-elevated)` IS `#ffffff`. These are mechanically replaceable:

- docs/index.tsx:52
- hub/index.tsx:48
- registry/[package]/[component].tsx:186, 198
- roadmap.tsx:60, 104, 167

**BUT:** Verify dark mode. If these should be `var(--bg-card)` in dark mode (which resolves to `var(--gray-2)` = `#16191d`), you need the semantic token NOT `#fff`.

### 8.5 font-weight: 750 (used 4 times)

`font-weight: 750` is intentional -- between 700 and 800. No token exists.

- docs/index.tsx:83
- hub/index.tsx:66
- roadmap.tsx:75, 135

**OPTIONS:**

1. Use `var(--font-weight-7)` (700) - lighter
2. Use `var(--font-weight-8)` (800) - bolder
3. Add `--font-weight-7-5: 750` token

### 8.6 font-family hardcoded (3 files)

```bash
# Replace in apilist.tsx, architecture/architecture.tsx, design-system.tsx
sed -i 's/font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace;/font-family: var(--font-mono);/g' \
  www/app/routes/apilist.tsx \
  www/app/routes/architecture/architecture.tsx

sed -i 's/font-family: "SF Mono", monospace;/font-family: var(--font-mono);/g' \
  www/app/routes/architecture/design-system.tsx
```

### 8.7 less-code-block.tsx line 104-106 (copied state)

These are copy-button feedback colors. Replace only if success tokens are added:

```css
/* CURRENT */
color: #22c55e;
border-color: rgba(34, 197, 94, 0.3);
background: rgba(34, 197, 94, 0.08);

/* AFTER adding --success token */
color: var(--success, #22c55e);
border-color: var(--success-border, rgba(34, 197, 94, 0.3));
background: var(--success-subtle, rgba(34, 197, 94, 0.08));
```

### 8.8 registry/[package]/[component].tsx line 389 (HTML demo wrapper)

This is a COMPLETE inline HTML document string with inline styles. Full rewrite needed:

```javascript
// CURRENT (simplified)
`<style>body{margin:0;padding:20px;font-family:system-ui,...;font-size:14px;line-height:1.5;color:#1a1a2e;background:#fff;overflow:hidden}</style>`

  // SHOULD BE
  `<style>body{margin:0;padding:var(--size-5);font-family:var(--font-sans);font-size:var(--font-size-0);line-height:var(--font-lineheight-4);color:var(--text-primary);background:var(--bg-base);overflow:hidden}</style>`;
```

---

## 9. Priority Ranking for Fixes

### CRITICAL (must fix -- high impact, many files)

1. Add `--success`, `--warning`, `--info`, `--experimental` semantic color tokens to open-props-tokens.ts
2. Fix registry/*.tsx files (120+ violations combined) -- these are user-facing
3. Fix demo-*.ts islands (36 violations across 4 files) -- high visibility

### HIGH (should fix)

4. All transition timing → var(--ease-N) var(--duration-N) (10 files, mechanical)
5. All font-weight → var(--font-weight-N) (12 files, mostly mechanical)
6. Fix less-layout.tsx (22 violations) -- navigation chrome, high visibility
7. Fix docs/index.tsx, hub/index.tsx (25 combined violations)

### MEDIUM

8. Fix blog files (21 combined violations)
9. Fix roadmap.tsx (21 violations)
10. Fix changelog.tsx (12 violations)
11. Fix architecture page files (34 combined violations across 4 files)

### LOW

12. Fix apilist.tsx (5 violations -- low-traffic page)
13. Media-chrome-showcase.ts (component library customization, mostly OK)

---

## 10. Recommended Execution Order

1. **First:** Add missing tokens to `open-props-tokens.ts` (Section 8.1 values + size tokens from 8.2)
2. **Second:** Run batch sed commands from Section 7 for mechanical replacements
3. **Third:** Manual fix Section 8 items in priority order
4. **Fourth:** Visual regression test -- especially dark mode for `#fff` → `var(--bg-elevated)` changes
5. **Fifth:** Clean up `www/app/data/registry/hub-data.ts` (out of scope but eventual target)

---

_Audit completed by css-auditor. 56 files scanned. ~350 violations identified. 15 files are clean._

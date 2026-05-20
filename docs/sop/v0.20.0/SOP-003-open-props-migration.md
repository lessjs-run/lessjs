# SOP-003: Open Props Token Migration

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-001 (DsdElement), SOP-002 (SSR extraction) recommended but not required
> **Estimated time**: 0.5 day
> **Complexity**: 🟢 Low

---

## Objective

Replace the custom design token system (`color-values.ts`, `design-tokens.ts`, `colors.ts` — ~100 lines total) with **Open Props** — an industry-standard CSS design token library.

---

## Pre-requisites

- [ ] Understand current token usage across all 10 components
- [ ] Confirm Open Props variable names (https://open-props.style)

---

## Files

| File                                     | Action                                  | Current lines |
| ---------------------------------------- | --------------------------------------- | ------------- |
| `packages/ui/src/tokens/color-values.ts` | **DELETE**                              | ~40           |
| `packages/ui/src/tokens/colors.ts`       | **DELETE**                              | ~30           |
| `packages/ui/src/design-tokens.ts`       | **REWRITE** → `open-props-tokens.ts`    | ~30 → ~20     |
| `packages/ui/deno.json`                  | **EDIT** — remove Lit dep from DSD path | —             |

---

## Step-by-Step

### Step 1: Create token mapping

Map current `--less-*` variables to Open Props equivalents:

| Current (`--less-*`)    | Open Props (`--*`) | Notes                 |
| ----------------------- | ------------------ | --------------------- |
| `--less-size-1`         | `--size-1`         | 4px                   |
| `--less-size-2`         | `--size-2`         | 8px                   |
| `--less-size-3`         | `--size-3`         | 12px                  |
| `--less-size-4`         | `--size-4`         | 16px                  |
| `--less-size-8`         | `--size-8`         | 64px                  |
| `--less-size-10`        | `--size-10`        | 80px                  |
| `--less-radius-md`      | `--radius-2`       | 8px                   |
| `--less-radius-lg`      | `--radius-3`       | 12px                  |
| `--less-radius-xl`      | `--radius-4`       | 16px                  |
| `--less-accent`         | `--brand` (custom) | Fallback `--indigo-6` |
| `--less-bg-base`        | `--gray-0`         | White                 |
| `--less-bg-surface`     | `--gray-1`         | Light gray            |
| `--less-text-primary`   | `--gray-9`         | Near black            |
| `--less-text-secondary` | `--gray-7`         | Medium gray           |
| `--less-border`         | `--gray-3`         | Light border          |
| `--less-shadow-sm`      | `--shadow-1`       | Small shadow          |
| `--less-shadow-md`      | `--shadow-3`       | Medium shadow         |

### Step 2: Create minimal brand override

`packages/ui/src/open-props-tokens.ts`:

```typescript
/**
 * Open Props + LessJS brand overrides.
 *
 * All design tokens come from Open Props (https://open-props.style).
 * Only brand-specific overrides are defined here.
 */
export const brandTokens = `
  /* === LessJS Brand Overrides === */
  --brand: #534ab7;           /* Primary brand color */
  --brand-hover: #4039a0;     /* Brand hover state */

  /* === Open Props aliases (used in components) === */
  /* Most tokens come directly from Open Props:
   *   --size-*      spacing scale
   *   --gray-*      neutral color palette
   *   --radius-*    border radius scale
   *   --shadow-*    box shadow scale
   *   --font-sans   system font stack
   *   --ease-*      animation easing
   */
`;
```

### Step 3: Determine Open Props delivery method

**For SSR (DSD templates)**: Extract used variable values at build time and inline them into each component's CSSStyleSheet.

Option A (simplest — recommended for v0.20):

```
Copy the ~15 Open Props variables actually used by LessJS components
directly into a shared token CSSStyleSheet.
```

```typescript
// packages/ui/src/open-props-tokens.ts — full version
import { css } from './brand-overrides.js'; // ← delete, merge into this

export const tokenSheet = new CSSStyleSheet();
tokenSheet.replaceSync(`
  /* === Spacing (from Open Props) === */
  --size-1: 4px;
  --size-2: 8px;
  --size-3: 12px;
  --size-4: 16px;
  --size-5: 20px;
  --size-6: 24px;
  --size-8: 64px;
  --size-10: 80px;

  /* === Colors (from Open Props gray palette) === */
  --gray-0: #f8f9fa;
  --gray-1: #f1f3f5;
  --gray-3: #dee2e6;
  --gray-5: #adb5bd;
  --gray-7: #495057;
  --gray-9: #212529;

  /* === Accent (from Open Props indigo) === */
  --indigo-5: #7950f2;
  --indigo-6: #6741d9;
  --indigo-7: #5a32b3;

  /* === Brand Overrides === */
  --brand: var(--indigo-6);
  --brand-hover: var(--indigo-7);

  /* === Borders & Radii (from Open Props) === */
  --border-size-1: 1px;
  --radius-2: 8px;
  --radius-3: 12px;
  --radius-4: 16px;

  /* === Shadows (from Open Props) === */
  --shadow-1: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-3: 0 4px 12px -2px rgb(0 0 0 / 0.15);

  /* === Typography (from Open Props) === */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-size-0: 0.875rem;
  --font-size-2: 1.25rem;
  --font-weight-5: 500;

  /* === Animation (from Open Props) === */
  --ease-2: cubic-bezier(.45, 0, .25, 1);
`);
```

### Step 4: Update component stylesheets

Each component's `CSSStyleSheet` should now reference Open Props variables. Example for less-button:

```typescript
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: inline-block; }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-4);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-5);
    border: var(--border-size-1) solid var(--gray-5);
    background: transparent;
    color: var(--gray-9);
    border-radius: var(--radius-2);
    transition: color var(--ease-2), background var(--ease-2);
  }
  /* ... */
`);
```

The DsdElement base class will merge `tokenSheet` + component `sheet` automatically.

### Step 5: Delete old token files

```
git rm packages/ui/src/tokens/color-values.ts
git rm packages/ui/src/tokens/colors.ts
```

`design-tokens.ts` is rewritten (not deleted) as `open-props-tokens.ts`.

---

## Verification Checklist

- [ ] All components use Open Props variables (no `--less-*` in component styles)
- [ ] Visual comparison: before/after screenshots identical
- [ ] Dark mode: Open Props light/dark pairs work correctly
- [ ] Brand color override: `--brand` custom property takes effect
- [ ] SSR output: `<style>` tag includes actual variable values (not `@import`)
- [ ] `color-values.ts` and `colors.ts` are deleted from the repo

---

## Dependencies

```
SOP-003 blocks: SOP-004, SOP-005, SOP-006, SOP-007, SOP-008 (components use new tokens)
SOP-003 blocked by: SOP-001 (DsdElement), SOP-002 (optional but recommended)
```

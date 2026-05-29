# SOP-004: Component Migration A — Pure Display

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-001 (DsdElement), SOP-002 (SSR extraction), SOP-003 (Open Props tokens)
> **Estimated time**: 0.7 day
> **Complexity**: 🟢 Low

---

## Objective

Migrate the three **pure display** components (no interactivity, no events) from `DsdLitElement` to `DsdElement`. These are the simplest migration — verify the entire SSR → DSD → hydration pipeline works end-to-end.

---

## Pre-requisites

- [ ] SOP-001: `DsdElement` base class exists in `@lessjs/core`
- [ ] SOP-002: `renderDsd()` extracts CSSStyleSheet
- [ ] SOP-003: Open Props token sheet available

---

## Components

| Component        | File                                | Lines | Events? | State? |
| ---------------- | ----------------------------------- | ----- | ------- | ------ |
| `less-card`      | `packages/ui/src/less-card.ts`      | 96    | No      | No     |
| `less-callout`   | `packages/ui/src/less-callout.ts`   | ~60   | No      | No     |
| `less-step-card` | `packages/ui/src/less-step-card.ts` | ~100  | No      | No     |

---

## Migration Pattern (applies to all 3)

Each component follows this exact transformation:

### Before (Lit)

```typescript
import { css, html, nothing } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

class LessCard extends DsdLitElement {
  static override styles = [lessDesignTokens, css`...`];
  
  override render() {
    if (this._dsdHydrated) return nothing;
    return html`<div class="card"><slot></slot></div>`;
  }
}
```

### After (Native DsdElement)

```typescript
import { DsdElement } from '@lessjs/core';
import { tokenSheet } from './open-props-tokens.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .card {
    padding: var(--size-4);
    background: var(--gray-0);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-3);
    box-shadow: var(--shadow-1);
  }
`);

export class LessCard extends DsdElement {
  static styles = sheet;

  render(): string {
    return `<div class="card" part="container">
      <slot></slot>
    </div>`;
  }
}

if (!customElements.get('less-card')) customElements.define('less-card', LessCard);
```

---

## Step-by-Step (per component)

### Step 1: Audit current component

Read the component file. Note:

- All attributes/properties used
- All CSS classes and their variants
- Any slots
- Any Lit-specific patterns (`@property`, `updated()`, `@click`)

### Step 2: Convert styles

1. Copy CSS from `css\`...\`` template literal
2. Replace `--less-*` variables with Open Props equivalents (see SOP-003 mapping)
3. Wrap in `new CSSStyleSheet()` + `sheet.replaceSync()`
4. Remove `lessDesignTokens` import — tokenSheet is merged by DsdElement base class

### Step 3: Convert render()

1. Copy HTML from `html\`...\`` template literal
2. Remove Lit binding syntax (`@click`, `.prop`, `?attr`)
3. Convert Lit expressions to string interpolation: `\${this.variant}` → `\${this.getAttribute('variant') || 'default'}`
4. Add `part="..."` attributes to key elements
5. Return plain string

### Step 4: Remove Lit imports

```diff
- import { css, html, nothing } from 'lit';
- import { DsdLitElement } from '@lessjs/adapter-lit';
- import { lessDesignTokens } from './design-tokens.js';
+ import { DsdElement } from '@lessjs/core';
```

### Step 5: Remove DSD hack

```diff
- if (this._dsdHydrated) return nothing;
```

### Step 6: Register custom element

```typescript
if (!customElements.get('less-card')) customElements.define('less-card', LessCard);
```

### Step 7: Verify SSR output

Build the SSG site and compare `<less-card>` output before/after. The HTML structure inside `<template shadowrootmode>` must be identical.

---

## Per-Component Details

### less-card (96 lines)

```
Attributes: variant (default, outlined, elevated)
Slots: default (content), header, footer
CSS Parts: container, header, body, footer
```

### less-callout (~60 lines)

```
Attributes: type (info, warning, success, error)
Slots: default (content)
CSS Parts: container, icon, content
```

### less-step-card (~100 lines)

```
Attributes: step (number), title, description, status (completed, active, pending)
Slots: default (content)
CSS Parts: container, indicator, title, description, content
```

---

## Verification Checklist (per component)

- [ ] `import { DsdElement } from '@lessjs/core'` — no Lit import
- [ ] `static styles = sheet` — CSSStyleSheet, not CSSResult
- [ ] `render(): string` — returns string, not TemplateResult
- [ ] No `_dsdHydrated` check
- [ ] No `@click`, `.prop`, `?attr` in render()
- [ ] `part="..."` on key elements
- [ ] `customElements.define()` at module level
- [ ] SSR output: HTML structure identical to v0.19
- [ ] Browser render: visual identical to v0.19

---

## Dependencies

```
SOP-004 blocks: SOP-010 (CSS Parts coverage)
SOP-004 blocked by: SOP-001, SOP-002, SOP-003
```

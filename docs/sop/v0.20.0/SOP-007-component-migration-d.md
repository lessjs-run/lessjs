# SOP-007: Component Migration D — less-layout (Layered)

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-006 (Migration C verified interactive patterns)
> **Estimated time**: 1.5 days
> **Complexity**: 🔴 High

---

## Objective

Migrate `less-layout` (1202 lines, the largest and most complex component) from `DsdLitElement` to `DsdElement` using a **3-step layered migration** to minimize regression risk.

---

## Why Layered?

`less-layout` is the app shell — it manages navigation, sidebar, header, footer, and content area. A full rewrite in one step risks regressions across the entire site. Three independent, verifiable steps:

```
Step 1: Styles migration      → CSSStyleSheet, no behavior change
Step 2: Events migration      → hydrateEvents, no structure change
Step 3: State migration       → attributeChangedCallback, final convergence
```

Each step is independently testable and revertible.

---

## Pre-requisites

- [ ] SOP-001 through SOP-006 complete
- [ ] Full understanding of less-layout's current behavior (read entire file)
- [ ] SSG build comparison baseline (before migration)

---

## Step 1: Styles Migration (0.5 day)

### Objective

Convert all Lit `css\`...\``to`CSSStyleSheet` without changing any logic, events, or state management.

### Approach

1. Extract all CSS from `static override styles` into a new `CSSStyleSheet`
2. Replace `--less-*` variables with Open Props equivalents
3. Keep `DsdLitElement` and all Lit imports intact
4. Replace `static override styles = [lessDesignTokens, css\`...\`]` with:
   ```typescript
   const layoutSheet = new CSSStyleSheet();
   layoutSheet.replaceSync(`... all CSS ...`);

   // TEMPORARY hybrid: direct sheet + adapter-lit still works
   // Because DsdLitElement extends LitElement, adoptedStyleSheets works
   static override styles = [lessDesignTokens, unsafeCSS(layoutSheet.cssRules[0]?.cssText || '')];
   ```
5. **Verify**: SSG build output identical. Visual: identical.
6. **Commit** with message: `refactor(layout): step 1 — styles to CSSStyleSheet`

### Verification (Step 1)

- [ ] SSG output for layout component: identical HTML
- [ ] Visual diff: no changes
- [ ] Navigation still works (Lit event handling still active)

---

## Step 2: Events Migration (0.5 day)

### Objective

Replace Lit `@click`, `@input` event bindings with `hydrateEvents` while keeping `DsdLitElement` as the base class.

### Approach

1. Add `static hydrateEvents` array, mirroring existing Lit event bindings:
   ```typescript
   static override hydrateEvents = [
     { selector: '.nav-toggle', event: 'click', method: '_toggleNav' },
     { selector: '.nav-item', event: 'click', method: '_handleNavClick' },
     { selector: '.theme-btn', event: 'click', method: '_toggleTheme' },
     // ... map every @click, @input, @change in the template
   ];
   ```

2. In `render()`, remove all Lit event binding syntax:
   ```diff
   - <button @click=${this._toggleNav}>...</button>
   + <button class="nav-toggle" part="nav-toggle">...</button>

   - <a @click=${this._handleNavClick} href=${item.href}>
   + <a class="nav-item" part="nav-item" href="${item.href}">
   ```

3. Keep Lit for everything else (properties, updated(), render() still returns TemplateResult).

4. **Verify**: Click navigation → works. Theme toggle → works. SSR output: attribute structure identical, event syntax removed.

5. **Commit** with message: `refactor(layout): step 2 — events to hydrateEvents`

### Verification (Step 2)

- [ ] All click handlers work (nav toggle, nav items, theme)
- [ ] SSR output: no `@click`, `.prop`, `?attr` in HTML
- [ ] No duplicate event handlers (Lit + hydrateEvents)
- [ ] Mobile nav toggle works

---

## Step 3: State Migration (0.5 day)

### Objective

Remove Lit entirely. Replace `@property`, `updated()`, `render() → nothing` with `observedAttributes`, `attributeChangedCallback`, and `render(): string`.

### Approach

1. Change base class:
   ```diff
   - import { DsdLitElement } from '@openelement/adapter-lit';
   + import { DsdElement } from '@openelement/core';

   - class LessLayout extends DsdLitElement {
   + export class LessLayout extends DsdElement {
   ```

2. Convert `@property` declarations:
   ```diff
   - @property({ type: String, reflect: true }) currentPath = '/';
   - @property({ type: Array }) navItems: NavItem[] = [];
   - @property({ type: String }) sidebarState = 'expanded';
   + static observedAttributes = ['current-path', 'nav-items', 'sidebar-state', 'theme'];
   ```

3. Convert `render()`:
   ```diff
   - override render() {
   -   if (this._dsdHydrated) return nothing;
   -   return html`<div class="layout">...complex template...</div>`;
   - }
   + render(): string {
   +   return `<div class="layout" part="container">...complex template...</div>`;
   + }
   ```

4. Convert `updated()` → `attributeChangedCallback`:
   ```typescript
   attributeChangedCallback(name: string, old: string | null, val: string | null) {
     if (old === val) return;
     switch (name) {
       case 'current-path':
         this._updateActiveNav();
         break;
       case 'sidebar-state':
         this._syncSidebar();
         break;
       case 'theme':
         this._syncTheme();
         break;
     }
   }
   ```

5. Remove all Lit imports: `css`, `html`, `nothing`, `property`.

6. **Verify**: Full SSG build + interactive testing.

7. **Commit** with message: `refactor(layout): step 3 — remove Lit, complete migration`

### Verification (Step 3)

- [ ] No Lit imports in less-layout.ts
- [ ] `render()` returns `string`
- [ ] SSR output: `<template shadowrootmode>` content identical
- [ ] Navigation: all links work
- [ ] Sidebar: toggle, collapse, expand
- [ ] Theme: toggles correctly
- [ ] Mobile: responsive behavior unchanged
- [ ] No regression on any page using layout

---

## File

| File                             | Action                                    |
| -------------------------------- | ----------------------------------------- |
| `packages/ui/src/less-layout.ts` | 3-step migration: styles → events → state |

Each step is a separate commit. Do NOT squash.

---

## Risk Mitigation

| Risk                                 | Mitigation                                                               |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Template is huge (many conditions)   | `render(): string` uses template literals — same logic, simpler syntax   |
| `navItems` as JSON attribute (array) | De-serialize in `_syncDOM()`: `JSON.parse(this.getAttribute('nav-items') |
| Mobile breakpoints                   | Media queries in CSSStyleSheet — identical to current                    |
| SSR attribute serialization          | `serializeAttributes()` handles nested objects → same as v0.19           |

---

## Dependencies

```
SOP-007 blocks: SOP-011 (build verification needs all components migrated)
SOP-007 blocked by: SOP-006
```

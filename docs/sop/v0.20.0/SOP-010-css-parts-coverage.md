# SOP-010: CSS Parts Universal Coverage

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-005 through SOP-009 (all components migrated)
> **Estimated time**: 0.5 day
> **Complexity**: 🟢 Low

---

## Objective

Ensure every component exposes `part="..."` attributes on all externally customizable elements, creating a consistent public CSS customization API.

---

## CSS Parts Contract

Each component MUST:

1. Add `part="..."` to key internal elements in `render()`
2. Document the parts in the component file header
3. Follow naming conventions

### Naming Convention

```
part="<semantic-name>"

Examples:
  part="control"    — the main interactive element (button, input)
  part="container"  — the outermost wrapper
  part="header"     — header section
  part="body"       — body/content section
  part="footer"     — footer section
  part="overlay"    — overlay/backdrop
  part="icon"       — icon element
  part="label"      — text label
```

---

## Per-Component Audit

### less-card

```html
<div class="card" part="container">
  <div part="header"><slot name="header"></slot></div>
  <div part="body"><slot></slot></div>
  <div part="footer"><slot name="footer"></slot></div>
</div>
```

### less-callout

```html
<div class="callout callout--${type}" part="container">
  <span class="callout-icon" part="icon"><!-- SVG --></span>
  <div class="callout-content" part="content"><slot></slot></div>
</div>
```

### less-step-card

```html
<div class="step-card" part="container" data-status="${status}">
  <div class="step-indicator" part="indicator">${step}</div>
  <div class="step-content" part="content">
    <h3 part="title">${title}</h3>
    <p part="description">${description}</p>
    <div part="body"><slot></slot></div>
  </div>
</div>
```

### less-button

```html
<button class="btn btn--${variant} btn--${size}" part="control" ${disabled}>
  <slot></slot>
</button>
```

### less-input

```html
<div class="input-wrapper" part="wrapper">
  <label part="label">${label}</label>
  <input type="${type}" part="control" ${disabled} />
</div>
```

### less-theme-toggle

```html
<button class="theme-toggle" part="toggle" aria-label="Toggle theme">
  <span class="theme-icon" part="icon"><!-- sun/moon SVG --></span>
  <span class="theme-label" part="label">${label}</span>
</button>
```

### less-code-block

```html
<div class="code-block" part="container">
  <div class="code-header" part="header">
    <span class="code-lang" part="lang">${language}</span>
    <button class="copy-btn" part="copy">Copy</button>
  </div>
  <pre class="code-body" part="body"><code>${highlighted}</code></pre>
</div>
```

### less-dialog

```html
<div class="overlay" part="overlay">
  <div class="dialog" part="dialog" role="dialog" aria-label="${label}">
    <div class="dialog-header" part="header">
      <h2 part="title">${label}</h2>
      <button class="close-btn" part="close" aria-label="Close">✕</button>
    </div>
    <div class="dialog-body" part="body"><slot></slot></div>
    <div class="dialog-footer" part="footer"><slot name="footer"></slot></div>
  </div>
</div>
```

### less-layout

```html
<div class="layout" part="container">
  <header class="layout-header" part="header">
    <button class="nav-toggle" part="nav-toggle">☰</button>
    <slot name="header"></slot>
  </header>
  <nav class="layout-sidebar" part="sidebar">
    <slot name="sidebar"></slot>
  </nav>
  <main class="layout-main" part="main"><slot></slot></main>
  <footer class="layout-footer" part="footer"><slot name="footer"></slot></footer>
</div>
```

### less-search

```html
<button class="search-trigger" part="trigger" aria-label="Search">
  <svg part="icon">...</svg>
  <span part="label">Search</span>
  <kbd part="shortcut">/</kbd>
</button>
```

### less-hero-ping (Island — Lit)

```html
<span class="ping-wrapper" part="wrapper">
  <span class="ping-dot ping-dot--static" part="dot-static"></span>
  <span class="ping-dot ping-dot--animated" part="dot-animated"></span>
</span>
```

---

## Consumer Usage Examples

```css
/* Customize all buttons */
less-button::part(control) {
  border-radius: 20px;
  font-weight: 700;
}

/* Customize dialog overlay */
less-dialog::part(overlay) {
  background: rgb(0 0 0 / 0.7);
  backdrop-filter: blur(4px);
}

/* Customize code block header */
less-code-block::part(header) {
  background: var(--gray-9);
  color: var(--gray-0);
}

/* Customize search trigger */
less-search::part(trigger) {
  border-radius: 24px;
  padding: 8px 16px;
}
```

---

## Implementation Steps

### For each component:

1. **Audit**: List all elements in `render()` output
2. **Add parts**: Add `part="..."` to each externally customizable element
3. **Document**: Add CSS Parts section to component file header comment:

```typescript
/**
 * @element less-button
 *
 * @csspart control — The button or anchor element
 *
 * @slot — Default slot for button content
 */
export class LessButton extends DsdElement { ... }
```

4. **Verify**: Consumer `<style>` with `::part()` applies correctly

---

## Verification Checklist

- [ ] All 10 components have `part="..."` attributes on key elements
- [ ] CSS Parts documented in each component's JSDoc
- [ ] Quick consumer test: `<style>less-button::part(control) { border: 3px solid red; }</style>` — visible border
- [ ] No duplicate part names within a single component
- [ ] Parts follow naming convention (no camelCase, no abbreviations)

---

## Dependencies

```
SOP-010 blocks: SOP-012 (regression testing includes CSS Parts)
SOP-010 blocked by: SOP-005, SOP-006, SOP-007, SOP-008, SOP-009
```

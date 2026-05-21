# SOP-005: Component Migration B — Attribute-Driven

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-004 (Migration A verified the pipeline)
> **Estimated time**: 0.8 day
> **Complexity**: 🟡 Medium

---

## Objective

Migrate attribute-driven interactive components: `less-button` and `less-input`. These are the first components that need `hydrateEvents`, `observedAttributes`, and `_syncDOM()`.

---

## Components

| Component     | File                             | Lines | Key features                                           |
| ------------- | -------------------------------- | ----- | ------------------------------------------------------ |
| `less-button` | `packages/ui/src/less-button.ts` | 251   | variant, size, disabled, href → <a> fallback, :state() |
| `less-input`  | `packages/ui/src/less-input.ts`  | 254   | type, placeholder, disabled, form association          |

---

## Migration Pattern

### less-button — detailed steps

#### 1. Convert styles

Current Lit CSSResult → CSSStyleSheet:

```typescript
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: inline-block; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-4);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-5);
    font-size: var(--font-size-0);
    line-height: 1.5;
    border: var(--border-size-1) solid var(--gray-5);
    background: transparent;
    color: var(--gray-9);
    border-radius: var(--radius-2);
    cursor: pointer;
    text-decoration: none;
    transition: color var(--ease-2), background var(--ease-2),
                border-color var(--ease-2), box-shadow var(--ease-2);
  }

  .btn:hover { border-color: var(--gray-7); }
  .btn:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }

  /* Variants */
  .btn--primary {
    background: var(--brand, var(--indigo-6));
    color: var(--gray-0);
    border-color: transparent;
  }
  .btn--primary:hover {
    background: var(--brand-hover, var(--indigo-7));
  }
  .btn--ghost {
    border-color: transparent;
    background: transparent;
  }
  .btn--ghost:hover { background: var(--gray-1); }

  /* Sizes */
  .btn--sm {
    padding: var(--size-1) var(--size-3);
    font-size: 0.8125rem;
  }
  .btn--lg {
    padding: var(--size-3) var(--size-5);
    font-size: var(--font-size-2);
  }

  /* States */
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`);
```

#### 2. Convert render()

Current Lit `html\`...\`` → string:

```typescript
render(): string {
  const v = this.getAttribute('variant') || 'default';
  const s = this.getAttribute('size') || 'md';
  const d = this.hasAttribute('disabled');
  const href = this.getAttribute('href');

  if (href) {
    return `<a class="btn btn--${v} btn--${s}"
      part="control" href="${href}"
      ${d ? 'aria-disabled="true"' : ''}>
      <slot></slot></a>`;
  }
  return `<button class="btn btn--${v} btn--${s}"
    part="control" ${d ? 'disabled' : ''}>
    <slot></slot></button>`;
}
```

#### 3. Add hydrateEvents

```typescript
static hydrateEvents: HydrateEventDescriptor[] = [
  { selector: '.btn', event: 'click', method: '_handleClick' },
];
```

#### 4. Add observedAttributes + _syncDOM

```typescript
static observedAttributes = ['variant', 'size', 'disabled', 'href'];

attributeChangedCallback(name: string, old: string | null, val: string | null) {
  if (old === val) return;
  // For href changes, the element type (a vs button) changes — need re-render
  if (name === 'href') {
    this._reRender();
    return;
  }
  this._syncDOM();
}
```

#### 5. Add _syncDOM (replaces updated())

```typescript
private _syncDOM(): void {
  const el = this.shadowRoot?.querySelector('.btn') as HTMLElement | null;
  if (!el) return;

  const v = this.getAttribute('variant') || 'default';
  const s = this.getAttribute('size') || 'md';
  el.className = `btn btn--${v} btn--${s}`;

  if (el instanceof HTMLButtonElement) {
    el.disabled = this.hasAttribute('disabled');
  }
  if (el instanceof HTMLAnchorElement && this.hasAttribute('disabled')) {
    el.setAttribute('aria-disabled', 'true');
  }
}
```

#### 6. Add _reRender (for href changes — element type changes)

```typescript
private _reRender(): void {
  if (!this.shadowRoot) return;
  // Preserve slot content by extracting it first
  const slot = this.shadowRoot.querySelector('slot');
  const slotContent = slot?.assignedNodes({ flatten: true }) || [];
  
  this.shadowRoot.innerHTML = this.render();
  this._hydrateEvents();
  
  // Re-attach slot content
  const newSlot = this.shadowRoot.querySelector('slot');
  if (newSlot && slotContent.length) {
    newSlot.replaceChildren(...slotContent);
  }
}
```

---

### less-input — detailed steps

#### 1. Styles

```typescript
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: block; }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-1);
  }

  label {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--gray-7);
  }

  input, textarea, select {
    padding: var(--size-2) var(--size-3);
    border: var(--border-size-1) solid var(--gray-5);
    border-radius: var(--radius-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-0);
    color: var(--gray-9);
    background: var(--gray-0);
    transition: border-color var(--ease-2);
    outline: none;
  }

  input:focus, textarea:focus, select:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--indigo-5);
  }

  input:disabled, textarea:disabled, select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-1);
  }
`);
```

#### 2. render()

```typescript
render(): string {
  const type = this.getAttribute('type') || 'text';
  const placeholder = this.getAttribute('placeholder') || '';
  const d = this.hasAttribute('disabled');
  const label = this.getAttribute('label') || '';

  return `
    <div class="input-wrapper" part="wrapper">
      ${label ? `<label part="label">${label}</label>` : ''}
      <input type="${type}" placeholder="${placeholder}"
        part="control" ${d ? 'disabled' : ''} />
    </div>`;
}
```

#### 3. hydrateEvents

```typescript
static hydrateEvents: HydrateEventDescriptor[] = [
  { selector: 'input, textarea, select', event: 'input', method: '_handleInput' },
  { selector: 'input, textarea, select', event: 'change', method: '_handleChange' },
  { selector: 'input, textarea, select', event: 'focus', method: '_handleFocus' },
  { selector: 'input, textarea, select', event: 'blur', method: '_handleBlur' },
];
```

#### 4. _syncDOM

```typescript
static observedAttributes = ['type', 'placeholder', 'disabled', 'label', 'value'];

private _syncDOM(): void {
  const input = this.shadowRoot?.querySelector('input, textarea, select') as HTMLInputElement | null;
  if (!input) return;
  input.disabled = this.hasAttribute('disabled');
  
  const val = this.getAttribute('value');
  if (val !== null && input.value !== val) {
    input.value = val;
  }
}
```

#### 5. Form association

```typescript
// In DsdElement base class (already handled):
// static formAssociated = true;
// constructor → this._internals = this.attachInternals();

// In _handleInput:
private _handleInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  this.setAttribute('value', input.value);
  this._internals?.setFormValue(input.value);
  this.dispatchEvent(new CustomEvent('less-input', {
    bubbles: true, composed: true,
    detail: { value: input.value },
  }));
}
```

---

## Verification Checklist

### less-button

- [ ] All variants render correctly (default, primary, ghost)
- [ ] Size variants (sm, md, lg)
- [ ] Disabled state: button disabled, visual opacity
- [ ] `href` attribute → renders `<a>` instead of `<button>`
- [ ] `href` + `disabled` → `aria-disabled="true"` on `<a>`
- [ ] Click event fires `less-click` CustomEvent
- [ ] CSS Parts: `::part(control)` works
- [ ] `_syncDOM()` updates className on attribute change

### less-input

- [ ] Text input renders and accepts input
- [ ] Type variants (text, email, password, number)
- [ ] Label renders when attribute present
- [ ] Placeholder renders
- [ ] Disabled state
- [ ] Value sync: `getAttribute('value')` updates on input
- [ ] Form association: `_internals.setFormValue()` called
- [ ] Custom events: `less-input`, `less-change`, `less-focus`, `less-blur`

---

## Dependencies

```
SOP-005 blocks: SOP-010 (CSS Parts), SOP-006 (builds on same patterns)
SOP-005 blocked by: SOP-004
```

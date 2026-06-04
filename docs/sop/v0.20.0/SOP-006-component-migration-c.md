# SOP-006: Component Migration C — Interactive

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-005 (Migration B established patterns for interactive components)
> **Estimated time**: 1.0 day
> **Complexity**: 🟡 Medium

---

## Objective

Migrate three interactive components: `less-theme-toggle`, `less-code-block`, `less-dialog`. Each has distinct interaction patterns that validate the DsdElement pattern against real-world complexity.

---

## Components

| Component           | File                                   | Lines | Interaction pattern               |
| ------------------- | -------------------------------------- | ----- | --------------------------------- |
| `less-theme-toggle` | `packages/ui/src/less-theme-toggle.ts` | 259   | Click toggle + localStorage       |
| `less-code-block`   | `packages/ui/src/less-code-block.ts`   | 394   | Copy button + syntax highlight    |
| `less-dialog`       | `packages/ui/src/less-dialog.ts`       | 317   | Open/close + overlay + focus trap |

---

## less-theme-toggle

### Interaction model

```
Initial: read localStorage('theme') || system preference
Click:   toggle theme → update localStorage → dispatch 'less-theme-change'
DOM:     swap icon (sun ↔ moon)
```

### Key migration points

1. **hydrateEvents**: Single click handler on the toggle button
2. **observedAttributes**: `theme` (light/dark/auto)
3. **_syncDOM**: Swap icon based on current theme
4. **_handleClick**: Toggle logic — localStorage + attribute update + event dispatch
5. **connectedCallback**: Check `_dsdHydrated` → if true, skip render; read initial theme

### CSS Parts

```
part="toggle"     — the clickable button
part="icon"       — the sun/moon icon
part="label"      — optional text label
```

---

## less-code-block

### Interaction model

```
Initial:    render code with syntax highlighting
Copy click: copy code text → temporary "Copied!" feedback
Language:   show language label
```

### Key migration points

1. **hydrateEvents**: `{ selector: '.copy-btn', event: 'click', method: '_handleCopy' }`
2. **observedAttributes**: `language`, `code` (the raw code text)
3. **render()**: Generate highlighted HTML from code text
4. **_handleCopy**: `navigator.clipboard.writeText()` + temporary state flip
5. **Copy feedback state**: Since we're native, use `this._internals?.states.add('copied')` for `:state(copied)` styling

### Copy feedback without Lit reactivity

```typescript
private _handleCopy(): void {
  const code = this.getAttribute('code') || '';
  navigator.clipboard.writeText(code).then(() => {
    this._internals?.states.add('copied');
    setTimeout(() => {
      this._internals?.states.delete('copied');
    }, 2000);
  });
}
```

CSS:

```css
:host(:state(copied)) .copy-btn {
  color: var(--indigo-6);
}
:host(:state(copied)) .copy-btn::after {
  content: ' Copied!';
}
```

---

## less-dialog

### Interaction model

```
Open:   setAttribute('open', '') → show overlay + dialog
Close:  removeAttribute('open') → hide overlay + dialog
        Close triggers: ✕ button, overlay click, ESC key
        Focus trap inside dialog when open
```

### Key migration points

1. **hydrateEvents**:
   ```
   { selector: '.close-btn', event: 'click', method: '_close' },
   { selector: '.overlay',   event: 'click', method: '_handleOverlayClick' },
   { selector: ':host',      event: 'keydown', method: '_handleKeydown' },
   ```

2. **observedAttributes**: `open`, `label`

3. **attributeChangedCallback**:
   - `open` added → show dialog, trap focus, dispatch `less-dialog-open`
   - `open` removed → hide dialog, restore focus, dispatch `less-dialog-close`

4. **Focus trap** (native implementation):
   ```typescript
   private _trapFocus(): void {
     const focusable = this.shadowRoot!.querySelectorAll(
       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     if (focusable.length === 0) return;
     (focusable[0] as HTMLElement).focus();

     this._focusTrapHandler = (e: KeyboardEvent) => {
       if (e.key !== 'Tab') return;
       const first = focusable[0] as HTMLElement;
       const last = focusable[focusable.length - 1] as HTMLElement;
       if (e.shiftKey && document.activeElement === first) {
         e.preventDefault();
         last.focus();
       } else if (!e.shiftKey && document.activeElement === last) {
         e.preventDefault();
         first.focus();
       }
     };
     this.shadowRoot!.addEventListener('keydown', this._focusTrapHandler);
   }
   ```

5. **Overlay click**: Check `e.target === overlay` (not a child) before closing

6. **ESC key**: `if (e.key === 'Escape') this._close()`

### CSS Parts

```
part="overlay"   — the backdrop overlay
part="dialog"    — the dialog container
part="header"    — title bar
part="close"     — close button (✕)
part="body"      — content area (<slot>)
part="footer"    — optional footer
```

---

## Shared patterns across all three

### 1. Remove all Lit imports

```diff
- import { css, html, nothing } from 'lit';
- import { property } from 'lit/decorators.js';
- import { DsdLitElement } from '@openelement/adapter-lit';
- import { lessDesignTokens } from './design-tokens.js';
+ import { DsdElement, type HydrateEventDescriptor } from '@openelement/core';
```

### 2. Convert Lit @property → observedAttributes

```diff
- @property({ type: String, reflect: true }) theme = 'auto';
+ static observedAttributes = ['theme', ...];
+ // Read: this.getAttribute('theme') || 'auto'
+ // Write: this.setAttribute('theme', newValue)
```

### 3. Convert Lit updated() → attributeChangedCallback

```diff
- override updated(changed: Map<string, unknown>) {
-   if (changed.has('theme')) this._syncTheme();
- }
+ attributeChangedCallback(name: string, old: string | null, val: string | null) {
+   if (old === val) return;
+   if (name === 'theme') this._syncTheme();
+ }
```

### 4. Convert Lit firstUpdated() → connectedCallback

```diff
- override firstUpdated() { this._init(); }
+ connectedCallback(): void {
+   super.connectedCallback();  // ← handles DSD detection + hydrateEvents
+   if (this._dsdHydrated) this._init();
+ }
```

---

## Verification Checklist (all 3 components)

### less-theme-toggle

- [ ] Click toggles theme (light ↔ dark)
- [ ] localStorage updated on toggle
- [ ] `less-theme-change` event dispatched with `{ theme }`
- [ ] Icon swaps correctly (sun for light, moon for dark)
- [ ] Initial theme reads from localStorage → system preference

### less-code-block

- [ ] Code displays with correct language label
- [ ] Copy button copies code to clipboard
- [ ] "Copied!" feedback appears for 2 seconds
- [ ] `:state(copied)` styling works
- [ ] Language label updates when attribute changes

### less-dialog

- [ ] Adding `open` attribute shows dialog + overlay
- [ ] Removing `open` attribute hides dialog + overlay
- [ ] Close button (✕) works
- [ ] Clicking overlay closes dialog
- [ ] ESC key closes dialog
- [ ] Focus trapped inside dialog when open
- [ ] Focus restored to trigger element on close
- [ ] `less-dialog-open` / `less-dialog-close` events fire
- [ ] CSS Parts: `::part(overlay)`, `::part(dialog)` etc. work

---

## Dependencies

```
SOP-006 blocks: SOP-007 (layout needs dialog pattern)
SOP-006 blocked by: SOP-005
```

# SOP-008: Component Migration E — less-search

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-007 (layout migrated, all interactive patterns proven)
> **Estimated time**: 1.0 day
> **Complexity**: 🔴 High

---

## Objective

Migrate `less-search` from `DsdLitElement` to `DsdElement`. This is the most complex migration because of:

1. **document.body overlay** (portals outside Shadow DOM)
2. **SPA navigation state** (reset on route change)
3. **Keyboard navigation** (arrow keys, Enter, Escape)
4. **Inline cssText** (must be converted to CSSStyleSheet)

---

## Component

| Component     | File                             | Lines |
| ------------- | -------------------------------- | ----- |
| `less-search` | `www/app/islands/less-search.ts` | ~317  |

Note: less-search lives in `www/app/islands/` — it's an Island component. Verify whether it should be DSD (Ocean) or stay as Island.

**Decision**: less-search IS a DSD component despite the `islands/` directory — it uses `render()` with `_dsdHydrated` hack and `hydrateEvents`. Migrate to `DsdElement`.

---

## Special Challenges

### 1. document.body Overlay

The overlay is appended to `document.body`, not inside the Shadow DOM. This is intentional (avoids Shadow DOM clipping).

**Migration approach**: Keep `document.body.appendChild()` pattern. The overlay element is NOT part of the Shadow DOM — it's a separate DOM node. This means overlay styles CANNOT go in `CSSStyleSheet` (which only applies inside Shadow DOM).

**Solution**: Create a separate `CSSStyleSheet` and inject it into `document.adoptedStyleSheets`:

```typescript
// Overlay stylesheet — applied to document, not shadow root
const overlaySheet = new CSSStyleSheet();
overlaySheet.replaceSync(`
  .ls-overlay {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
    z-index: 9998;
    display: flex;
    justify-content: center;
    padding-top: 20vh;
  }
  .ls-panel { /* ... */ }
  .ls-input { /* ... */ }
  .ls-results { /* ... */ }
  .ls-result-item { /* ... */ }
`);

// In _openOverlay():
private _openOverlay(): void {
  // Inject overlay stylesheet once
  if (!document.adoptedStyleSheets.includes(overlaySheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, overlaySheet];
  }
  // ... create overlay DOM
}
```

### 2. Inline cssText → CSSStyleSheet

Current `this.cssText` in the overlay creation:

```typescript
// v0.19: inline styles
overlay.style.cssText = 'position:fixed;inset:0;...';
```

Replace with classes from `overlaySheet`:

```html
<div class="ls-overlay">
  <div class="ls-panel">
    <input class="ls-input" type="search" />
    <div class="ls-results"></div>
  </div>
</div>
```

### 3. SPA Navigation Reset

Current behavior: `_handleRouteChange()` resets search state on SPA navigation. Keep this pattern — it's independent of Lit.

### 4. Keyboard Navigation

Current `_handleKeydown` for arrow keys + Enter + Escape. Keep the same logic — it's pure DOM manipulation.

---

## Migration Template

```typescript
import { DsdElement, type HydrateEventDescriptor } from '@lessjs/core';

// ── Shadow DOM styles (search trigger button) ──
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; align-items: center; }

  .search-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    background: var(--gray-1);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    cursor: pointer;
    color: var(--gray-7);
    font-size: var(--font-size-0);
  }
  .search-trigger:hover { border-color: var(--brand); color: var(--brand); }

  .search-trigger kbd {
    padding: 0 var(--size-1);
    border: var(--border-size-1) solid var(--gray-5);
    border-radius: 3px;
    font-size: 0.75rem;
    background: var(--gray-0);
  }
`);

// ── Overlay styles (document-level) ──
const overlaySheet = new CSSStyleSheet();
overlaySheet.replaceSync(`
  .ls-overlay { /* ... as above ... */ }
`);

export class LessSearch extends DsdElement {
  static styles = sheet;
  static hydrateEvents: HydrateEventDescriptor[] = [
    { selector: '.search-trigger', event: 'click', method: '_openOverlay' },
  ];

  // Overlay state (not attribute-driven — internal only)
  private _overlayEl?: HTMLElement;
  private _inputEl?: HTMLInputElement;
  private _resultsEl?: HTMLElement;
  private _selectedIndex = -1;
  private _results: SearchResult[] = [];

  render(): string {
    return `<button class="search-trigger" part="trigger" aria-label="Search">
      <svg part="icon">...</svg>
      <span part="label">Search</span>
      <kbd part="shortcut">/</kbd>
    </button>`;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Listen for SPA navigation to reset state
    window.addEventListener('popstate', this._handleRouteChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._handleRouteChange);
    this._closeOverlay();
  }

  // ── Overlay management (unchanged logic) ──

  private _openOverlay(): void {
    if (this._overlayEl) return; // Already open

    // Inject overlay stylesheet
    if (!document.adoptedStyleSheets.includes(overlaySheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, overlaySheet];
    }

    // Create overlay DOM
    this._overlayEl = document.createElement('div');
    this._overlayEl.className = 'ls-overlay';
    this._overlayEl.innerHTML = `
      <div class="ls-panel">
        <input class="ls-input" type="search" placeholder="Search..." />
        <div class="ls-results"></div>
      </div>
    `;
    document.body.appendChild(this._overlayEl);

    // Cache refs
    this._inputEl = this._overlayEl.querySelector('.ls-input')!;
    this._resultsEl = this._overlayEl.querySelector('.ls-results')!;

    // Bind overlay events
    this._inputEl.addEventListener('input', this._handleSearch);
    this._inputEl.addEventListener('keydown', this._handleKeydown);
    this._overlayEl.addEventListener('click', this._handleOverlayClick);

    this._inputEl.focus();
    this._selectedIndex = -1;
  }

  private _closeOverlay(): void {
    if (!this._overlayEl) return;
    this._overlayEl.remove();
    this._overlayEl = undefined;
    this._inputEl = undefined;
    this._resultsEl = undefined;
    this._results = [];
  }

  // ── Search logic (unchanged) ──

  private _handleSearch = (): void => {/* same as current */};
  private _handleKeydown = (e: KeyboardEvent): void => {/* same */};
  private _handleOverlayClick = (e: MouseEvent): void => {
    if (e.target === this._overlayEl) this._closeOverlay();
  };
  private _handleRouteChange = (): void => {
    this._closeOverlay();
  };

  // ── HTML escaping (unchanged) ──

  private _escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

const tagName = 'less-search';
if (!customElements.get(tagName)) customElements.define(tagName, LessSearch);
```

---

## Migration Steps

### Step 1: Convert Shadow DOM styles (0.2d)

- Move search-trigger styles from Lit `css\`...\``to`CSSStyleSheet`
- Verify trigger button renders correctly

### Step 2: Convert overlay styles (0.3d)

- Extract all inline `cssText` into `overlaySheet`
- Replace `style.cssText = '...'` with CSS classes from `overlaySheet`
- Verify overlay visual is identical

### Step 3: Convert to DsdElement (0.3d)

- Change base class from `DsdLitElement` to `DsdElement`
- `render()` returns string
- Remove Lit imports
- Keep existing logic (search, keyboard, SPA) unchanged

### Step 4: Integration test (0.2d)

- Full SSG build
- Test: open search → type → navigate results → select → close
- Test: SPA navigation resets search
- Test: keyboard navigation (arrows, Enter, Escape)
- Test: overlay click outside closes

---

## Verification Checklist

- [ ] Search trigger button renders with icon + "Search" + shortcut key
- [ ] Click trigger → overlay appears with input field
- [ ] Type → results appear (debounced)
- [ ] Arrow keys navigate results
- [ ] Enter selects result → navigates → overlay closes
- [ ] Escape closes overlay
- [ ] Click overlay background closes overlay
- [ ] SPA navigation via popstate closes overlay + resets state
- [ ] No inline `cssText` anywhere
- [ ] Overlay styles from `overlaySheet` (document.adoptedStyleSheets)
- [ ] Shadow DOM styles from component `sheet`
- [ ] CSS Parts: `::part(trigger)`, `::part(icon)`, `::part(label)`, `::part(shortcut)`

---

## Dependencies

```
SOP-008 blocks: SOP-011 (build verification)
SOP-008 blocked by: SOP-007
```

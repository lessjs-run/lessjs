/**
 * @lessjs/ui - less-theme-toggle
 *
 * Theme toggle Reactive DSD component for Dark/Light mode switching.
 * Swiss International Style: Pure B&W, minimal.
 *
 * v0.21.0: Uses DsdElement + html templates + Signals.
 *
 * @csspart toggle -The button element
 * @csspart icon-sun -The sun SVG icon
 * @csspart icon-moon -The moon SVG icon
 *
 * Usage:
 * ```html
 * <less-theme-toggle theme="light"></less-theme-toggle>
 * ```
 */

import { DsdElement, html, type TemplateResult, unsafeHTML } from '@lessjs/core';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { signal } from '@lessjs/signals';
import { openPropsTokenSheet } from './open-props-tokens.js';

export const tagName = 'less-theme-toggle';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--gray-6);
    cursor: pointer;
    font-size: 0;
    line-height: 1;
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .theme-toggle:hover {
    color: var(--gray-9);
    border-color: var(--gray-5);
    background: rgba(83,74,183,0.06);
  }

  .theme-toggle svg {
    width: 16px;
    height: 16px;
  }

  .theme-toggle .icon-sun {
    display: block;
  }

  .theme-toggle .icon-moon {
    display: none;
  }

  .theme-toggle.is-light .icon-sun {
    display: none;
  }

  .theme-toggle.is-light .icon-moon {
    display: block;
  }
`);

export class LessThemeToggle extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override delegatesFocus = true;
  static override observedAttributes = ['theme'];

  private _theme = signal<'dark' | 'light'>('dark');

  override connectedCallback(): void {
    super.connectedCallback();

    // Priority: theme attribute > document.documentElement > localStorage > prefers-color-scheme > default
    const themeAttr = this.getAttribute('theme');
    if (themeAttr === 'light') {
      this._theme.value = 'light';
    } else if (themeAttr === 'dark') {
      this._theme.value = 'dark';
    } else if (document.documentElement.dataset.theme === 'light') {
      this._theme.value = 'light';
    } else {
      let resolved = false;
      try {
        const saved = localStorage.getItem('less-theme');
        if (saved === 'light') {
          this._theme.value = 'light';
          resolved = true;
        } else if (saved === 'dark') {
          this._theme.value = 'dark';
          resolved = true;
        }
      } catch { /* silent */ }
      if (!resolved && typeof globalThis !== 'undefined' && globalThis.matchMedia) {
        this._theme.value = globalThis.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
      }
    }

    this.setAttribute('data-theme', this._theme.value);

    // Re-render to guarantee @click bindings regardless of DSD hydration.
    // _bindCurrentRenderTemplate relies on data-less-event-N markers that
    // parse5 re-serialization can silently drop. _renderIntoShadowRoot
    // (called by update()) sets innerHTML with fresh runtimeMarkers and
    // calls _bindTemplateRuntime, which is the well-tested CSR path.
    // Called synchronously after super.connectedCallback finishes so the
    // shadow root is guaranteed to exist.
    this.update();
  }

  override render(): string | TemplateResult {
    const lightClass = this._theme.value === 'light' ? ' is-light' : '';
    const title = this._theme.value === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

    return html`
      <button
        class="${`theme-toggle${lightClass}`}"
        part="toggle"
        title="${title}"
        aria-label="Toggle theme"
        @click="${() => this._handleToggle()}"
      >
        ${unsafeHTML(
          `<svg class="icon-sun" part="icon-sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <circle cx="8" cy="8" r="3"/>
        <line x1="8" y1="1" x2="8" y2="3"/>
        <line x1="8" y1="13" x2="8" y2="15"/>
        <line x1="1" y1="8" x2="3" y2="8"/>
        <line x1="13" y1="8" x2="15" y2="8"/>
        <line x1="3.05" y1="3.05" x2="4.46" y2="4.46"/>
        <line x1="11.54" y1="11.54" x2="12.95" y2="12.95"/>
        <line x1="3.05" y1="12.95" x2="4.46" y2="11.54"/>
        <line x1="11.54" y1="4.46" x2="12.95" y2="3.05"/>
      </svg>
      <svg class="icon-moon" part="icon-moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z"/>
      </svg>`,
        )}
      </button>
    `;
  }

  private _handleToggle(): void {
    const theme = this._theme.value === 'light' ? 'dark' : 'light';
    this._theme.value = theme;

    document.documentElement.setAttribute('data-theme', theme);
    if (document.documentElement.style) {
      document.documentElement.style.colorScheme = theme;
    }

    // Propagate data-theme to parent <less-layout> so :host([data-theme="dark"]) matches
    try {
      const root = this.getRootNode();
      if (root instanceof ShadowRoot && root.host) {
        root.host.setAttribute('data-theme', theme);
      }
    } catch { /* not connected to DOM */ }

    // Dispatch global event so all DsdElement components can react
    try {
      if (typeof CustomEvent !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
        globalThis.dispatchEvent(new CustomEvent('less:theme-change', { detail: { theme } }));
      }
    } catch { /* silent */ }

    try {
      localStorage.setItem('less-theme', theme);
    } catch { /* silent */ }
    this.setAttribute('data-theme', theme);
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'theme' && val) {
      this._theme.value = val === 'light' ? 'light' : 'dark';
      this.setAttribute('data-theme', this._theme.value);
    }
  }
}

export default LessThemeToggle;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessThemeToggle);
}

/**
 * @lessjs/ui - less-theme-toggle
 *
 * Theme toggle Island component for Dark/Light mode switching.
 * Swiss International Style: Pure B&W, minimal.
 *
 * Features:
 * - Accepts initial theme via `theme` attribute (avoids localStorage race)
 * - Falls back to reading localStorage if no attribute is set
 * - Toggles between dark and light themes
 * - Updates document.documentElement data-theme attribute
 * - Persists preference to localStorage
 *
 * Usage:
 * ```html
 * <!-- SSR-rendered with known theme (avoids FOUC + race condition) -->
 * <less-theme-toggle theme="light"></less-theme-toggle>
 *
 * <!-- Or without attribute (falls back to localStorage) -->
 * <less-theme-toggle></less-theme-toggle>
 * ```
 *
 * LessJS Architecture:
 * - This is an Island component with Shadow DOM and client-side behavior
 * - Requires eager upgrade (theme should be applied immediately)
 * - The `theme` attribute lets the SSR pipeline pass the resolved theme
 *   from the head inline script, avoiding a race between connectedCallback
 *   reading localStorage and the head script having already set data-theme.
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-theme-toggle';

export class LessThemeToggle extends LitElement {
  /** DSD: delegates focus for keyboard accessibility */
  static delegatesFocus = true;

  /**
   * When DSD already created and populated the shadow root,
   * keep it as-is — no Lit re-render needed.
   */
  private _dsdHydrated = false;

  override createRenderRoot(): HTMLElement | DocumentFragment {
    if (this.shadowRoot && this.shadowRoot.childElementCount > 0) {
      this._dsdHydrated = true;
      return this.shadowRoot;
    }
    return this.attachShadow({ mode: 'open' });
  }

  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
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
        border: 0.5px solid var(--less-border);
        border-radius: var(--less-radius-md);
        background: transparent;
        color: var(--less-text-tertiary);
        cursor: pointer;
        font-size: 0;
        line-height: 1;
        transition:
          color var(--less-transition-normal),
          border-color var(--less-transition-normal),
          background var(--less-transition-normal);
        }

        .theme-toggle:hover {
          color: var(--less-text-primary);
          border-color: var(--less-border-hover);
          background: var(--less-accent-subtle);
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
      `,
    ];

    static override properties = {
      /** Initial theme from SSR/head script. Avoids localStorage race. */
      theme: { type: String, reflect: true },
      _isLight: { state: true },
    };

    /** Initial theme attribute — set by SSR or head inline script */
    declare theme: string | undefined;

    /** Whether the current theme is light (false = dark) */
    declare _isLight: boolean;

    constructor() {
      super();
      this.theme = undefined;
      this._isLight = false;
    }

    override connectedCallback() {
      super.connectedCallback();

      // Priority: `theme` attribute > document.documentElement > localStorage > prefers-color-scheme > default
      // The `theme` attribute is set by SSR/head inline script, which runs
      // BEFORE this connectedCallback. This eliminates the race condition.
      if (this.theme === 'light') {
        this._isLight = true;
      } else if (this.theme === 'dark') {
        this._isLight = false;
      } else if (document.documentElement.dataset.theme === 'light') {
        this._isLight = true;
      } else {
        // Fallback chain: localStorage → prefers-color-scheme → dark
        let resolved = false;
        try {
          const saved = localStorage.getItem('less-theme');
          if (saved === 'light') {
            this._isLight = true;
            resolved = true;
          } else if (saved === 'dark') {
            this._isLight = false;
            resolved = true;
          }
        } catch {
          // Silently ignore — localStorage may throw
        }
        if (!resolved) {
          // v0.6': Respect user's OS-level preference via prefers-color-scheme
          // Per CSS Media Queries Level 5 §4.2
          if (typeof globalThis !== 'undefined' && globalThis.matchMedia) {
            const prefersLight = globalThis.matchMedia('(prefers-color-scheme: light)');
            this._isLight = prefersLight.matches;
          }
          // else: default to dark (already set in constructor)
        }
      }

      // Sync data-theme attribute on this host element
      this.setAttribute('data-theme', this._isLight ? 'light' : 'dark');
    }

    private _handleToggle() {
      this._isLight = !this._isLight;
      const theme = this._isLight ? 'light' : 'dark';

      // v0.6': Set both data-theme AND color-scheme CSS property
      // color-scheme tells the browser to use native light/dark form controls,
      // scrollbars, and other UA styles per CSS Color Adjustment Level 1 §2
      document.documentElement.setAttribute('data-theme', theme);
      if (document.documentElement.style) {
        document.documentElement.style.colorScheme = theme;
      }
      try {
        localStorage.setItem('less-theme', theme);
      } catch {
        // Silently ignore — localStorage may be unavailable in private browsing
      }
      this.setAttribute('data-theme', theme);
    }

    /** Propagate data-theme to the host element.
     *
     * v0.6: CSS custom properties on :root cascade into shadow DOM
     * automatically via the platform's CSS inheritance model. We no
     * longer need to walk all shadow roots setting data-theme.
     * Only set data-theme on this host for direct :host([data-theme])
     * selector matching within this component's own styles.
     */

    /** When DSD hydrated, return nothing — the shadow DOM already has content. */
    override render(): TemplateResult | typeof nothing {
      if (this._dsdHydrated) return nothing;
      return html`
        <button
          class="theme-toggle ${this._isLight ? 'is-light' : ''}"
          title="${this._isLight ? 'Switch to dark theme' : 'Switch to light theme'}"
          aria-label="Toggle theme"
          @click="${() => this._handleToggle()}"
        >
          <svg
            class="icon-sun"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
            <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
            <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
            <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
            <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
          </svg>
          <svg
            class="icon-moon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z" />
          </svg>
        </button>
      `;
    }
  }

  // Guard: idempotent across SSR paths
  if (!customElements.get(tagName)) customElements.define(tagName, LessThemeToggle);

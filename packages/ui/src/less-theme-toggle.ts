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
 * KISS Architecture:
 * - This is an Island component with Shadow DOM and client-side behavior
 * - Requires eager upgrade (theme should be applied immediately)
 * - The `theme` attribute lets the SSR pipeline pass the resolved theme
 *   from the head inline script, avoiding a race between connectedCallback
 *   reading localStorage and the head script having already set data-theme.
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-theme-toggle';

export class KissThemeToggle extends LitElement {
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

      // Priority: `theme` attribute > document.documentElement > localStorage > default
      // The `theme` attribute is set by SSR/head inline script, which runs
      // BEFORE this connectedCallback. This eliminates the race condition.
      if (this.theme === 'light') {
        this._isLight = true;
      } else if (this.theme === 'dark') {
        this._isLight = false;
      } else if (document.documentElement.dataset.theme === 'light') {
        // Check the <html data-theme="..."> attribute set by the head inline script.
        // This is the standard path: the head script reads localStorage and sets
        // data-theme BEFORE any LitElement connects.
        //
        // L2 EXEMPTION: reading document.documentElement.dataset is a platform API
        // (browser infrastructure), not a cross-Island dependency. Allowed under
        // the KISS L2 infrastructure exemption rule.
        this._isLight = true;
      } else {
        // Fallback: read from localStorage directly (edge case where neither
        // attribute nor data-theme is set)
        //
        // L2 EXEMPTION: localStorage is a browser platform API (infrastructure).
        // Not a cross-Island dependency — allowed under KISS L2 exemption.
        // try-catch: localStorage may throw in private browsing mode or when
        // storage is disabled by browser policy.
        try {
          const saved = localStorage.getItem('less-theme');
          if (saved === 'light') {
            this._isLight = true;
          }
        } catch {
          // Silently ignore — default to dark theme
        }
      }

      // Sync data-theme attribute on this host element so that
      // :host([data-theme="light"]) CSS selectors work correctly.
      this.setAttribute('data-theme', this._isLight ? 'light' : 'dark');
    }

    private _handleToggle() {
      this._isLight = !this._isLight;
      const theme = this._isLight ? 'light' : 'dark';
      // L2 EXEMPTION: document.documentElement.setAttribute and localStorage.setItem
      // are browser platform APIs (infrastructure). Not cross-Island dependencies.
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('less-theme', theme);
      } catch {
        // Silently ignore — localStorage may be unavailable in private browsing
      }
      // Propagate data-theme to all KISS component host elements.
      // Shadow DOM `:host([data-theme="light"])` selectors only match
      // when the host element itself has the attribute — CSS custom
      // properties declared on `:host` shadow the inherited `:root` values.
      this._propagateTheme(theme);
    }

    /** Propagate data-theme to all KISS UI components in the document.
     *
     * Uses convention-based selectors instead of a hardcoded tag list:
     *   1. All elements with `kiss-` prefixed tag names (KISS built-in components)
     *   2. All elements with `[data-less]` attribute (user custom components)
     *
     * This ensures custom components using lessDesignTokens are also themed,
     * without requiring the theme toggle to know about every component.
     *
     * Convention for user components:
     * ```html
     * <my-widget data-less>...</my-widget>
     * ```
     */
    private _propagateTheme(theme: string) {
      // CRITICAL: document.querySelectorAll() does NOT pierce Shadow DOM.
      // KISS components like less-layout live inside other components' shadow roots
      // (e.g. page-fullstack-demo's shadow root). We must recursively walk all
      // shadow roots to find and update every KISS component.
      //
      // I-CONSTRAINT ISOLATION: each element is wrapped in try/catch so that
      // one Island's setAttribute failure does NOT prevent other Islands from
      // receiving the theme update.
      const propagate = (root: Document | ShadowRoot, depth = 0) => {
        // Safety: limit recursion depth to avoid stack overflow on
        // deeply nested component compositions
        if (depth > 10) return;
        root.querySelectorAll('*').forEach((el) => {
          try {
            const tag = el.tagName?.toLowerCase();
            // All KISS built-in components (kiss-* prefix)
            if (tag?.startsWith('less-') || el.hasAttribute?.('data-less')) {
              el.setAttribute('data-theme', theme);
            }
            // Recurse into shadow roots created by DSD and custom element upgrade
            if (el.shadowRoot) {
              propagate(el.shadowRoot, depth + 1);
            }
          } catch {
            // Isolation: silently skip elements that fail (e.g. cross-origin,
            // already disconnected, or Shadow DOM access restrictions).
            // One Island's failure must not cascade to others.
          }
        });
      };
      propagate(document);
    }

    override render(): TemplateResult {
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

  // Guard: idempotent across SSR paths (SSR dom shim may not support get())
  try {
    customElements.define(tagName, KissThemeToggle);
  } catch { /* already defined */ }

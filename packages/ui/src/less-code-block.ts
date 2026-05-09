/**
 * @lessjs/ui - less-code-block
 *
 * Code block with copy button AND syntax highlighting via Prism.
 * v0.9.0: Self-contained Prism highlighting — each <code-block>
 *   highlights its own <pre><code> on upgrade. This is more reliable
 *   than external shadow DOM traversal because the component owns
 *   its own DOM structure.
 *
 * DSD makes content visible without JavaScript.
 *
 * v0.6.2: Fixed DSD hydration — copy button now works after DSD upgrade.
 *   - Uses WithDsdHydration Mixin for DSD detection + event binding
 *   - Added _updateCopyButtonDOM() for direct DOM updates
 *     (Lit won't re-render when _dsdHydrated is true)
 *   - _copyState is tracked internally but DOM is updated directly
 *
 * Usage:
 * ```html
 * <less-code-block>
 *   <pre><code>const x = 1;</code></pre>
 * </less-code-block>
 * ```
 */

import { css, type CSSResult, html, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';
import { DsdLitElement } from '@lessjs/adapter-lit';

export const tagName = 'less-code-block';

/**
 * Code block with copy button and DSD hydration.
 *
 * Uses WithDsdHydration Mixin for the common DSD pattern:
 *   - Detects pre-populated shadow root from DSD
 *   - Binds events declared in `static hydrateEvents`
 *   - Cleans up listeners on disconnect
 */
export class LessCodeBlock extends DsdLitElement {
  /** Declarative event bindings for DSD hydration */
  static hydrateEvents = [
    { selector: 'button.copy-btn', event: 'click', method: '_copy' },
  ];

  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
        position: relative;
      }

      ::slotted(pre) {
        margin: 0;
        padding: var(--less-size-5);
        background: var(--less-code-bg);
        border: 0.5px solid var(--less-code-border);
        border-radius: var(--less-radius-sm);
        overflow-x: auto;
        font-family: var(--less-font-mono);
        font-size: var(--less-font-size-sm);
        line-height: var(--less-line-height-normal);
        color: var(--less-text-secondary);
        scrollbar-width: thin;
        scrollbar-color: var(--less-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--less-size-2);
        right: var(--less-size-2);
        background: var(--less-bg-elevated);
        color: var(--less-text-muted);
        border: 0.5px solid var(--less-border);
        padding: var(--less-size-1) var(--less-size-3);
        font-size: var(--less-font-size-xs);
        font-family: var(--less-font-sans);
        cursor: pointer;
        border-radius: var(--less-radius-sm);
        transition: color var(--less-transition-normal), border-color var(--less-transition-normal);
        z-index: 1;
      }

      .copy-btn:hover {
        color: var(--less-text-secondary);
        border-color: var(--less-border-hover);
      }

      .copy-btn.copied {
        color: var(--less-text-primary);
        border-color: var(--less-border-hover);
      }

      .copy-btn.failed {
        color: var(--less-error, #e55);
        border-color: var(--less-error, #e55);
      }
    `,
  ];

  static override properties = {
    _copyState: { state: true },
  };

  declare private _copyState: 'idle' | 'copied' | 'failed';
  private _copyTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  constructor() {
    super();
    this._copyState = 'idle';
  }

  override connectedCallback() {
    super.connectedCallback();
    // Trigger Prism highlighting for code inside this block.
    // This runs after CE upgrade, whether from DSD or client render.
    this._tryHighlight();
  }

  override disconnectedCallback() {
    super.disconnectedCallback(); // Mixin handles _hydrateAbortController
    if (this._copyTimer !== undefined) {
      clearTimeout(this._copyTimer);
      this._copyTimer = undefined;
    }
    if (this._highlightTimer !== undefined) {
      clearTimeout(this._highlightTimer);
      this._highlightTimer = undefined;
    }
  }

  /**
   * After upgrade (DSD or client render), highlight the embedded code.
   * Uses a retry loop because Prism might not be loaded yet
   * (defer scripts may not have executed before CE upgrade).
   */
  private _tryHighlight(): void {
    const p = (globalThis as any).Prism;
    if (typeof p === 'undefined') {
      // Prism hasn't loaded yet — retry
      this._highlightTimer = globalThis.setTimeout(() => this._tryHighlight(), 50);
      return;
    }
    const code = this.querySelector('pre code');
    if (!code) return;
    // Add default language class if missing
    if (!Array.from(code.classList).some((c: string) => c.startsWith('language-'))) {
      code.classList.add('language-typescript');
    }
    // Highlight this element
    p.highlightElement(code);
  }

  private _highlightTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  /** When DSD hydrated, return nothing — the shadow DOM already has content. */
  override render(): TemplateResult | typeof nothing {
    if (this._dsdHydrated) return nothing;
    return html`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState === 'copied'
          ? 'copied'
          : ''} ${this._copyState === 'failed' ? 'failed' : ''}"
        @click="${() => this._copy()}"
      >
        ${this._copyState === 'copied'
          ? 'Copied!'
          : this._copyState === 'failed'
          ? 'Failed'
          : 'Copy'}
      </button>
    `;
  }

  private async _copy() {
    try {
      const text = this.textContent || '';
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      this._updateCopyButtonDOM();
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._updateCopyButtonDOM();
        this._copyTimer = undefined;
      }, 2000);
    } catch {
      this._copyState = 'failed';
      this._updateCopyButtonDOM();
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._updateCopyButtonDOM();
        this._copyTimer = undefined;
      }, 2000);
    }
  }

  /**
   * Update copy button DOM directly after DSD hydration.
   * Since render() returns nothing when _dsdHydrated is true,
   * Lit's reactive update cycle is bypassed. We must update
   * the DOM manually to reflect the copy state.
   */
  private _updateCopyButtonDOM(): void {
    if (!this.shadowRoot) return;
    const btn = this.shadowRoot.querySelector('button.copy-btn');
    if (!btn) return;

    // Update class list
    btn.classList.toggle('copied', this._copyState === 'copied');
    btn.classList.toggle('failed', this._copyState === 'failed');

    // Update text content
    if (this._copyState === 'copied') {
      btn.textContent = 'Copied!';
    } else if (this._copyState === 'failed') {
      btn.textContent = 'Failed';
    } else {
      btn.textContent = 'Copy';
    }
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) customElements.define(tagName, LessCodeBlock);

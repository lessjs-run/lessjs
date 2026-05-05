/**
 * @lessjs/ui - less-code-block
 *
 * Code block with copy button.
 * DSD makes content visible without JavaScript.
 *
 * Usage:
 * ```html
 * <less-code-block>
 *   <pre><code>const x = 1;</code></pre>
 * </less-code-block>
 * ```
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-code-block';

export class KissCodeBlock extends LitElement {
  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
        position: relative;
      }

      ::slotted(pre) {
        margin: 0;
        padding: var(--kiss-size-5);
        background: var(--less-code-bg);
        border: 0.5px solid var(--less-code-border);
        border-radius: var(--kiss-radius-sm);
        overflow-x: auto;
        font-family: var(--kiss-font-mono);
        font-size: var(--kiss-font-size-sm);
        line-height: var(--kiss-line-height-normal);
        color: var(--less-text-secondary);
        scrollbar-width: thin;
        scrollbar-color: var(--less-border) transparent;
      }

      .copy-btn {
        position: absolute;
        top: var(--kiss-size-2);
        right: var(--kiss-size-2);
        background: var(--kiss-bg-elevated);
        color: var(--kiss-text-muted);
        border: 0.5px solid var(--less-border);
        padding: var(--kiss-size-1) var(--kiss-size-3);
        font-size: var(--kiss-font-size-xs);
        font-family: var(--kiss-font-sans);
        cursor: pointer;
        border-radius: var(--kiss-radius-sm);
        transition: color var(--kiss-transition-normal), border-color var(--kiss-transition-normal);
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
        color: var(--kiss-error, #e55);
        border-color: var(--kiss-error, #e55);
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

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._copyTimer !== undefined) {
      clearTimeout(this._copyTimer);
      this._copyTimer = undefined;
    }
  }

  override render(): TemplateResult {
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
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._copyTimer = undefined;
      }, 2000);
    } catch {
      this._copyState = 'failed';
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._copyTimer = undefined;
      }, 2000);
    }
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, KissCodeBlock);
} catch { /* already defined */ }

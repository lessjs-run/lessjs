/**
 * code-block Island — LessJS Architecture compliant Shadow DOM Island.
 *
 * Without JS: <pre><code> content is visible via DSD projection.
 * With JS: Copy button becomes functional.
 *
 * LessJS Architecture (K·I·S·S):
 * - K (Knowledge): SSG output includes <template shadowrootmode="open">
 * - I (Isolated): Copy logic is encapsulated in Shadow DOM
 * - S (Semantic): DSD makes content visible without JS
 * - S (Static): No external DOM manipulation
 *
 * Usage:
 *   <code-block><pre><code>const x = 1</code></pre></code-block>
 */
import { css, html, LitElement } from 'lit';

export const tagName = 'code-block';

export default class CodeBlock extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    ::slotted(pre) {
      margin: 0;
      padding: 1.25rem;
      background: var(--less-code-bg);
      border: 0.5px solid var(--less-code-border);
      border-radius: 2px;
      overflow-x: auto;
      font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--less-text-secondary);
      scrollbar-width: thin;
      scrollbar-color: var(--kiss-scrollbar-thumb) transparent;
    }

    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: var(--kiss-bg-elevated);
      color: var(--less-text-tertiary);
      border: 0.5px solid var(--less-border);
      padding: 0.25rem 0.625rem;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      border-radius: 2px;
      transition: color 0.15s, border-color 0.15s;
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
  `;

  static override properties = {
    _copyState: { state: true },
  };

  declare private _copyState: 'idle' | 'copied' | 'failed';

  constructor() {
    super();
    this._copyState = 'idle';
  }

  override render() {
    return html`
      <slot></slot>
      <button
        class="copy-btn ${this._copyState === 'copied'
          ? 'copied'
          : ''} ${this._copyState === 'failed' ? 'failed' : ''}"
        @click="${() => this._copy()}"
      >
        ${this._copyState === 'copied'
          ? '✓ Copied!'
          : this._copyState === 'failed'
          ? '✗ Failed'
          : 'Copy'}
      </button>
    `;
  }

  private async _copy() {
    try {
      // Access light DOM text content via host element
      const text = this.textContent || '';
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      setTimeout(() => {
        this._copyState = 'idle';
      }, 2000);
    } catch {
      this._copyState = 'failed';
      setTimeout(() => {
        this._copyState = 'idle';
      }, 2000);
    }
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, CodeBlock);
} catch { /* already defined */ }

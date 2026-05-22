/**
 * @lessjs/ui - less-code-block
 *
 * Code block with copy button AND syntax highlighting via Prism.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 *   - Self-contained Prism highlighting injected into shadow root
 *   - Copy button uses ElementInternals :state(copied) for CSS feedback
 *   - DSD renders <slot> for SSR (no JS content fallback)
 *
 * @csspart copy - The copy button
 *
 * Usage:
 * ```html
 * <less-code-block>
 *   <pre><code>const x = 1;</code></pre>
 * </less-code-block>
 * ```
 */

import {
  DsdElement,
  type HydrateEventDescriptor,
  StyleSheet,
  type StyleSheetLike,
} from '@lessjs/core';
import { openPropsTokenSheet } from './open-props-tokens.js';

export const tagName = 'less-code-block';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    position: relative;
  }

  pre {
    margin: 0;
    padding: var(--size-5);
    background: #1a1a2e;
    border: var(--border-size-1) solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.7;
    color: #e0e0e0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    white-space: pre-wrap;
    word-break: break-word;
  }

  ::slotted(pre) {
    margin: 0;
    padding: var(--size-5);
    background: #1a1a2e;
    border: var(--border-size-1) solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.7;
    color: #e0e0e0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }

  .lang-badge {
    position: absolute;
    top: var(--size-2);
    left: var(--size-3);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.35);
    pointer-events: none;
  }

  .copy-btn {
    position: absolute;
    top: var(--size-2);
    right: var(--size-2);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    border: var(--border-size-1) solid rgba(255, 255, 255, 0.12);
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-00);
    font-family: var(--font-sans);
    cursor: pointer;
    border-radius: 4px;
    transition: color 0.2s ease, background 0.2s ease;
    z-index: 1;
  }

  .copy-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.12);
  }

  :host(:state(copied)) .copy-btn {
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.3);
  }

  :host(:state(failed)) .copy-btn {
    color: #e55;
    border-color: #e55;
  }

  /* Prism token colors (dark theme) */
  .token.cdata, .token.comment, .token.doctype, .token.prolog { color: #6a737d; }
  .token.punctuation { color: #8b949e; }
  .token.namespace { opacity: 0.7; }
  .token.boolean, .token.constant, .token.deleted, .token.number, .token.property, .token.symbol, .token.tag { color: #79c0ff; }
  .token.attr-name, .token.builtin, .token.char, .token.inserted, .token.selector, .token.string { color: #a5d6ff; }
  .token.entity, .token.operator, .token.url, .language-css .token.string, .style .token.string { color: #d2a8ff; }
  .token.atrule, .token.attr-value, .token.keyword { color: #ff7b72; }
  .token.class-name, .token.function { color: #d2a8ff; }
  .token.important, .token.regex, .token.variable { color: #ffa657; }
  .token.bold, .token.important { font-weight: 700; }
  .token.italic { font-style: italic; }
  .token.entity { cursor: help; }
`);

export class LessCodeBlock extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  static override hydrateEvents: HydrateEventDescriptor[] = [
    { selector: 'button.copy-btn', event: 'click', method: '_copy' },
  ];

  private _copyState: 'idle' | 'copied' | 'failed' = 'idle';
  private _copyTimer: ReturnType<typeof setTimeout> | undefined;
  private _highlightTimer: ReturnType<typeof setTimeout> | undefined;
  private _highlightedInShadow = false;
  private _highlightRetries = 0;
  private static MAX_HIGHLIGHT_RETRIES = 20;

  override render(): string {
    return `<slot></slot>
      <button class="copy-btn" part="copy">Copy</button>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this._dsdHydrated) {
      this._tryHighlight();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._copyTimer !== undefined) {
      clearTimeout(this._copyTimer);
      this._copyTimer = undefined;
    }
    if (this._highlightTimer !== undefined) {
      clearTimeout(this._highlightTimer);
      this._highlightTimer = undefined;
    }
  }

  private _tryHighlight(): void {
    const p = (globalThis as unknown as Record<string, unknown>).Prism;
    if (typeof p === 'undefined') {
      if (this._highlightRetries++ < LessCodeBlock.MAX_HIGHLIGHT_RETRIES) {
        this._highlightTimer = globalThis.setTimeout(() => this._tryHighlight(), 50);
      }
      return;
    }

    const pre = this.querySelector(':scope > pre') ||
      Array.from(this.children).find((c) => (c as Element).tagName === 'PRE');
    if (!pre) return;
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;

    let lang = 'typescript';
    const classes = codeEl.classList;
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].startsWith('language-')) {
        lang = classes[i].slice(9);
        break;
      }
    }

    const raw = codeEl.textContent || '';
    const grammar = (p as Record<string, Record<string, unknown>>).languages?.[lang] as
      | Record<string, unknown>
      | undefined;
    if (!grammar) {
      if (this._highlightRetries++ < LessCodeBlock.MAX_HIGHLIGHT_RETRIES) {
        this._highlightTimer = globalThis.setTimeout(() => this._tryHighlight(), 100);
      }
      return;
    }
    this._highlightRetries = 0;
    const highlightedHtml =
      (p as { highlight: (code: string, grammar: unknown, lang: string) => string }).highlight(
        raw,
        grammar,
        lang,
      );
    this._injectHighlighted(highlightedHtml);
  }

  private _injectHighlighted(html: string): void {
    if (!this.shadowRoot || this._highlightedInShadow) return;
    this._highlightedInShadow = true;

    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    const highlightedPre = document.createElement('pre');
    const highlightedCode = document.createElement('code');
    highlightedCode.className = 'language-typescript';
    highlightedCode.innerHTML = html;
    highlightedPre.appendChild(highlightedCode);
    slot.replaceWith(highlightedPre);

    const lightPre = this.querySelector('pre');
    if (lightPre) (lightPre as HTMLElement).style.display = 'none';
  }

  private _getCodeText(): string {
    if (this.shadowRoot) {
      const shadowCode = this.shadowRoot.querySelector('pre code');
      if (shadowCode) return shadowCode.textContent || '';
    }
    return this.textContent || '';
  }

  private async _copy(): Promise<void> {
    try {
      const text = this._getCodeText();
      await navigator.clipboard.writeText(text);
      this._copyState = 'copied';
      this._internals?.states.add('copied');
      this._internals?.states.delete('failed');
      this._updateCopyButtonDOM();
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._internals?.states.delete('copied');
        this._updateCopyButtonDOM();
        this._copyTimer = undefined;
      }, 2000);
    } catch {
      this._copyState = 'failed';
      this._internals?.states.add('failed');
      this._internals?.states.delete('copied');
      this._updateCopyButtonDOM();
      this._copyTimer = globalThis.setTimeout(() => {
        this._copyState = 'idle';
        this._internals?.states.delete('failed');
        this._updateCopyButtonDOM();
        this._copyTimer = undefined;
      }, 2000);
    }
  }

  private _updateCopyButtonDOM(): void {
    if (!this.shadowRoot) return;
    const btn = this.shadowRoot.querySelector('button.copy-btn');
    if (!btn) return;
    btn.classList.toggle('copied', this._copyState === 'copied');
    btn.classList.toggle('failed', this._copyState === 'failed');
    if (this._copyState === 'copied') btn.textContent = 'Copied!';
    else if (this._copyState === 'failed') btn.textContent = 'Failed';
    else btn.textContent = 'Copy';
  }
}

export default LessCodeBlock;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessCodeBlock);
}

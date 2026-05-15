/**
 * @lessjs/ui - less-code-block
 *
 * Code block with copy button AND syntax highlighting via Prism.
 *
 * v0.9.0+: Self-contained Prism highlighting. On upgrade, the component
 * reads raw code from light DOM, tokenizes with Prism, and MOVES the
 * highlighted HTML into its own shadow root. This way the component's
 * CSS (including `.token.*` rules) can style the tokens — no reliance
 * on external CSS penetrating Shadow DOM.
 *
 * SSR (no JS): raw <pre><code> visible via <slot>
 * Client JS:  highlighted code rendered inside shadow root
 *
 * DSD makes content visible without JavaScript.
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

      /* Shared pre/code styles (used by both SSR slot and client-rendered HTML) */
      pre {
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
        /* Allow long strings to wrap so they don't overflow */
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* SSR slot-only: style slotted <pre> */
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

      /* ── Prism.js token colors ──────────────────────────────────
      * Inlined here because these rules need to be inside the
      * component's shadow root to style the highlighted tokens.
      */
      .token.cdata,
      .token.comment,
      .token.doctype,
      .token.prolog {
        color: #708090;
      }
      .token.punctuation {
        color: #999;
      }
      .token.namespace {
        opacity: 0.7;
      }
      .token.boolean,
      .token.constant,
      .token.deleted,
      .token.number,
      .token.property,
      .token.symbol,
      .token.tag {
        color: #905;
      }
      .token.attr-name,
      .token.builtin,
      .token.char,
      .token.inserted,
      .token.selector,
      .token.string {
        color: #690;
      }
      .token.entity,
      .token.operator,
      .token.url,
      .language-css .token.string,
      .style .token.string {
        color: #9a6e3a;
      }
      .token.atrule,
      .token.attr-value,
      .token.keyword {
        color: #07a;
      }
      .token.class-name,
      .token.function {
        color: #dd4a68;
      }
      .token.important,
      .token.regex,
      .token.variable {
        color: #e90;
      }
      .token.bold,
      .token.important {
        font-weight: 700;
      }
      .token.italic {
        font-style: italic;
      }
      .token.entity {
        cursor: help;
      }
    `,
  ];

  static override properties = {
    _copyState: { state: true },
    _langClass: { state: true },
  };

  declare private _copyState: 'idle' | 'copied' | 'failed';
  /** Language class detected from the light DOM <code> (e.g. 'language-typescript') */
  declare private _langClass: string;
  private _copyTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private _highlightTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  /** Whether we have already injected highlighted HTML into the shadow root */
  private _highlightedInShadow = false;

  constructor() {
    super();
    this._copyState = 'idle';
    this._langClass = '';
  }

  override connectedCallback() {
    super.connectedCallback();
    // Trigger Prism highlighting after CE upgrade.
    this._tryHighlight();
  }

  override disconnectedCallback() {
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

  // M-25 fix: Max retries for Prism highlight attempts
  private static MAX_HIGHLIGHT_RETRIES = 20;
  private _highlightRetries = 0;

  /**
   * Read raw code from light DOM, tokenize with Prism, then inject the
   * highlighted HTML directly into the shadow root (replacing the <slot>).
   *
   * Retries if Prism hasn't loaded yet (capped at MAX_HIGHLIGHT_RETRIES).
   */
  private _tryHighlight(): void {
    const p = (globalThis as any).Prism;
    if (typeof p === 'undefined') {
      if (this._highlightRetries++ < LessCodeBlock.MAX_HIGHLIGHT_RETRIES) {
        this._highlightTimer = globalThis.setTimeout(() => this._tryHighlight(), 50);
      }
      return;
    }

    // Find <pre><code> in this component's light DOM
    const pre = this.querySelector(':scope > pre') || Array.from(this.children).find(function (c) {
      return (c as Element).tagName === 'PRE';
    });
    if (!pre) return;
    const codeEl = pre.querySelector('code');
    if (!codeEl) return;

    // Detect language class
    let lang = 'typescript';
    const classes = codeEl.classList;
    for (let i = 0; i < classes.length; i++) {
      if (classes[i].startsWith('language-')) {
        lang = classes[i].slice(9); // e.g. 'language-typescript' → 'typescript'
        break;
      }
    }
    if (!lang) lang = 'typescript';
    this._langClass = 'language-' + lang;

    // Read raw code
    const raw = codeEl.textContent || '';

    // Tokenize
    const grammar = p.languages[lang];
    if (!grammar) {
      // Grammar not loaded — try again (capped)
      if (this._highlightRetries++ < LessCodeBlock.MAX_HIGHLIGHT_RETRIES) {
        this._highlightTimer = globalThis.setTimeout(() => this._tryHighlight(), 100);
      }
      return;
    }
    // Reset retry counter on success
    this._highlightRetries = 0;
    const highlightedHtml = p.highlight(raw, grammar, lang);

    // Inject highlighted HTML into shadow root (replaces <slot>)
    this._injectHighlighted(highlightedHtml);
  }

  /**
   * Replace the <slot> element in the shadow root with a <pre><code>
   * containing the Prism-highlighted HTML, plus keep the copy button.
   *
   * After this, the highlighted <span class="token ..."> elements are
   * INSIDE the shadow root, so the component's CSS (with inline token
   * colors) can style them.
   */
  private _injectHighlighted(html: string): void {
    if (!this.shadowRoot || this._highlightedInShadow) return;
    this._highlightedInShadow = true;

    const slot = this.shadowRoot.querySelector('slot');
    if (!slot) return;

    // Build the highlighted <pre><code>
    const highlightedPre = document.createElement('pre');
    const highlightedCode = document.createElement('code');
    highlightedCode.className = this._langClass || 'language-typescript';
    // SECURITY: innerHTML is safe here — `html` comes from Prism.highlight()
    // which only produces styled <span> elements from tokenized code.
    // Raw user code is tokenized before highlighting, not rendered as-is.
    // Do NOT pass untrusted HTML to this path.
    highlightedCode.innerHTML = html;
    highlightedPre.appendChild(highlightedCode);

    // Replace <slot> with the highlighted pre
    slot.replaceWith(highlightedPre);

    // Hide the light DOM <pre><code> so it doesn't show through
    const lightPre = this.querySelector('pre');
    if (lightPre) lightPre.style.display = 'none';
  }

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

  /** Read highlighted code from either shadow root (client) or light DOM (SSR) */
  private _getCodeText(): string {
    if (this.shadowRoot) {
      const shadowCode = this.shadowRoot.querySelector('pre code');
      if (shadowCode) return shadowCode.textContent || '';
    }
    return this.textContent || '';
  }

  private async _copy() {
    try {
      const text = this._getCodeText();
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

    btn.classList.toggle('copied', this._copyState === 'copied');
    btn.classList.toggle('failed', this._copyState === 'failed');

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

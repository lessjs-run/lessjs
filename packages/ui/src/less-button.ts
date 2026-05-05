/**
 * @lessjs/ui - less-button
 *
 * Minimal button component following Swiss International Style.
 * Pure B&W design with subtle hover states.
 *
 * Variants:
 * - default: outlined button
 * - primary: filled button (black/white)
 * - ghost: no border, subtle hover
 *
 * Sizes:
 * - sm: compact button
 * - md: default size
 * - lg: prominent button
 *
 * Usage:
 * ```html
 * <less-button>Click me</less-button>
 * <less-button variant="primary">Submit</less-button>
 * <less-button size="sm" disabled>Small</less-button>
 * ```
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-button';

export class KissButton extends LitElement {
  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: inline-block;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--less-size-2);
        font-family: var(--less-font-sans);
        font-weight: var(--less-font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        border: 0.5px solid var(--less-border);
        background: transparent;
        color: var(--less-text-primary);
        border-radius: var(--less-radius-md);
        transition:
          color var(--less-transition-normal),
          border-color var(--less-transition-normal),
          background var(--less-transition-normal);
        white-space: nowrap;
        letter-spacing: var(--less-letter-spacing-wide);
      }

      /* Sizes */
      .btn--sm {
        padding: var(--less-size-1) var(--less-size-3);
        font-size: var(--less-font-size-sm);
        height: 28px;
      }

      .btn--md {
        padding: var(--less-size-2) var(--less-size-4);
        font-size: var(--less-font-size-md);
        height: 36px;
      }

      .btn--lg {
        padding: var(--less-size-3) var(--less-size-5);
        font-size: var(--less-font-size-lg);
        height: 44px;
      }

      /* Variants */
      .btn--default:hover {
        color: var(--less-text-primary);
        border-color: var(--less-border-hover);
        background: var(--less-accent-subtle);
      }

      .btn--primary {
        background: var(--less-accent);
        color: var(--less-bg-base);
        border-color: var(--less-accent);
      }

      .btn--primary:hover {
        background: var(--less-accent-dim);
        border-color: var(--less-accent-dim);
      }

      .btn--ghost {
        border-color: transparent;
      }

      .btn--ghost:hover {
        background: var(--less-accent-subtle);
        border-color: transparent;
      }

      /* States */
      .btn:disabled,
      .btn[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn:focus-visible {
        outline: 2px solid var(--less-accent);
        outline-offset: 2px;
      }
    `,
  ];

  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    type: { type: String },
  };

  /** Button variant style: 'default' (outlined), 'primary' (filled), or 'ghost' (no border) */
  declare variant: 'default' | 'primary' | 'ghost';
  /** Button size: 'sm', 'md' (default), or 'lg' */
  declare size: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  declare disabled: boolean;
  /** If set, renders as an anchor link instead of a button */
  declare href: string | undefined;
  /** Target attribute for link mode (e.g. '_blank') */
  declare target: string | undefined;
  /** Button type: 'submit', 'button', or 'reset' (default: 'button'). Only applies in button mode (no href). */
  declare type: 'submit' | 'button' | 'reset';

  constructor() {
    super();
    this.variant = 'default';
    this.size = 'md';
    this.disabled = false;
    this.href = undefined;
    this.target = undefined;
    this.type = 'button';
  }

  /** Prevent default on disabled anchor clicks */
  private _preventClick(e: Event) {
    e.preventDefault();
  }

  override render(): TemplateResult {
    const classes = `btn btn--${this.variant} btn--${this.size}`;

    if (this.href) {
      // disabled anchor: remove href and use aria-disabled (disabled is not valid on <a>)
      const hrefAttr = this.disabled ? undefined : this.href;
      return html`
        <a
          class="${classes}"
          href="${hrefAttr ?? nothing}"
          target="${this.target || nothing}"
          aria-disabled="${this.disabled || nothing}"
          rel="${this.target === '_blank' ? 'noopener noreferrer' : nothing}"
          @click="${this.disabled ? this._preventClick : nothing}"
        >
          <slot></slot>
        </a>
      `;
    }

    return html`
      <button class="${classes}" ?disabled="${this.disabled}" type="${this.type}">
        <slot></slot>
      </button>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, KissButton);
} catch { /* already defined */ }

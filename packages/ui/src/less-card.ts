/**
 * @lessjs/ui - less-card
 *
 * Minimal card container with optional header and footer.
 * Swiss International Style: borders are whispers, not shouts.
 *
 * Usage:
 * ```html
 * <less-card>
 *   <h3 slot="header">Card Title</h3>
 *   <p>Card content goes here.</p>
 * </less-card>
 *
 * <less-card variant="elevated">
 *   <p>Elevated card with shadow.</p>
 * </less-card>
 * ```
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-card';

export class KissCard extends LitElement {
  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
        background: var(--kiss-bg-card);
        border: 0.5px solid var(--less-border);
        border-radius: var(--kiss-radius-lg);
        overflow: hidden;
      }

      :host([variant="elevated"]) {
        box-shadow: var(--kiss-shadow-md);
        border-color: transparent;
      }

      :host([variant="borderless"]) {
        border-color: transparent;
      }

      ::slotted([slot="header"]) {
        padding: var(--kiss-size-4) var(--kiss-size-5);
        border-bottom: 0.5px solid var(--less-border);
        font-size: var(--kiss-font-size-lg);
        font-weight: var(--kiss-font-weight-semibold);
        color: var(--less-text-primary);
        margin: 0;
      }

      .card-body {
        padding: var(--kiss-size-5);
      }

      ::slotted([slot="footer"]) {
        padding: var(--kiss-size-3) var(--kiss-size-5);
        border-top: 0.5px solid var(--less-border);
        font-size: var(--kiss-font-size-sm);
        color: var(--kiss-text-muted);
        margin: 0;
      }
    `,
  ];

  static override properties = {
    variant: { type: String, reflect: true },
  };

  /** Card variant: 'default' (bordered), 'elevated' (shadow, no border), or 'borderless' */
  declare variant: 'default' | 'elevated' | 'borderless';

  constructor() {
    super();
    this.variant = 'default';
  }

  override render(): TemplateResult {
    return html`
      <article part="base">
        <slot name="header"></slot>
        <div class="card-body">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </article>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, KissCard);
} catch { /* already defined */ }

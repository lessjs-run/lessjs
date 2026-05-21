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

import { css, type CSSResult, html, nothing, type TemplateResult } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-card';

export class LessCard extends DsdLitElement {
  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
        background: var(--less-bg-card);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        overflow: hidden;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }

      :host([variant="elevated"]) {
        box-shadow: var(--less-shadow-sm);
        border-color: transparent;
      }

      /* v0.19.1 Phase 6: Hover lift on elevated cards (ADR-0035 B2) */
      :host([variant="elevated"]:hover) {
        box-shadow: var(--less-shadow-md);
        transform: translateY(-2px);
      }

      :host([variant="borderless"]) {
        border-color: transparent;
      }

      ::slotted([slot="header"]) {
        padding: var(--less-size-4) var(--less-size-5);
        border-bottom: 0.5px solid var(--less-border);
        font-size: var(--less-font-size-lg);
        font-weight: var(--less-font-weight-semibold);
        color: var(--less-text-primary);
        margin: 0;
      }

      .card-body {
        padding: var(--less-size-5);
      }

      ::slotted([slot="footer"]) {
        padding: var(--less-size-3) var(--less-size-5);
        border-top: 0.5px solid var(--less-border);
        font-size: var(--less-font-size-sm);
        color: var(--less-text-muted);
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

  /** When DSD hydrated, return nothing — the shadow DOM already has content. */
  override render(): TemplateResult | typeof nothing {
    if (this._dsdHydrated) return nothing;
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
if (!customElements.get(tagName)) customElements.define(tagName, LessCard);

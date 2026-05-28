/**
 * @lessjs/ui - less-card
 *
 * Minimal card container with optional header and footer.
 * Swiss International Style: borders are whispers, not shouts.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart container - The article wrapper
 * @csspart body - The card body content area
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

import { DsdElement } from '@lessjs/core';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from './open-props-tokens.js';

export const tagName = 'less-card';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    background: var(--gray-0);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: 6px;
    overflow: hidden;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }

  :host([variant="elevated"]) {
    box-shadow: var(--shadow-1);
    border-color: transparent;
  }

  :host([variant="elevated"]:hover) {
    box-shadow: var(--shadow-2);
    transform: translateY(-2px);
  }

  :host([variant="borderless"]) {
    border-color: transparent;
  }

  ::slotted([slot="header"]) {
    padding: var(--size-4) var(--size-5);
    border-bottom: var(--border-size-1) solid var(--gray-3);
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    color: var(--gray-9);
    margin: 0;
  }

  .card-body {
    padding: var(--size-5);
  }

  ::slotted([slot="footer"]) {
    padding: var(--size-3) var(--size-5);
    border-top: var(--border-size-1) solid var(--gray-3);
    font-size: var(--font-size-0);
    color: var(--gray-5);
    margin: 0;
  }
`);

export class LessCard extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override observedAttributes = ['variant'];

  override render(): ReturnType<typeof DsdElement.prototype.render> {
    return (
      <article part='container'>
        <slot name='header'></slot>
        <div className='card-body' part='body'>
          <slot></slot>
        </div>
        <slot name='footer'></slot>
      </article>
    );
  }
}

export default LessCard;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessCard);
}

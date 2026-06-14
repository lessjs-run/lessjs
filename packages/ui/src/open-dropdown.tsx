/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-dropdown
 *
 * DaisyUI-style dropdown using DsdElement + Signals.
 * State is reflected to the host `data-open` attribute.
 * CSS uses `:host([data-open="true"])` to control visibility.
 *
 * Usage:
 * ```html
 * <open-dropdown>
 *   <button slot="trigger">Open</button>
 *   <div>Dropdown content</div>
 * </open-dropdown>
 * ```
 *
 * @slot trigger - Click target to toggle the dropdown
 * @slot - Dropdown content (shown when open)
 */

import { DsdElement, type VNode } from '@openelement/core';
import { signal } from '@openelement/signal';
import { openPropsTokenSheet } from './open-props-tokens.js';
import { daisyClassSheet } from './daisy-classes.js';

export const tagName = 'open-dropdown';

export class OpenDropdown extends DsdElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet];
  #open = signal(false);

  #toggle(): void {
    this.#open.value = !this.#open.value;
    this.setAttribute('data-open', String(this.#open.value));
  }

  override render(): VNode {
    return (
      <div class='dropdown'>
        <slot name='trigger' onClick={() => this.#toggle()} />
        <div class='dropdown-content'>
          <slot />
        </div>
      </div>
    );
  }
}

export default OpenDropdown;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenDropdown);
}

/**
 * Shoelace Showcase - Ocean component (v0.20.0 Ocean-Island).
 *
 * Renders Shoelace Web Components (Lit-based) as a static showcase.
 * Pure DsdElement - zero framework dependency at the wrapper level.
 * Shoelace itself uses Lit internally, but that's the library's choice.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @lessjs/app island - Shoelace WCs need client DOM, but static wrapper renders via DSD.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@shoelace-style/shoelace/dist/themes/light.css';

// Explicit component imports to prevent Rolldown tree-shaking.
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js';
import SlBadge from '@shoelace-style/shoelace/dist/components/badge/badge.js';
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

// Register Shoelace components explicitly so sl-* elements upgrade in the DSD shadow root.
if (typeof customElements !== 'undefined') {
  if (!customElements.get('sl-button')) customElements.define('sl-button', SlButton);
  if (!customElements.get('sl-badge')) customElements.define('sl-badge', SlBadge);
  if (!customElements.get('sl-input')) customElements.define('sl-input', SlInput);
  if (!customElements.get('sl-alert')) customElements.define('sl-alert', SlAlert);
  if (!customElements.get('sl-icon')) customElements.define('sl-icon', SlIcon);
}

registerIconLibrary('default', {
  resolver: (name: string) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/dist/assets/icons/${name}.svg`,
});

export const tagName = 'shoelace-showcase';

export const less = { ssr: true };

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
  }
  .sl-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 8px;
  }
  .sl-note {
    color: #a1a1aa;
    font-size: 11px;
    margin-top: 6px;
    line-height: 1.5;
  }
`);

export default class ShoelaceShowcase extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  override render() {
    return (
      <>
        <div className='sl-row'>
          <sl-button variant='primary' size='small'>Primary</sl-button>
          <sl-button variant='success' size='small'>Success</sl-button>
          <sl-button variant='neutral' size='small'>Neutral</sl-button>
          <sl-badge variant='danger' pill>DSD</sl-badge>
        </div>
        <div className='sl-row'>
          <sl-input placeholder='Type something...' size='small' style='width:200px'></sl-input>
        </div>
        <sl-alert variant='warning' open>
          <sl-icon name='info-circle' slot='icon'></sl-icon>
          <strong>Shoelace</strong> - Lit Web Components via @lessjs/adapter-lit DSD pipeline
        </sl-alert>
        <div className='sl-note'>
          Shoelace (80+ components) renders natively through our Lit adapter
        </div>
      </>
    );
  }
}

try {
  customElements.define(tagName, ShoelaceShowcase);
} catch { /* already defined */ }

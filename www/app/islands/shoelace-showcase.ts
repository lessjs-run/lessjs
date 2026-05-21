/**
 * Shoelace Showcase - Ocean component (v0.20.0 Ocean-Island).
 *
 * Renders Shoelace Web Components (Lit-based) as a static showcase.
 * Pure DsdElement - zero framework dependency at the wrapper level.
 * Shoelace itself uses Lit internally, but that's the library's choice.
 *
 * @lessjs/app island - client-only (ssr: false), Shoelace needs real DOM.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

registerIconLibrary('default', {
  resolver: (name: string) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/dist/assets/icons/${name}.svg`,
});

export const tagName = 'shoelace-showcase';

export const less = { ssr: false };

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
  static override styles = styles;

  override render(): string {
    return `
      <div class="sl-row">
        <sl-button variant="primary" size="small">Primary</sl-button>
        <sl-button variant="success" size="small">Success</sl-button>
        <sl-button variant="neutral" size="small">Neutral</sl-button>
        <sl-badge variant="danger" pill>DSD</sl-badge>
      </div>
      <div class="sl-row">
        <sl-input placeholder="Type something..." size="small" style="width:200px"></sl-input>
      </div>
      <sl-alert variant="warning" open>
        <sl-icon name="info-circle" slot="icon"></sl-icon>
        <strong>Shoelace</strong> - Lit Web Components via @lessjs/adapter-lit DSD pipeline
      </sl-alert>
      <div class="sl-note">Shoelace (80+ components) renders natively through our Lit adapter</div>
    `;
  }
}

try {
  customElements.define(tagName, ShoelaceShowcase);
} catch { /* already defined */ }

/**
 * Shoelace Showcase — Lit adapter demo
 *
 * Renders Shoelace Web Components (Lit-based) through
 * @lessjs/adapter-lit's DSD pipeline.
 *
 * Shoelace is a popular Lit-based Web Component library with
 * 80+ components. It uses Lit internally, so it renders through
 * our Lit adapter natively.
 *
 * @lessjs/app island — auto-detected and SSR'd by adapter-vite.
 */
import { css, html, LitElement } from 'lit';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

// Register the default Shoelace icon library (CDN)
registerIconLibrary('default', {
  resolver: (name) =>
    `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/dist/assets/icons/${name}.svg`,
});

export const tagName = 'shoelace-showcase';

// less.ssr: false — Shoelace's HasSlotController accesses this.host.childNodes
// and this.host.querySelector(), which are not available in ssr-dom-shim's
// HTMLElement. Client-only rendering is required until ADR-0028 DOM simulation.
export const less = { ssr: false };

export default class ShoelaceShowcase extends LitElement {
  static override styles = css`
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
  `;

  override render() {
    return html`
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
        <strong>Shoelace</strong> — Lit Web Components via @lessjs/adapter-lit DSD pipeline
      </sl-alert>
      <div class="sl-note">Shoelace (80+ components) renders natively through our Lit adapter</div>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, ShoelaceShowcase);
} catch { /* already defined */ }

/**
 * v0.21 Demo: client:only strategy.
 * Client-only render — no DSD, no SSR. Fully owns its shadow root on the client.
 */
import { defineIsland } from '@lessjs/core';

class DemoOnly extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  render(): string {
    return `<style>
  :host { display:block; padding:1rem; border:2px solid #ef4444; border-radius:8px; margin:0.5rem 0; }
  .badge { display:inline-block; background:#ef4444; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; }
</style>
<div class="badge">client:only</div>
<p>Client-only render — no SSR, full client ownership.</p>`;
  }
  connectedCallback() {
    this.shadowRoot!.innerHTML = this.render();
  }
}

export default defineIsland('demo-only', DemoOnly, { strategy: 'only' });

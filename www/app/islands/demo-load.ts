/**
 * v0.21 Demo: client:load strategy.
 * Imports immediately when the module loads.
 */
import { island } from '@lessjs/runtime';

class DemoLoad extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  render(): string {
    return `<style>
  :host { display:block; padding:1rem; border:2px solid #22c55e; border-radius:8px; margin:0.5rem 0; }
  .badge { display:inline-block; background:#22c55e; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; }
</style>
<div class="badge">client:load</div>
<p>Hydrated immediately on module load.</p>`;
  }
  connectedCallback() {
    this.shadowRoot!.innerHTML = this.render();
  }
}

export default island('demo-load', DemoLoad, { strategy: 'load' });

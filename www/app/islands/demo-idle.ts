/**
 * v0.21 Demo: client:idle strategy.
 * Defers hydration until the browser is idle (requestIdleCallback).
 */
import { island } from '@lessjs/runtime';

class DemoIdle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  render(): string {
    return `<style>
  :host { display:block; padding:1rem; border:2px solid #f59e0b; border-radius:8px; margin:0.5rem 0; }
  .badge { display:inline-block; background:#f59e0b; color:#000; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; }
</style>
<div class="badge">client:idle</div>
<p>Hydrated when the browser is idle.</p>`;
  }
  connectedCallback() {
    this.shadowRoot!.innerHTML = this.render();
  }
}

export default island('demo-idle', DemoIdle, { strategy: 'idle' });

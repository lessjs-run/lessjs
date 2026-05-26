/**
 * v0.21 Demo: client:visible strategy.
 * Hydrates when the element enters the viewport (IntersectionObserver, 200px rootMargin).
 */
import { island } from '@lessjs/runtime';

class DemoVisible extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  render(): string {
    return `<style>
  :host { display:block; padding:1rem; border:2px solid #3b82f6; border-radius:8px; margin:0.5rem 0; }
  .badge { display:inline-block; background:#3b82f6; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; }
</style>
<div class="badge">client:visible</div>
<p>Hydrated when scrolled into view (200px rootMargin).</p>`;
  }
  connectedCallback() {
    this.shadowRoot!.innerHTML = this.render();
  }
}

export default island('demo-visible', DemoVisible, { strategy: 'visible' });

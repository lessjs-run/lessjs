/**
 * v0.21 Demo: Hydration strategies guide.
 *
 * Demonstrates all four client:* hydration strategies:
 *   - client:load    → import immediately
 *   - client:idle    → defer to requestIdleCallback
 *   - client:visible → import on viewport entry (IntersectionObserver)
 *   - client:only    → client-only, no SSR/DSD
 */

import { html } from 'lit';
import type { ServerHandler } from '@lessjs/core';

// Side-effect imports: island() registers custom elements
import '../../islands/demo-load.js';
import '../../islands/demo-idle.js';
import '../../islands/demo-visible.js';
import '../../islands/demo-only.js';

export const tagName = 'guide-islands';

export default {
  default: (() => {
    return html`
      <h1>Hydration Strategies</h1>
      <p>LessJS v0.21 supports four hydration strategies:</p>

      <h2>client:load</h2>
      <p>Imports immediately when the module loads. Best for above-the-fold interactive elements.</p>
      <demo-load></demo-load>

      <h2>client:idle</h2>
      <p>
        Defers until browser is idle (requestIdleCallback). Best for below-the-fold or non-critical UI.
      </p>
      <demo-idle></demo-idle>

      <h2>client:visible</h2>
      <p>
        Imports when the element enters the viewport (IntersectionObserver, 200px rootMargin). Best for
        lazy content.
      </p>
      <div style="height:400px"></div>
      <demo-visible></demo-visible>

      <h2>client:only</h2>
      <p>Client-only render — no DSD, no SSR. The component fully owns its shadow root.</p>
      <demo-only></demo-only>
    `;
  }) as unknown as ServerHandler,
};

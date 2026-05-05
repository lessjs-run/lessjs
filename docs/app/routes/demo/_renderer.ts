/**
 * _renderer.ts — Demo page renderer
 *
 * Injects <api-consumer> inside page-demo's template (correct position in layout)
 * without the legacy upgrade marker. This means:
 *   - It's positioned correctly within the less-layout slot
 *   - It's excluded from the old batch-upgrade group
 *   - It upgrades independently when its chunk defines the custom element
 *   - No simultaneous upgrade conflict with the parent shadow DOM
 */
import type { KissRenderer } from '@lessjs/core';

const renderer: KissRenderer = {
  wrap(html, _ctx) {
    // Replace the placeholder comment with the actual <api-consumer> tag.
    // No legacy upgrade marker; it would cause a dual-upgrade conflict.
    return html.replace(
      '<!-- api-consumer rendered by renderer in light DOM -->',
      '<api-consumer></api-consumer>',
    );
  },
};

export default renderer;

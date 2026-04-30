/**
 * _renderer.ts — Homepage renderer
 *
 * Strips defer-hydration from <kiss-hero-ping> to prevent nested
 * hydration conflict with the parent <docs-home> shadow DOM.
 * The island hydrates independently when its chunk loads.
 */
import type { KissRenderer } from '@kissjs/core';

const renderer: KissRenderer = {
  wrap(html, _ctx) {
    return html.replace(
      '<kiss-hero-ping defer-hydration',
      '<kiss-hero-ping',
    );
  },
};

export default renderer;

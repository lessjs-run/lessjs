/**
 * _renderer.ts — Homepage renderer
 *
 * Homepage renderer kept as the route-local customization hook.
 * The island upgrades independently when its chunk loads.
 */
import type { LessRenderer } from '@lessjs/core';

const renderer: LessRenderer = {
  wrap(html, _ctx) {
    return html;
  },
};

export default renderer;

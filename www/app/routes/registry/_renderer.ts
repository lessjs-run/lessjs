/**
 * _renderer.ts — Layout renderer for the Registry section.
 *
 * v0.19.0: Empty renderer for now. No special injection needed.
 */

import type { LessRenderer } from '@lessjs/core';

const renderer: LessRenderer = {
  wrap(html: string, _ctx: { req: { path: string } }) {
    return html;
  },
};

export default renderer;

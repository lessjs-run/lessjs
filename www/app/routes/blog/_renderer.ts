/**
 * _renderer.ts — Layout renderer for the blog section.
 *
 * Injects search button into the layout header.
 *
 * @see {@link ../../packages/core/src/types.ts} for LessRenderer interface
 */

import type { LessRenderer } from '@lessjs/core';

const GITHUB_EDIT_BASE = 'https://github.com/lessjs-run/lessjs/edit/main/www/app/routes';

function routeToSourcePath(path: string): string {
  const p = path.endsWith('/') ? path.slice(0, -1) : path;
  if (p === '' || p === '/') return 'index/index.ts';
  const rel = p.startsWith('/') ? p.slice(1) : p;
  return `${rel}.ts`;
}

const renderer: LessRenderer = {
  wrap(html: string, ctx: { req: { path: string } }) {
    const editUrl = `${GITHUB_EDIT_BASE}/${routeToSourcePath(ctx.req.path)}`;

    // Inject search button into header slot
    const layoutOpen = html.indexOf('<less-layout');
    if (layoutOpen >= 0) {
      const closeGt = html.indexOf('>', layoutOpen);
      if (closeGt > 0) {
        html = html.slice(0, closeGt + 1) +
          '<less-search slot="header-actions"></less-search>' +
          html.slice(closeGt + 1);
      }
    }

    // Inject "Edit this page" in the layout footer
    html = html.replace(
      'LESS IS MORE',
      `LESS IS MORE</p><p style="font-size:0.75rem;margin-top:0.5rem;opacity:0.6"><a href="${
        editUrl.replace(/"/g, '&quot;')
      }" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">Edit this page on GitHub →</a></p>`,
    );

    return html;
  },
};

export default renderer;

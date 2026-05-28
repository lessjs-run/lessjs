/**
 * section-renderer.ts - Shared layout renderer factory.
 *
 * Sets "Edit this page" link via edit-url attribute on <less-layout>.
 * Used by all doc/guide/blog/component/architecture/engine/example/hub sections.
 *
 * Search is rendered by less-layout itself (see packages/ui/src/less-layout.ts).
 *
 * v0.23.0: Search DSD injection removed — less-layout now renders <less-search>
 *   directly. The import of less-search.tsx is kept for customElements registration
 *   during SSR.
 */

import type { LessRenderer } from '@lessjs/runtime';
import '../islands/less-search.tsx';

const GITHUB_EDIT_BASE = 'https://github.com/lessjs-run/lessjs/edit/main/www/app/routes';

function routeToSourcePath(path: string): string {
  const p = path.endsWith('/') ? path.slice(0, -1) : path;
  if (p === '' || p === '/') return 'index/index.ts';
  const rel = p.startsWith('/') ? p.slice(1) : p;
  return `${rel}.ts`;
}

/**
 * Create a section renderer with edit-link support.
 *
 * Sets `edit-url` attribute on `<less-layout>` so the component renders
 * the "Edit this page" link natively.
 * Search is handled by less-layout itself (no DSD injection needed).
 */
export function createSectionRenderer(_sectionName?: string): LessRenderer {
  return {
    wrap(html: string, ctx: { req: { path: string } }) {
      const editUrl = `${GITHUB_EDIT_BASE}/${routeToSourcePath(ctx.req.path)}`;

      // Inject edit-url attribute into <less-layout> opening tag.
      // less-layout reads this attribute and renders the footer edit link.
      const layoutOpen = html.indexOf('<less-layout');
      if (layoutOpen >= 0) {
        const closeGt = html.indexOf('>', layoutOpen);
        if (closeGt > 0) {
          const before = html.slice(0, closeGt);
          const after = html.slice(closeGt);
          // Only add if not already present
          if (!before.includes('edit-url=')) {
            html = `${before} edit-url="${editUrl.replace(/"/g, '&quot;')}"${after}`;
          }
        }
      }

      return html;
    },
  };
}

export default createSectionRenderer;

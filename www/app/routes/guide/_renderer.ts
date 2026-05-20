/**
 * _renderer.ts — Layout renderer for the guide section.
 *
 * Injects search button and "Edit this page" in the layout footer.
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

    // Inject search button into header slot with DSD fallback
    // The SSR pipeline does not process <less-search> injected via string,
    // so we must provide a DSD template with the search-trigger button
    // so it's visible before client-side hydration.
    const SEARCH_DSD = '<less-search slot="header-actions"><template shadowrootmode="open"><style>:host{display:inline-flex;align-items:center}.search-trigger{display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.5rem;border:0.5px solid var(--less-border);border-radius:6px;background:transparent;color:var(--less-text-muted);font-size:0.6875rem;font-weight:500;letter-spacing:0.02em;cursor:pointer}.search-trigger kbd{font-family:inherit;padding:0.0625rem 0.3125rem;border:0.5px solid var(--less-border);border-radius:3px;font-size:0.625rem;margin-left:0.25rem}</style><button class="search-trigger">Search<kbd>⌘K</kbd></button></template></less-search>';
    const layoutOpen = html.indexOf('<less-layout');
    if (layoutOpen >= 0) {
      const closeGt = html.indexOf('>', layoutOpen);
      if (closeGt > 0) {
        html = html.slice(0, closeGt + 1) +
          SEARCH_DSD +
          html.slice(closeGt + 1);
      }
    }

    // Inject "Edit this page" in the layout footer
    // This is needed because the layout's DSD template was already rendered without editUrl.
    // We inject directly into the <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}"> footer in the SSR HTML output.
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

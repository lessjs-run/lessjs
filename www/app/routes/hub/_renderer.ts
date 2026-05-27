/**
 * _renderer.ts - Layout renderer for the hub section.
 *
 * Injects search button and "Edit this page" in the layout footer.
 *
 * @see {@link ../../packages/core/src/types.ts} for LessRenderer interface
 */

import type { LessRenderer } from '@lessjs/runtime';
import ../../islands/less-search.js;

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

    // DSD contains CSS + button markup (matching SSR output).
    // Client-side Lit detects the existing button and skips render() to avoid duplicates.
    // Overlay is managed via imperative DOM after DSD hydration.
    const SEARCH_DSD =
      '<less-search slot="header-actions"><template shadowrootmode="open"><style>:host{display:inline-flex;align-items:center}.search-trigger{display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.5rem;border:0.5px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);font-size:0.6875rem;font-weight:500;letter-spacing:0.02em;cursor:pointer;transition:color 150ms ease-out,border-color 150ms ease-out}.search-trigger:hover{color:var(--text-secondary);border-color:var(--border-hover)}.search-trigger kbd{font-family:inherit;padding:0.0625rem 0.3125rem;border:0.5px solid var(--border);border-radius:3px;font-size:0.625rem;margin-left:0.25rem}.search-icon{display:none;width:16px;height:16px}@media(max-width:640px){.search-trigger span{display:none}.search-trigger kbd{display:none}.search-icon{display:inline-block}.search-trigger{padding:0.375rem}}</style><button class="search-trigger"><svg class="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg><span>Search</span><kbd>⌘K</kbd></button></template></less-search>';
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
      }" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">Edit this page on GitHub -></a></p>`,
    );

    return html;
  },
};

export default renderer;

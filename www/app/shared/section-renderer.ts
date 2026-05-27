/**
 * section-renderer.ts - Shared layout renderer factory.
 *
 * Injects search button DSD and "Edit this page" via edit-url attribute.
 * Used by all doc/guide/blog/component/architecture/engine/example/hub sections.
 *
 * v0.23.0: Extracted from 8 duplicate _renderer.ts files.
 *   Sets edit-url attribute on <less-layout> instead of magic-string replace.
 */

import type { LessRenderer } from '@lessjs/runtime';
import '../islands/less-search.js';

const GITHUB_EDIT_BASE = 'https://github.com/lessjs-run/lessjs/edit/main/www/app/routes';

function routeToSourcePath(path: string): string {
  const p = path.endsWith('/') ? path.slice(0, -1) : path;
  if (p === '' || p === '/') return 'index/index.ts';
  const rel = p.startsWith('/') ? p.slice(1) : p;
  return `${rel}.ts`;
}

// DSD contains CSS + button markup (matching SSR output).
// Client-side Lit detects the existing button and skips render() to avoid duplicates.
// Overlay is managed via imperative DOM after DSD hydration.
const SEARCH_DSD =
  '<less-search slot="header-actions"><template shadowrootmode="open"><style>:host{display:inline-flex;align-items:center}.search-trigger{display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.5rem;border:0.5px solid var(--border);border-radius:6px;background:transparent;color:var(--text-muted);font-size:0.6875rem;font-weight:500;letter-spacing:0.02em;cursor:pointer;transition:color 150ms ease-out,border-color 150ms ease-out}.search-trigger:hover{color:var(--text-secondary);border-color:var(--border-hover)}.search-trigger kbd{font-family:inherit;padding:0.0625rem 0.3125rem;border:0.5px solid var(--border);border-radius:3px;font-size:0.625rem;margin-left:0.25rem}.search-icon{display:none;width:16px;height:16px}@media(max-width:640px){.search-trigger span{display:none}.search-trigger kbd{display:none}.search-icon{display:inline-block}.search-trigger{padding:0.375rem}}</style><button class="search-trigger"><svg class="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg><span>Search</span><kbd>⌘K</kbd></button></template></less-search>';

/**
 * Create a section renderer with search DSD injection and edit-link support.
 *
 * Sets `edit-url` attribute on `<less-layout>` so the component renders
 * the "Edit this page" link natively, instead of via string replacement.
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

      // Inject search button DSD into <less-layout> opening tag
      const layoutOpen2 = html.indexOf('<less-layout');
      if (layoutOpen2 >= 0) {
        const closeGt2 = html.indexOf('>', layoutOpen2);
        if (closeGt2 > 0) {
          html = html.slice(0, closeGt2 + 1) +
            SEARCH_DSD +
            html.slice(closeGt2 + 1);
        }
      }

      return html;
    },
  };
}

export default createSectionRenderer;

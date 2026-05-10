/**
 * @lessjs/content - Unified content plugin for LessJS
 *
 * Blog + Nav + Sitemap — build-time only, zero runtime.
 * Each module is opt-in: pass options to enable, omit or false to disable.
 *
 * Usage:
 * ```ts
 * import { lessContent } from '@lessjs/content';
 *
 * export default defineConfig({
 *   plugins: [
 *     less(),
 *     lessContent({
 *       blog: { contentDir: 'content/blog', basePath: '/blog' },
 *       nav: { routesDir: 'app/routes', headerNav: [...] },
 *       sitemap: { hostname: 'https://lessjs.org' },
 *     }),
 *   ],
 * });
 * ```
 */

import type { Plugin } from 'vite';
import type { HeaderNavLink, LessContentOptions, NavSection } from './types.ts';
import type { LessBuildContext } from '@lessjs/core/build-context';
import { getActiveContext } from '@lessjs/core';
import { initBlogData } from './blog/blog-data.ts';
import { scanNavData } from './nav/scanner.ts';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('content');

// ─── Re-exports ─────────────────────────────────────────────────

// Blog
export type { BlogPost, BlogPostFrontmatter, LessBlogOptions } from './blog/types.ts';
export { parseMarkdownFile, slugFromFilename } from './blog/markdown.ts';
export { generateBlogRoutes, scanPosts } from './blog/routes.ts';
export { getBlogOptions, getPostBySlug, getPosts, initBlogData } from './blog/blog-data.ts';

// Nav
export { extractMeta, scanNavData } from './nav/scanner.ts';
export type { HeaderNavLink, NavItem, NavOptions, NavSection, RouteMeta } from './types.ts';

// Sitemap
export {
  generateSitemap,
  renderRobotsTxt,
  renderSitemapXml,
  scanHtmlFiles,
} from './sitemap/generator.ts';
export type { SitemapOptions, SitemapUrl } from './types.ts';

// ─── Virtual module IDs ─────────────────────────────────────────

const VIRTUAL_NAV_ID = 'virtual:less-nav';
const RESOLVED_NAV_ID = '\0' + VIRTUAL_NAV_ID;

/** Cached nav data (populated in buildStart) */
let _navSections: NavSection[] = [];
let _headerNav: HeaderNavLink[] = [];

// ─── Main Plugin ────────────────────────────────────────────────

/**
 * LessJS Content Vite plugin.
 * Unified entry for blog, nav, and sitemap modules.
 * Each module is opt-in.
 */
export function lessContent(
  options: LessContentOptions & { ctx?: LessBuildContext } = {},
): Plugin[] {
  const blogOpts = options.blog === false ? null : (options.blog || null);
  const navOpts = options.nav || null;
  const sitemapOpts = options.sitemap || null;
  // Discover ctx: explicit param > active build context from less()
  const ctx = options.ctx || getActiveContext();

  const contentPlugin: Plugin = {
    name: 'less:content',

    async buildStart() {
      // ─── Blog module ────────────────────────────────────
      if (blogOpts) {
        const contentDir = blogOpts.contentDir ?? 'posts';
        const basePath = blogOpts.basePath ?? '/blog';

        const { postCount } = await (async () => {
          const result = await initBlogData(blogOpts);
          return { postCount: result.posts.length };
        })();

        log.info(`Blog: ${postCount} post(s) found in ${contentDir}, base path: ${basePath}`);

        // Write blog options to ctx (or fallback to .less/ for backward compat)
        if (ctx) {
          ctx.blogOptions = { contentDir, basePath };
        }
      }

      // ─── Nav module ─────────────────────────────────────
      if (navOpts) {
        _navSections = scanNavData(navOpts);
        _headerNav = navOpts.headerNav || [];

        // Write nav data to ctx (or fallback to virtual module resolution)
        if (ctx) {
          ctx.navSections = _navSections;
          ctx.headerNav = _headerNav;
        }

        log.info(`Nav: ${_navSections.length} section(s) configured`);
      }

      // ─── Sitemap module ──────────────────────────────────
      if (sitemapOpts) {
        if (ctx) {
          ctx.sitemapOptions = sitemapOpts as unknown as Record<string, unknown>;
        }
        log.info(`Sitemap: configured for ${sitemapOpts.hostname}`);
      }
    },

    config() {
      const defines: Record<string, string> = {};

      // Blog: define __LESS_BLOG_BASE_PATH__ for route components
      if (blogOpts) {
        defines['__LESS_BLOG_BASE_PATH__'] = JSON.stringify(blogOpts.basePath ?? '/blog');
      }

      return { define: defines };
    },
  };

  const virtualNavPlugin: Plugin = {
    name: 'less:virtual-nav',

    resolveId(id) {
      if (id === VIRTUAL_NAV_ID) return RESOLVED_NAV_ID;
    },

    load(id) {
      if (id === RESOLVED_NAV_ID) {
        return [
          `export const navSections = ${JSON.stringify(_navSections)};`,
          `export const headerNav = ${JSON.stringify(_headerNav)};`,
        ].join('\n');
      }
    },
  };

  return [contentPlugin, virtualNavPlugin];
}

export default lessContent;

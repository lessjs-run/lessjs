/**
 * @lessjs/content - Unified content plugin for LessJS
 *
 * Blog + Nav + Sitemap — build-time only, zero runtime.
 * Each module is opt-in: pass options to enable, omit or false to disable.
 *
 * ADR 0018: Route components import data from virtual:less-blog-data,
 * NOT from @lessjs/content module state. The loadBlogData() pure function
 * is called by the virtual module plugin's load() hook.
 *
 * Recommended usage (via @lessjs/app):
 * ```ts
 * import { lessjs } from '@lessjs/app';
 *
 * export default defineConfig({
 *   plugins: [await lessjs({
 *     content: {
 *       blog: { contentDir: 'content/blog', basePath: '/blog' },
 *       nav: { routesDir: 'app/routes', headerNav: [...] },
 *       sitemap: { hostname: 'https://lessjs.org' },
 *     },
 *   })],
 * });
 * ```
 *
 * Standalone usage requires explicit ctx parameter:
 * ```ts
 * lessContent({ blog: {...}, ctx });  // ctx must be explicitly passed
 * ```
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { LessContentOptions } from './types.ts';
import type { LessBuildContext } from '@lessjs/adapter-vite/build-context';
import { RESOLVED_BLOG_DATA_ID } from '@lessjs/core/constants';
import { loadBlogData } from './blog/blog-data.ts';
import { scanNavData } from './nav/scanner.ts';
import { createLogger } from '@lessjs/core/logger';
import { relative, resolve } from 'node:path';

const log = createLogger('content');

// ─── Re-exports ─────────────────────────────────────────────────

// Blog
export type { BlogPost, BlogPostFrontmatter, LessBlogOptions } from './blog/types.ts';
export { parseMarkdownFile, slugFromFilename } from './blog/markdown.ts';
export { generateBlogRoutes, scanPosts } from './blog/routes.ts';
export { loadBlogData } from './blog/blog-data.ts';

// Nav
export { extractMeta, scanNavData } from './nav/scanner.ts';
export type {
  HeaderNavLink,
  LessContentOptions,
  NavItem,
  NavOptions,
  NavSection,
  RouteMeta,
} from './types.ts';

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
  // ctx must be explicitly provided (via lessjs() umbrella or direct param)
  const ctx = options.ctx;

  const contentPlugin: Plugin = {
    name: 'less:content',

    async buildStart() {
      // ─── Blog module ────────────────────────────────────
      if (blogOpts) {
        const contentDir = blogOpts.contentDir ?? 'posts';
        const basePath = blogOpts.basePath ?? '/blog';

        // ADR 0018: Use loadBlogData() pure function instead of stateful initBlogData()
        const result = await loadBlogData(blogOpts);

        log.info(
          `Blog: ${result.posts.length} post(s) found in ${contentDir}, base path: ${basePath}`,
        );

        // Write blog options to ctx (ADR 0010: ctx replaces .less/ temp files)
        // The virtual:less-blog-data plugin reads ctx.plugins.blogOptions in its load() hook
        if (ctx) {
          ctx.plugins.blogOptions = { contentDir, basePath };
        }
      }

      // ─── Nav module ─────────────────────────────────────
      if (navOpts) {
        if (ctx) {
          ctx.plugins.navSections = scanNavData(navOpts);
          ctx.plugins.headerNav = navOpts.headerNav || [];
        }

        log.info(`Nav: ${ctx?.plugins.navSections.length ?? 0} section(s) configured`);
      }

      // ─── Sitemap module ──────────────────────────────────
      if (sitemapOpts) {
        if (ctx) {
          ctx.plugins.sitemapOptions = sitemapOpts as unknown as Record<string, unknown>;
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

    // ADR 0018 Phase 3: Content HMR
    // When .md/.mdx files change, invalidate virtual:less-blog-data
    // so the next ssrLoadModule() call triggers load() with fresh data.
    configureServer(server: ViteDevServer) {
      const contentDir = blogOpts?.contentDir;
      if (!contentDir) return;

      const absoluteContentDir = resolve(server.config.root, contentDir);

      // Watch the content directory for changes
      server.watcher.add(absoluteContentDir);

      const invalidateBlogData = (file: string) => {
        if (!file.startsWith(absoluteContentDir)) return;
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;

        // Invalidate the virtual blog data module
        const mod = server.moduleGraph.getModuleById(RESOLVED_BLOG_DATA_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          log.info(`Content changed: ${relative(server.config.root, file)} — reloading`);
          server.hot.send({ type: 'full-reload' });
        }
      };

      server.watcher.on('change', invalidateBlogData);
      server.watcher.on('add', invalidateBlogData);
      server.watcher.on('unlink', invalidateBlogData);
    },
  };

  const virtualNavPlugin: Plugin = {
    name: 'less:virtual-nav',

    resolveId(id) {
      if (id === VIRTUAL_NAV_ID) return RESOLVED_NAV_ID;
    },

    load(id) {
      if (id === RESOLVED_NAV_ID) {
        const navSections = ctx?.plugins.navSections ?? [];
        const headerNav = ctx?.plugins.headerNav ?? [];
        return [
          `export const navSections = ${JSON.stringify(navSections)};`,
          `export const headerNav = ${JSON.stringify(headerNav)};`,
        ].join('\n');
      }
    },
  };

  return [contentPlugin, virtualNavPlugin];
}

export default lessContent;

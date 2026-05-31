/**
 * @lessjs/content - Unified content plugin for LessJS
 *
 * Blog + Nav + Sitemap - build-time only, zero runtime.
 * Each module is opt-in: pass options to enable, omit or false to disable.
 *
 * Route components import generated data from @lessjs/generated/blog-data.
 * This package writes the generated module and does not resolve it at runtime.
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { LessContentOptions } from './types.ts';
import type { LessBuildContextLike } from '@lessjs/protocols/build-types';
import { loadBlogData, writeBlogDataModule } from './blog/blog-data.ts';
import { scanNavData } from './nav/scanner.ts';
import { writeNavModule } from './nav/writer.ts';
import { writeSearchIndex } from './search/writer.ts';
import { createLogger } from '@lessjs/core/logger';
import process from 'node:process';
import { join, relative, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const log = createLogger('content');

export type { BlogPost, BlogPostFrontmatter, LessBlogOptions } from './blog/types.ts';
export { parseMarkdownFile, slugFromFilename } from './blog/markdown.ts';
export { generateBlogRoutes, scanPosts } from './blog/routes.ts';
export { loadBlogData } from './blog/blog-data.ts';

export { extractMeta, scanNavData } from './nav/scanner.ts';
export {
  createRouteManifest,
  type DocsRouteManifest,
  type DocsRouteManifestEntry,
  writeRouteManifestModule,
} from './manifest/writer.ts';
export { type SearchIndexEntry, writeSearchIndex } from './search/writer.ts';
export type {
  HeaderNavLink,
  LessContentOptions,
  NavItem,
  NavOptions,
  NavSection,
  RouteMeta,
} from './types.ts';

export {
  generateSitemap,
  renderRobotsTxt,
  renderSitemapXml,
  scanHtmlFiles,
} from './sitemap/generator.ts';
export type { SitemapOptions, SitemapUrl } from './types.ts';
export function lessContent(
  options: LessContentOptions & { ctx?: LessBuildContextLike } = {},
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

        // Write blog options to ctx for SSG helpers.
        if (ctx) {
          ctx.plugins.blogOptions = { contentDir, basePath };
        }

        // SOP-001: Write generated blog data module to disk
        try {
          const dataDir = join(process.cwd(), 'app', 'data');
          mkdirSync(dataDir, { recursive: true });
          const blogModule = writeBlogDataModule(result.posts);
          writeFileSync(join(dataDir, '_generated-blog-data.ts'), blogModule, 'utf-8');
          log.info(`Blog: wrote _generated-blog-data.ts (${result.posts.length} post(s))`);
        } catch (err) {
          log.warn(
            `Failed to write _generated-blog-data.ts: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }

      // ─── Nav module ─────────────────────────────────────
      if (navOpts) {
        const resolvedNavOpts = {
          ...navOpts,
          routesDir: navOpts.routesDir ?? 'app/routes',
        };
        const navSections = scanNavData(resolvedNavOpts);
        const headerNav = resolvedNavOpts.headerNav || [];
        if (ctx) {
          ctx.plugins.navSections = navSections;
          ctx.plugins.headerNav = headerNav;
        }

        // SOP-001: Write generated nav data module to disk
        try {
          const dataDir = join(process.cwd(), 'app', 'data');
          mkdirSync(dataDir, { recursive: true });
          const navModule = writeNavModule({ headerNav, navSections });
          writeFileSync(join(dataDir, '_generated-nav.ts'), navModule, 'utf-8');
          log.info(`Nav: wrote _generated-nav.ts (${navSections.length} section(s))`);
          const publicDir = join(process.cwd(), 'public');
          mkdirSync(publicDir, { recursive: true });
          writeFileSync(
            join(publicDir, 'search-index.json'),
            writeSearchIndex(navSections, headerNav),
            'utf-8',
          );
          log.info('Search: wrote search-index.json from route metadata');
        } catch (err) {
          log.warn(
            `Failed to write _generated-nav.ts: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }

        log.info(`Nav: ${navSections.length} section(s) configured`);
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

      // Blog: define __BLOG_BASE_PATH__ for route components
      if (blogOpts) {
        defines['__BLOG_BASE_PATH__'] = JSON.stringify(blogOpts.basePath ?? '/blog');
      }

      return { define: defines };
    },

    configureServer(server: ViteDevServer) {
      const contentDir = blogOpts?.contentDir;
      if (!contentDir) return;

      const absoluteContentDir = resolve(server.config.root, contentDir);

      // Watch the content directory for changes
      server.watcher.add(absoluteContentDir);

      const invalidateBlogData = (file: string) => {
        if (!file.startsWith(absoluteContentDir)) return;
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;

        log.info(`Content changed: ${relative(server.config.root, file)} - reloading`);
        server.hot.send({ type: 'full-reload' });
      };

      server.watcher.on('change', invalidateBlogData);
      server.watcher.on('add', invalidateBlogData);
      server.watcher.on('unlink', invalidateBlogData);

      // M-19 fix: Clean up watcher listeners on server close
      server.httpServer?.on('close', () => {
        server.watcher.off('change', invalidateBlogData);
        server.watcher.off('add', invalidateBlogData);
        server.watcher.off('unlink', invalidateBlogData);
      });
    },
  };

  return [contentPlugin];
}

export default lessContent;

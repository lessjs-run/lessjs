/**
 * @lessjs/adapter-vite - Virtual data module plugins
 *
 * Replaces module-level state in @lessjs/content and @lessjs/i18n
 * with virtual module data exports. The load() hook runs in the
 * Vite plugin process and generates code that executes in the
 * SSR runner — this IS the data bridge.
 *
 * Dev mode:  ssrLoadModule('virtual:less-blog-data') → load() → fresh data
 * Build mode: viteBuild bundles the virtual module → data inlined
 * HMR:       invalidateModule → load() re-runs → fresh data
 *
 * Zero module state. Zero init functions. Zero dual paths.
 * ADR 0018
 */

import type { Plugin } from 'vite';
import type { LessBuildContext } from './build-context.js';

// ─── Virtual module IDs (exported for HMR invalidation) ─────────

export const VIRTUAL_BLOG_DATA_ID = 'virtual:less-blog-data';
export const RESOLVED_BLOG_DATA_ID = '\0' + VIRTUAL_BLOG_DATA_ID;

export const VIRTUAL_I18N_DATA_ID = 'virtual:less-i18n-data';
export const RESOLVED_I18N_DATA_ID = '\0' + VIRTUAL_I18N_DATA_ID;

// ─── Blog data virtual module ──────────────────────────────────

export function createBlogDataPlugin(ctx: LessBuildContext): Plugin {
  return {
    name: 'less:blog-data',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_BLOG_DATA_ID) return RESOLVED_BLOG_DATA_ID;
    },

    async load(id) {
      if (id !== RESOLVED_BLOG_DATA_ID) return;

      const blogOpts = ctx.blogOptions;
      if (!blogOpts) {
        // Blog not configured — export empty data
        return [
          'export const posts = [];',
          'export function getPostBySlug() { return undefined; }',
          'export function getBlogOptions() { return {}; }',
        ].join('\n');
      }

      // Dynamic import to avoid hard dependency on @lessjs/content
      // at module load time (content is an optional peer)
      const { loadBlogData } = await import('@lessjs/content/blog-data');

      const options = {
        contentDir: blogOpts.contentDir,
        basePath: blogOpts.basePath,
      };

      const { posts } = await loadBlogData(options);

      // Generate code that exports data + derived functions
      // The posts array is serialized as JSON — this is the bridge.
      // In build mode, this gets inlined into the SSR bundle.
      // In dev mode, this runs fresh on each ssrLoadModule() call.
      return [
        `const _posts = ${JSON.stringify(posts)};`,
        '',
        `/** All published blog posts, sorted newest first */`,
        `export const posts = _posts;`,
        '',
        `/** Get a single post by slug */`,
        `export function getPostBySlug(slug) {`,
        `  return _posts.find(p => p.slug === slug);`,
        `}`,
        '',
        `/** Get blog configuration */`,
        `export function getBlogOptions() {`,
        `  return ${JSON.stringify(options)};`,
        `}`,
      ].join('\n');
    },
  };
}

// ─── i18n data virtual module ───────────────────────────────────

export function createI18nDataPlugin(ctx: LessBuildContext): Plugin {
  return {
    name: 'less:i18n-data',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_I18N_DATA_ID) return RESOLVED_I18N_DATA_ID;
    },

    load(id) {
      if (id !== RESOLVED_I18N_DATA_ID) return;

      const i18nOpts = ctx.i18nOptions;
      if (!i18nOpts) {
        return [
          'export const locales = [];',
          'export function getDefaultLocale() { return "en"; }',
          'export function getI18nOptions() { return null; }',
        ].join('\n');
      }

      return [
        `const _options = ${JSON.stringify(i18nOpts)};`,
        'export const locales = _options.locales;',
        'export function getDefaultLocale() { return _options.defaultLocale || "en"; }',
        'export function getI18nOptions() { return _options; }',
      ].join('\n');
    },
  };
}

// ─── TypeScript type declarations ───────────────────────────────

// These are provided for IDE support. They must also be declared in a .d.ts file.

/**
 * virtual:less-blog-data module type declaration
 *
 * declare module 'virtual:less-blog-data' {
 *   import type { BlogPost, LessBlogOptions } from '@lessjs/content';
 *   export const posts: BlogPost[];
 *   export function getPostBySlug(slug: string): BlogPost | undefined;
 *   export function getBlogOptions(): LessBlogOptions;
 * }
 */

/**
 * virtual:less-i18n-data module type declaration
 *
 * declare module 'virtual:less-i18n-data' {
 *   import type { LessI18nOptions } from '@lessjs/i18n';
 *   export const locales: string[];
 *   export function getDefaultLocale(): string;
 *   export function getI18nOptions(): LessI18nOptions | null;
 * }
 */

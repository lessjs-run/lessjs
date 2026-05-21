/**
 * @lessjs/content - Blog Data Virtual Module Plugin
 *
 * Creates the virtual:less-blog-data Vite virtual module that provides
 * blog post data to route components during SSR.
 *
 * Lives in @lessjs/content (not adapter-vite) because it depends on
 * @lessjs/content's loadBlogData() - avoids circular dependency between
 * adapter-vite <-> content.
 */

import type { Plugin } from 'vite';
import type { LessBuildContextLike } from '@lessjs/core/build-types';
import { RESOLVED_BLOG_DATA_ID, VIRTUAL_BLOG_DATA_ID } from '@lessjs/core/virtual-ids';
import { loadBlogData } from './blog/blog-data.ts';

export function createBlogDataPlugin(ctx: LessBuildContextLike): Plugin {
  return {
    name: 'less:blog-data',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_BLOG_DATA_ID) return RESOLVED_BLOG_DATA_ID;
    },

    async load(id) {
      if (id !== RESOLVED_BLOG_DATA_ID) return;

      const blogOpts = ctx.plugins.blogOptions;
      if (!blogOpts) {
        return [
          'export const posts = [];',
          'export function getPostBySlug(slug) { return undefined; }',
          'export function getBlogOptions() { return {}; }',
        ].join('\n');
      }

      const options = {
        contentDir: blogOpts.contentDir!,
        basePath: blogOpts.basePath!,
      };

      const { posts } = await loadBlogData(options);

      return [
        `const _posts = ${JSON.stringify(posts)};`,
        '',
        'export const posts = _posts;',
        '',
        'export function getPostBySlug(slug) {',
        '  return _posts.find(p => p.slug === slug);',
        '}',
        '',
        `export function getBlogOptions() { return ${JSON.stringify(options)}; }`,
      ].join('\n');
    },
  };
}

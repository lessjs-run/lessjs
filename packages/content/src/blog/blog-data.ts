/**
 * @lessjs/content - Blog data store
 *
 * Singleton that holds parsed blog posts during build/dev.
 * The [slug].ts dynamic route reads from this store to render posts.
 */

import type { BlogPost, LessBlogOptions } from './types.ts';
import { generateBlogRoutes } from './routes.ts';

/** Global blog data store — populated by lessBlog() plugin at buildStart */
let _posts: BlogPost[] = [];
let _options: LessBlogOptions = {};

/** Get all published posts (sorted newest first) */
export function getPosts(): BlogPost[] {
  return _posts;
}

/** Get a single post by slug */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return _posts.find((p) => p.slug === slug);
}

/** Get current blog options */
export function getBlogOptions(): LessBlogOptions {
  return _options;
}

/**
 * Initialize the blog data store.
 * Called by lessBlog() plugin during buildStart().
 * Returns the route data for further use.
 */
export async function initBlogData(options?: LessBlogOptions): Promise<{
  posts: BlogPost[];
  basePath: string;
}> {
  _options = options ?? {};
  const routes = await generateBlogRoutes(options);
  _posts = routes.posts;
  return {
    posts: routes.posts,
    basePath: routes.basePath,
  };
}

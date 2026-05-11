/**
 * @lessjs/content - Blog data loader
 *
 * Pure function for loading blog data from the file system.
 * Zero module-level state. Zero side effects beyond reading files.
 *
 * ADR 0018: Replaces the old stateful initBlogData() + getPosts() pattern.
 * Route components import data from virtual:less-blog-data instead.
 * This module is only called by the virtual module plugin's load() hook.
 */

import type { BlogPost, LessBlogOptions } from './types.ts';
import { generateBlogRoutes } from './routes.ts';

/**
 * Pure function: load blog data from file system.
 * No module-level state. No side effects beyond reading files.
 * Can be called from any runtime context.
 *
 * This replaces the stateful initBlogData() + getPosts() pattern.
 * For virtual module consumers, use virtual:less-blog-data instead.
 */
export async function loadBlogData(options?: LessBlogOptions): Promise<{
  posts: BlogPost[];
  basePath: string;
}> {
  const routes = await generateBlogRoutes(options);
  return {
    posts: routes.posts,
    basePath: routes.basePath,
  };
}

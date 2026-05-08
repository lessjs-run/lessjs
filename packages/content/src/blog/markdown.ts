/**
 * @lessjs/content - Markdown processing
 *
 * Parses markdown files with frontmatter using gray-matter + marked.
 */

import matter from 'gray-matter';
import { marked } from 'marked';
import type { BlogPost, LessBlogOptions } from './types.ts';

/**
 * Parse a markdown file into a BlogPost.
 * Extracts frontmatter, renders markdown to HTML.
 */
export async function parseMarkdownFile(
  _filePath: string,
  fileContent: string,
  slug: string,
  options?: LessBlogOptions,
): Promise<BlogPost> {
  const { data, content } = matter(fileContent);

  const frontmatter = {
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString().split('T')[0],
    draft: data.draft ?? false,
    tags: data.tags ?? [],
    excerpt: data.excerpt,
  };

  let html: string;
  if (options?.markdown) {
    html = await options.markdown(content);
  } else {
    html = await marked(content);
  }

  return {
    slug,
    frontmatter,
    content,
    html,
  };
}

/**
 * Derive a URL-safe slug from a filename.
 * e.g. "2026-05-07-hello-world.md" → "hello-world"
 *      "my-post.md" → "my-post"
 */
export function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, ''); // strip date prefix
}

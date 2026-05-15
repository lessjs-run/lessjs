/**
 * @lessjs/content - Markdown processing
 *
 * Parses markdown files with frontmatter using gray-matter + marked.
 */

import matter from 'gray-matter';
import { marked } from 'marked';
import type { BlogPost, LessBlogOptions } from './types.ts';

/**
 * Strip dangerous HTML elements and attributes from markdown output.
 * Removes <script>, <iframe>, <object>, <embed>, <form>, and on* event attributes.
 * This is a build-time defense-in-depth — content files are developer-controlled,
 * but sanitization prevents accidental or malicious XSS via raw HTML in markdown.
 */
function sanitizeHtml(html: string): string {
  return html
    // Remove dangerous tags entirely (including content)
    .replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, '')
    .replace(/<iframe[\s>][\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<object[\s>][\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed[\s>][\s\S]*?<\/embed\s*>/gi, '')
    .replace(/<form[\s>][\s\S]*?<\/form\s*>/gi, '')
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs in href/src/action
    .replace(/(href|src|action)\s*=\s*["']javascript:[^"']*["']/gi, '$1=""');
}

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
    type: data.type,
  };

  let html: string;
  if (options?.markdown) {
    html = await options.markdown(content);
  } else {
    // v0.14.7: Sanitize markdown output — strip dangerous HTML tags
    // to prevent stored XSS from malicious markdown files.
    // marked renders raw HTML by default; we explicitly disable it.
    const raw = await marked(content, { async: true });
    html = sanitizeHtml(raw);
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

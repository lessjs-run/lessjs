/**
 * Blog Post Page — Dynamic Route
 *
 * Renders individual blog posts from @lessjs/content markdown content.
 * The `slug` param is set by LessJS dynamic routing: /blog/:slug
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import { getPostBySlug, getPosts } from '@lessjs/content';

export const tagName = 'page-blog-slug';

/**
 * getStaticPaths — tells the SSG pipeline which concrete pages to generate.
 * Without this, Hono's toSSG() skips parameter routes entirely.
 */
export async function getStaticPaths(): Promise<Array<Record<string, string>>> {
  const posts = getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default class BlogPostPage extends LitElement {
  /** Set by LessJS dynamic routing from /blog/:slug */
  slug = '';

  static override styles = [
    pageStyles,
    css`
      .blog-back {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        margin-bottom: 0.5rem;
        display: inline-block;
      }
      .blog-date {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        margin-bottom: 2rem;
      }
      .blog-tags {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .blog-tag {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        color: var(--less-text-muted);
      }
      .blog-content {
        font-size: 0.9375rem;
        line-height: 1.75;
        color: var(--less-text-secondary);
      }
      .blog-content h2 {
        margin-top: 2.5rem;
        color: var(--less-text-primary);
        font-size: 1.125rem;
        font-weight: 600;
      }
      .blog-content h3 {
        margin-top: 2rem;
        color: var(--less-text-primary);
        font-size: 1rem;
        font-weight: 600;
      }
      .blog-content p {
        margin: 0.75rem 0;
      }
      .blog-content ul,
      .blog-content ol {
        padding-left: 1.5rem;
        margin: 0.75rem 0;
      }
      .blog-content li {
        margin: 0.375rem 0;
      }
      .blog-content strong {
        color: var(--less-text-primary);
      }
      .blog-content code {
        background: var(--less-code-bg);
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        font-size: 0.8125rem;
        font-family: "SF Mono", "Fira Code", monospace;
      }
      .blog-content pre {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        padding: 1rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
      .blog-content pre code {
        background: none;
        padding: 0;
        font-size: 0.75rem;
        line-height: 1.6;
      }
      .blog-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.8125rem;
      }
      .blog-content th,
      .blog-content td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 0.5px solid var(--less-border);
      }
      .blog-content th {
        background: var(--less-bg-surface);
        color: var(--less-text-muted);
        font-weight: 600;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .blog-content a {
        color: var(--less-accent);
        text-decoration: none;
      }
      .blog-content a:hover {
        text-decoration: underline;
      }
      .blog-content hr {
        border: none;
        border-top: 0.5px solid var(--less-border);
        margin: 2rem 0;
      }
      .blog-content blockquote {
        border-left: 2px solid var(--less-accent);
        padding-left: 1rem;
        margin: 1rem 0;
        color: var(--less-text-muted);
      }
      .not-found {
        text-align: center;
        padding: 4rem 1rem;
        color: var(--less-text-muted);
      }
      .nav-row {
        margin-top: 3rem;
      }
    `,
  ];

  override render() {
    const post = getPostBySlug(this.slug);

    if (!post) {
      return html`
        <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/blog">
          <div class="container">
            <div class="not-found">
              <h1>404</h1>
              <p>文章未找到: ${this.slug}</p>
              <a href="/blog">← 返回博客</a>
            </div>
          </div>
        </less-layout>
      `;
    }

    const tags = post.frontmatter.tags ?? [];

    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/blog">
        <div class="container">
          <a href="/blog" class="blog-back">&larr; 博客</a>
          <h1>${post.frontmatter.title}</h1>
          <p class="subtitle">${post.frontmatter.excerpt ?? ''}</p>

          ${tags.length > 0
            ? html`
              <div class="blog-tags">
                ${tags.map((tag) =>
                  html`
                    <span class="blog-tag">${tag}</span>
                  `
                )}
              </div>
            `
            : ''}

          <p class="blog-date">${post.frontmatter.date}</p>

          <div class="blog-content">
            ${unsafeHTML(post.html)}
          </div>

          <div class="nav-row">
            <a href="/blog" class="nav-link">&larr; 返回博客</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, BlogPostPage);

/**
 * Render HTML string from markdown output.
 * Lit's `html` literal escapes by default, but blog post HTML
 * is pre-sanitized by marked (no raw user input).
 * We use a helper to bypass Lit's escaping for rendered markdown.
 */
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

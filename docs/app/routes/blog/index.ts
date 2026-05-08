/**
 * Blog Index Page — Data-driven rendering via @lessjs/content
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import { getPosts } from '@lessjs/content';

export class BlogIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-list {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0;
      }
      .blog-item {
        padding: 1rem 1.25rem;
        /* 0.5px: reduced to match less-ui spec */
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        transition: border-color 0.15s;
        display: block;
        text-decoration: none;
        color: inherit;
      }
      .blog-item:hover {
        border-color: var(--less-text-primary);
      }
      .blog-item h2 {
        font-size: 0.9375rem;
        margin: 0 0 0.25rem;
        font-weight: 500;
        color: var(--less-text-primary);
      }
      .blog-item .blog-desc {
        font-size: 0.8125rem;
        color: var(--less-text-secondary);
        margin: 0.5rem 0 0;
      }
      .blog-item .blog-date {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        margin: 0;
      }
      .blog-item .blog-tags {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
      }
      .blog-item .blog-tag {
        font-size: 0.5625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.0625rem 0.25rem;
        border-radius: 2px;
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        color: var(--less-text-muted);
      }
      .new-badge {
        font-size: 0.7rem;
        color: var(--less-accent);
        margin-left: 0.25rem;
      }
    `,
  ];

  override render() {
    const posts = getPosts();
    const newestSlug = posts.length > 0 ? posts[0].slug : '';

    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/blog">
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">LessJS 框架的设计思考、架构决策和发展路线。</p>

          <div class="blog-list">
            ${posts.map((post, i) => {
              const tags = post.frontmatter.tags ?? [];
              return html`
                <a href="/blog/${post.slug}" class="blog-item">
                  <h2>
                    ${post.frontmatter.title} ${i === 0
                      ? html`
                        <span class="new-badge">NEW</span>
                      `
                      : ''}
                  </h2>
                  ${post.frontmatter.excerpt
                    ? html`
                      <p class="blog-desc">${post.frontmatter.excerpt}</p>
                    `
                    : ''}
                  <span class="blog-date">${post.frontmatter.date}</span>
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
                </a>
              `;
            })}
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-blog-index', BlogIndexPage);
export default BlogIndexPage;
export const tagName = 'page-blog-index';

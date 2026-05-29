/**
 * Blog Index Page - Data-driven rendering via virtual:less-blog-data
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import { posts } from '@lessjs/content/blog-data';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .blog-list {
        list-style: none;
        padding: 0;
        margin: var(--size-6) 0;
      }
      .blog-item {
        display: block;
        padding: var(--size-4) var(--size-5);
        margin-bottom: var(--size-2);
        border: 0.5px solid var(--border);
        border-radius: var(--radius-1);
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s, background 0.15s;
      }
      .blog-item:hover {
        border-color: var(--border-hover);
        background: var(--bg-surface);
      }
      .blog-item h2 {
        margin: 0 0 var(--size-1);
        font-size: var(--font-size-4);
        font-weight: var(--font-weight-5);
        color: var(--text-primary);
      }
      .blog-desc {
        margin: 0 0 var(--size-1);
        font-size: var(--font-size-1);
        color: var(--text-muted);
      }
      .blog-date {
        font-size: 0.6875rem;
        color: var(--text-muted);
      }
      .blog-tags {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
        margin-top: var(--size-2);
      }
      .blog-tag {
        font-size: var(--font-size-00);
        font-weight: var(--font-weight-6);
        text-transform: uppercase;
        letter-spacing: var(--font-letterspacing-2);
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        color: var(--text-muted);
      }
      .new-badge {
        display: inline-block;
        font-size: 0.5rem;
        font-weight: var(--font-weight-7);
        letter-spacing: var(--font-letterspacing-4);
        padding: 0.0625rem 0.3125rem;
        border-radius: 2px;
        background: var(--text-primary);
        color: var(--bg-base);
        vertical-align: middle;
        margin-left: var(--size-1);
      }
    `);

export class BlogIndexPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="${this._getLocale('zh')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/blog"
      >
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">LessJS 框架的设计思考、架构决策和发展路线。</p>
          <div class="blog-list">${
      posts.filter((p) => p.frontmatter.type !== 'adr').map(
        (post, i) => {
          const tags = post.frontmatter.tags ?? [];
          return `
                <a href="/blog/${post.slug}" class="blog-item">
                  <h2>${post.frontmatter.title} ${
            i === 0
              ? `
                      <span class="new-badge">NEW</span>
                    `
              : ''
          }</h2>
                  ${
            post.frontmatter.excerpt
              ? `
                      <p class="blog-desc">${post.frontmatter.excerpt}</p>
                    `
              : ''
          }
                  <span class="blog-date">${post.frontmatter.date}</span>
                  ${
            tags.length > 0
              ? `
                      <div class="blog-tags">${
                tags.map((tag) => `
                          <span class="blog-tag">${tag}</span>
                        `)
              }</div>
                    `
              : ''
          }
                </a>
              `;
        },
      )
    }</div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/en/blog"
      >
        <div class="container">
          <h1>Blog</h1>
          <p class="subtitle">
            Design thoughts, architecture decisions, and development roadmap for the LessJS framework.
          </p>
          <div class="blog-list">${
      posts.filter((p) => p.frontmatter.type !== 'adr').map(
        (post, i) => {
          const tags = post.frontmatter.tags ?? [];
          return `
                <a href="/en/blog/${post.slug}" class="blog-item">
                  <h2>${post.frontmatter.title} ${
            i === 0
              ? `
                      <span class="new-badge">NEW</span>
                    `
              : ''
          }</h2>
                  ${
            post.frontmatter.excerpt
              ? `
                      <p class="blog-desc">${post.frontmatter.excerpt}</p>
                    `
              : ''
          }
                  <span class="blog-date">${post.frontmatter.date}</span>
                  ${
            tags.length > 0
              ? `
                      <div class="blog-tags">${
                tags.map((tag) => `
                          <span class="blog-tag">${tag}</span>
                        `)
              }</div>
                    `
              : ''
          }
                </a>
              `;
        },
      )
    }</div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-blog-index', BlogIndexPage);
export default BlogIndexPage;
export const tagName = 'page-blog-index';

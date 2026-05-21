/**
 * Blog Index Page - Data-driven rendering via virtual:less-blog-data
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterBlogNav } from '../../utils/nav-filter.js';
import { DsdElement, StyleSheet } from '@lessjs/core';
import '@lessjs/ui/less-layout';
import { posts } from 'virtual:less-blog-data';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .blog-list {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0;
      }
      .blog-item {
        display: block;
        padding: 1rem 1.25rem;
        margin-bottom: 0.5rem;
        border: 0.5px solid var(--border);
        border-radius: 4px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s, background 0.15s;
      }
      .blog-item:hover {
        border-color: var(--border-hover);
        background: var(--bg-surface);
      }
      .blog-item h2 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);
      }
      .blog-desc {
        margin: 0 0 0.25rem;
        font-size: 0.8125rem;
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
        margin-top: 0.5rem;
      }
      .blog-tag {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        color: var(--text-muted);
      }
      .new-badge {
        display: inline-block;
        font-size: 0.5rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        padding: 0.0625rem 0.3125rem;
        border-radius: 2px;
        background: var(--text-primary);
        color: var(--bg-base);
        vertical-align: middle;
        margin-left: 0.25rem;
      }
    `);

export class BlogIndexPage extends DsdElement {
  static override styles = [routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="${this._getLocale('zh')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterBlogNav(navSections))}'
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
        nav-items='${JSON.stringify(filterBlogNav(navSections))}'
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

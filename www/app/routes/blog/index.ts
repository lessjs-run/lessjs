/**
 * Blog Index Page — Data-driven rendering via virtual:less-blog-data
 */
export const meta = { section: 'History', label: 'Blog', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import { posts } from 'virtual:less-blog-data';

export class BlogIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-list { list-style: none; padding: 0; margin: 1.5rem 0; }
      .blog-item { display: block; padding: 1rem 1.25rem; margin-bottom: 0.5rem; border: 0.5px solid var(--less-border); border-radius: 4px; text-decoration: none; color: inherit; transition: border-color 0.15s, background 0.15s; }
      .blog-item:hover { border-color: var(--less-border-hover); background: var(--less-bg-surface); }
      .blog-item h2 { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 500; color: var(--less-text-primary); }
      .blog-desc { margin: 0 0 0.25rem; font-size: 0.8125rem; color: var(--less-text-tertiary); }
      .blog-date { font-size: 0.6875rem; color: var(--less-text-muted); }
      .blog-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.5rem; }
      .blog-tag { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.125rem 0.375rem; border-radius: 2px; background: var(--less-bg-surface); border: 0.5px solid var(--less-border); color: var(--less-text-muted); }
      .new-badge { display: inline-block; font-size: 0.5rem; font-weight: 700; letter-spacing: 0.1em; padding: 0.0625rem 0.3125rem; border-radius: 2px; background: var(--less-text-primary); color: var(--less-bg-base); vertical-align: middle; margin-left: 0.25rem; }
    `,
  ];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/blog">
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">LessJS 框架的设计思考、架构决策和发展路线。</p>
          <div class="blog-list">${posts.map((post, i) => {
            const tags = post.frontmatter.tags ?? [];
            return html`
              <a href="/blog/${post.slug}" class="blog-item">
                <h2>${post.frontmatter.title} ${i === 0 ? html`<span class="new-badge">NEW</span>` : ''}</h2>
                ${post.frontmatter.excerpt ? html`<p class="blog-desc">${post.frontmatter.excerpt}</p>` : ''}
                <span class="blog-date">${post.frontmatter.date}</span>
                ${tags.length > 0 ? html`<div class="blog-tags">${tags.map(tag => html`<span class="blog-tag">${tag}</span>`)}</div>` : ''}
              </a>`;
          })}</div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout locale="${this.locale || 'en'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/blog">
        <div class="container">
          <h1>Blog</h1>
          <p class="subtitle">Design thoughts, architecture decisions, and development roadmap for the LessJS framework.</p>
          <div class="blog-list">${posts.map((post, i) => {
            const tags = post.frontmatter.tags ?? [];
            return html`
              <a href="/en/blog/${post.slug}" class="blog-item">
                <h2>${post.frontmatter.title} ${i === 0 ? html`<span class="new-badge">NEW</span>` : ''}</h2>
                ${post.frontmatter.excerpt ? html`<p class="blog-desc">${post.frontmatter.excerpt}</p>` : ''}
                <span class="blog-date">${post.frontmatter.date}</span>
                ${tags.length > 0 ? html`<div class="blog-tags">${tags.map(tag => html`<span class="blog-tag">${tag}</span>`)}</div>` : ''}
              </a>`;
          })}</div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-blog-index', BlogIndexPage);
export default BlogIndexPage;
export const tagName = 'page-blog-index';

/**
 * Blog Post Page - Dynamic Route
 *
 * Renders individual blog posts from virtual:less-blog-data.
 * The `slug` param is set by LessJS dynamic routing: /blog/:slug
 * ADR 0018: Data comes from virtual module, not @lessjs/content module state.
 */
import { headerNav, navSections } from '@lessjs/content/nav';
import { filterBlogNav } from '../../utils/nav-filter.js';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import { getPostBySlug, posts } from '@lessjs/content/blog-data';

export const tagName = 'page-blog-slug';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

    .blog-back { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; display: inline-block; }
    .blog-date { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2rem; }
    .blog-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .blog-tag { font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.125rem 0.375rem; border-radius: 2px; background: var(--bg-surface); border: 0.5px solid var(--border); color: var(--text-muted); }
    .blog-content { font-size: 0.9375rem; line-height: 1.75; color: var(--text-secondary); }
    .blog-content h2 { margin-top: 2.5rem; color: var(--text-primary); font-size: 1.125rem; font-weight: 600; }
    .blog-content h3 { margin-top: 2rem; color: var(--text-primary); font-size: 1rem; font-weight: 600; }
    .blog-content p { margin: 0.75rem 0; }
    .blog-content ul, .blog-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
    .blog-content li { margin: 0.375rem 0; }
    .blog-content strong { color: var(--text-primary); }
    .blog-content code { background: var(--bg-code); padding: 0.125rem 0.375rem; border-radius: 2px; font-size: 0.8125rem; font-family: "SF Mono", monospace; }
    .blog-content pre { background: var(--bg-surface); border: 0.5px solid var(--border); border-radius: 4px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
    .blog-content pre code { background: none; padding: 0; font-size: 0.75rem; line-height: 1.6; }
    .blog-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8125rem; }
    .blog-content th, .blog-content td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 0.5px solid var(--border); }
    .blog-content th { background: var(--bg-surface); color: var(--text-muted); font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .blog-content a { color: var(--brand); text-decoration: none; }
    .blog-content a:hover { text-decoration: underline; }
    .blog-content hr { border: none; border-top: 0.5px solid var(--border); margin: 2rem 0; }
    .blog-content blockquote { border-left: 2px solid var(--brand); padding-left: 1rem; margin: 1rem 0; color: var(--text-muted); }
    .not-found { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .nav-row { margin-top: 3rem; }
  `,
);

export default class BlogPostPage extends DsdElement {
  slug = '';

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');
    const post = getPostBySlug(this.slug);
    const nav = filterBlogNav(navSections);
    if (!post) {
      return (
        <less-layout
          locale={loc}
          locales={JSON.stringify(['en', 'zh'])}
          navItems={JSON.stringify(nav)}
          headerNav={JSON.stringify(headerNav)}
          currentPath='/blog'
        >
          <div class='container'>
            <div class='not-found'>
              <h1>404</h1>
              <p>文章未找到: {this.slug}</p>
              <a href='/blog'>← 返回博客</a>
            </div>
          </div>
        </less-layout>
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
        navItems={JSON.stringify(nav)}
        headerNav={JSON.stringify(headerNav)}
        currentPath='/blog'
      >
        <div class='container'>
          <a href='/blog' class='blog-back'>← 博客</a>
          <h1>{post.frontmatter.title}</h1>
          <p class='subtitle'>{post.frontmatter.excerpt ?? ''}</p>
          {tags.length > 0
            ? (
              <div class='blog-tags'>
                {tags.map((tag: string) => <span key={tag} class='blog-tag'>{tag}</span>)}
              </div>
            )
            : null}
          <p class='blog-date'>{post.frontmatter.date}</p>
          <div class='blog-content' innerHTML={post.html}></div>
          <div class='nav-row'>
            <a href='/blog' class='nav-link'>← 返回博客</a>
          </div>
        </div>
      </less-layout>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');
    const post = getPostBySlug(this.slug);
    const nav = filterBlogNav(navSections);
    if (!post) {
      return (
        <less-layout
          locale={loc}
          locales={JSON.stringify(['en', 'zh'])}
          navItems={JSON.stringify(nav)}
          headerNav={JSON.stringify(headerNav)}
          currentPath='/en/blog'
        >
          <div class='container'>
            <div class='not-found'>
              <h1>404</h1>
              <p>Post not found: {this.slug}</p>
              <a href='/en/blog'>← Back to Blog</a>
            </div>
          </div>
        </less-layout>
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
        navItems={JSON.stringify(nav)}
        headerNav={JSON.stringify(headerNav)}
        currentPath='/en/blog'
      >
        <div class='container'>
          <a href='/blog' class='blog-back'>← Blog</a>
          <h1>{post.frontmatter.title}</h1>
          <p class='subtitle'>{post.frontmatter.excerpt ?? ''}</p>
          {tags.length > 0
            ? (
              <div class='blog-tags'>
                {tags.map((tag: string) => <span key={tag} class='blog-tag'>{tag}</span>)}
              </div>
            )
            : null}
          <p class='blog-date'>{post.frontmatter.date}</p>
          <div class='blog-content' innerHTML={post.html}></div>
          <div class='nav-row'>
            <a href='/blog' class='nav-link'>← Back to Blog</a>
          </div>
        </div>
      </less-layout>
    );
  }
}

customElements.define(tagName, BlogPostPage);

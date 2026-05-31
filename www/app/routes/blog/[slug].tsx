/**
 * Blog Post Page - Dynamic Route
 *
 * Renders individual blog posts from @lessjs/generated/blog-data.
 * The `slug` param is set by LessJS dynamic routing: /blog/:slug
 * Data comes from generated app data, not @lessjs/content module state.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import { getPostBySlug, posts } from '@lessjs/generated/blog-data';

export const tagName = 'page-blog-slug';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

    .blog-back { font-size: var(--font-size-0); color: var(--gray-6); margin-bottom: var(--size-2); display: inline-block; }
    .blog-date { font-size: var(--font-size-0); color: var(--gray-6); margin-bottom: var(--size-8); }
    .blog-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: var(--size-4); }
    .blog-tag { font-size: var(--font-size-00); font-weight: var(--font-weight-6); text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); padding: 0.125rem 0.375rem; border-radius: 2px; background: var(--gray-1); border: 0.5px solid var(--gray-3); color: var(--gray-6); }
    .blog-content { font-size: var(--font-size-3); line-height: var(--font-lineheight-4); color: var(--gray-7); }
    .blog-content h2 { margin-top: var(--size-10); color: var(--gray-10); font-size: 1.125rem; font-weight: var(--font-weight-6); }
    .blog-content h3 { margin-top: var(--size-8); color: var(--gray-10); font-size: var(--font-size-4); font-weight: var(--font-weight-6); }
    .blog-content p { margin: var(--size-3) 0; }
    .blog-content ul, .blog-content ol { padding-left: var(--size-6); margin: var(--size-3) 0; }
    .blog-content li { margin: 0.375rem 0; }
    .blog-content strong { color: var(--gray-10); }
    .blog-content code { background: var(--gray-2); padding: 0.125rem 0.375rem; border-radius: 2px; font-size: var(--font-size-1); font-family: var(--font-mono); }
    .blog-content pre { background: var(--gray-1); border: 0.5px solid var(--gray-3); border-radius: var(--radius-1); padding: var(--size-4); overflow-x: auto; margin: var(--size-4) 0; }
    .blog-content pre code { background: none; padding: 0; font-size: var(--font-size-0); line-height: 1.6; }
    .blog-content table { width: 100%; border-collapse: collapse; margin: var(--size-4) 0; font-size: var(--font-size-1); }
    .blog-content th, .blog-content td { padding: var(--size-2) var(--size-3); text-align: left; border-bottom: 0.5px solid var(--gray-3); }
    .blog-content th { background: var(--gray-1); color: var(--gray-6); font-weight: var(--font-weight-6); font-size: 0.6875rem; text-transform: uppercase; letter-spacing: var(--font-letterspacing-2); }
    .blog-content a { color: var(--indigo-5); text-decoration: none; }
    .blog-content a:hover { text-decoration: underline; }
    .blog-content hr { border: none; border-top: 0.5px solid var(--gray-3); margin: var(--size-8) 0; }
    .blog-content blockquote { border-left: 2px solid var(--indigo-5); padding-left: var(--size-4); margin: var(--size-4) 0; color: var(--gray-6); }
    .not-found { text-align: center; padding: var(--size-12) var(--size-4); color: var(--gray-6); }
    .nav-row { margin-top: var(--size-11); }
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

    if (!post) {
      return (
        
          <div class='container'>
            <div class='not-found'>
              <h1>404</h1>
              <p>文章未找到: {this.slug}</p>
              <a href='/blog'>← 返回博客</a>
            </div>
          </div>
        
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      
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
      
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');
    const post = getPostBySlug(this.slug);

    if (!post) {
      return (
        
          <div class='container'>
            <div class='not-found'>
              <h1>404</h1>
              <p>Post not found: {this.slug}</p>
              <a href='/en/blog'>← Back to Blog</a>
            </div>
          </div>
        
      );
    }
    const tags = post.frontmatter.tags ?? [];
    return (
      
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
      
    );
  }
}

customElements.define(tagName, BlogPostPage);

/**
 * Blog System — @lessjs/blog package design
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class BlogSystemPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
      }
      h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 1.5rem 0 0.5rem;
        color: var(--less-text-primary);
      }
      h3 {
        font-size: 0.875rem;
        font-weight: 500;
        margin: 1rem 0 0.25rem;
        color: var(--less-text-secondary);
      }
      p {
        font-size: 0.8125rem;
        line-height: 1.7;
        color: var(--less-text-secondary);
        margin: 0 0 0.75rem;
      }
      .code-block {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--less-text-secondary);
        white-space: pre;
      }
      ul {
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--less-text-secondary);
        margin: 0.5rem 0 1rem;
        padding-left: 1.25rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/guide/blog-system">
        <div class="container">
          <p class="adr-meta">ADR 0004 · 2026-04-30 · Draft · after v0.8.0 target</p>
          <h1>@lessjs/blog — Standalone SSG Blog Package</h1>

          <h2>Motivation</h2>
          <p>
            The docs site currently has two hardcoded blog pages — not a reusable system. Users need a
            one-line solution: drop in <code>.md</code> files, get automatic listing, pagination, RSS, and
            tags. Like VitePress, but as a LessJS plugin.
          </p>

          <h2>User experience</h2>
          <div class="code-block">
            // vite.config.ts import { kiss } from '@lessjs/core' import { kissBlog } from '@lessjs/blog'
            export default defineConfig({ plugins: [ kiss(), kissBlog({ dir: 'content/blog', // .md files
            go here title: 'My Blog', postsPerPage: 10, }), ], })
          </div>

          <div class="code-block">
            <!-- content/blog/hello-world.md -->
            --- title: Hello World date: 2026-05-01 tags: [kiss, meta] --- This is my first post.
          </div>

          <h2>Generated routes</h2>
          <ul>
            <li><code>/blog/</code> — Post listing (paginated, newest first)</li>
            <li><code>/blog/hello-world</code> — Individual post</li>
            <li><code>/blog/page/2</code> — Page 2</li>
            <li><code>/blog/tags/kiss</code> — Filter by tag</li>
            <li><code>/blog/feed.xml</code> — RSS / Atom feed</li>
          </ul>

          <h2>Constraint</h2>
          <p>
            The blog package should not require Lit. The first useful version should work as a plain SSG
            plugin: Markdown in, static routes + feed out. Plain blog pages should ship no page-level
            framework runtime; interactive widgets remain islands.
          </p>
          <p>
            The <code>.kiss</code> compiler is an ideal future template backend, not a release blocker.
            When v0.10.0 alpha exists, blog templates can gain compiler-backed Custom Elements.
          </p>

          <h2>Implementation order</h2>
          <ol style="font-size:0.8125rem;line-height:1.8;color:var(--less-text-secondary)">
            <li>v0.8.0 stabilizes route/action/serverless conventions</li>
            <li><code>@lessjs/blog</code> ships as a plain SSG plugin first</li>
            <li><code>.kiss</code> compiler support is added after v0.10.0 alpha</li>
            <li>LessJS docs site dogfoods it and replaces current hardcoded blog routes</li>
          </ol>

          <p>详见 <code>docs/decisions/0004-blog-system.md</code></p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">&larr; PWA Support</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-blog-system', BlogSystemPage);
export default BlogSystemPage;
export const tagName = 'page-blog-system';

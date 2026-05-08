/**
 * Blog System — @lessjs/blog package guide
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class BlogSystemPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta {
        font-size: 0.75rem;
        color: var(--less-text-muted);
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
          <p class="adr-meta">ADR 0004 · 2026-04-30 · Shipped in v0.8.0</p>
          <h1>@lessjs/blog — Markdown Blog Plugin</h1>

          <h2>Quick Start</h2>
          <p>
            Drop <code>.md</code> files into a content directory, get automatic
            blog listing and post pages. One Vite plugin call:
          </p>
          <code-block><pre><code>// vite.config.ts
import { less } from '@lessjs/core';
import { lessBlog } from '@lessjs/blog';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    less(),
    lessBlog({
      contentDir: resolve(__dirname, 'content/blog'),
      basePath: '/blog',
    }),
  ],
});</code></pre></code-block>

          <h2>Markdown Files</h2>
          <p>
            Each <code>.md</code> file in the content directory becomes a blog post.
            Frontmatter supports <code>title</code>, <code>date</code>, <code>tags</code>,
            <code>draft</code>, and <code>excerpt</code>:
          </p>
          <code-block><pre><code><!-- content/blog/2026-05-08-hello-world.md -->
---
title: 'Hello World'
date: '2026-05-08'
tags: ['lessjs', 'meta']
excerpt: 'First post on the new blog system.'
---

This is my first post.</code></pre></code-block>

          <h2>Generated Routes</h2>
          <ul>
            <li><code>/blog/</code> — Post listing (newest first)</li>
            <li><code>/blog/hello-world</code> — Individual post</li>
          </ul>

          <h2>API Reference</h2>
          <h3>lessBlog(options)</h3>
          <p>
            Vite plugin that integrates blog into the build pipeline. Options:
          </p>
          <ul>
            <li><code>contentDir</code> — Path to <code>.md</code> files (required)</li>
            <li><code>basePath</code> — URL prefix for blog routes (default: <code>/blog</code>)</li>
            <li><code>markdown</code> — Custom markdown renderer function (optional)</li>
          </ul>

          <h3>getPosts()</h3>
          <p>
            Returns all non-draft posts sorted by date (newest first).
            Use in route components to render the listing page.
          </p>

          <h3>getPostBySlug(slug)</h3>
          <p>
            Returns a single post by its slug (filename without date prefix and <code>.md</code>).
            Returns <code>undefined</code> if not found or if the post is a draft.
          </p>

          <h3>parseMarkdownFile(content, filename)</h3>
          <p>
            Parses a markdown file with gray-matter frontmatter.
            Returns <code>{ frontmatter, content, html, slug }</code>.
          </p>

          <h3>slugFromFilename(filename)</h3>
          <p>
            Strips date prefix from filenames: <code>2026-05-08-my-post.md</code>
            → <code>my-post</code>.
          </p>

          <h2>Constraint</h2>
          <p>
            The blog package does not require Lit. It works as a plain SSG plugin:
            Markdown in, static routes out. Plain blog pages ship no page-level
            framework runtime; interactive widgets remain islands.
          </p>
          <p>
            v0.8 scope: <code>.md → routes → list/post pages</code>.
            No MDX, comments, pagination, or tags system in this version.
          </p>

          <p>详见 <code>docs/decisions/0004-blog-system.md</code></p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/error-handling" class="nav-link">&larr; Error Handling</a>
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

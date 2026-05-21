/**
 * ADR Detail Page — Dynamic route from virtual:less-blog-data
 *
 * Renders individual ADR pages (posts with type === 'adr').
 * The slug is derived from the ADR filename (e.g. 0001-keep-hono-vite-dev-server).
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import { posts } from 'virtual:less-blog-data';

export const tagName = 'page-decision-slug';

/** Extract status from ADR content: ## Status\n\n**TEXT** */
function extractStatus(content: string): string {
  const m = content.match(/##\s*Status(?:us)?[\s\S]*?\*\*([^*]+)\*\*/);
  return m?.[1]?.trim() || '';
}

/** Extract ADR number from slug */
function adrId(slug: string): string {
  const m = slug.match(/^(\d{4})/);
  return m ? m[1] : slug.slice(0, 4);
}

export function getStaticPaths(): Array<Record<string, string>> {
  return posts
    .filter((p) => p.frontmatter.type === 'adr')
    .map((p) => ({ slug: p.slug }));
}

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .decision-meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin: 0.75rem 0 2rem;
        color: var(--text-muted);
        font-size: 0.75rem;
      }
      .badge {
        border: 0.5px solid var(--border);
        border-radius: 3px;
        padding: 0.125rem 0.375rem;
        color: var(--text-secondary);
      }
      .markdown h1 {
        display: none;
      }
      .markdown h4 {
        margin: 1rem 0 0.5rem;
        color: var(--text-primary);
        font-size: 0.8125rem;
      }
      .markdown blockquote {
        margin: 1rem 0;
        padding: 0.75rem 1rem;
        border-left: 2px solid var(--border-hover);
        background: var(--bg-surface);
        color: var(--text-secondary);
      }
      .markdown hr {
        border: 0;
        border-top: 0.5px solid var(--border);
        margin: 2rem 0;
      }
      .markdown {
        font-size: 0.9375rem;
        line-height: 1.75;
        color: var(--text-secondary);
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .markdown h2 {
        margin-top: 2.5rem;
        color: var(--text-primary);
        font-size: 1.125rem;
        font-weight: 600;
      }
      .markdown h3 {
        margin-top: 2rem;
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
      }
      .markdown p {
        margin: 0.75rem 0;
      }
      .markdown ul, .markdown ol {
        padding-left: 1.5rem;
        margin: 0.75rem 0;
      }
      .markdown li {
        margin: 0.375rem 0;
      }
      .markdown strong {
        color: var(--text-primary);
      }
      .markdown code {
        background: var(--bg-code);
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        font-size: 0.8125rem;
        font-family: "SF Mono", monospace;
        overflow-wrap: anywhere;
      }
      .markdown pre {
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        padding: 1rem;
        overflow-x: auto;
        margin: 1rem 0;
      }
      .markdown pre code {
        background: none;
        padding: 0;
        font-size: 0.75rem;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      h1 {
        overflow-wrap: anywhere;
      }
      .markdown table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.8125rem;
      }
      .markdown th, .markdown td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 0.5px solid var(--border);
      }
      .markdown th {
        background: var(--bg-surface);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .markdown a {
        color: var(--brand);
        text-decoration: none;
      }
      .markdown a:hover {
        text-decoration: underline;
      }
      .not-found {
        text-align: center;
        padding: 4rem 1rem;
        color: var(--text-muted);
      }
    `);

export default class DecisionSlugPage extends DsdElement {
  slug = '';

  static override styles = [routeSheet];

  override render() {
    const adrs = posts.filter((p) => p.frontmatter.type === 'adr');
    const post = adrs.find((p) => p.slug === this.slug);
    if (!post) {
      return `
        <less-layout
          locale="${this.getAttribute('locale') || 'zh'}"
          locales='${JSON.stringify(['en', 'zh'])}'
          nav-items='${JSON.stringify(navSections)}'
          header-nav='${JSON.stringify(headerNav)}'
          current-path="/decisions"
        >
          <div class="container">
            <div class="not-found">
              <h1>404</h1>
              <p>ADR not found: ${this.slug}</p><a href="/decisions">← Back to Decisions</a>
            </div>
          </div>
        </less-layout>
      `;
    }
    const status = extractStatus(post.content);
    return `
      <less-layout
        locale="${this.getAttribute('locale') || 'zh'}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/decisions/${this.slug}"
      >
        <div class="container">
          <h1>${adrId(post.slug)}: ${post.frontmatter.title}</h1>
          ${
      post.frontmatter.excerpt
        ? `
              <p class="subtitle">${post.frontmatter.excerpt}</p>
            `
        : ''
    } ${
      status
        ? `
              <div class="decision-meta"><span class="badge">${status}</span></div>
            `
        : ''
    }
          <div class="markdown">${unsafeHTML(post.html)}</div>
          <div class="nav-row">
            <a href="/decisions" class="nav-link">&larr; Decisions</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-decision-slug', DecisionSlugPage);
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

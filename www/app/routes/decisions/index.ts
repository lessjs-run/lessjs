/**
 * ADR Index Page — Dynamic from virtual:less-blog-data
 *
 * Displays all ADRs (posts with type === 'adr') in a card layout.
 */
export const meta = { section: 'Roadmap & Decisions', label: 'Architecture Decisions', order: 20 };
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import { posts } from 'virtual:less-blog-data';
import '@lessjs/ui/less-layout';

/** Extract status from ADR content: ## Status\n\n**TEXT** */
function extractStatus(content: string): string {
  const m = content.match(/##\s*Status(?:us)?[\s\S]*?\*\*([^*]+)\*\*/);
  return m?.[1]?.trim() || 'Draft';
}

/** Create a slug/id/path from the ADR filename slug */
function adrId(slug: string): string {
  const m = slug.match(/^(\d{4})/);
  return m ? m[1] : slug.slice(0, 4);
}

export class DecisionsIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .decision-list { display: grid; gap: 0.75rem; margin: 1.5rem 0 2rem; }
      .decision-link { display: block; padding: 1rem; border: 0.5px solid var(--less-border); border-radius: 6px; text-decoration: none; background: var(--less-bg-surface); }
      .decision-link:hover { border-color: var(--less-border-hover); }
      .decision-title { display: flex; justify-content: space-between; gap: 1rem; color: var(--less-text-primary); font-size: 0.9375rem; font-weight: 500; }
      .decision-status { color: var(--less-text-muted); font-size: 0.75rem; white-space: nowrap; }
      .decision-summary { margin-top: 0.5rem; color: var(--less-text-tertiary); font-size: 0.8125rem; line-height: 1.6; }
    `,
  ];

  override render() {
    const adrs = posts.filter(p => p.frontmatter.type === 'adr');
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/decisions">
        <div class="container">
          <h1>Architecture Decisions</h1>
          <p class="subtitle">ADR documents published from the @lessjs/content blog pipeline.</p>
          <div class="decision-list">
            ${adrs.map(p => html`
              <a class="decision-link" href="/decisions/${p.slug}">
                <div class="decision-title">
                  <span>${adrId(p.slug)}: ${p.frontmatter.title}</span>
                  <span class="decision-status">${extractStatus(p.content)}</span>
                </div>
                <div class="decision-summary">${p.frontmatter.excerpt ?? ''}</div>
              </a>
            `)}
          </div>
          <div class="nav-row">
            <a href="/guide/content-system" class="nav-link">&larr; Content System</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-decisions-index', DecisionsIndexPage);
export default DecisionsIndexPage;
export const tagName = 'page-decisions-index';

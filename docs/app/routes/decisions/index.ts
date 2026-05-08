export const meta = { section: 'Roadmap & Decisions', label: 'Architecture Decisions', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import { DECISIONS } from '../../decision-data.js';
import '@lessjs/ui/less-layout';

export class DecisionsIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .decision-list {
        display: grid;
        gap: 0.75rem;
        margin: 1.5rem 0 2rem;
      }
      .decision-link {
        display: block;
        padding: 1rem;
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        text-decoration: none;
        background: var(--less-bg-surface);
      }
      .decision-link:hover {
        border-color: var(--less-border-hover);
      }
      .decision-title {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        color: var(--less-text-primary);
        font-size: 0.9375rem;
        font-weight: 500;
      }
      .decision-status {
        color: var(--less-text-muted);
        font-size: 0.75rem;
        white-space: nowrap;
      }
      .decision-summary {
        margin-top: 0.5rem;
        color: var(--less-text-tertiary);
        font-size: 0.8125rem;
        line-height: 1.6;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/decisions">
        <div class="container">
          <h1>Architecture Decisions</h1>
          <p class="subtitle">
            Source-controlled ADRs from <span class="inline-code">docs/decisions</span>, rendered directly
            into the docs site.
          </p>

          <div class="decision-list">
            ${DECISIONS.map((decision) =>
              html`
                <a class="decision-link" href="${decision.path}">
                  <div class="decision-title">
                    <span>${decision.id}: ${decision.title}</span>
                    <span class="decision-status">${decision.status}</span>
                  </div>
                  <div class="decision-summary">${decision.summary}</div>
                </a>
              `
            )}
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

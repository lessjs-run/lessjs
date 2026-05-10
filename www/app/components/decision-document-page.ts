import { css, html, LitElement } from 'lit';
import { pageStyles } from './page-styles.js';
import { renderMarkdown } from '../lib/markdown.js';
import type { DecisionDoc } from '../decision-data.js';
import '@lessjs/ui/less-layout';

export abstract class DecisionDocumentPage extends LitElement {
  protected abstract decision: DecisionDoc;

  static override styles = [
    pageStyles,
    css`
      .decision-meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin: 0.75rem 0 2rem;
        color: var(--less-text-muted);
        font-size: 0.75rem;
      }
      .badge {
        border: 0.5px solid var(--less-border);
        border-radius: 3px;
        padding: 0.125rem 0.375rem;
        color: var(--less-text-secondary);
      }
      .markdown h1 {
        display: none;
      }
      .markdown h4 {
        margin: 1rem 0 0.5rem;
        color: var(--less-text-primary);
        font-size: 0.8125rem;
      }
      .markdown blockquote {
        margin: 1rem 0;
        padding: 0.75rem 1rem;
        border-left: 2px solid var(--less-border-hover);
        background: var(--less-bg-surface);
        color: var(--less-text-secondary);
      }
      .markdown hr {
        border: 0;
        border-top: 0.5px solid var(--less-border);
        margin: 2rem 0;
      }
    `,
  ];

  override render() {
    const decision = this.decision;
    return html`
      <less-layout current-path="${decision.path}" locale="zh" .locales="${['en', 'zh']}">
        <div class="container">
          <h1>${decision.id}: ${decision.title}</h1>
          <p class="subtitle">${decision.summary}</p>
          <div class="decision-meta">
            <span class="badge">${decision.status}</span>
            <span>Source: www/decisions/${decision.id}</span>
          </div>
          <div class="markdown">${renderMarkdown(decision.source)}</div>
          <div class="nav-row">
            <a href="/decisions" class="nav-link">&larr; Decisions</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

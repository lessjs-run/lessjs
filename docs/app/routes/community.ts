/**
 * @lessjs/docs - Community page
 */

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'community-page';

export const meta = { section: 'Roadmap & Decisions', label: 'Community', order: 15 };

export default class CommunityPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .links {
        margin-top: 1.5rem;
      }
      .link-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        margin-bottom: 0.75rem;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s, background 0.15s;
      }
      .link-row:hover {
        border-color: var(--less-border-hover);
        background: var(--less-bg-surface);
      }
      .link-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--less-text-primary);
      }
      .link-desc {
        font-size: 0.8125rem;
        color: var(--less-text-tertiary);
        margin-top: 0.125rem;
      }
      .external::after {
        content: " ↗";
        font-size: 0.75rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container">
          <h1>Community</h1>
          <p class="subtitle">
            LessJS is open-source and community-driven. Get involved:
          </p>

          <div class="links">
            <a
              class="link-row"
              href="https://github.com/lessjs-run/lessjs"
              target="_blank"
              rel="noopener"
            >
              <div>
                <div class="link-label external">GitHub</div>
                <div class="link-desc">Source code, issues, discussions</div>
              </div>
            </a>

            <a
              class="link-row"
              href="https://github.com/lessjs-run/lessjs/issues"
              target="_blank"
              rel="noopener"
            >
              <div>
                <div class="link-label external">Bug Reports & Feature Requests</div>
                <div class="link-desc">Open an issue on GitHub</div>
              </div>
            </a>

            <a class="link-row" href="https://jsr.io/@lessjs/core" target="_blank" rel="noopener">
              <div>
                <div class="link-label external">JSR Package</div>
                <div class="link-desc">Published packages on jsr.io</div>
              </div>
            </a>

            <a
              class="link-row"
              href="https://github.com/lessjs-run/lessjs/discussions"
              target="_blank"
              rel="noopener"
            >
              <div>
                <div class="link-label external">GitHub Discussions</div>
                <div class="link-desc">Ask questions, share projects, discuss ideas</div>
              </div>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, CommunityPage);

/**
 * 404 Not Found Page — with search and helpful links
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

const POPULAR_LINKS = [
  { href: '/guide/getting-started', label: 'Getting Started' },
  { href: '/guide/architecture', label: 'Architecture Overview' },
  { href: '/guide/routing', label: 'Routing' },
  { href: '/guide/dsd', label: 'DSD Rendering' },
  { href: '/guide/islands', label: 'Island Upgrade' },
  { href: '/guide/ssg', label: 'Rendering & SSG' },
  { href: '/ui', label: 'Design System (UI)' },
  { href: '/roadmap', label: 'Roadmap' },
];

export class NotFoundPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      :host {
        display: block;
      }
      .container {
        max-width: 560px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        text-align: center;
      }
      .error-code {
        font-size: 4rem;
        font-weight: 800;
        letter-spacing: -0.06em;
        color: var(--less-text-primary);
        margin: 0 0 0.25rem;
        line-height: 1;
      }
      .error-message {
        color: var(--less-text-tertiary);
        font-size: 0.9375rem;
        margin: 0 0 1.5rem;
      }
      .search-box {
        width: 100%;
        max-width: 400px;
        padding: 0.625rem 0.875rem;
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        background: var(--less-bg-surface);
        color: var(--less-text-primary);
        font-size: 0.875rem;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .search-box:focus {
        border-color: var(--less-text-primary);
      }
      .search-box::placeholder {
        color: var(--less-text-tertiary);
      }
      .links {
        margin-top: 2rem;
      }
      .links-title {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--less-text-tertiary);
        margin-bottom: 0.75rem;
      }
      .link-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.5rem;
        text-align: left;
      }
      .link-grid a {
        display: block;
        padding: 0.5rem 0.75rem;
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        color: var(--less-text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s, background 0.15s;
      }
      .link-grid a:hover {
        border-color: var(--less-border-hover);
        background: var(--less-bg-surface);
      }
      .home-link {
        display: inline-block;
        margin-top: 2rem;
        padding: 0.5rem 1.25rem;
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        color: var(--less-text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s;
      }
      .home-link:hover {
        border-color: var(--less-text-primary);
      }
    `,
  ];

  private _onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value.trim();
      if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
    }
  }

  override render() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container">
          <div class="error-code">404</div>
          <p class="error-message">This page does not exist — or has moved to a different route.</p>

          <input
            class="search-box"
            type="text"
            placeholder="Search documentation..."
            @keydown="${this._onSearchKeydown}"
            aria-label="Search documentation"
          >

          <div class="links">
            <div class="links-title">Popular Pages</div>
            <div class="link-grid">
              ${POPULAR_LINKS.map(
                (l) =>
                  html`
                    <a href="${l.href}">${l.label}</a>
                  `,
              )}
            </div>
          </div>

          <a href="/" class="home-link">&larr; Back to home</a>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-not-found', NotFoundPage);
export default NotFoundPage;
export const tagName = 'page-not-found';

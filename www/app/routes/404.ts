/**
 * 404 Not Found Page - with search, helpful links, and old URL redirects
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../components/page-styles.js';
const pageSheet = new StyleSheet();
pageSheet.replaceSync(pageStyles);
import '@lessjs/ui/less-layout';
import '../islands/less-search.js';

const POPULAR_LINKS = [
  { href: '/guide/getting-started', label: 'Getting Started' },
  { href: '/engine/architecture', label: 'Architecture Overview' },
  { href: '/guide/routing', label: 'Routing' },
  { href: '/engine/dsd', label: 'DSD Rendering' },
  { href: '/engine/islands', label: 'Island Upgrade' },
  { href: '/guide/ssg', label: 'Rendering & SSG' },
  { href: '/engine/design-system', label: 'Design System (UI)' },
  { href: '/roadmap', label: 'Roadmap' },
];

/** Mapping of old URLs to new URLs for client-side redirects. */
const REDIRECT_MAP: Record<string, string> = {
  '/guide/architecture': '/engine/architecture',
  '/guide/dsd': '/engine/dsd',
  '/guide/islands': '/engine/islands',
  '/guide/islands-deep': '/engine/islands-deep',
  '/guide/package-compatibility': '/engine/package-compatibility',
  '/guide/standards-registry': '/engine/standards-registry',
  '/guide/comparison': '/engine/comparison',
  '/reference/core': '/engine/reference/core',
  '/ui': '/engine/design-system',
  '/styling/web-awesome': '/engine/design-system',
  '/community': '/',
};

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
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
        color: var(--text-primary);
        margin: 0 0 0.25rem;
        line-height: 1;
      }
      .error-message {
        color: var(--text-muted);
        font-size: 0.9375rem;
        margin: 0 0 1.5rem;
      }
      .search-box {
        width: 100%;
        max-width: 400px;
        padding: 0.625rem 0.875rem;
        border: 0.5px solid var(--border);
        border-radius: 6px;
        background: var(--bg-surface);
        color: var(--text-primary);
        font-size: 0.875rem;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .search-box:focus {
        border-color: var(--text-primary);
      }
      .search-box::placeholder {
        color: var(--text-muted);
      }
      .links {
        margin-top: 2rem;
      }
      .links-title {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
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
        border: 0.5px solid var(--border);
        border-radius: 4px;
        color: var(--text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s, background 0.15s;
      }
      .link-grid a:hover {
        border-color: var(--border-hover);
        background: var(--bg-surface);
      }
      .home-link {
        display: inline-block;
        margin-top: 2rem;
        padding: 0.5rem 1.25rem;
        border: 0.5px solid var(--border);
        border-radius: 4px;
        color: var(--text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s;
      }
      .home-link:hover {
        border-color: var(--text-primary);
      }
    `);

export class NotFoundPage extends DsdElement {
  static override styles = [routeSheet];

  private _onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value.trim();
      if (q) globalThis.location.href = `/search?q=${encodeURIComponent(q)}`;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    // Check if the current path matches an old URL that should redirect
    const pathname = globalThis.location?.pathname || '';
    const newPath = REDIRECT_MAP[pathname];
    if (newPath) {
      globalThis.location.replace(newPath);
    }
  }

  override render() {
    return `
      <less-layout
        locale="en"
        locales='${JSON.stringify(['en'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        home
      >
        <less-search slot="header-actions"></less-search>
        <div class="container">
          <div class="error-code">404</div>
          <p class="error-message">This page does not exist - or has moved to a different route.</p>

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
              ${
      POPULAR_LINKS.map(
        (l) => `
                    <a href="${l.href}">${l.label}</a>
                  `,
      )
    }
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

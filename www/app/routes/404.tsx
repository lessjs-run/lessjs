/**
 * 404 Not Found Page - with search, helpful links, and old URL redirects
 */
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '../islands/less-search.tsx';

const POPULAR_LINKS = [
  { href: '/guide/getting-started', label: 'Getting Started' },
  { href: '/guide/core-concepts', label: 'Core Concepts' },
  { href: '/architecture/dsd', label: 'DSD Rendering' },
  { href: '/api/reference', label: 'API Reference' },
  { href: '/architecture/architecture', label: 'Architecture' },
  { href: '/architecture/comparison', label: 'Framework Comparison' },
  { href: '/roadmap', label: 'Roadmap' },
];

/** Mapping of old URLs to new URLs for client-side redirects. */
const REDIRECT_MAP: Record<string, string> = {
  '/engine/architecture': '/architecture/architecture',
  '/engine/dsd': '/architecture/dsd',
  '/engine/islands': '/architecture/islands',
  '/engine/islands-deep': '/architecture/islands-deep',
  '/engine/design-system': '/architecture/design-system',
  '/engine/comparison': '/architecture/comparison',
  '/engine/package-compatibility': '/architecture/package-compatibility',
  '/engine/standards-registry': '/architecture/standards-registry',
  '/engine/reference/core': '/api/reference',
  '/guide/migration-v0.24': '/guide/getting-started',
  '/guide/positioning': '/architecture/architecture',
  '/guide/rpc': '/api/reference',
  '/guide/security-middleware': '/guide/error-handling',
  '/guide/content-system': '/guide/routing-and-data',
  '/guide/pwa': '/guide/deployment',
  '/examples': '/architecture/comparison',
  '/components': '/architecture/design-system',
  '/decisions': '/blog',
  '/zh/decisions': '/blog',
};

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .container { max-width: 700px; margin: 4rem auto; text-align: center; }
  h1 { font-size: 4rem; font-weight: 700; color: var(--text-primary); margin: 0; }
  p { color: var(--text-muted); font-size: 1rem; margin: 1rem 0 2rem; }
  .links { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
  .links a {
    padding: 0.5rem 1rem;
    border: 0.5px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.8125rem;
  }
  .links a:hover { border-color: var(--border-hover); color: var(--text-primary); }
`);

export default class Page404 extends DsdElement {
  static styles = [openPropsTokenSheet, styles];
  override render() {
    return `
      <div class="container">
        <h1>404</h1>
        <p>Page not found. Here are some helpful links:</p>
        <div class="links">
          ${POPULAR_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('\n')}
        </div>
      </div>
    `;
  }
}

customElements.define('page-404', Page404);
export const tagName = 'page-404';

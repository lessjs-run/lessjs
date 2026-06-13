/**
 * 404 Not Found Page - with search, helpful links, and old URL redirects
 */
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/core/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import '../islands/open-search.tsx';

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
`);

export default class Page404 extends DsdElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet, styles];
  override render() {
    return (
      <div class='container text-center' style='max-width:700px;margin:var(--size-12) auto;'>
        <h1 style='font-size:4rem;font-weight:var(--font-weight-7);color:var(--gray-10);margin:0;'>404</h1>
        <p style='color:var(--gray-6);font-size:var(--font-size-4);margin:var(--size-4) 0 var(--size-8);'>Page not found. Here are some helpful links:</p>
        <div class='flex flex-wrap justify-center gap-3'>
          {POPULAR_LINKS.map((l) => <a href={l.href} class='btn btn-ghost btn-sm'>{l.label}</a>)}
        </div>
      </div>
    );
  }
}

customElements.define('page-404', Page404);
export const tagName = 'page-404';

/**
 * Fixture: Local island with less.ssr = false
 *
 * This component explicitly opts out of SSR by exporting
 * `less = { ssr: false }`. The SSR admission plan should
 * place its tag into `clientOnlyTags`.
 */

export const less = { ssr: false, dsd: false, hydrate: 'lazy' };

export default class LocalSsrFalse extends HTMLElement {
  connectedCallback() {
    this.textContent = 'I am client-only';
  }
}

export const tagName = 'local-ssr-false';

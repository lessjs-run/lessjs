/**
 * Fixture: Local island with less.ssr = false
 *
 * This component explicitly opts out of SSR by exporting
 * `less = { ssr: false }`. The SSR admission plan should
 * place its tag into `clientOnlyTags`.
 *
 * Note: We don't extend HTMLElement here because Deno doesn't have
 * DOM globals. The class is just a placeholder for metadata export.
 */

export const less = { ssr: false, dsd: false, hydrate: 'lazy' };

// eslint-disable-next-line @typescript-eslint/no-empty-class-definition
export default class LocalSsrFalse {
  // Placeholder - in browser this would extend HTMLElement
  textContent: string | null = null;
  connectedCallback?(): void;
}

export const tagName = 'local-ssr-false';

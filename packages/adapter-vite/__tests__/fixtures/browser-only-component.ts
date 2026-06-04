/**
 * Fixture: Browser-dependent mock component
 *
 * This module exports metadata for a browser-only component.
 * In a real scenario, this component would fail to import in SSR
 * because it uses window/document at top level.
 * For testing, we export the metadata without top-level errors.
 *
 * Note: We don't extend HTMLElement here because Deno doesn't have
 * DOM globals. The class is just a placeholder for metadata export.
 */

export const openElement = { ssr: false, dsd: false, hydrate: 'idle' };

// eslint-disable-next-line @typescript-eslint/no-empty-class-definition
export default class BrowserOnlyComponent {
  // Placeholder - in browser this would extend HTMLElement
  textContent: string | null = null;
  connectedCallback?(): void;
}

export const tagName = 'browser-only-component';

/**
 * Fixture: Browser-dependent mock component
 *
 * This module throws when imported in SSR (non-DOM environment).
 * It simulates a browser-only package that cannot be imported during
 * SSR discovery. The scanner should catch this and skip the package.
 */

// This condition is true in SSR (Node/Deno) and false in browser
if (typeof window === 'undefined' && typeof document === 'undefined') {
  throw new Error(
    '[Fixture] browser-only-component cannot be imported in SSR: ' +
      'window is not defined',
  );
}

export default class BrowserOnlyComponent extends HTMLElement {
  connectedCallback() {
    this.textContent = 'I need the browser!';
  }
}

export const tagName = 'browser-only-component';

/**
 * SSR Polyfills for browser-only APIs.
 *
 * Dependency order: CSSStyleSheet (Lit internals) → HTMLElement (self-contained class stub)
 * → customElements (web component registration). This must load BEFORE any Lit module.
 *
 * ADR-0044: SSR polyfill strategy — browser globals in Deno SSR runtime.
 */

/**
 * Generates a polyfill banner string for the SSR entry.
 *
 * This banner must be prepended to the SSR entry module so that
 * browser-only globals (CSSStyleSheet, HTMLElement, customElements)
 * are available before any Lit or web component module is evaluated.
 *
 * @returns A JavaScript module snippet as a string.
 */
export function generateSsrPolyfillBanner(): string {
  return `\
// SSR polyfill: Lit references CSSStyleSheet in its internals.
// This must load before any Lit module is evaluated.
import { StyleSheet } from '@lessjs/core';
if (typeof globalThis.CSSStyleSheet === 'undefined') {
  globalThis.CSSStyleSheet = class {
    replaceSync(_css) {}
    get cssRules() { return []; }
  };
}

// ADR-0044: HTMLElement polyfill (self-contained, no external import)
if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class HTMLElement {};
}

// ADR-0044: customElements polyfill for SSR environment
// Web components call customElements.define() at module top-level.
// Node.js/Deno do not provide customElements - we provide a no-op shim.
if (typeof globalThis.customElements === 'undefined') {
  globalThis.customElements = {
    define(_name, _ctor, _options) {},
    get(_name) { return undefined; },
    whenDefined(_name) { return Promise.resolve(); },
    upgrade(_root) {},
  };
}
`;
}

/**
 * KISS runtime shim — built-in, auto-injected by kiss() plugin.
 *
 * v0.5.0: Dual runtime — exports both KissElement (zero-runtime) and Lit (optional).
 *
 * The kiss() plugin resolves `@kissjs/core` imports to this shim automatically,
 * preventing build-time code (node:fs, Vite plugins) from leaking into bundles.
 */

// --- KissElement (zero-runtime, always available) ---
export { KissElement, html, css, signal, computed, effect } from './kiss-element.js';
export type { ReactiveController, ReactiveControllerHost } from './kiss-element.js';

export { renderDSD, renderDSDByName } from './render-dsd.js';

export { Hono } from 'hono';

// SSR runtime — wrapInDocument has no Node.js deps, safe to re-export
export { wrapInDocument } from './ssr-handler.js';

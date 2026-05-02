/**
 * Runtime shim for @kissjs/core — auto-injected by kiss() plugin.
 *
 * v0.5.0: Core exports build/SSR APIs only.
 *   - Lit exports are provided by @kissjs/ui (not through core)
 *   - KissElement has been removed (innerHTML route was not sustainable)
 *   - Route components import from '@kissjs/core' for unified DX
 */
export { renderDSD, renderDSDByName } from '../../packages/kiss-core/src/render-dsd.js';

// --- Lit (optional, for @kissjs/ui consumers) ---
// Users of kiss-ui LitElement components import these through the UI package
export { css, html, LitElement } from 'lit';
export { Hono } from 'hono';

// SSR runtime (used by generated Hono entry)
export { wrapInDocument } from '../../packages/kiss-core/src/ssr-handler.js';

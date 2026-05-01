/**
 * Runtime shim for @kissjs/core
 *
 * v0.5.0: Dual runtime — exports both KissElement (zero-runtime) and Lit (optional).
 * Route components import from '@kissjs/core' for unified DX.
 *
 * This file is a build-time bridge — not part of the framework's public API.
 */
// --- KissElement (zero-runtime, always available) ---
export {
  css as kissCss,
  effect,
  html as kissHtml,
  KissElement,
  signal,
} from '../../packages/kiss-core/src/kiss-element.js';
export { renderDSD } from '../../packages/kiss-core/src/render-dsd.js';

// --- Lit (optional, backward compat) ---
export { css, html, LitElement, nothing, svg } from 'lit';
export { unsafeHTML } from 'lit/directives/unsafe-html.js';
export { classMap } from 'lit/directives/class-map.js';
export { styleMap } from 'lit/directives/style-map.js';
export { createRef, ref } from 'lit/directives/ref.js';
export { Hono } from 'hono';

// SSR runtime (used by generated Hono entry)
export { wrapInDocument } from '../../packages/kiss-core/src/ssr-handler.js';

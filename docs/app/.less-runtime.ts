/**
 * Runtime shim for @lessjs/core/kiss-runtime — auto-injected by kiss() plugin.
 *
 * v0.5.0: Core exports build/SSR APIs only.
 *   - Lit imports come directly from 'lit' in docs route components
 *   - KissElement has been removed (innerHTML route was not sustainable)
 *   - This shim keeps generated SSR entry imports away from build-time plugin code
 */
export { renderDSD, renderDSDByName } from '../../packages/core/src/render-dsd.js';
export { Hono } from 'hono';

// SSR runtime (used by generated Hono entry)
export { wrapInDocument } from '../../packages/core/src/ssr-handler.js';

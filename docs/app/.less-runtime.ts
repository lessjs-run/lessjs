/**
 * Runtime shim for @lessjs/core/less-runtime — auto-injected by less() plugin.
 *
 * v0.6.0: Re-exports from core source files (single source of truth).
 *   - registerAdapter: so adapters share the same module scope as renderDSD
 *   - No self-contained copy — this is the monorepo-internal docs override
 */
export { registerAdapter, renderDSD, renderDSDByName } from '../../packages/core/src/render-dsd.js';
export { Hono } from 'hono';

// SSR runtime (used by generated Hono entry)
export { wrapInDocument } from '../../packages/core/src/ssr-handler.js';

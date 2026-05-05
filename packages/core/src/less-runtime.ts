/**
 * LessJS runtime shim — built-in, auto-injected by kiss() plugin.
 *
 * v0.5.0: Pure build/SSR runtime. No KissElement, no Lit.
 * Lit exports are handled by @lessjs/ui — users import components directly.
 */
export { renderDSD, renderDSDByName } from './render-dsd.js';
export { Hono } from 'hono';
export { wrapInDocument } from './ssr-handler.js';

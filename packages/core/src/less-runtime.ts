/**
 * LessJS runtime shim — built-in, auto-injected by less() plugin.
 *
 * v0.6.0: Pure build/SSR runtime. No LessElement, no Lit.
 * Exports registerAdapter so adapters (e.g., @lessjs/adapter-lit) can
 * register from the same module scope as renderDSD — no globalThis bridge.
 */
import { createLogger } from './logger.js';

const log = createLogger('core');

export { log };
export { registerAdapter, renderDSD, renderDSDByName } from './render-dsd.js';
export { Hono } from 'hono';
export { wrapInDocument } from './ssr-handler.js';

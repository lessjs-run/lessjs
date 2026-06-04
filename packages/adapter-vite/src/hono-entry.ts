/**
 * @openelement/core - Hono entry generator (re-export facade).
 *
 * All implementation has been merged into entry-renderer.ts.
 * This file re-exports for consumers that import from hono-entry.ts.
 */
export { buildEntryDescriptor, generateHonoEntryCode, renderEntry } from './entry-renderer.js';

export type { EntryDescriptor } from './entry-descriptor.js';
export type { HonoEntryOptions } from './entry-renderer.js';

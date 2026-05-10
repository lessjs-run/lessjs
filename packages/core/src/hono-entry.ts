/**
 * @lessjs/core - Hono entry generator (re-export facade).
 *
 * All implementation has been merged into entry-renderer.ts.
 * This file re-exports for backward compatibility with existing consumers.
 */
export { buildEntryDescriptor, generateHonoEntryCode, renderEntry } from './entry-renderer.js';

export type { EntryDescriptor } from './entry-descriptor.js';
export type { HonoEntryOptions } from './entry-renderer.js';

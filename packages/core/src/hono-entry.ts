/**
 * @lessjs/core - Hono entry generator.
 *
 * Generates a virtual module string that exports a Hono app with all routes
 * registered. This module is the small facade over the descriptor builder and
 * renderer so both pieces stay independently testable.
 */
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';
import { buildEntryDescriptor } from './entry-descriptor.js';
import { renderEntry } from './entry-renderer.js';

export { buildEntryDescriptor } from './entry-descriptor.js';
export { renderEntry } from './entry-renderer.js';
export type { EntryDescriptor } from './entry-descriptor.js';

/** Options for the Hono entry code generator */
export interface HonoEntryOptions {
  routesDir?: string;
  islandsDir?: string;
  componentsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssg?: boolean;
  islandTagNames?: string[];
  /** Relative file paths for local islands (preserves subdirectory structure) */
  islandFiles?: string[];
  packageIslands?: PackageIslandMeta[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

/**
 * Generate the Hono entry module code from scanned routes.
 *
 * Internally:
 *  1. buildEntryDescriptor() — pure data transformation
 *  2. renderEntry()          — pure string rendering
 *
 * Both steps are exported individually for testing.
 */
export function generateHonoEntryCode(
  routes: RouteEntry[],
  options: HonoEntryOptions = {},
): string {
  const descriptor = buildEntryDescriptor(routes, options);
  return renderEntry(descriptor);
}

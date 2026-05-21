/**
 * @lessjs/core - Adapter Registry
 *
 * Module-level adapter storage for framework-specific rendering.
 *
 * Supports named adapters via RendererProtocol.
 * The last registered adapter is the default (returned by getAdapter()).
 * Named lookup is available via getAdapter(name).
 *
 * With viteBuild(ssr:true, noExternal) producing a self-contained ESM bundle,
 * all virtual modules resolve at compile time and there is only one module
 * instance - so a plain module variable replaces the former globalThis bridge.
 *
 * @warning Do NOT call registerAdapter() manually more than once unless you
 * are intentionally switching adapters. Each call overwrites the previous
 * adapter. In normal usage, the framework calls registerAdapter() automatically
 * via installLitAdapter() or equivalent.
 */

import type { RendererProtocol } from './types.js';

// Re-export for consumers who import from @lessjs/core/adapter-registry
export type { RendererProtocol } from './types.js';

let _adapter: RendererProtocol | undefined;
const _namedAdapters: Map<string, RendererProtocol> = new Map();

/** Register a render adapter explicitly. */
export function registerAdapter(
  adapter: RendererProtocol | undefined,
): void {
  _adapter = adapter;
  // If adapter has a name, register it in the named map
  if (adapter && adapter.name) {
    _namedAdapters.set(adapter.name, adapter);
  }
}

/** Get the currently registered (default) adapter, or look up by name. */
export function getAdapter(name?: string): RendererProtocol | undefined {
  if (name) {
    return _namedAdapters.get(name);
  }
  return _adapter;
}

/** Get all registered named adapters. */
export function getRegisteredAdapters(): readonly RendererProtocol[] {
  return Array.from(_namedAdapters.values());
}

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

export interface AdapterRegistry {
  register(adapter: RendererProtocol | undefined): void;
  get(name?: string): RendererProtocol | undefined;
  getAll(): readonly RendererProtocol[];
  clear(): void;
}

export function createAdapterRegistry(): AdapterRegistry {
  let defaultAdapter: RendererProtocol | undefined;
  const namedAdapters: Map<string, RendererProtocol> = new Map();

  return {
    register(adapter: RendererProtocol | undefined): void {
      defaultAdapter = adapter;
      if (!adapter) {
        namedAdapters.clear();
        return;
      }
      if (adapter.name) namedAdapters.set(adapter.name, adapter);
    },

    get(name?: string): RendererProtocol | undefined {
      if (name) return namedAdapters.get(name);
      return defaultAdapter;
    },

    getAll(): readonly RendererProtocol[] {
      return Array.from(namedAdapters.values());
    },

    clear(): void {
      defaultAdapter = undefined;
      namedAdapters.clear();
    },
  };
}

const defaultAdapterRegistry = createAdapterRegistry();

/** Register a render adapter explicitly. */
export function registerAdapter(
  adapter: RendererProtocol | undefined,
): void {
  defaultAdapterRegistry.register(adapter);
}

/** Get the currently registered (default) adapter, or look up by name. */
export function getAdapter(name?: string): RendererProtocol | undefined {
  return defaultAdapterRegistry.get(name);
}

/** Get all registered named adapters. */
export function getRegisteredAdapters(): readonly RendererProtocol[] {
  return defaultAdapterRegistry.getAll();
}

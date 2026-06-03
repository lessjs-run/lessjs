/**
 * @lessjs/core - Adapter Registry
 *
 * Adapter registry storage for framework-specific rendering.
 *
 * Supports named adapters via RendererProtocol.
 * The last registered adapter is the default. Named lookup is available via
 * AdapterRegistry.get(name).
 *
 * With viteBuild(ssr:true, noExternal) producing a self-contained ESM bundle,
 * all virtual modules resolve at compile time and there is only one module
 * instance - so a plain module variable replaces the former globalThis bridge.
 *
 * @warning Do NOT mutate the default registry manually more than once unless
 * you are intentionally switching adapters. In normal usage, framework adapter
 * installers update the default registry automatically.
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
      if (!adapter) return;
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

/** Get the default process-local render adapter registry. */
export function getDefaultRegistry(): AdapterRegistry {
  return defaultAdapterRegistry;
}

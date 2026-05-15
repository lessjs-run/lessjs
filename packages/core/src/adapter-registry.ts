/**
 * @lessjs/core - Adapter Registry
 *
 * Module-level adapter storage for framework-specific rendering.
 *
 * With viteBuild(ssr:true, noExternal) producing a self-contained ESM bundle,
 * all virtual modules resolve at compile time and there is only one module
 * instance — so a plain module variable replaces the former globalThis bridge.
 *
 * The public API (registerAdapter / getAdapter) is unchanged.
 *
 * @warning Do NOT call registerAdapter() manually more than once unless you
 * are intentionally switching adapters. Each call overwrites the previous
 * adapter. In normal usage, the framework calls registerAdapter() automatically
 * via installLitAdapter() or equivalent. Manual double-registration can cause
 * subtle rendering bugs where the wrong adapter is active at render time.
 */

import type { RenderAdapter } from './types.js';

// Re-export for consumers who import from @lessjs/core/adapter-registry
export type { RenderAdapter } from './types.js';

let _adapter: RenderAdapter | undefined;

/** Register a render adapter explicitly. */
export function registerAdapter(adapter: RenderAdapter | undefined): void {
  _adapter = adapter;
}

/** Get the currently registered adapter. */
export function getAdapter(): RenderAdapter | undefined {
  return _adapter;
}

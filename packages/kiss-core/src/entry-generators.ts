/**
 * @kissjs/core - Entry Generators
 *
 * Pure functions that generate client entry code strings.
 *
 * v0.5.0: Simplified client entry.
 * No Lit hydration, no defer-hydration, no <!--lit-part--> markers.
 * Custom Elements upgrade naturally via the browser's CE spec.
 *
 * Client lifecycle:
 *   1. Browser parses SSR HTML → DSD Shadow DOM attached automatically
 *   2. This script loads → dynamic import() all island modules
 *   3. Each module's side-effect calls customElements.define()
 *   4. Browser automatically upgrades all existing <tag> elements
 *   5. connectedCallback fires on each upgraded element
 *   6. Event listeners are attached (no re-rendering needed)
 *
 * No hydration ceremony needed because:
 *   - DSD provides the initial Shadow DOM content (from SSR)
 *   - Custom Elements upgrade activates the behavior
 *   - No TemplateResult to re-associate
 *   - No <!--lit-part--> markers to reconcile
 */

import type { HydrationStrategy } from './types.js';

/** Island entry for client bundle generation */
export interface ClientIslandEntry {
  /** Custom element tag name */
  tagName: string;
  /** Module path for dynamic import */
  modulePath: string;
  /** True if this island comes from a package */
  isPackage?: boolean;
}

/**
 * Generate the client entry point file content.
 *
 * This entry is built by Vite's client build (Phase 2).
 * It dynamically imports all island modules — the browser's Custom
 * Elements v1 spec handles automatic element upgrade from there.
 *
 * @param islands - List of islands to register
 * @param strategy - Hydration strategy (preserved for backward compat, minimal effect)
 */
export function generateClientEntry(
  islands: ClientIslandEntry[],
): string {
  if (islands.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n';
  }

  // All islands use dynamic import() — their side effects call customElements.define()
  const dynamicImports = islands
    .map((island) => `  import('${island.modulePath}'),`)
    .join('\n');

  const whenDefinedList = islands
    .map((island) => `customElements.whenDefined('${island.tagName}')`)
    .join(', ');

  return `// KISS Client Entry (auto-generated — v0.5.0)
// No Lit hydration — CE upgrade + DSD handles everything natively.

// --- Dynamic import all islands ---
// Each module's customElements.define() registers the element.
// The browser automatically upgrades existing SSR-rendered elements.
const __islandPromises = Promise.all([
${dynamicImports}
]);

// --- Wait for all elements to upgrade, then notify ---
__islandPromises.then(() => {
  Promise.all([${whenDefinedList}]).then(() => {
    // Dispatch custom event so external code can hook into ready state
    document.dispatchEvent(new CustomEvent('kiss:ready', {
      detail: { islands: [${islands.map((i) => `'${i.tagName}'`).join(', ')}] }
    }));
  });
}).catch(err => {
  console.warn('[KISS] Island loading failed:', err);
  // Best-effort: try to upgrade any islands that DID load
  Promise.all([${whenDefinedList}]).then(() => {
    document.dispatchEvent(new CustomEvent('kiss:ready', {
      detail: { islands: [${islands.map((i) => `'${i.tagName}'`).join(', ')}], partial: true }
    }));
  }).catch(() => { /* best effort */ });
});
`;
}

/** @deprecated Use generateClientEntry() — strategy parameter kept for API compat */
export type { HydrationStrategy };

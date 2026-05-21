/**
 * @lessjs/core - Island transform plugin
 * Detects island components and injects build metadata markers.
 *
 * v0.3.0: This plugin ONLY injects __island and __tagName metadata markers.
 * Island upgrade is handled by the Vite-built client entry
 * (entry-generators.ts), which imports island modules so they can
 * self-register via customElements.define().
 *
 * Web Standards alignment:
 * - Uses standard customElements.define() API
 * - No framework runtime - just native Custom Elements v1
 * - Declarative Shadow DOM provides the fallback (Level 0)
 */

import type { Plugin } from 'vite';
import { fileToTagName } from './route-scanner.js';

/** Vite plugin that injects `__island` and `__tagName` markers into island components */
export function islandTransformPlugin(islandsDir: string): Plugin {
  const normalizedIslandsDir = islandsDir.replace(/\\/g, '/');

  return {
    name: 'less:island-transform',

    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/');

      // Only transform files in the islands directory
      if (!normalizedId.includes(`/${normalizedIslandsDir}/`)) return null;

      // Extract tag name from file name
      const parts = normalizedId.split('/');
      const fileName = parts[parts.length - 1];
      const tagName = fileToTagName(fileName);

      // Validate tag name (must contain a hyphen for Custom Elements)
      if (!tagName.includes('-')) {
        this.warn(
          `Island file "${fileName}" must export a Custom Element with a hyphenated tag name. ` +
            `Got: "${tagName}". Skipping island registration.`,
        );
        return null;
      }

      // Security: reject characters that could break out of the injected
      // string literal or cause XSS (quotes, backslashes, angle brackets,
      // control chars). Only allow lowercase letters, digits, and hyphens.
      // Note: this.error() throws in Vite/Rollup, so no return needed after it.
      if (!/^[a-z0-9-]+$/.test(tagName)) {
        this.error(
          `Island tag name "${tagName}" contains unsafe characters. ` +
            `Only lowercase letters, digits, and hyphens are allowed.`,
        );
      }

      // Inject only metadata markers. The Vite-built client entry imports
      // islands for side-effect registration, so no registration code lives here.
      const injected = `
// --- LessJS Island Markers (auto-injected by @lessjs/core) ---
export const __island = true;
export const __tagName = '${tagName}';
// --- End LessJS Island Markers ---
`;

      return code + '\n' + injected;
    },
  };
}

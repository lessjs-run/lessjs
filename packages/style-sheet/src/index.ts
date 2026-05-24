/**
 * @lessjs/style-sheet — Cross-environment CSSStyleSheet abstraction.
 *
 * Extracted from @lessjs/core in v0.21.0 (SOP-007).
 * Provides StyleSheet constructor + StyleSheetLike / StyleSheetRule types.
 *
 * In browsers: delegates to native CSSStyleSheet (zero overhead).
 * In Deno/Node: uses a minimal in-memory shim.
 */

// Re-export directly from the extracted source
export { StyleSheet } from './style-sheet.js';
export type { StyleSheetLike, StyleSheetRule } from './style-sheet.js';

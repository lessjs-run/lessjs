/**
 * @lessjs/runtime — Component authoring facade.
 *
 * Single-import convenience layer for LessJS component authors.
 * Re-exports the public authoring surface from the runtime kernel,
 * signals engine, and stylesheet abstraction.
 *
 * Use this as your sole import for writing LessJS components:
 * ```ts
 * import { DsdElement, html, signal, StyleSheet } from '@lessjs/runtime';
 * ```
 *
 * This package does not own any implementation — it is a pure
 * re-export facade over @lessjs/core, @lessjs/signals, and
 * @lessjs/style-sheet.
 *
 * @module @lessjs/runtime
 */

// ─── @lessjs/core — Runtime kernel primitives ───────────────────

// Base class + templates
export { DsdElement } from '@lessjs/core';
export {
  html,
  isSignalLike,
  isTemplateResult,
  renderTemplateToString,
  unsafeHTML,
} from '@lessjs/core';
export type { SignalLike, TemplateResult, TemplateValue, UnsafeHtmlValue } from '@lessjs/core';

// HTML escaping utilities
export { escapeAttr, escapeAttrValue, escapeHtml } from '@lessjs/core';
export type { SafeHtml, UnsafeHtml } from '@lessjs/core';

// ─── @lessjs/signals — Reactive primitives ──────────────────────

export { computed, effect, signal } from '@lessjs/signals';

// ─── @lessjs/style-sheet — CSSStyleSheet abstraction ────────────

export { StyleSheet } from '@lessjs/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@lessjs/style-sheet';

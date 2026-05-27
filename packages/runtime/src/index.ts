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
// v0.24 (ADR-0052): @prop() reactive property decorator
export { prop } from '@lessjs/core';
export type { PropertyOptions } from '@lessjs/core';
export {
  choose,
  // v0.24: Template helpers (ADR-0051, SOP-009)
  classMap,
  html,
  isSignalLike,
  isTemplateResult,
  ref,
  renderTemplateToString,
  repeat,
  unsafeHTML,
  when,
} from '@lessjs/core';
export type {
  AttrValue,
  ChooseCase,
  ClassMapInput,
  ClassMapValue,
  ContentValue,
  EventValue,
  RefDirective,
  SignalLike,
  TemplateResult,
  TemplateValue,
  UnsafeHtmlValue,
} from '@lessjs/core';

// HTML escaping utilities
export { escapeAttr, escapeAttrValue, escapeHtml } from '@lessjs/core';
export type { SafeHtml, UnsafeHtml } from '@lessjs/core';

// Island authoring helpers
export { getSSRProps, island, lessBind } from '@lessjs/core';
export type { IslandOptions } from '@lessjs/core';

// ─── @lessjs/signals — Reactive primitives ──────────────────────

export { computed, effect, signal } from '@lessjs/signals';

// ─── @lessjs/style-sheet — CSSStyleSheet abstraction ────────────

export { StyleSheet } from '@lessjs/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@lessjs/style-sheet';

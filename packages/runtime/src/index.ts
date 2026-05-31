/**
 * @lessjs/runtime — Component authoring facade.
 *
 * Single-import convenience layer for LessJS component authors.
 * Re-exports the public authoring surface from the runtime kernel,
 * signals engine, and stylesheet abstraction.
 *
 * Use this as your sole import for writing LessJS components:
 * ```tsx
 * import { DsdElement, signal, StyleSheet } from '@lessjs/runtime';
 * ```
 *
 * This package does not own any implementation — it is a pure
 * re-export facade over @lessjs/core, @lessjs/signals, and
 * @lessjs/style-sheet.
 *
 * @module @lessjs/runtime
 */

// ─── @lessjs/core — Runtime kernel primitives ───────────────────

// Base class + JSX
export { DsdElement } from '@lessjs/core';
export { Fragment, jsx, jsxDEV, jsxs } from '@lessjs/core/jsx-runtime';
export type { VNode } from '@lessjs/core';
export type { LessRenderer } from '@lessjs/core';
export { isVNode } from '@lessjs/core';

// JSX rendering
export { renderToDom, renderToString } from '@lessjs/core';

// v0.25.0: SignalContext
export { consumeContext, createContext, provideContext } from '@lessjs/core';
export type { Context } from '@lessjs/core';

// v0.24.1: static props
export type { PropDecl, PropsFrom, PropType } from '@lessjs/core';

// v0.24 (ADR-0053): Error boundary + error types
export { ErrorBoundary } from '@lessjs/core';
export type {
  BuildError,
  ErrorCode,
  ErrorPhase,
  ErrorSeverity,
  IslandRenderError,
  LessError,
  NavigationError,
  PropValidationError,
  RenderError,
  SsrRenderError,
} from '@lessjs/core';

// Signals utilities (v0.24.1: SignalLike kept, isSignalLike kept)
export { isSignalLike } from '@lessjs/core';
export type { SignalLike } from '@lessjs/core';

// HTML escaping utilities
export { escapeAttr, escapeAttrValue, escapeHtml } from '@lessjs/core';
export type { SafeHtml, UnsafeHtml } from '@lessjs/core';

// Island authoring helpers
export { bindEvents, defineIsland, getSsrProps } from '@lessjs/core';
export type { IslandOptions } from '@lessjs/core';

// ─── @lessjs/signals — Reactive primitives ──────────────────────

export { computed, effect, signal } from '@lessjs/signals';

// ─── @lessjs/style-sheet — CSSStyleSheet abstraction ────────────

export { StyleSheet } from '@lessjs/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@lessjs/style-sheet';

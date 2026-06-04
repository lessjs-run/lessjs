/**
 * Single-import convenience layer for openElement component authors.
 * Re-exports the public authoring surface from the runtime kernel,
 * signals engine, and stylesheet abstraction.
 *
 * Use this as your sole import for writing openElement components:
 * ```tsx
 * import { DsdElement, signal, StyleSheet } from '@openelement/runtime';
 * ```
 *
 * re-export facade over @openelement/core, @openelement/signals, and
 * @openelement/style-sheet.
 *
 * @module @openelement/runtime
 */

// Base class + JSX
export { DsdElement } from '@openelement/core';
export { Fragment, jsx, jsxDEV, jsxs } from '@openelement/core/jsx-runtime';
export type { VNode } from '@openelement/core';
export type { OpenElementRenderer } from '@openelement/core';
export { isVNode } from '@openelement/core';

// JSX rendering
export { renderDsdTree, renderToDom } from '@openelement/core';

// v0.25.0: SignalContext
export { consumeContext, createContext, provideContext } from '@openelement/core';
export type { Context } from '@openelement/core';

// v0.24.1: static props
export type { PropDecl, PropsFrom, PropType } from '@openelement/core';

// v0.24 (ADR-0053): Error boundary + error types
export { ErrorBoundary } from '@openelement/core';
export type {
  BuildError,
  ErrorCode,
  ErrorPhase,
  ErrorSeverity,
  IslandRenderError,
  NavigationError,
  OpenElementError,
  PropValidationError,
  RenderError,
  SsrRenderError,
} from '@openelement/core';

// Signals utilities (v0.24.1: SignalLike kept, isSignalLike kept)
export { isSignalLike } from '@openelement/core';
export type { SignalLike } from '@openelement/core';

// HTML escaping utilities
export { escapeAttr, escapeAttrValue, escapeHtml } from '@openelement/core';
export type { SafeHtml, UnsafeHtml } from '@openelement/core';

// Island authoring helpers
export { bindSsrProps, defineIsland, getSsrProps } from '@openelement/core';
export type { IslandOptions } from '@openelement/core';

export { computed, effect, signal } from '@openelement/signals';

export { StyleSheet } from '@openelement/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@openelement/style-sheet';

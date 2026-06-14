/**
 * Canonical component-authoring facade for openElement.
 *
 * This package is the single import surface for authoring custom elements,
 * DSD components, and islands. Build orchestration remains in
 * @openelement/app and @openelement/adapter-vite.
 */

export { DsdElement, OpenElement } from '@openelement/core';
export { Fragment, jsx, jsxDEV, jsxs } from '@openelement/core/jsx-runtime';
export type { OpenElementRenderer, VNode } from '@openelement/core';
export { isVNode } from '@openelement/core';

export { renderDsdTree, renderToDom } from '@openelement/core';

export { consumeContext, createContext, provideContext } from '@openelement/core';
export type { Context } from '@openelement/core';

export type { PropDecl, PropsFrom, PropType } from '@openelement/core';

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

export { isSignalLike } from '@openelement/core';
export type { SignalLike } from '@openelement/core';

export { escapeAttr, escapeAttrValue, escapeHtml } from '@openelement/core';
export type { SafeHtml, UnsafeHtml } from '@openelement/core';

export { bindSsrProps, defineIsland, getSsrProps } from '@openelement/core';
export type { IslandOptions } from '@openelement/core';

export { computed, effect, signal } from '@openelement/signal';

export { StyleSheet } from '@openelement/core/style-sheet';
export type { StyleSheetLike, StyleSheetRule } from '@openelement/core/style-sheet';

/**
 * @openelement/adapter-react - React adapter for openElement Framework.
 *
 * Bridges React components to DSD SSR rendering.
 * Uses ReactDOMServer.renderToStaticMarkup() for string conversion.
 *
 * Architecture:
 *   @openelement/core          renderDsd() accepts the VNode/null component contract
 *   @openelement/adapter-react converts React elements at the adapter boundary
 *   DsdReactElement       wraps React components as Web Components
 *
 * Usage:
 *   import { installReactAdapter } from '@openelement/adapter-react';
 *   installReactAdapter();
 *
 * @module @openelement/adapter-react
 */

export {
  installReactAdapter,
  isReactElement,
  renderReactToString,
  uninstallReactAdapter,
} from './ssr.js';
export { DsdReactElement, WithDsdHydration } from './dsd-hydration.js';
export type {
  DsdHydration as ReactDsdHydration,
  DsdHydrationMixin as ReactDsdHydrationMixin,
} from './dsd-hydration.js';

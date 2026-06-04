/**
 * @lessjs/adapter-react - React adapter for LessJS Framework.
 *
 * Bridges React components to DSD SSR rendering.
 * Uses ReactDOMServer.renderToStaticMarkup() for string conversion.
 *
 * Architecture:
 *   @lessjs/core          renderDsd() accepts the VNode/null component contract
 *   @lessjs/adapter-react converts React elements at the adapter boundary
 *   DsdReactElement       wraps React components as Web Components
 *
 * Usage:
 *   import { installReactAdapter } from '@lessjs/adapter-react';
 *   installReactAdapter();
 *
 * @module @lessjs/adapter-react
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

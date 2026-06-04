/**
 * @openelement/adapter-vanilla - Vanilla Web Component adapter for openElement.
 *
 * SSR adapter for plain/vanilla Web Components that use the openElement VNode/null
 * component contract.
 *
 * Provides:
 * - installVanillaAdapter(): registers style extraction for vanilla components
 * - extractVanillaStyles(): extracts static styles from vanilla components
 * - DsdVanillaElement: base class with DSD detection + hydration event binding
 *
 * Usage:
 *   import { installVanillaAdapter } from '@openelement/adapter-vanilla';
 *   installVanillaAdapter();
 *
 * @module @openelement/adapter-vanilla
 */

export { extractVanillaStyles, installVanillaAdapter, uninstallVanillaAdapter } from './ssr.js';
export { DsdVanillaElement, WithDsdHydration } from './dsd-hydration.js';
export type {
  DsdHydration as VanillaDsdHydration,
  DsdHydrationMixin as VanillaDsdHydrationMixin,
} from './dsd-hydration.js';

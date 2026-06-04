/**
 * @lessjs/adapter-vanilla - Vanilla Web Component adapter for LessJS.
 *
 * SSR adapter for plain/vanilla Web Components that use the LessJS VNode/null
 * component contract.
 *
 * Provides:
 * - installVanillaAdapter(): registers style extraction for vanilla components
 * - extractVanillaStyles(): extracts static styles from vanilla components
 * - DsdVanillaElement: base class with DSD detection + hydration event binding
 *
 * Usage:
 *   import { installVanillaAdapter } from '@lessjs/adapter-vanilla';
 *   installVanillaAdapter();
 *
 * @module @lessjs/adapter-vanilla
 */

export { extractVanillaStyles, installVanillaAdapter, uninstallVanillaAdapter } from './ssr.js';
export { DsdVanillaElement, WithDsdHydration } from './dsd-hydration.js';
export type {
  DsdHydration as VanillaDsdHydration,
  DsdHydrationMixin as VanillaDsdHydrationMixin,
} from './dsd-hydration.js';

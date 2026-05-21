/**
 * @lessjs/adapter-lit - Lit adapter for LessJS Framework.
 *
 * Bridges Lit TemplateResult values to strings for DSD SSR rendering.
 * Uses safe interpolation without @lit-labs/ssr.
 * Produces clean DSD HTML without Lit SSR marker comments.
 *
 * Architecture:
 *   @lessjs/core        renderDSD() only accepts render(): string
 *   @lessjs/adapter-lit converts TemplateResult to string at build time
 *   @lessjs/ui          LitElement components (Lit + OpenProps)
 *
 * Usage (in vite.config.ts or build config):
 *   import { installLitAdapter } from '@lessjs/adapter-lit';
 *   installLitAdapter(); // patches renderDSD to handle Lit TemplateResult
 *
 * Usage (for DSD Interactive components):
 *   import { DsdLitElement } from '@lessjs/adapter-lit';
 *   class MyToggle extends DsdLitElement { ... }
 *
 * @module @lessjs/adapter-lit
 */

export { installLitAdapter, uninstallLitAdapter } from './ssr.js';
export { isLitTemplateResult, renderLitToString } from './ssr.js';
/**
 * @deprecated Use `DsdElement` from `@lessjs/core` instead.
 * DsdLitElement is the Lit-based predecessor; the framework is migrating
 * to zero-dependency DsdElement (extends HTMLElement directly, no Lit).
 */
export { DsdLitElement, WithDsdHydration } from './dsd-hydration.js';
export type { DsdHydration, DsdHydrationMixin } from './dsd-hydration.js';

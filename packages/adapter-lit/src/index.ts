/**
 * @lessjs/adapter-lit - Lit adapter for LessJS Framework.
 *
 * Bridges Lit TemplateResult values to strings for DSD SSR rendering.
 * Uses safe interpolation without @lit-labs/ssr.
 * Produces clean DSD HTML without Lit SSR marker comments.
 *
 * Architecture:
 *   @lessjs/core        renderDsd() only accepts render(): string
 *   @lessjs/adapter-lit converts TemplateResult to string at build time
 *   @lessjs/ui          LitElement components (Lit + OpenProps)
 *
 * Usage (in vite.config.ts or build config):
 *   import { installLitAdapter } from '@lessjs/adapter-lit';
 *   installLitAdapter(); // patches renderDsd to handle Lit TemplateResult
 *
 * @module @lessjs/adapter-lit
 */

export { installLitAdapter, uninstallLitAdapter } from './ssr.js';
export { isLitTemplateResult, renderLitToString } from './ssr.js';

/**
 * @openelement/adapter-lit - Lit adapter for openElement Framework.
 *
 * Bridges Lit TemplateResult values to strings for DSD SSR rendering.
 * Uses safe interpolation without @lit-labs/ssr.
 * Produces clean DSD HTML without Lit SSR marker comments.
 *
 * Architecture:
 *   @openelement/core        renderDsd() accepts the VNode/null component contract
 *   @openelement/adapter-lit converts TemplateResult values at the adapter boundary
 *   @openelement/ui          LitElement components (Lit + OpenProps)
 *
 * Usage (in vite.config.ts or build config):
 *   import { installLitAdapter } from '@openelement/adapter-lit';
 *   installLitAdapter(); // patches renderDsd to handle Lit TemplateResult
 *
 * @module @openelement/adapter-lit
 */

export { installLitAdapter, uninstallLitAdapter } from './ssr.js';
export { isLitTemplateResult, renderLitToString } from './ssr.js';

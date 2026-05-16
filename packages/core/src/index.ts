/**
 * @lessjs/core - Pure runtime.
 *
 * LessJS is a static-first framework with a pure runtime core:
 * - Zero node:* imports — no filesystem, no process, no path
 * - Zero Vite dependency — no Plugin, no build orchestration
 * - Zero npm: specifiers — works in Deno, Node, Bun, Edge
 * - Pure Web Standard: URL, fetch, import.meta.url, console
 *
 * Rendering: DSD (Declarative Shadow DOM) string concatenation
 * Islands: Custom Element registration + prop deserialization
 * Adapter: registerAdapter() + RenderAdapter interface
 *
 * Build orchestration (Vite plugins) lives in @lessjs/adapter-vite.
 * For the unified lessjs() entry, use @lessjs/app instead.
 */

// ─── Public API re-exports ─────────────────────────────────────────

export type {
  FrameworkOptions,
  LessMiddleware,
  LessRenderer,
  PackageIslandMeta,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';

export { LessError, SsrRenderError } from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './html-escape.js';
export { renderDSD, renderDSDByName } from './render-dsd.js';
export { camelToKebab } from './render-serialize.js';
export { getAdapter, registerAdapter } from './adapter-registry.js';
export type { ComponentLayer, DsdOptions, HydrateEventDescriptor, RenderAdapter } from './types.js';
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  type SafeHtml,
  type UnsafeHtml,
} from './html-escape.js';
export { createLogger, LessLogger, LogLevel } from './logger.js';
export { DANGEROUS_KEYS, getSSRProps, island, type IslandOptions, lessBind } from './island.js';
export { hasNavigationApi, matchRoute, navigate, onNavigate } from './navigation.js';
export type { NavigationCallback } from './navigation.js';

// G10 fix: Build-time shared types — breaks adapter-vite ↔ content circular dep
export type {
  LessBlogOptions,
  LessBuildContextLike,
  LessHeaderNavLink,
  LessI18nContextOptions,
  LessNavSection,
  LessPluginMeta,
} from './build-types.js';

// G10 fix: Virtual module IDs — shared across adapter-vite, content, i18n
export {
  RESOLVED_BLOG_DATA_ID,
  RESOLVED_I18N_DATA_ID,
  RESOLVED_NAV_ID,
  RESOLVED_PAGE_DATA_ID,
  VIRTUAL_BLOG_DATA_ID,
  VIRTUAL_I18N_DATA_ID,
  VIRTUAL_NAV_ID,
  VIRTUAL_PAGE_DATA_ID,
} from './virtual-ids.js';

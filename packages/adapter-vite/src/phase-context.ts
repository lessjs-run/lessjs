/**
 * @lessjs/adapter-vite — Build Phase Context Wiring.
 *
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * Provides the dispatch mechanism that bridges virtual data modules
 * (blog, i18n) to the plugin instances registered by @lessjs/content
 * and @lessjs/i18n during buildStart().
 *
 * Phase tokens and Meta classes remain in build-context.ts.
 * This module focuses on the runtime dispatch layer between
 * the build context and sub-plugins.
 */

import type { Plugin } from 'vite';
import type { LessBuildContext } from './build-context.js';

/**
 * Dispatch virtual data module resolve/load to plugins registered by
 * @lessjs/content / @lessjs/i18n during buildStart().
 *
 * At less() construction time, ctx.plugins.blogDataPlugin is null because
 * buildStart() hasn't run yet. This dispatcher checks ctx at call time,
 * so the real plugin is used when it's available.
 */
export function dispatchDataPlugin(ctx: LessBuildContext): Plugin {
  const ENTRIES: Array<{
    virtual: string;
    resolved: string;
    get: () => Plugin | null;
    emptyCode: string;
  }> = [
    {
      virtual: 'virtual:less-blog-data',
      resolved: '\0virtual:less-blog-data',
      get: () => ctx.plugins.blogDataPlugin,
      emptyCode: [
        'export const posts = [];',
        'export function getPostBySlug() { return undefined; }',
        'export function getBlogOptions() { return {}; }',
      ].join('\n'),
    },
    {
      virtual: 'virtual:less-i18n-data',
      resolved: '\0virtual:less-i18n-data',
      get: () => ctx.plugins.i18nDataPlugin,
      emptyCode: [
        'export const locales = [];',
        'export function getDefaultLocale() { return "en"; }',
        'export function getI18nOptions() { return null; }',
      ].join('\n'),
    },
  ];

  // v0.14.6: Use Map for O(1) virtual module ID lookup
  const ENTRIES_MAP = new Map(ENTRIES.map((e) => [e.virtual, e]));
  const RESOLVED_MAP = new Map(ENTRIES.map((e) => [e.resolved, e]));

  return {
    name: 'less:data-dispatch',
    enforce: 'pre',
    resolveId(id) {
      const entry = ENTRIES_MAP.get(id);
      if (entry) {
        const real = entry.get();
        if (!real?.resolveId) return entry.resolved;
        // Vite 8 Plugin hook can be function or {handler, order}
        const fn = typeof real.resolveId === 'function'
          ? real.resolveId
          : (real.resolveId as Record<string, unknown>).handler;
        if (!fn) return entry.resolved;
        // deno-lint-ignore no-explicit-any
        const result = (fn as any)(id);
        return result ?? entry.resolved;
      }
    },
    load(id) {
      const entry = RESOLVED_MAP.get(id);
      if (entry) {
        const real = entry.get();
        if (!real?.load) return entry.emptyCode;
        // Vite 8 Plugin hook can be function or {handler, order}
        const fn = typeof real.load === 'function'
          ? real.load
          : (real.load as Record<string, unknown>).handler;
        if (!fn) return entry.emptyCode;
        // deno-lint-ignore no-explicit-any
        return (fn as any)(id) ?? entry.emptyCode;
      }
    },
  };
}

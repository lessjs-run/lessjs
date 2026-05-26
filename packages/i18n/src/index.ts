/**
 * @lessjs/i18n - Internationalization for LessJS
 *
 * Opt-in Vite plugin for locale-aware routes and path helpers.
 * Separate from @lessjs/content because i18n is a cross-cutting concern,
 * not a content-management feature.
 *
 * ADR 0018: Route components import data from virtual:less-i18n-data,
 * NOT from @lessjs/i18n module state. The loadI18nData() pure function
 * is called by the virtual module plugin's load() hook.
 *
 * Recommended usage (via @lessjs/app):
 * ```ts
 * import { lessjs } from '@lessjs/app';
 *
 * export default defineConfig({
 *   plugins: [await lessjs({
 *     i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
 *   })],
 * });
 * ```
 *
 * Standalone usage requires explicit ctx parameter:
 * ```ts
 * lessI18n({ locales: ['en', 'zh'], defaultLocale: 'en', ctx });  // ctx must be explicitly passed
 * ```
 *
 * Route-level helpers:
 * ```ts
 * import { i18nStaticPaths, switchLocale } from '@lessjs/i18n';
 * ```
 */

import type { Plugin } from 'vite';
import type { LessI18nOptions } from './types.ts';
import type { LessBuildContextLike } from '@lessjs/protocols/build-types';
import { loadI18nData } from './i18n-data.ts';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('i18n');

// ─── Re-exports ─────────────────────────────────────────────────

export type { LessI18nOptions } from './types.ts';
export { loadI18nData } from './i18n-data.ts';
export { i18nStaticPaths, switchLocale } from './routes.ts';

// ─── Main Plugin ────────────────────────────────────────────────

/**
 * LessJS i18n Vite plugin.
 * Configures locale options for route-level i18n helpers.
 */
export function lessI18n(
  options: LessI18nOptions & { ctx?: LessBuildContextLike },
): Plugin {
  // ctx must be explicitly provided (via lessjs() umbrella or direct param)
  const ctx = options.ctx;

  return {
    name: 'less:i18n',

    async buildStart() {
      // ADR 0018: Use loadI18nData() pure function - zero module state
      const i18nData = loadI18nData(options);

      // Write i18n options to ctx (shared build context)
      // The virtual:less-i18n-data plugin reads ctx.plugins.i18nOptions in its load() hook
      if (ctx) {
        ctx.plugins.i18nOptions = {
          locales: i18nData.locales,
          defaultLocale: i18nData.defaultLocale,
        };
        // Register i18n data virtual module plugin with adapter-vite
        // Lives here (not in adapter-vite) to avoid circular deps
        const { createI18nDataPlugin } = await import('./i18n-data-plugin.ts');
        ctx.plugins.i18nDataPlugin = createI18nDataPlugin(ctx);
      }

      log.info(`${options.locales.join(', ')} (default: ${options.defaultLocale})`);
    },
  };
}

export default lessI18n;

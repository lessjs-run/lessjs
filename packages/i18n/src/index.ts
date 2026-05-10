/**
 * @lessjs/i18n - Internationalization for LessJS
 *
 * Opt-in Vite plugin for locale-aware routes and path helpers.
 * Separate from @lessjs/content because i18n is a cross-cutting concern,
 * not a content-management feature.
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
import type { LessBuildContext } from '@lessjs/core/build-context';
import { initI18nData } from './i18n-data.ts';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('i18n');

// ─── Re-exports ─────────────────────────────────────────────────

export type { LessI18nOptions } from './types.ts';
export { getDefaultLocale, getI18nLocales, getI18nOptions, initI18nData } from './i18n-data.ts';
export { i18nStaticPaths, switchLocale } from './routes.ts';

// ─── Main Plugin ────────────────────────────────────────────────

/**
 * LessJS i18n Vite plugin.
 * Configures locale options for route-level i18n helpers.
 */
export function lessI18n(
  options: LessI18nOptions & { ctx?: LessBuildContext },
): Plugin {
  // ctx must be explicitly provided (via lessjs() umbrella or direct param)
  const ctx = options.ctx;

  return {
    name: 'less:i18n',

    buildStart() {
      initI18nData(options);

      // Write i18n options to ctx (shared build context)
      if (ctx) {
        ctx.i18nOptions = {
          locales: options.locales,
          defaultLocale: options.defaultLocale,
        };
      }

      log.info(`${options.locales.join(', ')} (default: ${options.defaultLocale})`);
    },
  };
}

export default lessI18n;

/**
 * @lessjs/i18n - Internationalization for LessJS
 *
 * Opt-in Vite plugin for locale-aware routes and path helpers.
 * Separate from @lessjs/content because i18n is a cross-cutting concern,
 * not a content-management feature.
 *
 * Usage:
 * ```ts
 * import { defineConfig } from 'vite';
 * import { less } from '@lessjs/core';
 * import { lessContent } from '@lessjs/content';
 * import { lessI18n } from '@lessjs/i18n';
 *
 * export default defineConfig({
 *   plugins: [
 *     less({ routesDir: 'app/routes' }),
 *     lessContent({ nav: { routesDir: 'app/routes' } }),
 *     lessI18n({ locales: ['en', 'zh'], defaultLocale: 'en' }),
 *   ],
 * });
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
import { getActiveContext } from '@lessjs/core';
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
  const ctx = options.ctx || getActiveContext();

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

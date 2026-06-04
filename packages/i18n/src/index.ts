/**
 * @openelement/i18n - Internationalization for openElement
 *
 * Opt-in Vite plugin for locale-aware routes and path helpers.
 * Separate from @openelement/content because i18n is a cross-cutting concern,
 * not a content-management feature.
 *
 * Route components import generated data from @openelement/generated/i18n.
 * This package writes locale data and does not resolve it at runtime.
 *
 * Recommended usage (via @openelement/app):
 * ```ts
 * import { lessjs } from '@openelement/app';
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
 * import { i18nStaticPaths, switchLocale } from '@openelement/i18n';
 * ```
 */

import type { Plugin } from 'vite';
import type { LessI18nOptions } from './types.ts';
import type { LessBuildContextLike } from '@openelement/protocols/build-types';
import { loadI18nData, writeI18nDataModule } from './i18n-data.ts';
import { createLogger } from '@openelement/core/logger';
import process from 'node:process';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const log = createLogger('i18n');

// ©¤©¤©¤ Re-exports ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

export type { LessI18nOptions } from './types.ts';
export { loadI18nData } from './i18n-data.ts';
export { writeI18nDataModule } from './i18n-data.ts';
export { i18nStaticPaths, normalizeLocalePath, switchLocale } from './routes.ts';
export type { LocalePath } from './routes.ts';

// ©¤©¤©¤ Main Plugin ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

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

    buildStart() {
      // ADR 0018: Use loadI18nData() pure function - zero module state
      const i18nData = loadI18nData(options);

      // Write i18n options to ctx (shared build context)
      // The @openelement/generated/i18n plugin reads ctx.plugins.i18nOptions in its load() hook
      if (ctx) {
        ctx.plugins.i18nOptions = {
          locales: i18nData.locales,
          defaultLocale: i18nData.defaultLocale,
        };
      }

      // SOP-001: Write generated i18n data module to disk
      try {
        const dataDir = join(process.cwd(), 'app', 'data');
        mkdirSync(dataDir, { recursive: true });
        const i18nModule = writeI18nDataModule(i18nData.locales, i18nData.defaultLocale);
        writeFileSync(join(dataDir, '_generated-i18n-data.ts'), i18nModule, 'utf-8');
        log.info(`I18n: wrote _generated-i18n-data.ts (${i18nData.locales.join(', ')})`);
      } catch (err) {
        log.warn(
          `Failed to write _generated-i18n-data.ts: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      log.info(`${options.locales.join(', ')} (default: ${options.defaultLocale})`);
    },
  };
}

export default lessI18n;

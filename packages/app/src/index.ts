/**
 * @lessjs/app - Unified LessJS Vite plugin entry.
 *
 * Single entry point that combines lessPipeline() + lessContent() + lessI18n()
 * with a shared LessBuildContext. Explicit ctx passing - no globalThis needed.
 *
 * Usage:
 * ```ts
 * import { lessjs } from '@lessjs/app';
 *
 * export default defineConfig({
 *   plugins: [lessjs({
 *     routesDir: 'app/routes',
 *     content: { blog: { contentDir: 'posts' }, nav: { routesDir: 'app/routes' } },
 *     i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
 *   })]
 * })
 * ```
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions } from '@lessjs/core';
import type { LessContentOptions } from '@lessjs/content';
import type { LessI18nOptions } from '@lessjs/i18n';

import { LessBuildContext } from '@lessjs/adapter-vite';
// Internal: less() is the raw plugin factory, not part of the public API.
// lessPipeline() wraps it — use that for consumer-facing code.
import { less } from '@lessjs/adapter-vite/less-plugin';
import { lessContent } from '@lessjs/content';
import { lessI18n } from '@lessjs/i18n';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('app');

/** Options for the lessjs() unified entry */
export interface LessjsOptions extends FrameworkOptions {
  /** Content module options (blog + nav + sitemap). Omit to disable. */
  content?: LessContentOptions;
  /** i18n module options. Omit to disable. */
  i18n?: LessI18nOptions;
}

/**
 * Unified LessJS Vite plugin - single entry point for all LessJS features.
 *
 * Combines lessPipeline() + lessContent() + lessI18n() under one call with a
 * shared LessBuildContext. ctx is explicitly passed to sub-plugins,
 * eliminating the need for globalThis discovery.
 *
 * This is the recommended way to use LessJS.
 */
export function lessjs(options: LessjsOptions = {}): Plugin[] {
  const { content: contentOpts, i18n: i18nOpts, ...coreOpts } = options;
  const ctx = new LessBuildContext({
    ...coreOpts,
    routesDir: coreOpts.routesDir || 'app/routes',
    islandsDir: coreOpts.islandsDir || 'app/islands',
    componentsDir: coreOpts.componentsDir || 'app/components',
  });

  const plugins: Plugin[] = [...less(coreOpts, ctx)];

  if (i18nOpts) {
    plugins.push(lessI18n({ ...i18nOpts, ctx }));
    log.info('i18n plugin loaded');
  }

  if (contentOpts) {
    plugins.push(...lessContent({ ...contentOpts, ctx }));
    log.info('Content plugin loaded');
  }

  return plugins;
}

export default lessjs;

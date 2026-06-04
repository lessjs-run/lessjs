/**
 * @openelement/app - Unified openElement Vite plugin entry.
 *
 * Single entry point that combines lessPipeline() + lessContent() + lessI18n()
 * with a shared LessBuildContext. Explicit ctx passing - no globalThis needed.
 *
 * Usage:
 * ```ts
 * import { lessjs } from '@openelement/app';
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
import type { FrameworkOptions } from '@openelement/core';
import type { LessContentOptions } from '@openelement/content';
import type { LessI18nOptions } from '@openelement/i18n';

import { LessBuildContext } from '@openelement/adapter-vite';
// Internal: less() is the raw plugin factory, not part of the public API.
// lessPipeline() wraps it ¡ª use that for consumer-facing code.
import { less } from '@openelement/adapter-vite/less-plugin';
import { lessContent } from '@openelement/content';
import { lessI18n } from '@openelement/i18n';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('app');

/** Options for the openElement() unified entry */
export interface LessjsOptions extends FrameworkOptions {
  /** Content module options (blog + nav + sitemap). Omit to disable. */
  content?: LessContentOptions;
  /** i18n module options. Omit to disable. */
  i18n?: LessI18nOptions;
}

/**
 * Unified openElement Vite plugin - single entry point for all LessJS features.
 *
 * Combines lessPipeline() + lessContent() + lessI18n() under one call with a
 * shared LessBuildContext. ctx is explicitly passed to sub-plugins,
 * eliminating the need for globalThis discovery.
 *
 * This is the recommended way to use openElement.
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

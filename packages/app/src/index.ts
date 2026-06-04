/**
 * @openelement/app - Unified openElement Vite plugin entry.
 *
 * Single entry point that combines openPipeline() + openContent() + openI18n()
 * with a shared OpenElementBuildContext. Explicit ctx passing - no globalThis needed.
 *
 * Usage:
 * ```ts
 * import { openElement } from '@openelement/app';
 *
 * export default defineConfig({
 *   plugins: [openElement({
 *     routesDir: 'app/routes',
 *     content: { blog: { contentDir: 'posts' }, nav: { routesDir: 'app/routes' } },
 *     i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
 *   })]
 * })
 * ```
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions } from '@openelement/core';
import type { OpenElementContentOptions } from '@openelement/content';
import type { OpenElementI18nOptions } from '@openelement/i18n';

import { OpenElementBuildContext } from '@openelement/adapter-vite';
// Internal: createOpenPlugin() is the raw plugin factory, not part of the public API.
import { createOpenPlugin } from '@openelement/adapter-vite/plugin';
import { openContent } from '@openelement/content';
import { openI18n } from '@openelement/i18n';
import { createLogger } from '@openelement/core/logger';

const log = createLogger('app');

/** Options for the openElement() unified entry */
export interface OpenElementOptions extends FrameworkOptions {
  /** Content module options (blog + nav + sitemap). Omit to disable. */
  content?: OpenElementContentOptions;
  /** i18n module options. Omit to disable. */
  i18n?: OpenElementI18nOptions;
}

/**
 * Unified openElement Vite plugin - single entry point for all openElement features.
 *
 * Combines openPipeline() + openContent() + openI18n() under one call with a
 * shared OpenElementBuildContext. ctx is explicitly passed to sub-plugins,
 * eliminating the need for globalThis discovery.
 *
 * This is the recommended way to use openElement.
 */
export function openElement(options: OpenElementOptions = {}): Plugin[] {
  const { content: contentOpts, i18n: i18nOpts, ...coreOpts } = options;
  const ctx = new OpenElementBuildContext({
    ...coreOpts,
    routesDir: coreOpts.routesDir || 'app/routes',
    islandsDir: coreOpts.islandsDir || 'app/islands',
    componentsDir: coreOpts.componentsDir || 'app/components',
  });

  const plugins: Plugin[] = [...createOpenPlugin(coreOpts, ctx)];

  if (i18nOpts) {
    plugins.push(openI18n({ ...i18nOpts, ctx }));
    log.info('i18n plugin loaded');
  }

  if (contentOpts) {
    plugins.push(...openContent({ ...contentOpts, ctx }));
    log.info('Content plugin loaded');
  }

  return plugins;
}

export default openElement;

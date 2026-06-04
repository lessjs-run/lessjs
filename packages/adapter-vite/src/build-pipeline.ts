/**
 * @openelement/adapter-vite - BuildPipeline declarative API.
 *
 * v0.25.0 (SOP-001): openPipeline() is the sole public build pipeline entry.
 * It wraps the internal plugin factory (plugin.ts) with a cleaner
 * declarative config shape. All existing build code is reused as-is.
 *
 * @module @openelement/adapter-vite/build-pipeline
 */

import type { Plugin } from 'vite';
import { createOpenPlugin } from './plugin.js';
import type { FrameworkOptions } from '@openelement/core';
export type { FrameworkOptions } from '@openelement/core';

// ─── Pipeline Config ───────────────────────────────────────────────

export interface OpenPipelineConfig {
  routes?: { dir?: string };
  i18n?: { locales: string[]; defaultLocale?: string };
  output?: { outDir?: string; cleanUrls?: boolean };
  island?: { dir?: string; upgradeStrategy?: string };
  pwa?: { name?: string; shortName?: string; themeColor?: string };
  viewTransition?: boolean;
  headExtras?: string;
}

// ─── openPipeline() — declarative entry ────────────────────────────

/**
 * Declarative build pipeline entry.
 *
 * ```typescript
 * // vite.config.ts
 * import { openPipeline } from '@openelement/adapter-vite';
 * export default defineConfig({
 *   plugins: [openPipeline({ routes: { dir: 'app/routes' }, i18n: { locales: ['en', 'zh'] } })],
 * });
 * ```
 */
export function openPipeline(config: OpenPipelineConfig = {}): Plugin[] {
  const options: FrameworkOptions = {
    routesDir: config.routes?.dir || 'app/routes',
    islandsDir: config.island?.dir || 'app/islands',
    componentsDir: 'app/components',
    viewTransition: config.viewTransition ?? true,
    headExtras: config.headExtras,
    pwa: config.pwa as FrameworkOptions['pwa'],
    island: config.island as FrameworkOptions['island'],
    build: config.output as FrameworkOptions['build'],
  };
  return createOpenPlugin(options);
}

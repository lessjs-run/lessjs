/**
 * @lessjs/adapter-vite - BuildPipeline declarative API.
 *
 * v0.25.0 (SOP-001): Declarative wrapper. lessPipeline() is a thin
 * wrapper around the existing less() function with a cleaner config shape.
 * Zero logic change — all existing build code is reused as-is.
 *
 * @module @lessjs/adapter-vite/build-pipeline
 */

import type { Plugin } from 'vite';
import { less } from './less-plugin.js';
import type { FrameworkOptions } from '@lessjs/core';
export type { FrameworkOptions } from '@lessjs/core';

// ─── Pipeline Config ───────────────────────────────────────────────

export interface PipelineConfig {
  routes?: { dir?: string };
  i18n?: { locales: string[]; defaultLocale?: string };
  output?: { outDir?: string; cleanUrls?: boolean };
  island?: { dir?: string; upgradeStrategy?: string };
  pwa?: { name?: string; shortName?: string; themeColor?: string };
  viewTransition?: boolean;
  headExtras?: string;
}

// ─── lessPipeline() — declarative entry ────────────────────────────

/**
 * Declarative build pipeline entry.
 *
 * ```typescript
 * // vite.config.ts
 * import { lessPipeline } from '@lessjs/adapter-vite';
 * export default defineConfig({
 *   plugins: [lessPipeline({ routes: { dir: 'app/routes' }, i18n: { locales: ['en', 'zh'] } })],
 * });
 * ```
 */
export function lessPipeline(config: PipelineConfig = {}): Plugin[] {
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
  return less(options);
}

// ─── Backward compatibility ────────────────────────────────────────

/**
 * @deprecated since v0.25.0 — Use `lessPipeline()` instead.
 *
 * ```diff
 * - export default defineConfig({ plugins: [less({ ... })] });
 * + export default defineConfig({ plugins: [lessPipeline({ routes: { dir: 'app/routes' } })] });
 * ```
 */
export const lessCompat = less;

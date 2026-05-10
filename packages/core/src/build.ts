/**
 * @lessjs/core - Build plugin
 * LessJS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * ADR 0010: closeBundle writes metadata to LessBuildContext only.
 * No .less/ file fallback — unified build orchestrator is the only entry point.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { LessBuildContext } from './build-context.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

/** Vite plugin: writes build metadata to ctx */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: LessBuildContext): Plugin {
  const outDir = options.build?.outDir || 'dist';

  let config: ResolvedConfig;
  let base: string = '/';

  return {
    name: 'less:build',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      base = resolvedConfig.base || '/';
      if (!base.endsWith('/')) base += '/';
    },

    // deno-lint-ignore require-await
    async closeBundle() {
      // Only run in build mode (not dev)
      if (config.command !== 'build') return;

      const root = config.root;

      // Serialize SSR noExternal patterns (RegExp → marker objects)
      const ssrNoExternal = ((options.ssr?.noExternal ||
        (config.ssr as { noExternal?: (string | RegExp)[] } | undefined)?.noExternal) || [])
        .map((item) => {
          if (item instanceof RegExp) {
            return { __type: 'RegExp', source: item.source, flags: item.flags };
          }
          return item;
        });

      // ─── Write to LessBuildContext ──────────
      if (ctx) {
        ctx.root = root;
        ctx.outDir = outDir;
        ctx.base = base;
        ctx.ssrNoExternal =
          ssrNoExternal as (string | { __type: 'RegExp'; source: string; flags: string })[];
        ctx.routesDir = options.routesDir || 'app/routes';
        ctx.islandsDir = options.islandsDir || 'app/islands';
        ctx.componentsDir = options.componentsDir || 'app/components';
        ctx.middleware = options.middleware || null;
        ctx.html = options.html || null;
        ctx.pwa = options.pwa || null;
        ctx.upgradeStrategy = options.island?.upgradeStrategy || 'lazy';
        ctx.viewTransition = options.viewTransition ?? true;
        ctx.speculation = options.speculation ?? null;
        ctx.headExtras = options.headExtras || '';
      }

      const totalIslands = (ctx?.islandTagNames?.length || 0) + (ctx?.packageIslands?.length || 0);

      log.info('Phase 1 complete — SSR bundle + metadata written to ctx');
      if (totalIslands > 0) {
        log.info(
          `${totalIslands} island(s) detected — run the full build command next.`,
        );
        log.info('  deno task build          (compile islands + render static HTML)');
      } else {
        log.info('No islands — static pages only, zero client JS');
        log.info('Run: deno task build       (render static HTML)');
      }
    },
  };
}

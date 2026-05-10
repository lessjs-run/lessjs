/**
 * @lessjs/core - Build plugin
 * LessJS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * ADR 0011: closeBundle writes metadata to ctx, then triggers Phase 2/3.
 * No globalThis bridge — ctx stays in less() closure scope throughout.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { LessBuildContext } from './build-context.js';
import { clearActiveContext } from './build-context.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

/** Vite plugin: writes build metadata to ctx, then runs Phase 2 + Phase 3 */
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

      log.info('Phase 1/3 complete — SSR bundle + metadata written to ctx');

      // ─── Phase 2: Client island build ──────────
      // ADR 0011: Inline Phase 2/3 in closeBundle instead of
      // cli/build.ts orchestrator. ctx is already in closure scope
      // — no globalThis bridge needed.
      if (ctx && totalIslands > 0) {
        try {
          const { buildClient } = await import('./cli/build-client.js');
          log.info('Phase 2/3 - Client island build...');
          await buildClient(ctx);
        } catch (error) {
          log.error('Client build failed:', error);
          throw error;
        }
      } else {
        log.info('No islands — static pages only, zero client JS');
      }

      // ─── Phase 3: SSG rendering ──────────
      if (ctx) {
        try {
          const { buildSSG } = await import('./cli/build-ssg.js');
          log.info('Phase 3/3 - Static site generation...');
          await buildSSG({}, ctx);
        } catch (error) {
          log.error('SSG build failed:', error);
          throw error;
        }
      }

      log.info('Build complete.');

      // Clean up module-level active context
      clearActiveContext();
    },
  };
}

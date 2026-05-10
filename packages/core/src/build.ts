/**
 * @lessjs/core - Build plugin
 * LessJS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * ADR 0008 Phase A: closeBundle writes metadata to LessBuildContext
 * instead of .less/build-metadata.json. When ctx is provided, the
 * unified build orchestrator reads ctx directly — no filesystem IPC.
 *
 * For backward compat (standalone `vite build` without orchestrator),
 * .less/build-metadata.json is still written as a fallback.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { LessBuildContext } from './build-context.js';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createLogger } from './logger.js';

const log = createLogger('core');

/**
 * Serialize resolve.alias for JSON storage.
 * Handles both Record<string, string> and Alias[] formats.
 * Alias[] entries with RegExp `find` are converted to a marker object.
 */
function serializeAlias(
  alias: Record<string, string> | import('vite').Alias[] | undefined | null,
): Record<string, string> | Array<{ find: string; replacement: string }> | null {
  if (!alias) return null;
  if (!Array.isArray(alias)) {
    return Object.entries(alias)
      .map(([find, replacement]) => ({ find, replacement }))
      .sort((a, b) => b.find.length - a.find.length);
  }
  const result: Array<{ find: string; replacement: string }> = [];
  for (const entry of alias) {
    if (typeof entry.find === 'string') {
      result.push({ find: entry.find, replacement: entry.replacement });
    }
    // Skip RegExp find patterns — they can't be JSON-serialized
  }
  result.sort((a, b) => b.find.length - a.find.length);
  return result.length > 0 ? result : null;
}

/** Vite plugin: writes build metadata to ctx and .less/ fallback */
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

      // ─── Write to LessBuildContext (preferred path) ──────────
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

      // ─── Write .less/build-metadata.json (fallback for standalone CLI) ──
      // TODO: Remove once unified build orchestrator is the only entry point
      const lessTmpDir = join(root, '.less');
      mkdirSync(lessTmpDir, { recursive: true });

      const resolveAlias = serializeAlias(ctx?.userResolveAlias || config.resolve?.alias);
      const metadata = {
        islandTagNames: ctx?.islandTagNames || [],
        islandFiles: ctx?.islandFiles || [],
        packageIslands: ctx?.packageIslands || [],
        root,
        outDir,
        base,
        resolveAlias,
        ssrNoExternal,
        islandsDir: options.islandsDir || 'app/islands',
        routesDir: options.routesDir || 'app/routes',
        componentsDir: options.componentsDir || 'app/components',
        middleware: options.middleware || null,
        headExtras: options.headExtras || '',
        html: options.html || {},
        pwa: options.pwa || null,
        upgradeStrategy: options.island?.upgradeStrategy || 'lazy',
        viewTransition: options.viewTransition ?? true,
        speculation: options.speculation ?? null,
      };
      const metadataPath = join(lessTmpDir, 'build-metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      const totalIslands = (ctx?.islandTagNames?.length || 0) + (ctx?.packageIslands?.length || 0);

      log.info('Phase 1 complete — SSR bundle + metadata written');
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

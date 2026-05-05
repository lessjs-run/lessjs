/**
 * @lessjs/core - Build plugin
 * KISS Architecture (K·I·S·S): Knowledge · Isolated · Semantic · Static
 * Build produces only static files (K+S), Islands are the only JS (I).
 * API Routes (S — Serverless extension) deploy separately.
 *
 * v0.3.0: closeBundle no longer nests viteBuild() + createServer().
 * Instead, it writes .kiss/build-metadata.json and instructs the user
 * to run the official build command:
 *
 *   deno task build
 *     Phase 1: vite build  -> SSR bundle + .kiss/build-metadata.json
 *     Phase 2: buildClient -> dist/client/islands/*.js + manifest
 *     Phase 3: buildSSG    -> dist/*.html + post-process
 *
 * This eliminates:
 *   - Watch mode breakage from nested viteBuild() inside Vite hooks
 *   - Cross-instance error stacks that are impossible to debug
 *
 * Phase 2/3 remain available as debug CLIs under src/cli/.
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { FrameworkOptions } from './types.js';
import type { KissBuildContext } from './build-context.js';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

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

/** Vite plugin: writes build metadata for CLI build pipeline */
export function buildPlugin(options: FrameworkOptions = {}, ctx?: KissBuildContext): Plugin {
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
      const kissTmpDir = join(root, '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });

      // Write build metadata — this is the bridge to Phase 2/3 CLI scripts
      const metadata = {
        islandTagNames: ctx?.islandTagNames || [],
        islandFiles: ctx?.islandFiles || [],
        packageIslands: ctx?.packageIslands || [],
        root,
        outDir,
        base,
        // Pass user's resolve alias and ssr.noExternal so CLI scripts
        // can replicate the same module resolution
        // Priority: ctx.userResolveAlias (from config hook) → config.resolve.alias (from configResolved)
        resolveAlias: serializeAlias(ctx?.userResolveAlias || config.resolve?.alias),
        // Priority: options.ssr (from kiss() plugin options) → config.ssr (from Vite config)
        ssrNoExternal: ((options.ssr?.noExternal ||
          (config.ssr as { noExternal?: (string | RegExp)[] } | undefined)?.noExternal) || [])
          .map((item) => {
            if (item instanceof RegExp) {
              return { __type: 'RegExp', source: item.source, flags: item.flags };
            }
            return item;
          }),
        islandsDir: options.islandsDir || 'app/islands',
        routesDir: options.routesDir || 'app/routes',
        componentsDir: options.componentsDir || 'app/components',
        middleware: options.middleware || null,
        headExtras: options.headExtras || '',
        html: options.html || {},
        pwa: options.pwa || null,
        // upgradeStrategy controls when island modules are imported.
        // It is an upgrade timing hint, not a client render runtime.
        upgradeStrategy: options.island?.upgradeStrategy || 'lazy',
      };
      const metadataPath = join(kissTmpDir, 'build-metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      const totalIslands = (ctx?.islandTagNames?.length || 0) + (ctx?.packageIslands?.length || 0);

      console.log('[LessJS] Phase 1 complete — SSR bundle + metadata written');
      if (totalIslands > 0) {
        console.log(`[LessJS] ${totalIslands} island(s) detected — run the full build command next.`);
        console.log('[LessJS]   deno task build          (compile islands + render static HTML)');
      } else {
        console.log('[LessJS] No islands — static pages only, zero client JS');
        console.log('[LessJS] Run: deno task build       (render static HTML)');
      }
    },
  };
}

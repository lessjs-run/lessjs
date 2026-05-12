/**
 * @lessjs/core - CLI: Client Island Build
 *
 * Client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * ADR 0011: This module exports buildClient() only — it is called from
 * closeBundle() in less:build plugin. No longer a standalone CLI entry.
 * ctx parameter is required (no globalThis fallback).
 *
 * Resolution: No Vite resolve.alias. The client build runs with
 * root = workspace root so Vite finds the workspace deno.json
 * and resolves all @lessjs/* packages through Deno natively.
 *
 * Usage:
 *   deno task build  (unified entry — runs all 3 phases)
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { type ClientIslandEntry, generateClientEntry } from '../entry-generators.js';
import type { LessBuildContext } from '../build-context.js';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('ssg');

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:less-client-entry';
const RESOLVED_CLIENT_ENTRY_ID = '\0' + VIRTUAL_CLIENT_ENTRY_ID;

async function buildClient(ctx: LessBuildContext): Promise<void> {
  const userRoot = ctx.root || process.cwd();
  const workspaceRoot = resolve(userRoot, '..');
  const wwwRel = basename(userRoot); // e.g. "www"

  const outDir = ctx.outDir || 'dist';
  const islandsDir = ctx.islandsDir || 'app/islands';
  const localIslands = ctx.islandTagNames || [];
  const localIslandFiles = ctx.islandFiles || [];
  const packageIslands = ctx.packageIslands || [];

  if (localIslands.length === 0 && packageIslands.length === 0) {
    log.info('No islands found — zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslands.length;
  log.info(`Building client bundle for ${totalIslands} island(s)...`);

  // Generate client entry code
  const islandEntries: ClientIslandEntry[] = [
    ...localIslands.map((tagName: string, i: number) => ({
      tagName,
      modulePath: resolve(
        userRoot,
        localIslandFiles[i]
          ? `${islandsDir}/${localIslandFiles[i]}`
          : `${islandsDir}/${tagName}.ts`,
      ).replace(/\\/g, '/'),
      isPackage: false,
      strategy: (ctx as unknown as { localIslandStrategies?: string[] })
          .localIslandStrategies?.[i] === 'eager'
        ? 'eager' as const
        : undefined,
    })),
    ...packageIslands.map(
      (island) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        isPackage: true,
        strategy: island.strategy === 'eager' ? 'eager' as const : 'lazy' as const,
      }),
    ),
  ];

  const clientEntryCode = generateClientEntry(islandEntries);

  // Restore RegExp from serialized noExternal patterns
  const noExternalPatterns = (ctx.ssrNoExternal || []).map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && (item as Record<string, unknown>).__type === 'RegExp') {
      return new RegExp(
        (item as { source: string; flags: string }).source,
        (item as { source: string; flags: string }).flags,
      );
    }
    return item;
  });

  const clientOutDir = resolve(userRoot, outDir, 'client');
  const clientBase = ctx.base || '/';
  const clientConfig: InlineConfig = {
    configFile: false,
    // Use workspace root so Vite finds workspace deno.json
    // and resolves @lessjs/* through Deno natively (zero aliases).
    root: workspaceRoot,
    base: `${clientBase}client/`,
    logLevel: 'warn',
    build: {
      outDir: clientOutDir,
      emptyOutDir: true,
      minify: 'oxc',
      // @ts-ignore — Vite's own manifest option (not Rollup's)
      manifest: true,
      rollupOptions: {
        input: { client: VIRTUAL_CLIENT_ENTRY_ID },
        output: {
          format: 'esm',
          entryFileNames: 'islands/[name].js',
          chunkFileNames: 'islands/[name]-[hash].js',
          manualChunks(id: string) {
            // Match local islands under www/ (root is workspace root)
            if (id.includes(`/${wwwRel}/${islandsDir}/`)) {
              const match = id.match(/\/([^/]+)\.(ts|js)$/);
              if (match) return `island-${match[1]}`;
            }
            for (const island of packageIslands) {
              if (id.includes(island.modulePath)) return `island-${island.tagName}`;
            }
          },
        },
      },
    },
    ssr: {
      noExternal: (noExternalPatterns.length > 0 ? noExternalPatterns : undefined) as
        | (string | RegExp)[]
        | undefined,
    },
    plugins: [
      // ADR 0010: Virtual client entry module
      // Replaces .less/.less-client-entry.ts file write
      {
        name: 'less:virtual-client-entry',
        resolveId(id) {
          if (id === VIRTUAL_CLIENT_ENTRY_ID) return RESOLVED_CLIENT_ENTRY_ID;
        },
        load(id) {
          if (id === RESOLVED_CLIENT_ENTRY_ID) return clientEntryCode;
        },
      },
    ],
  };

  try {
    await viteBuild(clientConfig);
    log.info('Client bundle built → ' + clientOutDir);

    const { printBuildManifest } = await import('../build-manifest.js');
    printBuildManifest({ root, outDir, phase: 2 });
  } catch (error) {
    log.error('Client build failed:', error);
    throw error;
  }
}

export { buildClient };

/**
 * @lessjs/core - CLI: Client Island Build
 *
 * Client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * ADR 0010: Virtual module `virtual:less-client-entry` replaces
 * .less/.less-client-entry.ts file write. All metadata flows through
 * LessBuildContext — no filesystem IPC.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build  (recommended — unified entry)
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { resolve } from 'node:path';
import process from 'node:process';
import { type ClientIslandEntry, generateClientEntry } from '../entry-generators.js';
import type { LessBuildContext } from '../build-context.js';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:less-client-entry';
const RESOLVED_CLIENT_ENTRY_ID = '\0' + VIRTUAL_CLIENT_ENTRY_ID;

async function buildClient(ctx: LessBuildContext): Promise<void> {
  const root = ctx.root || process.cwd();
  const outDir = ctx.outDir || 'dist';
  const islandsDir = ctx.islandsDir || 'app/islands';
  const localIslands = ctx.islandTagNames || [];
  const localIslandFiles = ctx.islandFiles || [];
  const packageIslands = ctx.packageIslands || [];

  // Resolve alias for client build
  const resolveAlias = ctx.userResolveAlias;
  const serializedAlias = resolveAlias
    ? (Array.isArray(resolveAlias)
      ? resolveAlias.filter((a) => typeof a.find === 'string').map((a) => ({
        find: a.find as string,
        replacement: a.replacement,
      }))
      : Object.entries(resolveAlias).map(([find, replacement]) => ({ find, replacement })))
    : null;

  if (serializedAlias) {
    log.info('resolveAlias: ' + JSON.stringify(serializedAlias, null, 2));
  } else {
    log.info('WARNING: no resolveAlias in build metadata — island imports may fail');
  }

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
        root,
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

  const clientOutDir = resolve(root, outDir, 'client');
  const clientBase = ctx.base || '/';
  const clientConfig: InlineConfig = {
    configFile: false,
    root,
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
            if (id.includes(`/${islandsDir}/`)) {
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
    resolve: serializedAlias ? { alias: serializedAlias } : undefined,
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

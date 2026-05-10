/**
 * @lessjs/core - CLI: Client Island Build
 *
 * Standalone client build for Island components.
 * Produces dist/client/islands/*.js + manifest for SSG post-processing.
 *
 * This is Phase 2 of the LessJS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .less/build-metadata.json
 *   Phase 2 (this script): Client island chunks
 *   Phase 3 (build-ssg.ts): SSG rendering + post-processing
 *
 * When ctx is provided, reads metadata from LessBuildContext instead of
 * .less/build-metadata.json (ADR 0008 Phase A).
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build-client
 *   deno task build:client
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { type ClientIslandEntry, generateClientEntry } from '../entry-generators.js';
import type { LessBuildContext } from '../build-context.js';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

interface BuildMetadata {
  islandTagNames: string[];
  islandFiles: string[];
  packageIslands: Array<
    { tagName: string; modulePath: string; strategy?: 'eager' | 'lazy' | 'idle' | 'visible' }
  >;
  root: string;
  outDir: string;
  base: string;
  resolveAlias: Record<string, string> | Array<{ find: string; replacement: string }> | null;
  ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[];
  islandsDir: string;
}

/** Read build metadata from ctx (preferred) or .less/build-metadata.json (fallback) */
function getBuildMetadata(ctx?: LessBuildContext): BuildMetadata | null {
  if (ctx && ctx.root) {
    // Read from ctx (ADR 0008 Phase A — no .less/ IPC)
    const resolveAlias = ctx.userResolveAlias;
    const serializedAlias = resolveAlias
      ? (Array.isArray(resolveAlias)
        ? resolveAlias.filter((a) => typeof a.find === 'string').map((a) => ({
          find: a.find as string,
          replacement: a.replacement,
        }))
        : Object.entries(resolveAlias).map(([find, replacement]) => ({ find, replacement })))
      : null;

    return {
      islandTagNames: ctx.islandTagNames,
      islandFiles: ctx.islandFiles,
      packageIslands: ctx.packageIslands,
      root: ctx.root,
      outDir: ctx.outDir,
      base: ctx.base,
      resolveAlias: serializedAlias,
      ssrNoExternal: ctx.ssrNoExternal,
      islandsDir: ctx.islandsDir,
    };
  }

  // Fallback: read from .less/build-metadata.json
  const root = process.cwd();
  const metadataPath = join(root, '.less', 'build-metadata.json');
  try {
    const raw = readFileSync(metadataPath, 'utf-8');
    return JSON.parse(raw) as BuildMetadata;
  } catch {
    return null;
  }
}

async function buildClient(ctx?: LessBuildContext): Promise<void> {
  const metadata = getBuildMetadata(ctx);

  if (!metadata) {
    log.info('No build metadata found — skipping client build');
    log.info('Run `vite build` first (Phase 1) or use unified build() orchestrator');
    return;
  }

  const root = metadata.root || process.cwd();
  const outDir = metadata.outDir || 'dist';
  const islandsDir = metadata.islandsDir || 'app/islands';
  const localIslands = metadata.islandTagNames || [];
  const localIslandFiles = metadata.islandFiles || [];
  const packageIslands = metadata.packageIslands || [];

  // Debug: log resolve aliases for CI troubleshooting
  if (metadata.resolveAlias) {
    log.info('resolveAlias: ' + JSON.stringify(metadata.resolveAlias, null, 2));
  } else {
    log.info('WARNING: no resolveAlias in build metadata — island imports may fail');
  }

  if (localIslands.length === 0 && packageIslands.length === 0) {
    log.info('No islands found — zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslands.length;
  log.info(`Building client bundle for ${totalIslands} island(s)...`);

  // Auto-generate client entry from island list
  const lessTmpDir = join(root, '.less');
  mkdirSync(lessTmpDir, { recursive: true });
  const clientEntryPath = join(lessTmpDir, '.less-client-entry.ts');

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
      strategy: (metadata as unknown as { localIslandStrategies?: string[] })
          .localIslandStrategies?.[i] === 'eager'
        ? 'eager' as const
        : undefined,
    })),
    ...packageIslands.map(
      (island: { tagName: string; modulePath: string; strategy?: string }) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        isPackage: true,
        strategy: island.strategy === 'eager' ? 'eager' as const : 'lazy' as const,
      }),
    ),
  ];

  const clientEntryCode = generateClientEntry(islandEntries);
  writeFileSync(clientEntryPath, clientEntryCode, 'utf-8');

  // Restore RegExp from JSON serialization
  const noExternalPatterns = (metadata.ssrNoExternal || []).map((item) => {
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
  const clientBase = metadata.base || '/';
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
        input: { client: clientEntryPath },
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
    resolve: metadata.resolveAlias ? { alias: metadata.resolveAlias } : undefined,
    ssr: {
      noExternal: (noExternalPatterns.length > 0 ? noExternalPatterns : undefined) as
        | (string | RegExp)[]
        | undefined,
    },
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

// CLI entry point
if (import.meta.main) {
  buildClient().catch((err) => {
    log.error('Client build failed:', err);
    process.exit(1);
  });
}

export { buildClient };

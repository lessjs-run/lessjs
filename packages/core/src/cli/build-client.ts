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
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build-client
 *   deno task build:client
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { type ClientIslandEntry, generateClientEntry } from '../entry-generators.js';

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

async function buildClient(): Promise<void> {
  const root = process.cwd();

  // Read island metadata from Phase 1 output
  const metadataPath = join(root, '.less', 'build-metadata.json');
  let metadata: BuildMetadata;

  try {
    const raw = readFileSync(metadataPath, 'utf-8');
    metadata = JSON.parse(raw);
  } catch (e) {
    console.log('[LessJS] No .less/build-metadata.json found — skipping client build');
    console.log('[LessJS] Run `vite build` first (Phase 1) to generate island metadata');
    console.debug(`[LessJS] Metadata read error: ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  const outDir = metadata.outDir || 'dist';
  const islandsDir = metadata.islandsDir || 'app/islands';
  const localIslands = metadata.islandTagNames || [];
  const localIslandFiles = metadata.islandFiles || [];
  const packageIslands = metadata.packageIslands || [];

  // Debug: log resolve aliases for CI troubleshooting
  if (metadata.resolveAlias) {
    console.log('[LessJS] resolveAlias:', JSON.stringify(metadata.resolveAlias, null, 2));
  } else {
    console.log('[LessJS] WARNING: no resolveAlias in build metadata — island imports may fail');
  }

  if (localIslands.length === 0 && packageIslands.length === 0) {
    console.log('[LessJS] No islands found — zero client JS output');
    return;
  }

  const totalIslands = localIslands.length + packageIslands.length;
  console.log(`[LessJS] Building client bundle for ${totalIslands} island(s)...`);

  // Auto-generate client entry from island list
  const lessTmpDir = join(root, '.less');
  mkdirSync(lessTmpDir, { recursive: true });
  const clientEntryPath = join(lessTmpDir, '.less-client-entry.ts');

  const islandEntries: ClientIslandEntry[] = [
    ...localIslands.map((tagName: string, i: number) => ({
      tagName,
      // Use file path if available (supports subdirectory islands).
      // The tagName fallback keeps generated test metadata compact.
      modulePath: resolve(
        root,
        localIslandFiles[i]
          ? `${islandsDir}/${localIslandFiles[i]}`
          : `${islandsDir}/${tagName}.ts`,
      ).replace(/\\/g, '/'),
      isPackage: false,
      // Local islands default to lazy; per-island strategy will be
      // supported once build-metadata carries it from route-scanner.
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
  // JSON.stringify turns RegExp into {} — we reconstruct via __type marker
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
  // base must match the deployed URL prefix for client assets.
  // The SSG output places client JS at /client/islands/*.js,
  // so the client build's base must be '/client/' so that
  // Vite generates correct dynamic-import URLs (__vite__mapDeps).
  // Without this, preload links point to /islands/*.js (404)
  // instead of /client/islands/*.js.
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
    // Pass user's resolve alias from Phase 1 so island imports resolve correctly
    resolve: metadata.resolveAlias ? { alias: metadata.resolveAlias } : undefined,
    // SSR noExternal: ensures packages like @lessjs/ui (with decorators)
    // are bundled by Vite instead of left as bare imports
    ssr: {
      noExternal: (noExternalPatterns.length > 0 ? noExternalPatterns : undefined) as
        | (string | RegExp)[]
        | undefined,
    },
  };

  try {
    await viteBuild(clientConfig);
    console.log('[LessJS] Client bundle built →', clientOutDir);

    // Build observability: print manifest with island sizes
    const { printBuildManifest } = await import('../build-manifest.js');
    printBuildManifest({ root, outDir, phase: 2 });
  } catch (error) {
    console.error('[LessJS] Client build failed:', error);
    throw error;
  }
}

// CLI entry point
if (import.meta.main) {
  buildClient().catch((err) => {
    console.error('[LessJS] Client build failed:', err);
    process.exit(1);
  });
}

export { buildClient };

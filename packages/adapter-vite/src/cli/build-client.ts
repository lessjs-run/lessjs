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
 * Usage:
 *   deno task build  (unified entry — runs all 3 phases)
 */

import { build as viteBuild, type InlineConfig } from 'vite';
import { resolve } from 'node:path';
import process from 'node:process';
import { type ClientIslandEntry, generateClientEntry } from '../entry-generators.js';
import type { LessBuildContext } from '../build-context.js';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('ssg');

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:less-client-entry';
const RESOLVED_CLIENT_ENTRY_ID = '\0' + VIRTUAL_CLIENT_ENTRY_ID;

// ─── Alias auto-generation from workspace ────────────────────────────

interface AliasEntry {
  find: string;
  replacement: string;
}

/**
 * Walk up from startDir to find a deno.json with a "workspace" field.
 * Returns the directory containing the workspace deno.json, or null.
 */
async function findWorkspaceRoot(startDir: string): Promise<string | null> {
  let dir = resolve(startDir);
  const fsRoot = resolve('/');
  while (dir !== fsRoot && dir !== resolve(dir, '..')) {
    try {
      const path = resolve(dir, 'deno.json');
      const raw = await Deno.readTextFile(path);
      const cfg = JSON.parse(raw);
      if (cfg.workspace && Array.isArray(cfg.workspace)) return dir;
    } catch { /* not found or no workspace */ }
    dir = resolve(dir, '..');
  }
  return null;
}

/**
 * Generate Vite resolve.alias entries from all @lessjs/* workspace packages.
 * Each package's deno.json exports become aliases:
 *   "."        → { find: "@lessjs/pkg", replacement: "<dir>/src/index.ts" }
 *   "./foo"    → { find: "@lessjs/pkg/foo", replacement: "<dir>/src/foo.ts" }
 */
async function generateWorkspaceAliases(workspaceRoot: string): Promise<AliasEntry[]> {
  const rootConfig = JSON.parse(
    await Deno.readTextFile(resolve(workspaceRoot, 'deno.json')),
  );
  const members: string[] = rootConfig.workspace || [];
  const aliases: AliasEntry[] = [];

  for (const member of members) {
    const memberDir = resolve(workspaceRoot, member);
    let memberCfg: Record<string, unknown>;
    try {
      memberCfg = JSON.parse(await Deno.readTextFile(resolve(memberDir, 'deno.json')));
    } catch {
      continue;
    }

    const name = memberCfg.name as string | undefined;
    const exports = memberCfg.exports as Record<string, string> | string | undefined;
    if (!name || !exports) continue;

    if (typeof exports === 'string') {
      // Single export — no subpaths
      aliases.push({ find: name, replacement: resolve(memberDir, exports) });
      continue;
    }

    // Build subpath aliases first (Vite prefix matching: subpath before parent)
    for (const [exportPath, sourcePath] of Object.entries(exports)) {
      if (exportPath === '.') continue; // parent alias added last
      // "./foo" → "@lessjs/pkg/foo"
      const subpath = exportPath.replace(/^\.\//, '/');
      aliases.push({
        find: `${name}${subpath}`,
        replacement: resolve(memberDir, sourcePath as string),
      });
    }

    // Parent alias last
    if (exports['.']) {
      aliases.push({ find: name, replacement: resolve(memberDir, exports['.'] as string) });
    }
  }

  return aliases;
}

// ─── Build function ──────────────────────────────────────────────────

async function buildClient(ctx: LessBuildContext): Promise<void> {
  const root = ctx.root || process.cwd();
  const outDir = ctx.outDir || 'dist';
  const islandsDir = ctx.islandsDir || 'app/islands';
  const localIslands = ctx.islandTagNames || [];
  const localIslandFiles = ctx.islandFiles || [];
  const packageIslands = ctx.packageIslands || [];

  // Resolve alias for client build
  // 1. Prefer user-provided aliases (vite.config.ts resolve.alias)
  // 2. Otherwise, auto-generate from Deno workspace packages
  const resolveAlias = ctx.userResolveAlias;
  let serializedAlias: AliasEntry[] | null = null;

  if (resolveAlias) {
    serializedAlias = Array.isArray(resolveAlias)
      ? resolveAlias.filter((a) => typeof a.find === 'string').map((a) => ({
        find: a.find as string,
        replacement: a.replacement,
      }))
      : Object.entries(resolveAlias).map(([find, replacement]) => ({ find, replacement }));
    log.info('resolveAlias: ' + JSON.stringify(serializedAlias, null, 2));
  } else {
    // Auto-generate from workspace packages
    const workspaceRoot = await findWorkspaceRoot(root);
    if (workspaceRoot) {
      serializedAlias = await generateWorkspaceAliases(workspaceRoot);
      log.info(
        `Auto-generated ${serializedAlias.length} alias(es) from workspace: ${workspaceRoot}`,
      );
    } else {
      log.info('WARNING: no resolveAlias and no workspace found — island imports may fail');
    }
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

/**
 * @lessjs/adapter-vite — Internal plugin factory.
 *
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * This is the core build plugin implementation. It is NOT part of the
 * public API. Use `lessPipeline()` from the main entry instead.
 *
 * Internal only: called by lessPipeline() and the @lessjs/app umbrella.
 */

import type { Alias, Plugin } from 'vite';
import type {
  FrameworkOptions,
  HydrationStrategy,
  LessPackageManifest,
  RouteEntry,
} from '@lessjs/core';

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { LessError } from '@lessjs/core/errors';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('adapter-vite');

import honoDevServer from '@hono/vite-dev-server';
import { LessBuildContext } from './build-context.js';
import { findWorkspaceRoot, generateWorkspaceAliases } from './workspace-alias.js';
import { buildPlugin } from './build.js';
import { devtoolsPlugin } from './devtools/index.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { buildHeadExtras } from './head-injection.js';
import { islandTransformPlugin } from './island-transform.js';
import { optionalPackageStubsPlugin } from './optional-package-stubs.js';
import { createGeneratedDataResolverPlugin } from './generated-data-resolver.js';
import {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './route-scanner.js';
import { createCoreResolvePlugin } from './subpath-resolver.js';
import { mdxPlugin } from './plugin-mdx.js';

type LessAliasOptions = Record<string, string> | Alias[] | null | undefined;

function mergeAliasOptions(
  primary: LessAliasOptions,
  fallback: LessAliasOptions,
): Record<string, string> | Alias[] | null {
  if (!primary) return fallback ?? null;
  if (!fallback) return primary;

  const merged: Alias[] = [];
  const append = (aliases: LessAliasOptions): void => {
    if (!aliases) return;
    if (Array.isArray(aliases)) {
      merged.push(...aliases);
      return;
    }
    for (const [find, replacement] of Object.entries(aliases)) {
      merged.push({ find, replacement });
    }
  };

  append(primary);
  append(fallback);
  return merged;
}

/**
 * LessJS Framework Vite plugin — internal plugin factory.
 *
 * This is the core build plugin implementation. It is NOT part of the
 * public API. Use `lessPipeline()` from @lessjs/adapter-vite instead.
 *
 * Internal only: called by lessPipeline() and the @lessjs/app umbrella.
 * Jamstack: M=SSG+DSD, A=API Routes, J=Islands.
 *
 * @param options - Framework options
 * @param externalCtx - Optional shared LessBuildContext (used by lessjs() umbrella)
 * @internal
 */
export function less(
  options: FrameworkOptions = {},
  externalCtx?: LessBuildContext,
): Plugin[] {
  const metaUrl = import.meta.url;

  // Build head extras (validated HTML fragments, stylesheets, scripts)
  const { headExtras, allowHeadExtrasScripts } = buildHeadExtras(options);

  const resolvedOptions: FrameworkOptions & {
    allowHeadExtrasScripts?: boolean;
  } = {
    ...options,
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras,
    allowHeadExtrasScripts,
  };

  const ctx = externalCtx || new LessBuildContext(resolvedOptions);

  // Pre-generate workspace aliases (sync, once, cached in ctx).
  // Phase 1 config, Phase 2 client build, and Phase 3 SSG build
  // all read ctx.phase1.userResolveAlias - zero redundant generation.
  try {
    const wsRoot = findWorkspaceRoot(process.cwd());
    if (wsRoot) {
      ctx.phase1.userResolveAlias = generateWorkspaceAliases(wsRoot);
      log.info(
        `Auto-generated ${
          (ctx.phase1.userResolveAlias as Array<unknown>).length
        } resolve alias(es) from workspace`,
      );
    }
  } catch {
    log.debug('Workspace not available - aliases stay null');
  }

  const VIRTUAL_ENTRY_ID = 'virtual:less-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;
  const VIRTUAL_BUILD_TRIGGER_ID = 'virtual:less-build-trigger';
  const RESOLVED_BUILD_TRIGGER_ID = '\0' + VIRTUAL_BUILD_TRIGGER_ID;

  // v0.19.1 Phase 6: Discover client-only tags from Hub registry data (ADR-0035 A1)
  // Imports generated hub-data.ts at build time and extracts tagNames where
  // compatibility is 'client-only'. This ensures Shoelace/Media Chrome
  // tags are in __CLIENT_ONLY_TAGS__ without requiring CEM manifests.
  let _cachedHubClientOnlyTags: string[] | null = null;
  async function discoverHubClientOnlyTags(root: string, _routesDir: string): Promise<string[]> {
    if (_cachedHubClientOnlyTags !== null) return _cachedHubClientOnlyTags;
    try {
      const hubDataPath = join(root, 'app', 'data', 'registry', 'hub-data.ts');
      const hubData = await import(pathToFileURL(hubDataPath).href) as {
        default?: Record<string, {
          tags?: Array<{ tagName?: string; compatibility?: string }>;
        }>;
      };
      const tags = Object.values(hubData.default ?? {}).flatMap((record) =>
        (record.tags ?? [])
          .filter((tag) => tag.compatibility === 'client-only' && tag.tagName)
          .map((tag) => tag.tagName!)
      );
      _cachedHubClientOnlyTags = tags;
      if (tags.length > 0) {
        log.info(`Hub client-only tags: ${tags.length} tag(s) discovered from ${hubDataPath}`);
      }
      return tags;
    } catch {
      // Hub data not available - skip (non-fatal)
      _cachedHubClientOnlyTags = [];
      return [];
    }
  }

  function generateEntry(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageManifests: LessPackageManifest[] = [],
    islandFiles: string[] = [],
  ): string {
    return generateHonoEntryCode(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      islandFiles,
      islandMeta: ctx.phase1.islandMeta,
      packageManifests,
      headExtras: resolvedOptions.headExtras,
      allowHeadExtrasScripts,
      html: resolvedOptions.html,
      upgradeStrategy: resolvedOptions.island?.upgradeStrategy || 'idle',
      hubClientOnlyTags: _cachedHubClientOnlyTags || [],
      appShell: resolvedOptions.appShell,
      layouts: resolvedOptions.layouts,
    });
  }

  const corePlugin: Plugin = {
    name: 'less:core',

    config(userConfig) {
      if (userConfig.resolve?.alias) {
        ctx.phase1.userResolveAlias = mergeAliasOptions(
          userConfig.resolve.alias as Record<string, string> | Alias[],
          ctx.phase1.userResolveAlias,
        );
      }

      const aliases = ctx.phase1.userResolveAlias as
        | Alias[]
        | Record<string, string>
        | null;

      return {
        resolve: aliases ? { alias: aliases } : undefined,
        build: {
          // The generated virtual entry intentionally contains the whole route graph.
          // Keep the budget explicit so Vite does not report it as an unexpected warning.
          chunkSizeWarningLimit: 1500,
          rollupOptions: {
            input: [VIRTUAL_BUILD_TRIGGER_ID],
          },
        },
      };
    },

    configResolved(cfg) {
      if (cfg.resolve?.alias && !ctx.phase1.userResolveAlias) {
        ctx.phase1.userResolveAlias = cfg.resolve.alias;
      }
      // v0.14.6: Generate placeholder entry code with empty routes in configResolved.
      // This is a Vite requirement - the virtual entry must exist before buildStart().
      // The real entry with actual routes is generated in buildStart() which runs later.
      ctx.phase1.honoEntryCode = generateEntry(
        [],
        ctx.phase1.islandTagNames,
        ctx.phase1.packageManifests,
        ctx.phase1.islandFiles,
      );
    },

    async buildStart() {
      ctx.reset();

      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(
          process.cwd(),
          resolvedOptions.islandsDir || 'app/islands',
        );
        const islandFiles = await scanIslands(islandsRoot);
        ctx.phase1.islandTagNames = islandFiles.map((f) => fileToTagName(f));
        ctx.phase1.islandFiles = islandFiles;
        const { scanIslandMeta } = await import('./route-scanner.js');
        ctx.phase1.islandMeta = await scanIslandMeta(islandsRoot, islandFiles);

        if (
          resolvedOptions.packageIslands &&
          resolvedOptions.packageIslands.length > 0
        ) {
          ctx.phase1.packageManifests = await scanPackageManifests(
            resolvedOptions.packageIslands,
          );
          if (ctx.phase1.packageManifests.length > 0) {
            // Extract island declarations from manifests
            ctx.phase1.packageIslandDecls = ctx.phase1.packageManifests.flatMap((pkg) =>
              pkg.declarations
                .filter((d) => d.less?.module)
                .map((d) => ({
                  tagName: d.tagName,
                  modulePath: d.less!.module!,
                  isPackage: true,
                  hydrate: d.less?.hydrate as HydrationStrategy | undefined,
                  ssr: d.less?.hydrate === 'only' ? false : d.less?.ssr,
                  dsd: d.less?.hydrate === 'only' ? false : d.less?.dsd,
                }))
            );
            log.info(
              `Package islands: ${ctx.phase1.packageIslandDecls.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        // Cache routes for lazy load() regeneration (ctx.blogOptions may not
        // be set yet - lessContent() buildStart() runs after this one).
        ctx.phase1.cachedRoutes = routes;

        ctx.phase1.honoEntryCode = generateEntry(
          routes,
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
        const { buildEntryDescriptor } = await import('./entry-descriptor.js');

        // v0.18.0: CEM auto-detection - scan node_modules for custom-elements.json
        // without importing or executing any package code.
        try {
          const nodeModulesDir = join(process.cwd(), 'node_modules');
          ctx.phase1.cemClassifications = await detectAndClassifyCemPackages(nodeModulesDir);
          if (ctx.phase1.cemClassifications.length > 0) {
            log.info(
              `CEM auto-detection: classified ${ctx.phase1.cemClassifications.length} component(s) from node_modules`,
            );
          }
        } catch (err) {
          // CEM detection is best-effort - never fail the build
          log.debug(
            `CEM auto-detection failed (non-fatal): ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          ctx.phase1.cemClassifications = [];
        }

        ctx.phase1.ssrAdmissionPlan = buildEntryDescriptor(routes, {
          routesDir: resolvedOptions.routesDir,
          islandsDir: resolvedOptions.islandsDir,
          islandTagNames: ctx.phase1.islandTagNames,
          islandFiles: ctx.phase1.islandFiles,
          islandMeta: ctx.phase1.islandMeta,
          packageManifests: ctx.phase1.packageManifests,
          cemClassifications: ctx.phase1.cemClassifications,
          hubClientOnlyTags: await discoverHubClientOnlyTags(
            process.cwd(),
            resolvedOptions.routesDir || 'app/routes',
          ),
          appShell: resolvedOptions.appShell,
          layouts: resolvedOptions.layouts,
        }).ssrAdmissionPlan;
        const pageCount = routes.filter(
          (r) => r.type === 'page' && !r.special,
        ).length;
        const apiCount = routes.filter(
          (r) => r.type === 'api' && !r.special,
        ).length;
        const totalIslands = ctx.phase1.islandTagNames.length +
          ctx.phase1.packageIslandDecls.length;
        log.info(
          `Routes: ${pageCount} page(s), ${apiCount} API route(s), ` +
            `${totalIslands} island(s) - LessJS Architecture`,
        );
      } catch (err) {
        throw new LessError(
          `Route scan failed: ${err instanceof Error ? err.message : String(err)}`,
          'ROUTE_SCAN_ERROR',
          500,
          false,
        );
      }
    },
  };

  const virtualEntryPlugin: Plugin = {
    name: 'less:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID;
      if (id === VIRTUAL_BUILD_TRIGGER_ID) return RESOLVED_BUILD_TRIGGER_ID;
    },

    load(id) {
      if (id === RESOLVED_BUILD_TRIGGER_ID) {
        return 'export default null;';
      }
      if (id === RESOLVED_ENTRY_ID) {
        // Always regenerate to pick up late-settled ctx fields (e.g., blogOptions
        // from lessContent() buildStart() which runs after less:core buildStart()).
        // In dev mode, load() is called lazily by the SSR runner, so all buildStart()
        // hooks have completed by this point.
        return generateEntry(
          ctx.phase1.cachedRoutes || [],
          ctx.phase1.islandTagNames,
          ctx.phase1.packageManifests,
          ctx.phase1.islandFiles,
        );
      }
    },
  };

  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin;

  return [
    mdxPlugin(),
    corePlugin,
    createGeneratedDataResolverPlugin({ root: process.cwd() }),
    createCoreResolvePlugin(metaUrl),
    optionalPackageStubsPlugin(),
    virtualEntryPlugin,
    devServerPlugin,
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
    devtoolsPlugin(),
  ];
}

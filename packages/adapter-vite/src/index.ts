/**
 * @lessjs/adapter-vite - Vite build orchestration adapter.
 *
 * Provides the `less()` Vite plugin that handles:
 * - Route scanning and virtual Hono entry generation
 * - Dev server integration via @hono/vite-dev-server
 * - Island marking transform
 * - SSG build pipeline (Phase 1/2/3)
 * - Core subpath resolution (ADR 0016)
 *
 * Runtime code (renderDSD, island, escapeHtml, etc.) lives in @lessjs/core.
 * This package only contains Vite-specific build orchestration.
 *
 * For the unified lessjs() entry, use @lessjs/app instead.
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from '@lessjs/core';

import { join } from 'node:path';
import process from 'node:process';
import { transform as esbuildTransform } from 'esbuild';
import { LessError } from '@lessjs/core/errors';
import { createLogger } from '@lessjs/core/logger';
import { escapeAttr as escapeHtmlAttr } from '@lessjs/core/render-dsd';

const log = createLogger('adapter-vite');

import honoDevServer from '@hono/vite-dev-server';
import { LessBuildContext } from './build-context.js';
import { buildPlugin } from './build.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { islandTransformPlugin } from './island-transform.js';
import { fileToTagName, scanIslands, scanPackageIslands, scanRoutes } from './route-scanner.js';
import { createBlogDataPlugin, createI18nDataPlugin } from './virtual-data.js';

// ─── Subpath resolution (ADR 0016 — JSR remote only) ─────────────
//
// ADR 0018 Phase 0: buildCoreSubpathAliases() DELETED.
// Local mode now relies on @deno/vite-plugin for bare specifier resolution.
//
// Remote JSR resolution (createCoreResolvePlugin) is retained because
// JSR packages are not in node_modules and require virtual module loading.
//
// When @deno/vite-plugin is integrated, it will handle local bare specifier
// resolution through Deno's import map. The remote plugin remains as fallback
// for JSR execution contexts.

/** Virtual module ID prefix for JSR remote resolution */
const VIRTUAL_CORE_PREFIX = '\0lessjs:core/src/';

/** Mapping of @lessjs/core/* subpath specifiers to source files (used by JSR remote resolution only) */
const CORE_SUBPATHS: Record<string, string> = {
  'html-escape': 'html-escape.ts',
  'render-dsd': 'render-dsd.ts',
  'render-nested': 'render-nested.ts',
  'adapter-registry': 'adapter-registry.ts',
  'ssr-handler': 'ssr-handler.ts',
  'logger': 'logger.ts',
  'build-context': 'build-context.ts',
  'navigation': 'navigation.ts',
};

// ADR 0018: buildCoreSubpathAliases() DELETED.
// Local mode relies on @deno/vite-plugin (to be integrated).
// Remote JSR mode uses createCoreResolvePlugin below.

/** Source cache for JSR-fetched modules (avoids redundant network requests) */
const jsrSourceCache = new Map<string, string>();

/**
 * Create the core subpath resolution plugin for JSR remote execution.
 *
 * When @lessjs/core is loaded from JSR (https:// import.meta.url),
 * Vite's SSR runner cannot load https:// URLs via Node.js ESM loader.
 * This plugin intercepts @lessjs/core/* imports and loads source code
 * through virtual modules, bypassing Node.js ESM loader entirely.
 */
function createCoreResolvePlugin(metaUrl: string): Plugin {
  const isRemote = metaUrl.startsWith('https://') || metaUrl.startsWith('http://');

  // Compute JSR base URL for source fetching.
  let jsrSrcBase = '';
  if (isRemote) {
    // Handle both @version and /version URL formats
    jsrSrcBase = metaUrl
      .replace(/\/src\/index\.ts$/, '/src/')
      .replace(/@(\d+\.\d+\.\d+)\/src\/$/, '/$1/src/');
  }

  return {
    name: 'less:core-resolve',
    enforce: 'pre',

    resolveId(source, importer, options) {
      if (!isRemote) return;

      // Case 1: Bare specifier @lessjs/core or @lessjs/core/*
      if (source === '@lessjs/core' || source.startsWith('@lessjs/core/')) {
        const subpath = source === '@lessjs/core'
          ? 'index.ts'
          : (CORE_SUBPATHS[source.slice('@lessjs/core/'.length)] ||
            `${source.slice('@lessjs/core/'.length)}.ts`);
        return `${VIRTUAL_CORE_PREFIX}${subpath}`;
      }

      // Case 2: Relative imports from within our virtual modules
      if (importer?.startsWith(VIRTUAL_CORE_PREFIX) && source.startsWith('./')) {
        const importerDir = importer.replace(/[/\\][^/\\]+$/, '');
        return `${importerDir}/${source.slice(2)}`;
      }

      // Case 3: Third-party bare specifiers from virtual modules
      if (
        importer?.startsWith(VIRTUAL_CORE_PREFIX) && !source.startsWith('/') &&
        !source.startsWith('.') && !source.startsWith('\0')
      ) {
        return this.resolve(source, undefined, { ...options, skipSelf: true });
      }

      // Case 4: Already-resolved virtual IDs (re-resolve safeguard)
      if (source.startsWith(VIRTUAL_CORE_PREFIX)) {
        return source;
      }
    },

    async load(id) {
      if (!isRemote) return;
      if (!id.startsWith(VIRTUAL_CORE_PREFIX)) return;

      // Check cache
      if (jsrSourceCache.has(id)) return jsrSourceCache.get(id);

      // Normalize .js → .ts (Deno convention: imports use .js, files are .ts)
      let filePath = id.slice(VIRTUAL_CORE_PREFIX.length);
      if (filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
        filePath = filePath.slice(0, -3) + '.ts';
      }

      // Fetch TypeScript source from JSR
      const url = `${jsrSrcBase}${filePath}`;
      let tsCode: string;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(
            `[less:core-resolve] Failed to fetch ${url}: HTTP ${resp.status}`,
          );
        }
        tsCode = await resp.text();
      } catch (err) {
        throw new LessError(
          `Failed to load @lessjs/core module from JSR: ${filePath}. ` +
            `URL: ${url}. Error: ${err instanceof Error ? err.message : String(err)}`,
          'JSR_FETCH_ERROR',
          500,
          false,
        );
      }

      // Compile TypeScript → JavaScript via esbuild
      let jsCode: string;
      try {
        const result = await esbuildTransform(tsCode, {
          loader: 'ts',
          target: 'esnext',
          format: 'esm',
        });
        jsCode = result.code;
      } catch (err) {
        throw new LessError(
          `Failed to compile @lessjs/core module from JSR: ${filePath}. ` +
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          'JSR_COMPILE_ERROR',
          500,
          false,
        );
      }

      // Post-process: rewrite npm: specifiers to bare specifiers.
      jsCode = jsCode.replace(
        /(["'])npm:([^"']+)\1/g,
        (_, quote: string, specifier: string) => {
          const isScoped = specifier.startsWith('@');
          const withoutScope = isScoped ? specifier.slice(1) : specifier;
          const namePart = withoutScope.split('@')[0];
          return `${quote}${isScoped ? '@' : ''}${namePart}${quote}`;
        },
      );

      jsrSourceCache.set(id, jsCode);
      return jsCode;
    },
  };
}

/**
 * LessJS Framework Vite plugin.
 * Jamstack: M=SSG+DSD, A=API Routes, J=Islands.
 *
 * less() handles dev mode plus Phase 1 metadata for production builds.
 *
 * @param options - Framework options
 * @param externalCtx - Optional shared LessBuildContext (used by lessjs() umbrella)
 */
export function less(options: FrameworkOptions = {}, externalCtx?: LessBuildContext): Plugin[] {
  const metaUrl = import.meta.url;

  let headExtras = options.headExtras;

  const validateSafeUrl = (url: string, context: string): string => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
      throw new LessError(
        `Unsafe URL in ${context}: "${url}" - javascript: and data: protocols are not allowed`,
        'UNSAFE_URL',
        400,
        false,
      );
    }
    return url;
  };

  if (options.inject && !headExtras) {
    const fragments: string[] = [];
    for (const href of options.inject.stylesheets || []) {
      validateSafeUrl(href, 'inject.stylesheets');
      const safeHref = escapeHtmlAttr(href);
      fragments.push(`<link rel="stylesheet" href="${safeHref}" />`);
    }
    for (const src of options.inject.scripts || []) {
      validateSafeUrl(src, 'inject.scripts');
      const safeSrc = escapeHtmlAttr(src);
      fragments.push(`<script type="module" src="${safeSrc}"></script>`);
    }
    for (const frag of options.inject.headFragments || []) {
      // Security: warn if fragment contains inline <script> tags
      if (/<script[\s>]/i.test(frag)) {
        log.warn(
          'inject.headFragments contains <script> tags. Ensure this content is ' +
            'developer-controlled, not user-supplied, to prevent XSS. For safe URL injection, ' +
            'use inject.scripts instead.',
        );
      }
      fragments.push(frag);
    }
    headExtras = fragments.join('\n  ');
  }

  const resolvedOptions: FrameworkOptions = {
    ...options,
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras,
  };

  const ctx = externalCtx || new LessBuildContext(resolvedOptions);

  const VIRTUAL_ENTRY_ID = 'virtual:less-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;

  function generateEntry(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageIslands: PackageIslandMeta[] = [],
    islandFiles: string[] = [],
  ): string {
    return generateHonoEntryCode(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      islandFiles,
      packageIslands,
      headExtras: resolvedOptions.headExtras,
      html: resolvedOptions.html,
      upgradeStrategy: resolvedOptions.island?.upgradeStrategy || 'lazy',
    });
  }

  const corePlugin: Plugin = {
    name: 'less:core',

    async config(userConfig) {
      if (userConfig.resolve?.alias && !ctx.userResolveAlias) {
        ctx.userResolveAlias = userConfig.resolve.alias as
          | Record<string, string>
          | import('vite').Alias[];
      }

      // Auto-generate aliases from workspace packages when user
      // doesn't provide explicit aliases (zero-alias config).
      // This is needed because Vite/rolldown doesn't support
      // Deno workspace resolution during builds.
      let workspaceAliases = null;
      if (!userConfig.resolve?.alias) {
        try {
          const { findWorkspaceRoot, generateWorkspaceAliases } =
            await import('./workspace-alias.js');
          const wsRoot = await findWorkspaceRoot(process.cwd());
          if (wsRoot) {
            workspaceAliases = await generateWorkspaceAliases(wsRoot);
            log.info(
              `Auto-generated ${workspaceAliases.length} resolve alias(es) from workspace`,
            );
            ctx.userResolveAlias = workspaceAliases;
          }
        } catch (e) {
          log.warn(`Workspace alias generation skipped: ${e}`);
        }
      }

      return {
        resolve: workspaceAliases ? { alias: workspaceAliases } : undefined,
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      };
    },

    configResolved(cfg) {
      if (cfg.resolve?.alias && !ctx.userResolveAlias) {
        ctx.userResolveAlias = cfg.resolve.alias;
      }
      ctx.honoEntryCode = generateEntry(
        [],
        ctx.islandTagNames,
        ctx.packageIslands,
        ctx.islandFiles,
      );
    },

    async buildStart() {
      ctx.reset();

      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands');
        const islandFiles = await scanIslands(islandsRoot);
        ctx.islandTagNames = islandFiles.map((f) => fileToTagName(f));
        ctx.islandFiles = islandFiles;

        if (resolvedOptions.packageIslands && resolvedOptions.packageIslands.length > 0) {
          ctx.packageIslands = await scanPackageIslands(resolvedOptions.packageIslands);
          if (ctx.packageIslands.length > 0) {
            log.info(
              `Package islands: ${ctx.packageIslands.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        // Cache routes for lazy load() regeneration (ctx.blogOptions may not
        // be set yet — lessContent() buildStart() runs after this one).
        ctx.cachedRoutes = routes;

        ctx.honoEntryCode = generateEntry(
          routes,
          ctx.islandTagNames,
          ctx.packageIslands,
          ctx.islandFiles,
        );
        const pageCount = routes.filter((r) => r.type === 'page' && !r.special).length;
        const apiCount = routes.filter((r) => r.type === 'api' && !r.special).length;
        const totalIslands = ctx.islandTagNames.length + ctx.packageIslands.length;
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
    },

    load(id) {
      if (id === RESOLVED_ENTRY_ID) {
        // Always regenerate to pick up late-settled ctx fields (e.g., blogOptions
        // from lessContent() buildStart() which runs after less:core buildStart()).
        // In dev mode, load() is called lazily by the SSR runner, so all buildStart()
        // hooks have completed by this point.
        return generateEntry(
          ctx.cachedRoutes || [],
          ctx.islandTagNames,
          ctx.packageIslands,
          ctx.islandFiles,
        );
      }
    },
  };

  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin;

  return [
    corePlugin,
    createCoreResolvePlugin(metaUrl),
    createBlogDataPlugin(ctx),
    createI18nDataPlugin(ctx),
    virtualEntryPlugin,
    devServerPlugin,
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
  ];
}

// Re-export build utilities for CLI consumers
export { LessBuildContext } from './build-context.js';
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
  type SpeculationRulesOptions,
} from './ssg-postprocess.js';
export {
  extractCustomElementTags,
  generateIslandManifests,
  type IslandLayerMap,
  type IslandManifestEntry,
  type IslandStrategyMap,
  type PageIslandManifest,
  writeIslandManifests,
} from './island-manifest.js';

export default less;

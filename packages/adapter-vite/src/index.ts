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
import { escapeAttr as escapeHtmlAttr } from '@lessjs/core';

const log = createLogger('adapter-vite');

import honoDevServer from '@hono/vite-dev-server';
import { LessBuildContext } from './build-context.js';
import { findWorkspaceRoot, generateWorkspaceAliases } from './workspace-alias.js';
import { buildPlugin } from './build.js';
import { devtoolsPlugin } from './devtools/index.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { islandTransformPlugin } from './island-transform.js';
import { fileToTagName, scanIslands, scanPackageIslands, scanRoutes } from './route-scanner.js';

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
  let allowHeadExtrasScripts = false;

  const validateSafeUrl = (url: string, context: string): string => {
    // Normalise: decode URL encoding, strip whitespace, lowercase
    const normalised = url.trim();
    try {
      const decoded = decodeURIComponent(normalised); // catch malformed %XX
      const lower = decoded.toLowerCase().trim();
      const blockedProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      for (const proto of blockedProtocols) {
        if (lower.startsWith(proto)) {
          throw new LessError(
            `Unsafe URL in ${context}: "${url}" — ${proto} protocol is not allowed`,
            'UNSAFE_URL',
            400,
            false,
          );
        }
      }
    } catch {
      // decodeURIComponent threw — malformed encoding, treat as unsafe
      throw new LessError(
        `Invalid URL in ${context}: "${url}" — malformed percent-encoding`,
        'UNSAFE_URL',
        400,
        false,
      );
    }
    return normalised;
  };

  if (options.inject && !headExtras) {
    const fragments: string[] = [];

    // headFragments FIRST (meta, styles, anti-flash) — must exist in DOM
    // before scripts that reference them (e.g. theme-init.js removes anti-flash).
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

    // Stylesheets second
    for (const href of options.inject.stylesheets || []) {
      validateSafeUrl(href, 'inject.stylesheets');
      const safeHref = escapeHtmlAttr(href);
      fragments.push(`<link rel="stylesheet" href="${safeHref}" />`);
    }

    // Scripts last — depend on headFragments being in DOM
    for (const script of options.inject.scripts || []) {
      const isObjectScript = typeof script === 'object';
      const src = isObjectScript ? script.src : script;
      validateSafeUrl(src, 'inject.scripts');
      const attrs: Record<string, string | number | boolean> = {
        ...(!isObjectScript || script.type
          ? { type: isObjectScript ? script.type! : 'module' }
          : {}),
        ...(isObjectScript && script.defer ? { defer: true } : {}),
        ...(isObjectScript && script.async ? { async: true } : {}),
        ...(isObjectScript ? script.attrs ?? {} : {}),
        src,
      };
      const attrText = Object.entries(attrs)
        .filter(([, value]) => value !== undefined && value !== false)
        .map(([name, value]) =>
          value === true
            ? escapeHtmlAttr(name)
            : `${escapeHtmlAttr(name)}="${escapeHtmlAttr(String(value))}"`
        )
        .join(' ');
      fragments.push(`<script ${attrText}></script>`);
    }
    headExtras = fragments.join('\n  ');
    allowHeadExtrasScripts = true;
  }

  const resolvedOptions: FrameworkOptions & { allowHeadExtrasScripts?: boolean } = {
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
  // all read ctx.phase1.userResolveAlias — zero redundant generation.
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
    log.debug('Workspace not available — aliases stay null');
  }

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
      allowHeadExtrasScripts,
      html: resolvedOptions.html,
      upgradeStrategy: resolvedOptions.island?.upgradeStrategy || 'lazy',
    });
  }

  const corePlugin: Plugin = {
    name: 'less:core',

    config(userConfig) {
      if (userConfig.resolve?.alias && !ctx.phase1.userResolveAlias) {
        ctx.phase1.userResolveAlias = userConfig.resolve.alias as
          | Record<string, string>
          | import('vite').Alias[];
      }

      const aliases = ctx.phase1.userResolveAlias as
        | import('vite').Alias[]
        | Record<string, string>
        | null;

      return {
        resolve: aliases ? { alias: aliases } : undefined,
        build: {
          // The generated virtual entry intentionally contains the whole route graph.
          // Keep the budget explicit so Vite does not report it as an unexpected warning.
          chunkSizeWarningLimit: 1500,
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      };
    },

    configResolved(cfg) {
      if (cfg.resolve?.alias && !ctx.phase1.userResolveAlias) {
        ctx.phase1.userResolveAlias = cfg.resolve.alias;
      }
      ctx.phase1.honoEntryCode = generateEntry(
        [],
        ctx.phase1.islandTagNames,
        ctx.phase1.packageIslands,
        ctx.phase1.islandFiles,
      );
    },

    async buildStart() {
      ctx.reset();

      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands');
        const islandFiles = await scanIslands(islandsRoot);
        ctx.phase1.islandTagNames = islandFiles.map((f) => fileToTagName(f));
        ctx.phase1.islandFiles = islandFiles;

        if (resolvedOptions.packageIslands && resolvedOptions.packageIslands.length > 0) {
          ctx.phase1.packageIslands = await scanPackageIslands(resolvedOptions.packageIslands);
          if (ctx.phase1.packageIslands.length > 0) {
            log.info(
              `Package islands: ${ctx.phase1.packageIslands.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        // Cache routes for lazy load() regeneration (ctx.blogOptions may not
        // be set yet — lessContent() buildStart() runs after this one).
        ctx.phase1.cachedRoutes = routes;

        ctx.phase1.honoEntryCode = generateEntry(
          routes,
          ctx.phase1.islandTagNames,
          ctx.phase1.packageIslands,
          ctx.phase1.islandFiles,
        );
        const pageCount = routes.filter((r) => r.type === 'page' && !r.special).length;
        const apiCount = routes.filter((r) => r.type === 'api' && !r.special).length;
        const totalIslands = ctx.phase1.islandTagNames.length + ctx.phase1.packageIslands.length;
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
          ctx.phase1.cachedRoutes || [],
          ctx.phase1.islandTagNames,
          ctx.phase1.packageIslands,
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
    corePlugin,
    createCoreResolvePlugin(metaUrl),
    // ADR 0021: Blog/i18n data plugins registered lazily by @lessjs/content
    // and @lessjs/i18n during buildStart(). We dispatch resolve/load to
    // whatever plugin is registered in ctx.plugins at call time.
    dispatchDataPlugin(ctx),
    virtualEntryPlugin,
    devServerPlugin,
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
    devtoolsPlugin(),
  ];
}

/**
 * Dispatch virtual data module resolve/load to plugins registered by
 * @lessjs/content / @lessjs/i18n during buildStart().
 *
 * At less() construction time, ctx.plugins.blogDataPlugin is null because
 * buildStart() hasn't run yet. This dispatcher checks ctx at call time,
 * so the real plugin is used when it's available.
 */
function dispatchDataPlugin(ctx: LessBuildContext): Plugin {
  const ENTRIES: Array<{
    virtual: string;
    resolved: string;
    get: () => Plugin | null;
    emptyCode: string;
  }> = [
    {
      virtual: 'virtual:less-blog-data',
      resolved: '\0virtual:less-blog-data',
      get: () => ctx.plugins.blogDataPlugin,
      emptyCode: [
        'export const posts = [];',
        'export function getPostBySlug() { return undefined; }',
        'export function getBlogOptions() { return {}; }',
      ].join('\n'),
    },
    {
      virtual: 'virtual:less-i18n-data',
      resolved: '\0virtual:less-i18n-data',
      get: () => ctx.plugins.i18nDataPlugin,
      emptyCode: [
        'export const locales = [];',
        'export function getDefaultLocale() { return "en"; }',
        'export function getI18nOptions() { return null; }',
      ].join('\n'),
    },
  ];

  return {
    name: 'less:data-dispatch',
    enforce: 'pre',
    resolveId(id) {
      for (const e of ENTRIES) {
        if (id === e.virtual) {
          const real = e.get();
          if (!real?.resolveId) return e.resolved;
          // Vite 8 Plugin hook can be function or {handler, order}
          const fn = typeof real.resolveId === 'function'
            ? real.resolveId
            : (real.resolveId as Record<string, unknown>).handler;
          if (!fn) return e.resolved;
          // deno-lint-ignore no-explicit-any
          const result = (fn as any)(id);
          return result ?? e.resolved;
        }
      }
    },
    load(id) {
      for (const e of ENTRIES) {
        if (id === e.resolved) {
          const real = e.get();
          if (!real?.load) return e.emptyCode;
          // Vite 8 Plugin hook can be function or {handler, order}
          const fn = typeof real.load === 'function'
            ? real.load
            : (real.load as Record<string, unknown>).handler;
          if (!fn) return e.emptyCode;
          // deno-lint-ignore no-explicit-any
          return (fn as any)(id) ?? e.emptyCode;
        }
      }
    },
  };
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

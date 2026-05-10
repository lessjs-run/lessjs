/**
 * @lessjs/core - Main entry.
 *
 * LessJS 0.6 is a static-first framework package:
 * - routes are scanned at build time
 * - pages are rendered to DSD HTML
 * - islands upgrade through Custom Elements
 * - Lit is imported directly by user code or adapters, not re-exported by core
 *
 * less() returns the Vite plugins that provide route scanning, virtual Hono
 * entry generation, dev-server integration, island marking, and build metadata.
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';

import { join } from 'node:path';
import process from 'node:process';
import { LessError } from './errors.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

import honoDevServer from '@hono/vite-dev-server';
import { LessBuildContext, setActiveContext } from './build-context.js';
import { buildPlugin } from './build.js';
import { escapeAttr as escapeHtmlAttr } from './render-dsd.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { islandTransformPlugin } from './island-transform.js';
import { fileToTagName, scanIslands, scanPackageIslands, scanRoutes } from './route-scanner.js';
import { createRuntimeShimCode } from './runtime-shim.js';

export type {
  FrameworkOptions,
  LessMiddleware,
  LessRenderer,
  PackageIslandMeta,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';
export { LessError, SsrRenderError } from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './ssr-handler.js';
/**
 * @internal SSG post-processing utilities — used by CLI build commands.
 * Not intended for direct use by application code.
 */
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
/**
 * @internal Island manifest generation — used by CLI build commands.
 * Not intended for direct use by application code.
 */
export {
  extractCustomElementTags,
  generateIslandManifests,
  type IslandLayerMap,
  type IslandManifestEntry,
  type IslandStrategyMap,
  type PageIslandManifest,
  writeIslandManifests,
} from './island-manifest.js';
/**
 * @internal Build manifest and observability — used by CLI build commands.
 * Not intended for direct use by application code.
 */
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
export { renderDSD, renderDSDByName } from './render-dsd.js';
export {
  type ComponentLayer,
  type DsdOptions,
  type HydrateEventDescriptor,
  registerAdapter,
  type RenderAdapter,
} from './types.js';
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  type SafeHtml,
  type UnsafeHtml,
} from './html-escape.js';
export { createLogger, LessLogger, LogLevel } from './logger.js';
export { getSSRProps, island, type IslandOptions, lessBind } from './island.js';
export { hasNavigationApi, matchRoute, navigate, onNavigate } from './navigation.js';
export type { NavigationCallback } from './navigation.js';
/**
 * @internal Build context discovery — used by sub-plugins (lessContent, lessI18n).
 * Not intended for direct use by application code.
 */
export { clearActiveContext, getActiveContext, setActiveContext } from './build-context.js';

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

  // ADR 0011: No globalThis bridge needed. Phase 2/3 run inside
  // closeBundle() where ctx is available via closure.
  // Share ctx with sub-plugins (lessContent, lessI18n) via module-level
  // active context — they can discover it without being passed ctx directly.
  setActiveContext(ctx);

  const VIRTUAL_ENTRY_ID = 'virtual:less-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;
  const VIRTUAL_RUNTIME_ID = 'virtual:less-runtime';
  const RESOLVED_RUNTIME_ID = '\0' + VIRTUAL_RUNTIME_ID;

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

  let resolvedConfig: import('vite').ResolvedConfig | undefined;

  const corePlugin: Plugin = {
    name: 'less:core',

    config(userConfig) {
      if (userConfig.resolve?.alias && !ctx.userResolveAlias) {
        ctx.userResolveAlias = userConfig.resolve.alias as
          | Record<string, string>
          | import('vite').Alias[];
      }

      return {
        resolve: {
          alias: {
            '@lessjs/core/less-runtime': VIRTUAL_RUNTIME_ID,
          },
        },
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      };
    },

    resolveId(id) {
      if (id === VIRTUAL_RUNTIME_ID) return RESOLVED_RUNTIME_ID;
    },

    load(id) {
      if (id === RESOLVED_RUNTIME_ID) {
        // SSR build needs real implementations (renderDSD, wrapInDocument, etc.)
        // because it renders pages server-side. Client build uses the lightweight
        // runtime shim (createRuntimeShimCode) which inlines minimal versions.
        if (resolvedConfig?.build?.ssr) {
          // In SSR mode, re-export from @lessjs/core. Use import+export pattern
          // (not `export ... from`) because Vite's SSR export analysis may not
          // resolve re-export chains for virtual modules.
          return [
            "import { registerAdapter, renderDSD, renderDSDByName, wrapInDocument, createLogger } from '@lessjs/core';",
            "const log = createLogger('core');",
            'export { registerAdapter, renderDSD, renderDSDByName, wrapInDocument, log };',
          ].join('\n');
        }
        return createRuntimeShimCode();
      }
    },

    configResolved(cfg) {
      resolvedConfig = cfg;
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
        return ctx.honoEntryCode ||
          generateEntry([], ctx.islandTagNames, ctx.packageIslands, ctx.islandFiles);
      }
    },
  };

  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin;

  return [
    corePlugin,
    virtualEntryPlugin,
    devServerPlugin,
    islandTransformPlugin(resolvedOptions.islandsDir!),
    buildPlugin(resolvedOptions, ctx),
  ];
}

export default less;

/**
 * Unified LessJS Vite plugin — single entry point for all LessJS features.
 *
 * Combines less() + lessContent() + lessI18n() under one call with a
 * shared LessBuildContext. This is the recommended way to use LessJS.
 *
 * ```ts
 * export default defineConfig({
 *   plugins: [lessjs({
 *     routesDir: 'app/routes',
 *     content: { blog: { contentDir: 'posts' }, nav: { routesDir: 'app/routes' } },
 *     i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
 *   })]
 * })
 * ```
 */
export async function lessjs(
  options: FrameworkOptions & {
    content?: Record<string, unknown>;
    i18n?: Record<string, unknown>;
  } = {},
): Promise<Plugin[]> {
  const { content: contentOpts, i18n: i18nOpts, ...coreOpts } = options;
  const ctx = new LessBuildContext({
    ...coreOpts,
    routesDir: coreOpts.routesDir || 'app/routes',
    islandsDir: coreOpts.islandsDir || 'app/islands',
    componentsDir: coreOpts.componentsDir || 'app/components',
  });

  const plugins: Plugin[] = [...less(coreOpts, ctx)];

  // Lazy-import sub-plugins to avoid hard deps when not used
  if (contentOpts) {
    try {
      const contentMod = await import('@lessjs/content') as Record<string, unknown>;
      if (typeof contentMod.lessContent === 'function') {
        plugins.push(
          ...(contentMod.lessContent as (opts: Record<string, unknown>) => Plugin[])({
            ...contentOpts,
            ctx,
          }),
        );
      }
    } catch {
      log.warn('@lessjs/content not installed — content features disabled');
    }
  }

  if (i18nOpts) {
    try {
      const i18nMod = await import('@lessjs/i18n') as Record<string, unknown>;
      if (typeof i18nMod.lessI18n === 'function') {
        plugins.push(
          (i18nMod.lessI18n as (opts: Record<string, unknown>) => Plugin)({ ...i18nOpts, ctx }),
        );
      }
    } catch {
      log.warn('@lessjs/i18n not installed — i18n features disabled');
    }
  }

  return plugins;
}

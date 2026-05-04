/**
 * @kissjs/core - Main entry.
 *
 * KISS 0.5 is a static-first framework package:
 * - routes are scanned at build time
 * - pages are rendered to DSD HTML
 * - islands upgrade through Custom Elements
 * - Lit is imported directly by user code or adapters, not re-exported by core
 *
 * kiss() returns the Vite plugins that provide route scanning, virtual Hono
 * entry generation, dev-server integration, island marking, and build metadata.
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { KissError } from './errors.js';

import honoDevServer from '@hono/vite-dev-server';
import { KissBuildContext } from './build-context.js';
import { buildPlugin } from './build.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { islandTransformPlugin } from './island-transform.js';
import { fileToTagName, scanIslands, scanPackageIslands, scanRoutes } from './route-scanner.js';
import { createRuntimeShimCode } from './runtime-shim.js';

export type {
  FrameworkOptions,
  KissMiddleware,
  KissRenderer,
  PackageIslandMeta,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';
export {
  ConflictError,
  ForbiddenError,
  IslandUpgradeError,
  KissError,
  NotFoundError,
  RateLimitError,
  SsrRenderError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './ssr-handler.js';
export {
  buildIslandChunkMap,
  injectClientScript,
  injectCspMeta,
  rewriteHtmlFiles,
} from './ssg-postprocess.js';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
export { escapeHtml, renderDSD, renderDSDByName, wrapDsdDocument } from './render-dsd.js';
export { Hono } from 'hono';

/**
 * KISS Framework Vite plugin.
 * Jamstack: M=SSG+DSD, A=API Routes, J=Islands.
 *
 * kiss() handles dev mode plus Phase 1 metadata for production builds.
 */
export function kiss(options: FrameworkOptions = {}): Plugin[] {
  let headExtras = options.headExtras;

  const escapeHtmlAttr = (str: string): string =>
    str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const validateSafeUrl = (url: string, context: string): string => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
      throw new KissError(
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

  const ctx = new KissBuildContext(resolvedOptions);

  const VIRTUAL_ENTRY_ID = 'virtual:kiss-hono-entry';
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
    name: 'kiss:core',

    config(userConfig) {
      if (userConfig.resolve?.alias && !ctx.userResolveAlias) {
        ctx.userResolveAlias = userConfig.resolve.alias as
          | Record<string, string>
          | import('vite').Alias[];
      }

      const userAlias = userConfig.resolve?.alias as
        | Record<string, string>
        | import('vite').Alias[]
        | undefined;
      const hasRuntimeAlias = Array.isArray(userAlias)
        ? userAlias.some((alias) => alias.find === '@kissjs/core/kiss-runtime')
        : Boolean(userAlias?.['@kissjs/core/kiss-runtime']);

      const buildConfig = {
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      };

      if (hasRuntimeAlias) {
        return buildConfig;
      }

      const kissTmpDir = resolve(process.cwd(), '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });
      const runtimePath = join(kissTmpDir, '.kiss-runtime.ts');
      writeFileSync(runtimePath, createRuntimeShimCode(), 'utf-8');
      ctx.userResolveAlias = Array.isArray(userAlias)
        ? [{ find: '@kissjs/core/kiss-runtime', replacement: runtimePath }, ...userAlias]
        : {
          ...(userAlias || {}),
          '@kissjs/core/kiss-runtime': runtimePath,
        };

      return {
        resolve: {
          alias: {
            '@kissjs/core/kiss-runtime': runtimePath,
          },
        },
        ...buildConfig,
      };
    },

    configResolved(resolvedConfig) {
      if (resolvedConfig.resolve?.alias && !ctx.userResolveAlias) {
        ctx.userResolveAlias = resolvedConfig.resolve.alias;
      }
      ctx.honoEntryCode = generateEntry([], ctx.islandTagNames, ctx.packageIslands, ctx.islandFiles);
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
            console.log(
              `[KISS] Package islands: ${ctx.packageIslands.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        ctx.honoEntryCode = generateEntry(routes, ctx.islandTagNames, ctx.packageIslands, ctx.islandFiles);
        const pageCount = routes.filter((r) => r.type === 'page' && !r.special).length;
        const apiCount = routes.filter((r) => r.type === 'api' && !r.special).length;
        const totalIslands = ctx.islandTagNames.length + ctx.packageIslands.length;
        console.log(
          `[KISS] Routes: ${pageCount} page(s), ${apiCount} API route(s), ` +
            `${totalIslands} island(s) - KISS Architecture`,
        );
      } catch (err) {
        throw new KissError(
          `Route scan failed: ${err instanceof Error ? err.message : String(err)}`,
          'ROUTE_SCAN_ERROR',
          500,
          false,
        );
      }
    },
  };

  const virtualEntryPlugin: Plugin = {
    name: 'kiss:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID;
    },

    load(id) {
      if (id === RESOLVED_ENTRY_ID) {
        return ctx.honoEntryCode || generateEntry([], ctx.islandTagNames, ctx.packageIslands, ctx.islandFiles);
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

export default kiss;

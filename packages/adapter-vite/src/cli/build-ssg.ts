/**
 * @lessjs/core - CLI: SSG Build
 *
 * SSG rendering + post-processing.
 * Builds a self-contained SSR bundle via viteBuild(ssr:true, noExternal),
 * then imports it to render all pages to static HTML, and post-processes
 * island paths.
 *
 * ADR 0011: This module exports buildSSG() only — it is called from
 * closeBundle() in less:build plugin. No longer a standalone CLI entry.
 * ctx parameter is required (no globalThis fallback).
 *
 * Usage:
 *   deno task build  (unified entry — runs all 3 phases)
 */

import { join, resolve } from 'node:path';
import process from 'node:process';
import { writeFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import type { FrameworkOptions, PackageIslandMeta } from '@lessjs/core';
import type { LessBuildContext } from '../build-context.js';
import type { SsgRenderOptions } from './ssg-render.js';
import { SsrRenderError } from '@lessjs/core/errors';
import { createLogger } from '@lessjs/core/logger';
import { RESOLVED_NAV_ID, VIRTUAL_NAV_ID } from '../virtual-ids.js';
import { ssgRender } from './ssg-render.js';

const log = createLogger('ssg');

const VIRTUAL_SSG_ENTRY_ID = 'virtual:less-ssg-entry';
const RESOLVED_SSG_ENTRY_ID = '\0' + VIRTUAL_SSG_ENTRY_ID;

// ─── Optional Package Stubs (ADR 0008 Phase C) ──────────────────────
// Vite plugin that resolves optional LessJS packages to empty stubs
// when they're not installed. This allows the generated entry code
// (which statically imports these packages) to build successfully
// regardless of which optional packages are available.
function optionalPackageStubsPlugin(): import('vite').Plugin {
  const stubs: Record<string, string> = {
    '@lessjs/adapter-lit': [
      'export function installLitAdapter() {}',
      'export function uninstallLitAdapter() {}',
    ].join('\n'),
    // ADR 0018: @lessjs/content no longer exports initBlogData/getPosts/getPostBySlug/getBlogOptions
    // Route components import from virtual:less-blog-data instead.
    // This stub is for the generateSitemap re-export only.
    '@lessjs/content': [
      'export async function loadBlogData() { return { posts: [], basePath: "" }; }',
    ].join('\n'),
    '@lessjs/content/sitemap': [
      'export function generateSitemap() { return []; }',
    ].join('\n'),
    // ADR 0018: @lessjs/i18n no longer exports initI18nData/getI18nOptions/getI18nLocales/getDefaultLocale
    // Route components import from virtual:less-i18n-data instead.
    '@lessjs/i18n': [
      'export function loadI18nData() { return { locales: [], defaultLocale: "en" }; }',
    ].join('\n'),
  };

  return {
    name: 'less:ssg-optional-stubs',
    enforce: 'pre',
    async resolveId(id) {
      if (id in stubs) {
        // Try to resolve the real package first
        const resolved = await this.resolve(id, undefined, { skipSelf: true });
        if (resolved) return null; // Package exists — let normal resolution proceed
        return `\0stub:${id}`; // Package missing — use stub
      }
    },
    load(id) {
      for (const pkgId of Object.keys(stubs)) {
        if (id === `\0stub:${pkgId}`) return stubs[pkgId];
      }
    },
  };
}

interface BuildSSGOptions {
  root?: string;
  outDir?: string;
  routesDir?: string;
  islandsDir?: string;
  middleware?: FrameworkOptions['middleware'];
  ssr?: FrameworkOptions['ssr'];
  islandTagNames?: string[];
  packageIslands?: PackageIslandMeta[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
  resolveAlias?: Record<string, string> | import('vite').Alias[];
  base?: string;
  pwa?: { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string };
  /**
   * View Transitions API configuration.
   * When true (default), injects <meta name="view-transition" content="same-origin">
   * into all HTML files for smooth cross-page animations in MPA navigation.
   * Set to false to disable.
   * @default true
   */
  viewTransition?: boolean;
  /**
   * Speculation Rules API configuration.
   * Enables browser prefetch/prerender of pages before the user navigates.
   * Can be a boolean (true = auto-generate from routes) or explicit rules.
   */
  speculation?: boolean | import('../ssg-postprocess.js').SpeculationRulesOptions;
}

async function buildSSG(options: BuildSSGOptions = {}, ctx: LessBuildContext): Promise<void> {
  const root = options.root || ctx.phase3.root || process.cwd();
  const outDir = options.outDir || ctx.phase3.outDir || 'dist';
  const routesDir = options.routesDir || ctx.phase3.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || ctx.phase3.islandsDir || 'app/islands';

  // Read island metadata from ctx (ADR 0010: no .less/ fallback)
  const islandTagNames = options.islandTagNames || ctx.phase1.islandTagNames || [];
  const packageIslands = options.packageIslands || ctx.phase1.packageIslands || [];
  const metadataResolveAlias = options.resolveAlias ||
    (ctx.phase1.userResolveAlias as Record<string, string> | import('vite').Alias[] | undefined);

  // Read options from ctx
  if (!options.headExtras) options.headExtras = ctx.phase3.headExtras || undefined;
  if (!options.html) options.html = ctx.phase3.html || undefined;
  if (!options.middleware) options.middleware = ctx.phase3.middleware || undefined;
  if (!options.upgradeStrategy) options.upgradeStrategy = ctx.phase3.upgradeStrategy;
  if (!options.pwa) options.pwa = ctx.phase3.pwa || undefined;
  if (!options.base) options.base = ctx.phase3.base;
  if (options.viewTransition === undefined) options.viewTransition = ctx.phase3.viewTransition;
  if (!options.speculation) options.speculation = ctx.phase3.speculation || undefined;

  // Generate SSG entry code
  const { scanRoutes, scanIslands, fileToTagName } = await import('../route-scanner.js');
  const { generateHonoEntryCode } = await import('../hono-entry.js');

  const routes = await scanRoutes(routesDir);
  const islandsRoot = join(root, islandsDir);
  const ssgIslandFiles = await scanIslands(islandsRoot);
  const ssgIslandTagNames = islandTagNames.length > 0
    ? islandTagNames
    : ssgIslandFiles.map((f) => fileToTagName(f));

  const ssgEntryCode = generateHonoEntryCode(routes, {
    routesDir,
    islandsDir,
    middleware: options.middleware,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    packageIslands,
    headExtras: options.headExtras,
    html: options.html,
    upgradeStrategy: options.upgradeStrategy || 'lazy',
  });

  try {
    const { build: viteBuild } = await import('vite');

    // SSR noExternal: bundle lit ecosystem + @lessjs/ui + @lessjs/adapter-lit + parse5 + node-fetch (Deno compat)
    const defaultNoExternal = [
      /^lit/,
      /^@lit/,
      /^@lessjs\/ui/,
      /^@lessjs\/adapter-lit/,
      'parse5',
      'entities',
      'node-fetch',
      'fetch-blob',
      'data-uri-to-buffer',
      'formdata-polyfill',
      'domexception',
      'node-domexception',
    ];
    const userNoExternal = options.ssr?.noExternal || [];
    const allNoExternal = [...defaultNoExternal, ...userNoExternal];

    // Handle alias — prefer CLI options, then ctx from Phase 1
    const alias = metadataResolveAlias;
    if (alias) {
      if (Array.isArray(alias)) {
        for (const a of alias) {
          if (a.find === '@lessjs/ui') allNoExternal.push(a.replacement);
        }
      } else if ('@lessjs/ui' in alias) {
        allNoExternal.push(alias['@lessjs/ui']);
      }
    }

    // Build the self-contained SSR bundle (ADR 0008 Phase C)
    // Replaces createServer() + ssrLoadModule() with viteBuild + import().
    // noExternal ensures all dependencies are inlined into a single bundle,
    // so module-level variables (Phase B) are shared across the entire graph.
    const ssrOutDir = join(root, outDir, 'server');
    log.info(`Building SSR bundle → ${ssrOutDir}`);

    await viteBuild({
      configFile: false,
      root,
      build: {
        ssr: true,
        outDir: ssrOutDir,
        rollupOptions: {
          input: { entry: VIRTUAL_SSG_ENTRY_ID },
          output: { format: 'esm' },
        },
      },
      ssr: { noExternal: allNoExternal },
      // ADR 0008 Phase A: Inject headExtras via define instead of .less/head-extras.html
      // The generated entry code uses __LESS_HEAD_EXTRAS__ which gets replaced
      // at build time. This avoids the Vite SSR AsyncFunction syntax errors
      // that large inline strings (with backticks/${}) cause.
      define: options.headExtras
        ? { __LESS_HEAD_EXTRAS__: JSON.stringify(options.headExtras) }
        : { __LESS_HEAD_EXTRAS__: '""' },
      esbuild: {
        tsconfigRaw: {
          compilerOptions: {
            useDefineForClassFields: false,
          },
        },
      },
      plugins: [
        // ADR 0010: Virtual SSG entry module
        // Replaces .less/.less-ssg-entry.ts file write
        {
          name: 'less:virtual-ssg-entry',
          resolveId(id) {
            if (id === VIRTUAL_SSG_ENTRY_ID) return RESOLVED_SSG_ENTRY_ID;
          },
          load(id) {
            if (id === RESOLVED_SSG_ENTRY_ID) return ssgEntryCode;
          },
        },
        // ADR 0018: Virtual data modules — resolve virtual:less-blog-data
        // and virtual:less-i18n-data in the SSR bundle.
        // Use dispatch plugin (checks ctx.plugins at resolve/load time).
        // The actual plugin may not be registered yet at SSG build time.
        // If not registered, the user hasn't configured blog/i18n → resolve as resolved ID
        // and load() returns empty data.
        {
          name: 'less:ssg-data-dispatch',
          enforce: 'pre',
          resolveId(id) {
            if (id === 'virtual:less-blog-data') return '\0virtual:less-blog-data';
            if (id === 'virtual:less-i18n-data') return '\0virtual:less-i18n-data';
          },
          load(id) {
            // Vite 8 Plugin.load type: function or {handler}
            function callLoad(p: Plugin | null, moduleId: string): string | null | undefined {
              if (!p?.load) return undefined;
              const fn = typeof p.load === 'function'
                ? p.load
                : (p.load as Record<string, unknown>).handler;
              // deno-lint-ignore no-explicit-any
              return fn ? (fn as any)(moduleId) : undefined;
            }
            if (id === '\0virtual:less-blog-data') {
              return callLoad(ctx.plugins.blogDataPlugin, id) ?? [
                'export const posts = [];',
                'export function getPostBySlug() { return undefined; }',
                'export function getBlogOptions() { return {}; }',
              ].join('\n');
            }
            if (id === '\0virtual:less-i18n-data') {
              return callLoad(ctx.plugins.i18nDataPlugin, id) ?? [
                'export const locales = [];',
                'export function getDefaultLocale() { return "en"; }',
                'export function getI18nOptions() { return null; }',
              ].join('\n');
            }
          },
        },
        // ADR 0008 Phase C: Provide stubs for optional packages.
        // The generated entry code statically imports @lessjs/adapter-lit,
        // @lessjs/content, @lessjs/i18n — but these may not be installed.
        // This plugin resolves them to empty stubs when missing, so the
        // viteBuild() succeeds regardless of which packages are available.
        optionalPackageStubsPlugin(),
        // Resolve virtual:less-nav — shared nav/pwa/speculation constants
        {
          name: 'less:ssg-virtual-nav',
          resolveId(id) {
            if (id === VIRTUAL_NAV_ID) return RESOLVED_NAV_ID;
          },
          load(id) {
            if (id === RESOLVED_NAV_ID) {
              const navSections = JSON.stringify(ctx.plugins.navSections || []);
              const headerNav = JSON.stringify(ctx.plugins.headerNav || []);
              return `export const navSections = ${navSections};\nexport const headerNav = ${headerNav};`;
            }
          },
        },
      ],
      resolve: {
        preserveSymlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: alias || undefined,
      },
    });

    log.info('SSR bundle built successfully');

    // ─── Write sidecar importmap.json (ADR 0022) ─────────────
    // This import map captures the dependency versions used in the SSR bundle,
    // enabling the bundle to be loaded in any runtime via standard ESM import().
    // Currently emitted as metadata alongside the Vite-inline bundle; in the
    // esbuild --packages=external mode, it becomes the actual resolution map.
    try {
      const importMap: Record<string, string> = {
        'hono': 'npm:hono@4',
        'parse5': 'npm:parse5@7.0.0',
        '@lessjs/core': 'npm:@jsr/lessjs__core@0.13.0',
      };

      // Add known LessJS subpath exports
      for (
        const subpath of [
          '/logger',
          '/errors',
          '/html-escape',
          '/context',
          '/navigation',
          '/render-dsd',
        ]
      ) {
        importMap[`@lessjs/core${subpath}`] = `npm:@jsr/lessjs__core${subpath}@0.13.0`;
      }

      // Add adapter-lit if used
      if (ctx?.phase1.packageIslands?.length) {
        importMap['@lessjs/adapter-lit'] = 'npm:@jsr/lessjs__adapter-lit@^0.8.0';
        importMap['lit'] = 'npm:lit@3.3.2';
        importMap['@lit/reactive-element'] = 'npm:@lit/reactive-element@2.1.0';
      }

      // Add @lessjs/ui if used
      const hasUi = allNoExternal.some((n: string | RegExp) =>
        typeof n === 'string' ? n.includes('@lessjs/ui') : n.toString().includes('@lessjs/ui')
      );
      if (hasUi) {
        importMap['@lessjs/ui'] = 'npm:@jsr/lessjs__ui@^0.7.0';
      }

      const importMapPath = join(ssrOutDir, 'importmap.json');
      writeFileSync(importMapPath, JSON.stringify({ imports: importMap }, null, 2), 'utf-8');
      log.info(`Import map written → ${importMapPath} (${Object.keys(importMap).length} entries)`);
    } catch (e) {
      log.warn('Failed to write importmap.json — non-fatal:', e);
    }

    // Load the SSR bundle and run SSG rendering pipeline
    const ssrBundlePath = resolve(ssrOutDir, 'entry.js');
    const ssrBundleUrl = Deno.build.os === 'windows'
      ? 'file:///' + ssrBundlePath.replace(/\\/g, '/')
      : 'file://' + ssrBundlePath;
    const module = await import(ssrBundleUrl) as Record<string, unknown>;

    if (!module.default) {
      throw new SsrRenderError('virtual:less-ssg-entry', new Error('Failed to load Hono app'));
    }

    // Delegate to shared ssgRender() — zero Vite dependency from this point
    await ssgRender(module as Parameters<typeof ssgRender>[0], {
      root,
      outDir,
      base: options.base || '/',
      headExtras: options.headExtras,
      html: options.html,
      middleware: options.middleware,
      islandTagNames: ssgIslandTagNames,
      viewTransition: options.viewTransition,
      speculation: options.speculation as boolean | Record<string, unknown> | undefined,
      pwa: (options as Record<string, unknown>).pwa as SsgRenderOptions['pwa'],
    }, ctx);

    log.info('Static site generated → ' + join(root, outDir));
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  }
}

export { buildSSG };

/**
 * @lessjs/adapter-vite - CLI: SSG Build
 *
 * SSG rendering + post-processing.
 * Builds a self-contained SSR bundle via viteBuild(ssr:true, noExternal),
 * then imports it to render all pages to static HTML, and post-processes
 * island paths.
 *
 * ADR 0011: This module exports buildSSG() only - it is called from
 * closeBundle() in less:build plugin. No longer a standalone CLI entry.
 * ctx parameter is required (no globalThis fallback).
 *
 * Usage:
 *   deno task build  (unified entry - runs all 3 phases)
 */

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import process from 'node:process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { FrameworkOptions, HydrationStrategy, LessPackageManifest } from '@lessjs/core';
import type { LessBuildContext } from '../build-context.js';
import type { SsgRenderOptions } from './ssg-render.js';
import { SsrRenderError } from '@lessjs/core/errors';
import { createLogger } from '@lessjs/core/logger';
import { ssgRender } from './ssg-render.js';
import { createGeneratedDataResolverPlugin } from '../generated-data-resolver.js';
import { createLessJsrPackageResolverPlugin } from '../ssg-package-resolver.js';
import { generateSsrPolyfillBanner } from '../ssr-polyfills.js';
import { resolveExternalManifest } from '../external-resolver.js';

const log = createLogger('ssg');

const VIRTUAL_SSG_ENTRY_ID = 'virtual:less-ssg-entry';
const RESOLVED_SSG_ENTRY_ID = '\0' + VIRTUAL_SSG_ENTRY_ID;
const FALLBACK_LESSJS_VERSION = '0.23.0';

function getJsrPackageVersion(metaUrl: string): string {
  const match = metaUrl.match(/\/@lessjs\/adapter-vite\/([^/]+)\//);
  return match?.[1] ?? FALLBACK_LESSJS_VERSION;
}

function getLocalLessjsPackageRoot(metaUrl: string): string | null {
  if (!metaUrl.startsWith('file:')) return null;
  try {
    const root = resolve(fileURLToPath(new URL('.', metaUrl)), '..', '..', '..', '..');
    return existsSync(resolve(root, 'packages', 'core', 'deno.json')) ? root : null;
  } catch {
    return null;
  }
}

// 鈹€鈹€鈹€ Optional Package Stubs (ADR 0008 Phase C) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
// Vite plugin that resolves optional LessJS packages to empty stubs
// when they're not installed. This allows the generated entry code
// (which statically imports these packages) to build successfully
// regardless of which optional packages are available.
function optionalPackageStubsPlugin(): import('vite').Plugin {
  const stubs: Record<string, string> = {
    '@lessjs/adapter-lit': [
      'class DsdLitElement extends (globalThis.HTMLElement || class{}) {}',
      'export { DsdLitElement };',
      'export function installLitAdapter() {}',
      'export function uninstallLitAdapter() {}',
      'export const WithDsdHydration = undefined;',
    ].join('\n'),
    '@lessjs/adapter-vanilla': [
      'class DsdVanillaElement extends (globalThis.HTMLElement || class{}) {}',
      'export { DsdVanillaElement };',
      'export function installVanillaAdapter() {}',
      'export function uninstallVanillaAdapter() {}',
    ].join('\n'),
    '@lessjs/adapter-react': [
      'class DsdReactElement extends (globalThis.HTMLElement || class{}) {}',
      'export { DsdReactElement };',
      'export function installReactAdapter() {}',
      'export function uninstallReactAdapter() {}',
      'export const WithDsdHydration = undefined;',
      'export function renderReactToString() { return ""; }',
      'export function isReactElement() { return false; }',
    ].join('\n'),
    // Route components import generated blog data from @lessjs/generated/blog-data.
    // This stub is for the generateSitemap re-export only.
    '@lessjs/content': [
      'export async function loadBlogData() { return { posts: [], basePath: "" }; }',
    ].join('\n'),
    '@lessjs/content/sitemap': [
      'export function generateSitemap() { return []; }',
    ].join('\n'),
    // Route components import generated i18n data from @lessjs/generated/i18n.
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
        if (resolved) return null; // Package exists - let normal resolution proceed
        return `\0stub:${id}`; // Package missing - use stub
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
  islandMeta?: Record<string, Partial<import('../entry-descriptor.js').IslandDecl>>;
  packageManifests?: LessPackageManifest[];
  /** @security Injected as raw HTML without sanitization */
  headExtras?: string;
  allowHeadExtrasScripts?: boolean;
  html?: { lang?: string; title?: string };
  upgradeStrategy?: HydrationStrategy;
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
  /** ADR-0047: Skip Deno pre-resolution, use regex fallback for external deps. */
  skipPreResolution?: boolean;
}

async function buildSSG(options: BuildSSGOptions = {}, ctx: LessBuildContext): Promise<void> {
  const root = options.root || ctx.phase3.root || process.cwd();
  const outDir = options.outDir || ctx.phase3.outDir || 'dist';
  const routesDir = options.routesDir || ctx.phase3.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || ctx.phase3.islandsDir || 'app/islands';

  // SOP-v0.21.6: Detect if we're running from a Deno workspace.
  // In workspace mode, @deno/vite-plugin resolves bare specifiers.
  // In JSR mode, we need the less:ssg-core-resolve plugin.
  const workspaceRoot = (() => {
    try {
      for (let d = resolve(root); d !== resolve(d, '..'); d = resolve(d, '..')) {
        const cfg = JSON.parse(readFileSync(resolve(d, 'deno.json'), 'utf-8'));
        if (cfg.workspace && Array.isArray(cfg.workspace)) return d;
      }
    } catch { /* deno.json not found, keep walking up */ }
    return null;
  })();

  // Read island metadata from ctx (ADR 0010: no .less/ fallback)
  const islandTagNames = options.islandTagNames || ctx.phase1.islandTagNames || [];
  const islandMeta = options.islandMeta || ctx.phase1.islandMeta || {};
  const packageManifests = options.packageManifests || ctx.phase1.packageManifests || [];
  const metadataResolveAlias = options.resolveAlias ||
    (ctx.phase1.userResolveAlias as Record<string, string> | import('vite').Alias[] | undefined);

  // Read options from ctx
  if (!options.headExtras) options.headExtras = ctx.phase3.headExtras || undefined;
  if (options.allowHeadExtrasScripts === undefined) {
    options.allowHeadExtrasScripts = ctx.phase3.allowHeadExtrasScripts;
  }
  if (!options.html) options.html = ctx.phase3.html || undefined;
  if (!options.middleware) options.middleware = ctx.phase3.middleware || undefined;
  if (!options.upgradeStrategy) options.upgradeStrategy = ctx.phase3.upgradeStrategy;
  if (!options.pwa) options.pwa = ctx.phase3.pwa || undefined;
  if (!options.base) options.base = ctx.phase3.base;
  if (options.viewTransition === undefined) options.viewTransition = ctx.phase3.viewTransition;
  if (!options.speculation) options.speculation = ctx.phase3.speculation || undefined;

  // Generate SSG entry code
  const { scanRoutes, scanIslands, scanIslandMeta, fileToTagName } = await import(
    '../route-scanner.js'
  );
  const { generateHonoEntryCode } = await import('../hono-entry.js');

  const routes = await scanRoutes(routesDir);

  // v0.25.0: Generate type-safe route parameter declarations for `virtual:less-routes`
  const { generateRouteTypes } = await import('../route-type-generator.js');
  const routeTypeDts = generateRouteTypes(routes);
  const dotLessDir = join(root, '.less');
  mkdirSync(dotLessDir, { recursive: true });
  writeFileSync(join(dotLessDir, 'routes.d.ts'), routeTypeDts, 'utf-8');
  log.info(`Route types generated -> .less/routes.d.ts`);

  const islandsRoot = join(root, islandsDir);
  const ssgIslandFiles = await scanIslands(islandsRoot);
  const ssgIslandTagNames = islandTagNames.length > 0
    ? islandTagNames
    : ssgIslandFiles.map((f) => fileToTagName(f));
  const ssgIslandMeta = Object.keys(islandMeta).length > 0
    ? islandMeta
    : await scanIslandMeta(islandsRoot, ssgIslandFiles);
  const { buildEntryDescriptor } = await import('../entry-descriptor.js');

  // v0.19.1 Phase 6: Discover Hub client-only tags for SSG admission (ADR-0035 A1)
  const hubClientOnlyTags: string[] = [];
  try {
    const { readFileSync } = await import('node:fs');
    const hubDataPath = join(root, 'app', 'data', 'registry', 'hub-data.ts');
    const content = readFileSync(hubDataPath, 'utf-8');
    const tagRe = /"tagName":\s*"([^"]+)"/g;
    const compatRe = /"compatibility":\s*"([^"]+)"/g;
    const tagPositions: Array<{ pos: number; tagName: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(content)) !== null) {
      tagPositions.push({ pos: m.index, tagName: m[1] });
    }
    const compatPositions: Array<{ pos: number; compat: string }> = [];
    while ((m = compatRe.exec(content)) !== null) {
      compatPositions.push({ pos: m.index, compat: m[1] });
    }
    for (const tp of tagPositions) {
      let nearestCompat = '';
      let nearestDist = Infinity;
      for (const cp of compatPositions) {
        const dist = cp.pos - tp.pos;
        if (dist > 0 && dist < nearestDist) {
          nearestDist = dist;
          nearestCompat = cp.compat;
        }
      }
      if (nearestCompat === 'client-only') hubClientOnlyTags.push(tp.tagName);
    }
    if (hubClientOnlyTags.length > 0) {
      const { createLogger: mkLog } = await import('@lessjs/core/logger');
      mkLog('core').info(
        `Hub client-only tags: ${hubClientOnlyTags.length} tag(s) for SSG admission`,
      );
    }
  } catch { /* hub data not available - skip */ }

  ctx.phase1.ssrAdmissionPlan = buildEntryDescriptor(routes, {
    routesDir,
    islandsDir,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    islandMeta: ssgIslandMeta,
    packageManifests,
    hubClientOnlyTags,
  }).ssrAdmissionPlan;

  const rawSsgEntryCode = generateSsrPolyfillBanner() + '\n' + generateHonoEntryCode(routes, {
    routesDir,
    islandsDir,
    middleware: options.middleware,
    ssg: true,
    islandTagNames: ssgIslandTagNames,
    islandFiles: ssgIslandFiles,
    islandMeta: ssgIslandMeta,
    packageManifests,
    headExtras: options.headExtras,
    allowHeadExtrasScripts: options.allowHeadExtrasScripts,
    html: options.html,
    upgradeStrategy: options.upgradeStrategy || 'idle',
    hubClientOnlyTags,
  });
  // Deno import map resolution handles bare specifiers (e.g. @lessjs/ui/less-callout)
  // via the createDenoImportMapPlugin added to the Phase 3 viteBuild plugins below.
  const ssgEntryCode = rawSsgEntryCode;

  try {
    const { build: viteBuild } = await import('vite');

    // SSR noExternal: packages that MUST be inlined into the SSR bundle.
    // Without these, the SSR bundle contains bare specifier imports (e.g.
    // `import { signal } from "alien-signals"`) that cannot be resolved
    // in non-workspace environments (e.g. CF Pages), causing import(entry.js)
    // to fail and the entire SSG pipeline to produce empty HTML.
    const defaultNoExternal = [
      /^@lessjs\//,
      /^lit/,
      /^@lit/,
      /^@lit-labs\//,
      // v0.26.1 FIX: alien-signals is a hard dependency of @lessjs/signals.
      // Without noExternal, it leaks as a bare import that Deno can resolve
      // locally (via workspace import map) but CF Pages cannot.
      'alien-signals',
      // v0.26.1 FIX: React is used by adapter-react islands for SSR rendering.
      // Must be inlined so the SSR bundle is self-contained.
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      // NOTE: Shoelace (@shoelace-style/shoelace) is NOT added here because
      // its transitive deps (@shoelace-style/localize, etc.) cannot be resolved
      // by Rolldown in Deno's nodeModulesDir:"manual" layout. Shoelace components
      // are browser-only and should stay as bare imports resolved by Deno at
      // import(entry.js) time, same as hono.
    ];
    // ADR-0047: External packages are externalized, not bundled.
    // ADR-0054: AST-based exports resolution covers ALL subpath exports
    // so Rolldown externalizes them correctly via manifest.specifiers.
    // Consumer template deno.json declares these packages so Deno can
    // resolve them at runtime when buildSSG() executes import(entry.js).
    // v0.26.1: Added @shoelace-style/shoelace + @shoelace-style/localize
    // since they cannot be inlined (Rolldown resolution failure) but must
    // be resolvable at import(entry.js) time.
    // NOTE: React is NOT here — it's in noExternal (inlined instead).
    const ssrExternalDefaults = [
      'entities',
      'entities',
      'hono',
      '@shoelace-style/shoelace',
      '@shoelace-style/localize',
    ];

    // Step 0: Deno pre-resolution + AST subpath discovery (ADR-0047 + ADR-0054)
    const manifest = await resolveExternalManifest(
      ssrExternalDefaults,
      root,
      options.skipPreResolution || ctx.phase3?.skipPreResolution,
    );

    const userNoExternal = options.ssr?.noExternal || [];
    const allNoExternal = [...defaultNoExternal, ...userNoExternal];

    // Handle alias - prefer CLI options, then ctx from Phase 1
    const alias = metadataResolveAlias;
    if (alias) {
      if (Array.isArray(alias)) {
        for (const a of alias) {
          if (a.find === '@lessjs/ui') {
            // v0.14.6: Check if replacement is already covered by defaultNoExternal
            const isAlreadyCovered = defaultNoExternal.some(
              (pattern: string | RegExp) =>
                pattern instanceof RegExp && pattern.test(a.replacement),
            );
            if (!isAlreadyCovered) {
              allNoExternal.push(a.replacement);
            }
          }
        }
      } else if ('@lessjs/ui' in alias) {
        const isAlreadyCovered = defaultNoExternal.some(
          (pattern: string | RegExp) =>
            pattern instanceof RegExp && pattern.test(alias['@lessjs/ui']),
        );
        if (!isAlreadyCovered) {
          allNoExternal.push(alias['@lessjs/ui']);
        }
      }
    }

    // Build the self-contained SSR bundle (ADR 0008 Phase C)
    // Replaces createServer() + ssrLoadModule() with viteBuild + import().
    // noExternal ensures all dependencies are inlined into a single bundle,
    // so module-level variables (Phase B) are shared across the entire graph.
    const ssrOutDir = join(root, outDir, 'server');
    log.info(`Building SSR bundle -> ${ssrOutDir}`);
    const clientOnlyIslandIds = new Set(
      Object.entries(ssgIslandMeta)
        .filter(([, meta]) => meta.ssr === false)
        .map(([tag]) => {
          const file = ssgIslandFiles[ssgIslandTagNames.indexOf(tag)];
          return file ? normalizePath(resolve(root, islandsDir, file)) : '';
        })
        .filter(Boolean),
    );
    // v0.21: Build filePath 鈫?tagName map for client-only placeholder generation.
    const clientOnlyTagMap = new Map<string, string>();
    for (const [tag, meta] of Object.entries(ssgIslandMeta)) {
      if (meta.ssr !== false) continue;
      const file = ssgIslandFiles[ssgIslandTagNames.indexOf(tag)];
      if (file) clientOnlyTagMap.set(normalizePath(resolve(root, islandsDir, file)), tag);
    }

    // v0.21 SOP-004: Conflict detection 鈥?same tag must not be both SSR and client:only.
    const ssrTags = new Set(
      Object.entries(ssgIslandMeta)
        .filter(([, meta]) => meta.ssr !== false)
        .map(([tag]) => tag),
    );
    const conflictTags = [...clientOnlyTagMap.values()].filter((t) => ssrTags.has(t));
    if (conflictTags.length > 0) {
      throw new Error(
        `[LessJS] SSR+client:only conflict detected for tags: ${conflictTags.join(', ')}. ` +
          'A tag cannot be both SSR-capable and client:only on the same page.',
      );
    }

    await viteBuild({
      configFile: false,
      root,
      logLevel: 'error',
      build: {
        ssr: true,
        outDir: ssrOutDir,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
          input: { entry: VIRTUAL_SSG_ENTRY_ID },
          // v0.21: Suppress IMPORT_IS_UNDEFINED for revalidate 鈥?the generated
          // code uses typeof check which correctly handles undefined exports.
          onwarn(warning, warn) {
            if (warning.code === 'IMPORT_IS_UNDEFINED') return;
            warn(warning);
          },
          output: {
            format: 'esm',
            // ADR-0044: customElements polyfill must run before ESM imports.
            // Uses Map-backed define()/get() 鈥?renderDsdByName() looks up
            // components via customElements.get(tagName) during SSG rendering.
            // SOP-016: HTMLElement stub is self-contained in @lessjs/core/dsd-element.ts.
            banner: `\
if (typeof globalThis.customElements === 'undefined') {
  const __lessCeRegistry = new Map();
  globalThis.customElements = {
    define(name, ctor, _opts) { __lessCeRegistry.set(name, ctor); },
    get(name) { return __lessCeRegistry.get(name); },
    whenDefined(name) { return Promise.resolve(__lessCeRegistry.get(name)); },
    upgrade(_root) {},
  };
}
`,
          },
        },
      },
      ssr: { noExternal: allNoExternal, external: manifest.specifiers },
      // ADR 0008 Phase A: Inject headExtras via define instead of .less/head-extras.html
      // The generated entry code uses __HEAD_EXTRAS__ which gets replaced
      // at build time. This avoids the Vite SSR AsyncFunction syntax errors
      // that large inline strings (with backticks/${}) cause.
      define: options.headExtras
        ? { __HEAD_EXTRAS__: JSON.stringify(options.headExtras) }
        : { __HEAD_EXTRAS__: '""' },
      esbuild: {
        // ADR-0057: JSX automatic runtime 鈥?same reason as build-client.ts.
        // SSG build also processes .tsx island files for SSR rendering.
        jsx: 'automatic',
        jsxImportSource: '@lessjs/core',
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
        // ADR 0008 Phase C: Provide stubs for optional packages.
        // The generated entry code statically imports @lessjs/adapter-lit,
        // @lessjs/content, @lessjs/i18n - but these may not be installed.
        // This plugin resolves them to empty stubs when missing, so the
        // viteBuild() succeeds regardless of which packages are available.
        optionalPackageStubsPlugin(),
        createGeneratedDataResolverPlugin({
          root,
          name: 'less:ssg-generated-data',
        }),
        createLessJsrPackageResolverPlugin({
          workspaceRoot,
          version: getJsrPackageVersion(import.meta.url),
          localPackageRoot: getLocalLessjsPackageRoot(import.meta.url),
        }),
        {
          name: 'less:ssg-client-only-island-stubs',
          enforce: 'pre',
          load(id) {
            const normalized = normalizePath(id.split('?')[0]);
            if (!clientOnlyIslandIds.has(normalized)) return;
            const tagName = clientOnlyTagMap.get(normalized) || 'less-client-only-stub';
            // v0.27: Client-only stub marker 鈥?unbranded attribute.
            // SSR outputs <tag-name data-client-only="true"></tag-name>
            // Client runtime imports the real module and upgrades the element.
            return [
              `export const tagName = ${JSON.stringify(tagName)};`,
              'export const less = { ssr: false };',
              `export default class LessClientOnlyStub extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('data-client-only')) {
      this.setAttribute('data-client-only', 'true');
    }
  }
}`,
            ].join('\n');
          },
        },
      ],
      resolve: {
        preserveSymlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          ...(alias && !Array.isArray(alias)
            ? Object.fromEntries(
              Object.entries(alias).map(([k, v]) => [
                k,
                v.startsWith('/') || /^[A-Za-z]:/.test(v) ? v : resolve(root, v),
              ]),
            )
            : {}),
        },
      },
    });
    log.info('SSR bundle built successfully');

    // Load the SSR bundle and run SSG rendering pipeline
    const ssrBundlePath = resolve(ssrOutDir, 'entry.js');
    // M-18 fix: Use process.platform instead of Deno.build.os for Node.js compat
    const isWindows = typeof process !== 'undefined' && process.platform === 'win32';
    const ssrBundleUrl = isWindows
      ? 'file:///' + ssrBundlePath.replace(/\\/g, '/')
      : 'file://' + ssrBundlePath;
    const module = await import(ssrBundleUrl) as Record<string, unknown>;

    if (!module.default) {
      throw new SsrRenderError('virtual:less-ssg-entry', new Error('Failed to load Hono app'));
    }

    // Delegate to shared ssgRender() - zero Vite dependency from this point
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

    log.info('Static site generated -> ' + join(root, outDir));

    // v0.21: Write ISR manifest for routes exporting revalidate > 0.
    try {
      const ssgModule = module as Record<string, unknown>;
      const routes = (ssgModule.routes || ssgModule.__routes) as
        | Array<Record<string, unknown>>
        | undefined;
      if (routes && routes.length > 0) {
        const isrRoutes: Record<string, unknown>[] = [];
        for (const r of routes) {
          const revalidate = typeof r.revalidate === 'number' && r.revalidate > 0
            ? r.revalidate
            : undefined;
          if (!revalidate) continue;
          isrRoutes.push({
            path: r.path,
            revalidate,
            cacheKey: `lessjs:isr:${r.path}`,
            params: r.params || {},
          });
        }
        if (isrRoutes.length > 0) {
          const manifestPath = join(root, outDir, 'isr-manifest.json');
          writeFileSync(manifestPath, JSON.stringify(isrRoutes, null, 2), 'utf-8');
          log.info(`ISR manifest written -> ${manifestPath} (${isrRoutes.length} routes)`);
        }
      }
    } catch (e) {
      log.warn('Failed to write isr-manifest.json 鈥?non-fatal:', e);
    }
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  }
}

export { buildSSG };

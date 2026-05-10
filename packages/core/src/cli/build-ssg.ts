/**
 * @lessjs/core - CLI: SSG Build
 *
 * Standalone SSG rendering + post-processing.
 * Builds a self-contained SSR bundle via viteBuild(ssr:true, noExternal),
 * then imports it to render all pages to static HTML, and post-processes
 * island paths.
 *
 * This is Phase 3 of the LessJS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .less/ metadata
 *   Phase 2 (build-client.ts): Client island chunks
 *   Phase 3 (this script): SSG rendering + post-processing
 *
 * Must run AFTER build-client so island chunk paths are available
 * for the post-processing step (source paths → built chunk paths).
 *
 * ADR 0008: Eliminates createServer() in favor of viteBuild(ssr:true,
 * noExternal) + import(). This produces a self-contained ESM bundle
 * where all virtual modules resolve at compile time, module variables
 * replace globalThis[Symbol.for()] bridges, and ssrLoadModule() is
 * replaced by direct import() of the built bundle.
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build-ssg
 *   deno task build:ssg
 */

import { join, resolve } from 'node:path';
import process from 'node:process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { FrameworkOptions, PackageIslandMeta } from '../types.js';
import type { LessBuildContext } from '../build-context.js';
import type { SpeculationRulesOptions } from '../ssg-postprocess.js';
import { SsrRenderError } from '../errors.js';
import { createLogger } from '../logger.js';
import { createRuntimeShimCode } from '../runtime-shim.js';

const log = createLogger('ssg');

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
    '@lessjs/content': [
      'export async function initBlogData() { return { posts: [], basePath: "" }; }',
      'export function getPosts() { return []; }',
      'export function getPostBySlug() { return undefined; }',
      'export function getBlogOptions() { return {}; }',
    ].join('\n'),
    '@lessjs/content/sitemap': [
      'export function generateSitemap() { return []; }',
    ].join('\n'),
    '@lessjs/i18n': [
      'export function initI18nData() {}',
      'export function getI18nOptions() { return null; }',
      'export function getI18nLocales() { return []; }',
      'export function getDefaultLocale() { return "en"; }',
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

/** Recursively find all .html files in a directory (excluding client/, server/, hidden dirs). */
function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (
        entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'client' &&
        entry.name !== 'server'
      ) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Directory may not exist or be unreadable — warn instead of silent swallow
    log.warn(
      `Cannot read directory ${dir}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return results;
}

async function buildSSG(options: BuildSSGOptions = {}, ctx?: LessBuildContext): Promise<void> {
  const root = options.root || ctx?.root || process.cwd();
  const outDir = options.outDir || ctx?.outDir || 'dist';
  const routesDir = options.routesDir || ctx?.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || ctx?.islandsDir || 'app/islands';

  // Read island metadata from ctx (preferred) or .less/ files (fallback)
  let islandTagNames = options.islandTagNames || ctx?.islandTagNames || [];
  let packageIslands = options.packageIslands || ctx?.packageIslands || [];
  let metadataResolveAlias = options.resolveAlias ||
    (ctx?.userResolveAlias as Record<string, string> | import('vite').Alias[] | undefined);

  // Fallback: read .less/build-metadata.json if ctx didn't provide data
  if (!ctx || !ctx.root) {
    const metadataPath = join(root, '.less', 'build-metadata.json');
    try {
      const raw = readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(raw);
      if (islandTagNames.length === 0) islandTagNames = metadata.islandTagNames || [];
      if (packageIslands.length === 0) packageIslands = metadata.packageIslands || [];
      if (!metadataResolveAlias && metadata.resolveAlias) {
        metadataResolveAlias = metadata.resolveAlias as Record<string, string>;
      }
      // Read Phase 1 metadata when values were not provided via CLI options.
      if (!options.headExtras && metadata.headExtras) {
        options.headExtras = metadata.headExtras;
      }
      if (!options.html && metadata.html) {
        options.html = metadata.html;
      }
      if (!options.middleware && metadata.middleware) {
        options.middleware = metadata.middleware;
      }
      if (!options.upgradeStrategy && metadata.upgradeStrategy) {
        options.upgradeStrategy = metadata.upgradeStrategy;
      }
      if (!options.pwa && metadata.pwa) {
        options.pwa = metadata.pwa;
      }
      if (!options.base && metadata.base) {
        options.base = metadata.base as string;
      }
      if (options.viewTransition === undefined && metadata.viewTransition !== undefined) {
        options.viewTransition = metadata.viewTransition as boolean;
      }
      if (!options.speculation && metadata.speculation) {
        options.speculation = metadata.speculation as boolean | SpeculationRulesOptions;
      }
    } catch (e) {
      log.warn(
        'No .less/build-metadata.json found; using provided island list.',
        e instanceof Error ? e.message : '',
      );
    }
  } else {
    // Read from ctx (ADR 0008 Phase A — no .less/ IPC)
    if (!options.headExtras) options.headExtras = ctx.headExtras || undefined;
    if (!options.html) options.html = ctx.html || undefined;
    if (!options.middleware) options.middleware = ctx.middleware || undefined;
    if (!options.upgradeStrategy) options.upgradeStrategy = ctx.upgradeStrategy;
    if (!options.pwa) options.pwa = ctx.pwa || undefined;
    if (!options.base) options.base = ctx.base;
    if (options.viewTransition === undefined) options.viewTransition = ctx.viewTransition;
    if (!options.speculation) options.speculation = ctx.speculation || undefined;
  }

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

  // Write temp entry file
  const lessTmpDir = join(root, '.less');
  const tmpEntryPath = join(lessTmpDir, '.less-ssg-entry.ts');
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(lessTmpDir, { recursive: true });

  writeFileSync(tmpEntryPath, ssgEntryCode, 'utf-8');

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

    // Handle alias — prefer CLI options, then fallback to metadata from Phase 1
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
        ssr: tmpEntryPath,
        outDir: ssrOutDir,
        rollupOptions: {
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
        // ADR 0008 Phase C: Provide stubs for optional packages.
        // The generated entry code statically imports @lessjs/adapter-lit,
        // @lessjs/content, @lessjs/i18n — but these may not be installed.
        // This plugin resolves them to empty stubs when missing, so the
        // viteBuild() succeeds regardless of which packages are available.
        optionalPackageStubsPlugin(),
        // ADR 0008 Phase D: Resolve virtual:less-runtime
        // The generated entry code imports @lessjs/core/less-runtime which
        // is now a virtual module. This plugin resolves it at SSR build time.
        {
          name: 'less:ssg-virtual-runtime',
          resolveId(id) {
            if (id === 'virtual:less-runtime') return '\0virtual:less-runtime';
            if (id === '@lessjs/core/less-runtime') return '\0virtual:less-runtime';
          },
          load(id) {
            if (id === '\0virtual:less-runtime') {
              return createRuntimeShimCode();
            }
          },
        },
        // Resolve virtual:less-nav — reads from ctx (preferred) or .less/ files (fallback)
        {
          name: 'less:ssg-virtual-nav',
          resolveId(id) {
            if (id === 'virtual:less-nav') return '\0virtual:less-nav';
          },
          load(id) {
            if (id === '\0virtual:less-nav') {
              // ADR 0008 Phase A: read from ctx first, fallback to .less/ files
              let navSections = '[]';
              let headerNav = '[]';
              if (ctx && ctx.navSections.length > 0) {
                navSections = JSON.stringify(ctx.navSections);
                headerNav = JSON.stringify(ctx.headerNav);
              } else {
                const navDataPath = join(root, '.less', 'nav-data.json');
                const headerNavPath = join(root, '.less', 'header-nav.json');
                try {
                  if (existsSync(navDataPath)) {
                    navSections = readFileSync(navDataPath, 'utf-8').trim();
                  }
                } catch { /* non-fatal */ }
                try {
                  if (existsSync(headerNavPath)) {
                    headerNav = readFileSync(headerNavPath, 'utf-8').trim();
                  }
                } catch { /* non-fatal */ }
              }
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

    // Load the SSR bundle
    // Use resolve() to generate an absolute path for import()
    const ssrBundlePath = resolve(ssrOutDir, 'entry.js');
    const module = await import(ssrBundlePath);
    const app = module.default;

    if (!app) {
      throw new SsrRenderError('.less-ssg-entry.ts', new Error('Failed to load Hono app'));
    }

    // Patch CustomElementRegistry.define to be idempotent in SSR.
    // The SSR dom shim throws on duplicate registration, but SSG loads page
    // components that each import the same UI modules. With nested DSD + relative
    // imports, multiple routes trigger the same define() call.
    let _ssrDefinePatched = false;
    const origDefine = globalThis.customElements?.define?.bind(globalThis.customElements);
    if (origDefine && !_ssrDefinePatched) {
      globalThis.customElements.define = (
        name: string,
        ctor: CustomElementConstructor,
        options?: ElementDefinitionOptions,
      ) => {
        if (globalThis.customElements.get(name)) return;
        try {
          origDefine(name, ctor, options);
        } catch (_e) {
          // Already defined by another route — safe to skip in SSR
          log.debug(`customElements.define("${name}") skipped: already defined`);
        }
      };
      _ssrDefinePatched = true;
    }

    // ── Dynamic route expansion via getStaticPaths() ──────────
    // Hono's toSSG() skips parameter routes (e.g. /blog/:slug).
    // We detect dynamic routes, call their getStaticPaths() to get
    // concrete parameter values, and render each page.
    // The rendered HTML is written directly to the output directory.
    const dynamicRoutes = routes.filter(
      (r) => r.type === 'page' && !r.special && r.path.includes(':'),
    );

    log.info(
      `Dynamic routes found: ${dynamicRoutes.length}${
        dynamicRoutes.length > 0 ? ` (${dynamicRoutes.map((r) => r.path).join(', ')})` : ''
      }`,
    );

    if (dynamicRoutes.length > 0) {
      // Import renderDSD and wrapInDocument from the SSR bundle.
      // Since the bundle is self-contained (noExternal), these share
      // the same module scope as installLitAdapter() (called in entry).
      const { renderDSD: renderDSDFn, wrapInDocument: wrapInDocumentFn } = module;

      // Initialize @lessjs/content (blog) data store if present.
      // ADR 0008 Phase A: read from ctx first, fallback to .less/ files
      let blogOptions: { contentDir?: string; basePath?: string } | undefined;
      if (ctx?.blogOptions) {
        blogOptions = ctx.blogOptions;
      } else {
        try {
          const blogOptsPath = join(root, '.less', 'blog-options.json');
          if (existsSync(blogOptsPath)) {
            const raw = readFileSync(blogOptsPath, 'utf-8');
            blogOptions = JSON.parse(raw);
          }
        } catch {
          // Non-fatal
        }
      }

      // Initialize in the SSR bundle's module scope
      if (module.initBlogData && typeof module.initBlogData === 'function') {
        try {
          await module.initBlogData(blogOptions);
        } catch {
          log.debug('Blog content module (bundle) not found — skipping');
        }
      }

      // Also initialize in the file system module scope — route modules
      // imported via import() resolve their dependencies from the file
      // system, creating a separate module instance of blog-data.ts.
      // Without this, getPosts() would return [] in those route modules.
      try {
        const fsContentModule = await import('@lessjs/content') as Record<string, unknown>;
        if (typeof fsContentModule.initBlogData === 'function') {
          await (fsContentModule.initBlogData as (opts?: unknown) => Promise<unknown>)(blogOptions);
        }
      } catch {
        log.debug('Blog content module (file system) not found — skipping');
      }

      const postCount = module.getPosts ? (module.getPosts as () => unknown[])().length : 0;
      if (postCount > 0) {
        log.info(`Blog data store initialized: ${postCount} post(s) for SSG dynamic routes`);
      }

      for (const route of dynamicRoutes) {
        const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map((m) => m[1]);
        const routeModulePath = `/${routesDir}/${route.filePath}`;
        let routeMod: Record<string, unknown>;

        try {
          // Dynamic import the route module from the project source.
          // Since the SSR bundle already inlined everything with noExternal,
          // individual route modules are already compiled in. However, for
          // dynamic routes that need getStaticPaths(), we need to load them
          // individually. Use the bundle's context by re-importing from the
          // same root-based path that the SSR build used.
          const routeImportPath = resolve(root, routesDir, route.filePath);
          routeMod = await import(routeImportPath) as Record<string, unknown>;
        } catch (e) {
          log.warn(
            `Cannot load dynamic route module ${routeModulePath}: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
          continue;
        }

        if (typeof routeMod.getStaticPaths !== 'function') {
          log.warn(
            `Dynamic route ${route.path} has no getStaticPaths() export — skipping SSG generation`,
          );
          continue;
        }

        const paramsList =
          await (routeMod.getStaticPaths as () => Promise<Array<Record<string, string>>>)();
        const tagName = (routeMod.tagName as string) || fileToTagName(route.filePath);
        const ComponentClass = routeMod.default as CustomElementConstructor;

        if (!ComponentClass) {
          log.warn(`Dynamic route ${route.path} has no default export — skipping`);
          continue;
        }

        // Register the component in SSR customElements registry
        if (!globalThis.customElements.get(tagName)) {
          try {
            globalThis.customElements.define(tagName, ComponentClass);
          } catch {
            // Already defined — safe to skip
          }
        }

        for (const params of paramsList) {
          // Resolve concrete path: /blog/:slug + { slug: 'v0-8-0' } → /blog/v0-8-0
          let resolvedPath = route.path;
          for (const name of paramNames) {
            resolvedPath = resolvedPath.replace(`:${name}`, params[name] || name);
          }

          try {
            // Render the component with route params as props
            const html = await renderDSDFn(tagName, ComponentClass, params, {
              route: resolvedPath,
              source: route.filePath,
            });

            const fullHtml = wrapInDocumentFn(html, {
              title: options.html?.title || 'LessJS',
              lang: options.html?.lang || 'en',
              headExtras: options.headExtras || '',
            });

            // Write to dist/blog/v0-8-0/index.html
            const ssgOutputDir = join(root, outDir);
            const pageDir = join(ssgOutputDir, resolvedPath);
            const { mkdirSync: mkDir, writeFileSync: writeFile } = await import('node:fs');
            mkDir(pageDir, { recursive: true });
            writeFile(join(pageDir, 'index.html'), fullHtml, 'utf-8');

            log.info(`Dynamic route: ${resolvedPath} → ${resolvedPath}/index.html`);
          } catch (e) {
            log.warn(
              `Failed to render dynamic route ${resolvedPath}: ${
                e instanceof Error ? e.message : String(e)
              }`,
            );
          }
        }
      }
    }

    const { toSSG } = await import('hono/ssg');
    const nodeFs = await import('node:fs');
    const nodePath = await import('node:path');

    const fsModule = {
      // deno-lint-ignore require-await
      writeFile: async (path: string, data: string | Uint8Array) => {
        const dir = nodePath.dirname(path);
        if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir, { recursive: true });
        nodeFs.writeFileSync(path, data);
      },
      // deno-lint-ignore require-await
      mkdir: async (path: string) => {
        if (!nodeFs.existsSync(path)) nodeFs.mkdirSync(path, { recursive: true });
      },
      isDirectory: (path: string) => {
        try {
          return nodeFs.statSync(path).isDirectory();
        } catch (e) {
          // Path doesn't exist or is inaccessible — not a directory
          log.debug(
            `isDirectory("${path}"): ${e instanceof Error ? e.message : String(e)}`,
          );
          return false;
        }
      },
    };

    const outputDir = join(root, outDir);
    const result = await toSSG(app, fsModule, { dir: outputDir });

    if (!result.success) throw result.error;

    // Rename 404/index.html → 404.html for GitHub Pages compatibility
    const _404Dir = join(outputDir, '404');
    const _404Html = join(outputDir, '404.html');
    const _404Index = join(_404Dir, 'index.html');
    if (existsSync(_404Index)) {
      const { renameSync } = await import('node:fs');
      renameSync(_404Index, _404Html);
      if (existsSync(_404Dir)) {
        const { rmdirSync } = await import('node:fs');
        try {
          rmdirSync(_404Dir);
        } catch (e) {
          // Non-empty directory — not an error, just can't auto-remove
          log.debug(
            `Cannot remove 404 directory (not empty): ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
      log.info('404 page → dist/404.html (GitHub Pages)');
    }

    // ── i18n locale expansion ──────────────────────────────
    // ADR 0008 Phase A: read from ctx first, fallback to .less/ files
    let i18nOptsToUse:
      | { locales: string[]; defaultLocale?: string; [key: string]: unknown }
      | null = null;
    if (ctx?.i18nOptions) {
      i18nOptsToUse = ctx.i18nOptions;
    } else {
      const i18nOptsPath = join(root, '.less', 'i18n-options.json');
      if (existsSync(i18nOptsPath)) {
        try {
          i18nOptsToUse = JSON.parse(readFileSync(i18nOptsPath, 'utf-8'));
        } catch {
          // Non-fatal
        }
      }
    }

    if (i18nOptsToUse) {
      const locales: string[] = i18nOptsToUse.locales || [];

      if (locales.length > 1) {
        log.info(`i18n: expanding ${routes.length} route(s) for locales: ${locales.join(', ')}`);

        // Use renderDSD and wrapInDocument from the SSR bundle
        const { renderDSD: renderDSDFn, wrapInDocument: wrapInDocumentFn } = module;

        // Initialize @lessjs/i18n data store so route-level helpers
        // (i18nStaticPaths, switchLocale) return correct values.
        try {
          const i18nModule = await import('@lessjs/i18n') as Record<string, unknown>;
          if (typeof i18nModule.initI18nData === 'function') {
            (i18nModule.initI18nData as (opts: unknown) => void)(i18nOptsToUse);
          }
        } catch {
          // @lessjs/i18n not available — non-fatal
          log.debug('@lessjs/i18n not found — continuing with inline locale expansion');
        }

        for (const locale of locales) {
          for (const route of routes) {
            if (route.type !== 'page' || route.special) continue;

            let routeMod: Record<string, unknown>;
            const routeImportPath = resolve(root, routesDir, route.filePath);
            try {
              routeMod = await import(routeImportPath) as Record<string, unknown>;
            } catch (e) {
              log.debug(
                `Cannot load route module ${routeImportPath}: ${
                  e instanceof Error ? e.message : String(e)
                }`,
              );
              continue;
            }

            const ComponentClass = routeMod.default as CustomElementConstructor | undefined;
            const tagName = (routeMod.tagName as string) || fileToTagName(route.filePath);

            if (!ComponentClass) {
              log.debug(
                `Route ${route.path} has no default export — skipping locale expansion`,
              );
              continue;
            }

            // Register component if not already registered
            if (!globalThis.customElements.get(tagName)) {
              try {
                globalThis.customElements.define(tagName, ComponentClass);
              } catch {
                // Already defined — safe to skip
              }
            }

            // Get param values for dynamic routes
            let paramsList: Array<Record<string, string>> = [{}];
            if (route.path.includes(':')) {
              if (typeof routeMod.getStaticPaths === 'function') {
                paramsList = await (routeMod.getStaticPaths as () => Promise<
                  Array<Record<string, string>>
                >)();
              } else {
                log.info(
                  `Dynamic route ${route.path} has no getStaticPaths — skipping locale expansion`,
                );
                continue;
              }
            }

            const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map((m) => m[1]);

            for (const params of paramsList) {
              // Resolve concrete path
              let resolvedPath = route.path;
              for (const name of paramNames) {
                resolvedPath = resolvedPath.replace(`:${name}`, params[name] || name);
              }

              const localePath = `/${locale}${resolvedPath}`;

              try {
                const html = await renderDSDFn(tagName, ComponentClass, {
                  ...params,
                  locale,
                }, {
                  route: localePath,
                  source: route.filePath,
                });

                const fullHtml = wrapInDocumentFn(html, {
                  title: options.html?.title || 'LessJS',
                  lang: locale,
                  headExtras: options.headExtras || '',
                });

                // Write to dist/en/guide/architecture/index.html
                const pageDir = join(outputDir, localePath);
                const { mkdirSync: mkDir, writeFileSync: writeFile } = await import('node:fs');
                mkDir(pageDir, { recursive: true });
                writeFile(join(pageDir, 'index.html'), fullHtml, 'utf-8');

                log.info(`i18n: ${localePath}/index.html`);
              } catch (e) {
                log.warn(
                  `i18n: failed to render locale ${locale} for ${resolvedPath}: ${
                    e instanceof Error ? e.message : String(e)
                  }`,
                );
              }
            }
          }
        }
      }
    }

    // Convert flat HTML files to clean URLs: about.html → about/index.html
    const allHtmlFiles = findHtmlFiles(outputDir);
    for (const filePath of allHtmlFiles) {
      const rel = nodePath.relative(outputDir, filePath);
      if (rel.endsWith('index.html') || rel === '404.html' || rel.includes(nodePath.sep)) {
        continue;
      }
      const baseName = rel.replace(/\.html$/, '');
      const dirPath = join(outputDir, baseName);
      const indexPath = join(dirPath, 'index.html');
      if (existsSync(dirPath)) continue;
      nodeFs.mkdirSync(dirPath, { recursive: true });
      nodeFs.renameSync(filePath, indexPath);
      log.info(`Clean URL: /${baseName} → ${baseName}/index.html`);
    }

    log.info(`Static site generated → ${outputDir}`);

    const basePath = options.base || '/';

    // Inject client script tag into all HTML files
    // The client entry (built in Phase 2) imports island modules so
    // custom elements can self-register and upgrade DSD markup.
    const clientManifestPath = join(root, outDir, 'client', '.vite', 'manifest.json');
    if (existsSync(clientManifestPath)) {
      try {
        const manifestRaw = readFileSync(clientManifestPath, 'utf-8');
        const manifest = JSON.parse(manifestRaw);
        // Find the client entry in the manifest
        // The key is the source path of .less/.less-client-entry.ts
        for (const [src, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
          if (src.includes('.less-client-entry') && entry.file) {
            const scriptSrc = `${basePath}client/${entry.file}`;
            const { injectClientScript } = await import('../ssg-postprocess.js');
            injectClientScript(outputDir, scriptSrc);
            log.info(`Client script injected: ${scriptSrc}`);
            break;
          }
        }
      } catch (err) {
        log.warn('Could not read client manifest for script injection:', err);
      }
    } else {
      log.warn('No client manifest found - run the full build command first');
    }

    // Post-process: build island chunk map for speculative links
    const {
      buildIslandChunkMap,
      injectCspMeta,
      injectDsdPolyfill,
      injectViewTransitionMeta,
      injectSpeculationRules,
      buildSpeculationRulesJson,
    } = await import('../ssg-postprocess.js');
    const _islandChunkMap = buildIslandChunkMap(root, outDir, islandTagNames, basePath);

    // Post-process: inject View Transitions meta tag.
    // Enables smooth cross-page animations for MPA navigation.
    // Supported: Chrome 111+, Safari 18+, Firefox 129+.
    // Unsupported browsers silently ignore the meta tag.
    const enableViewTransition = options.viewTransition !== false;
    if (enableViewTransition) {
      injectViewTransitionMeta(outputDir);
      log.info('View Transitions meta tag injected into static HTML');
    }

    // Post-process: inject Speculation Rules for prefetch/prerender.
    // Enables the browser to prefetch or prerender pages before navigation,
    // making page loads feel instant for SSG sites.
    // Supported: Chrome 121+, Edge 121+. Safari/Firefox gracefully ignore.
    if (options.speculation) {
      const specOpts = typeof options.speculation === 'boolean'
        ? {} // boolean true → use heuristic defaults
        : options.speculation;
      const rulesJson = buildSpeculationRulesJson(specOpts, routes);
      if (rulesJson) {
        injectSpeculationRules(outputDir, rulesJson);
        log.info('Speculation Rules injected into static HTML');
      } else {
        log.info('Speculation Rules: no rules generated (no matching routes)');
      }
    }

    // Post-process: inject CSP <meta> tag into static HTML files.
    // SSG outputs static files — CSP nonces are not possible here,
    // but policy-only CSP meta tags provide a security baseline for
    // static deployments (CDN, GitHub Pages, etc.).
    const cspPolicy = options.middleware?.csp?.policy;
    if (cspPolicy) {
      injectCspMeta(
        outputDir,
        cspPolicy,
        options.middleware?.csp?.reportOnly || false,
        options.middleware?.csp?.nonce || false,
      );
      log.info('CSP meta tag injected into static HTML');
    }

    // Inject DSD polyfill for browsers that don't support Declarative Shadow DOM
    // (Firefox does NOT support shadowrootmode as of 2025).
    injectDsdPolyfill(outputDir);
    log.info('DSD polyfill injected into static HTML');

    // Build observability: full manifest with HTML pages + budget warnings
    const { printBuildManifest } = await import('../build-manifest.js');
    printBuildManifest({
      root,
      outDir,
      phase: 3,
      headExtras: options.headExtras,
    });

    // Generate PWA files (manifest.json + sw.js) if options include PWA config
    const pwa = (options as Record<string, unknown>).pwa as
      | { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string }
      | undefined;
    if (pwa) {
      const manifest = {
        name: pwa.name || 'LessJS',
        short_name: pwa.shortName || 'LessJS',
        start_url: basePath,
        display: 'standalone' as const,
        theme_color: pwa.themeColor || '#000000',
        background_color: pwa.backgroundColor || '#ffffff',
        icons: [{ src: '/assets/less-logo.svg', sizes: 'any', type: 'image/svg+xml' }],
      };
      writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      log.info('PWA manifest.json generated');

      // Smart service worker: networkFirst for HTML+API, cacheFirst for assets
      // No precaching — the old PRECACHE pattern caused stale index.html.
      const swCode = `const CACHE = 'less-${Date.now()}';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => clients.claim())
));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;
  const isAsset = /\\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.includes('/api/');
  e.respondWith(
    (isAsset ? cacheFirst(e.request) : networkFirst(e.request))
      .catch(() => fetch(e.request))
  );
});
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    const cl = res.clone();
    caches.open(CACHE).then(c => c.put(req, cl)).catch(() => {});
  }
  return res;
}
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cl = res.clone();
      caches.open(CACHE).then(c => c.put(req, cl)).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw new Error('offline');
  }
}`;
      writeFileSync(join(outputDir, 'sw.js'), swCode);
      log.info('PWA sw.js generated');

      // Inject manifest link + sw registration into HTML files
      const manifestLink = `<link rel="manifest" href="${basePath}manifest.json">`;
      const swScript =
        `<script>addEventListener("load",()=>{navigator.serviceWorker?.register("${basePath}sw.js")})</script>`;
      const htmlFiles = findHtmlFiles(outputDir);
      for (const htmlPath of htmlFiles) {
        let html = readFileSync(htmlPath, 'utf-8');
        if (!html.includes('rel="manifest"')) {
          html = html.replace('</head>', `${manifestLink}</head>`);
        }
        if (!html.includes('serviceWorker')) {
          html = html.replace('</body>', `${swScript}</body>`);
        }
        writeFileSync(htmlPath, html);
      }
      log.info(`PWA: injected manifest + sw into ${htmlFiles.length} HTML files`);
    }

    // ─── Sitemap generation ────────────────────────────────────
    // ADR 0008 Phase A: read from ctx first, fallback to .less/ files
    try {
      let hasSitemapConfig = false;
      let sitemapOpts: unknown = null;

      if (ctx?.sitemapOptions) {
        hasSitemapConfig = true;
        sitemapOpts = ctx.sitemapOptions;
      } else {
        const navDataPath = join(root, '.less', 'nav-data.json');
        if (existsSync(navDataPath)) {
          const sitemapConfigPath = join(root, '.less', 'sitemap-options.json');
          if (existsSync(sitemapConfigPath)) {
            hasSitemapConfig = true;
            sitemapOpts = JSON.parse(readFileSync(sitemapConfigPath, 'utf-8'));
          }
        }
      }

      if (hasSitemapConfig && sitemapOpts) {
        const sitemapModule = await import('@lessjs/content/sitemap') as Record<
          string,
          unknown
        >;
        if (typeof sitemapModule.generateSitemap === 'function') {
          (sitemapModule.generateSitemap as (dir: string, opts: unknown) => string[])(
            join(root, outDir),
            sitemapOpts,
          );
        }
      }
    } catch {
      // Sitemap generation failure is non-fatal
      log.debug('Sitemap generation skipped or failed');
    }
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  }
}

// CLI entry point
if (import.meta.main) {
  buildSSG().catch((err) => {
    log.error('Failed:', err);
    process.exit(1);
  });
}

export { buildSSG };

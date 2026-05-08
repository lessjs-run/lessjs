/**
 * @lessjs/core - CLI: SSG Build
 *
 * Standalone SSG rendering + post-processing.
 * Reads the SSR entry from .less/, creates a Vite SSR server,
 * renders all pages to static HTML, then post-processes island paths.
 *
 * This is Phase 3 of the LessJS build pipeline:
 *   Phase 1 (vite build): SSR bundle + .less/ metadata
 *   Phase 2 (build-client.ts): Client island chunks
 *   Phase 3 (this script): SSG rendering + post-processing
 *
 * Must run AFTER build-client so island chunk paths are available
 * for the post-processing step (source paths → built chunk paths).
 *
 * Usage:
 *   deno run -A jsr:@lessjs/core/cli/build-ssg
 *   deno task build:ssg
 */

import { join } from 'node:path';
import process from 'node:process';
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import type { FrameworkOptions, PackageIslandMeta } from '../types.js';
import { SsrRenderError } from '../errors.js';
import { createLogger } from '../logger.js';

const log = createLogger('ssg');

// Lit adapter is installed after the Vite SSR server is created.
// The adapter uses naive TemplateResult interpolation — no DOM shim
// or @lit-labs/ssr dependency needed.

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

async function buildSSG(options: BuildSSGOptions = {}): Promise<void> {
  const root = options.root || process.cwd();
  const outDir = options.outDir || 'dist';
  const routesDir = options.routesDir || 'app/routes';
  const islandsDir = options.islandsDir || 'app/islands';

  // Read island metadata from Phase 1
  const metadataPath = join(root, '.less', 'build-metadata.json');
  let islandTagNames = options.islandTagNames || [];
  let packageIslands = options.packageIslands || [];
  let metadataResolveAlias = options.resolveAlias;

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
    // v0.5.0 note: upgradeStrategy controls island module import timing.
    // It is not a client render runtime.
  } catch (e) {
    log.warn(
      'No .less/build-metadata.json found; using provided island list.',
      e instanceof Error ? e.message : '',
    );
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
    const { createServer } = await import('vite');

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

    // Polyfill CJS globals for node-domexception in Deno ESM environment
    // node-domexception uses `module.exports` (CJS), which Deno's ESM
    // module-runner can't handle. Provide minimal polyfill before Vite loads.
    if (typeof (globalThis as Record<string, unknown>).module === 'undefined') {
      (globalThis as Record<string, unknown>).module = { exports: {} };
      (globalThis as Record<string, unknown>).exports = {};
    }

    const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
    const { join } = await import('node:path');

    const server = await createServer({
      configFile: false,
      root,
      server: { middlewareMode: true },
      appType: 'custom',
      build: { ssr: true },
      ssr: { noExternal: allNoExternal },
      esbuild: {
        tsconfigRaw: {
          compilerOptions: {
            useDefineForClassFields: false,
          },
        },
      },
      plugins: [],
      resolve: {
        preserveSymlinks: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: alias || undefined,
      },
    });

    // Install Lit adapter through Vite SSR so registerAdapter() and renderDSD()
    // share the same module scope. Using server.ssrLoadModule() instead of Deno's
    // import() ensures the adapter is registered in Vite's module graph — no
    // globalThis bridge needed.
    try {
      const adapterModule = await server.ssrLoadModule('@lessjs/adapter-lit');
      if (typeof adapterModule.installLitAdapter === 'function') {
        adapterModule.installLitAdapter();
      }
    } catch {
      log.warn(
        '@lessjs/adapter-lit not found — Lit components must return string from render()',
      );
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

    try {
      const module = await server.ssrLoadModule(tmpEntryPath);
      const app = module.default;

      if (!app) {
        throw new SsrRenderError('.less-ssg-entry.ts', new Error('Failed to load Hono app'));
      }

      // ── Dynamic route expansion via getStaticPaths() ──────────
      // Hono's toSSG() skips parameter routes (e.g. /blog/:slug).
      // We detect dynamic routes, call their getStaticPaths() to get
      // concrete parameter values, and render each page via Vite SSR.
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
        // Use server.ssrLoadModule() to ensure adapter registration is visible.
        // Direct import() creates a separate module graph where
        // installLitAdapter()'s registerAdapter() call is not visible.
        const renderDsdMod = await server.ssrLoadModule(
          '@lessjs/core/render-dsd',
        ) as Record<string, unknown>;
        const ssrHandlerMod = await server.ssrLoadModule(
          '@lessjs/core/less-runtime',
        ) as Record<string, unknown>;
        const renderDSDFn = renderDsdMod.renderDSD as typeof import('../render-dsd.js').renderDSD;
        const wrapInDocumentFn = ssrHandlerMod
          .wrapInDocument as typeof import('../ssr-handler.js').wrapInDocument;

        // Initialize @lessjs/content (blog) data store if present.
        // The content plugin's buildStart() ran in Phase 1's Vite instance,
        // but Phase 3 creates a fresh SSR server with its own module graph.
        // We need to re-initialize so getPosts() returns data.
        let blogOptions: { contentDir?: string; basePath?: string } | undefined;
        try {
          const blogOptsPath = join(root, '.less', 'blog-options.json');
          if (existsSync(blogOptsPath)) {
            const raw = readFileSync(blogOptsPath, 'utf-8');
            blogOptions = JSON.parse(raw);
          }
        } catch {
          // Non-fatal
        }

        try {
          const blogModule = await server.ssrLoadModule('@lessjs/content') as Record<
            string,
            unknown
          >;
          if (blogModule && typeof blogModule.initBlogData === 'function') {
            await (blogModule.initBlogData as (opts?: unknown) => Promise<unknown>)(blogOptions);
            const postCount = (blogModule.getPosts as () => unknown[])().length;
            log.info(`Blog data store initialized: ${postCount} post(s) for SSG dynamic routes`);
          }
        } catch {
          // @lessjs/content not available — non-fatal
          log.debug('Blog content module not found — skipping blog data initialization');
        }

        for (const route of dynamicRoutes) {
          const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map((m) => m[1]);
          const routeModulePath = `/${routesDir}/${route.filePath}`;
          let routeMod: Record<string, unknown>;

          try {
            routeMod = await server.ssrLoadModule(routeModulePath) as Record<string, unknown>;
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
      const { buildIslandChunkMap, injectCspMeta, injectDsdPolyfill } = await import(
        '../ssg-postprocess.js'
      );
      const _islandChunkMap = buildIslandChunkMap(root, outDir, islandTagNames, basePath);

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
    } finally {
      await server.close();
    }

    // ─── Sitemap generation ────────────────────────────────────
    // After SSG is complete, generate sitemap.xml from dist/ output
    // if @lessjs/content sitemap module is configured.
    try {
      const navDataPath = join(root, '.less', 'nav-data.json');
      if (existsSync(navDataPath)) {
        // Nav data exists → @lessjs/content was configured
        // Check if sitemap is configured via build-metadata
        const sitemapConfigPath = join(root, '.less', 'sitemap-options.json');
        if (existsSync(sitemapConfigPath)) {
          const sitemapOpts = JSON.parse(readFileSync(sitemapConfigPath, 'utf-8'));
          const sitemapModule = await import('@lessjs/content/sitemap') as Record<string, unknown>;
          if (typeof sitemapModule.generateSitemap === 'function') {
            (sitemapModule.generateSitemap as (dir: string, opts: unknown) => string[])(
              join(root, outDir),
              sitemapOpts,
            );
          }
        }
      }
    } catch {
      // Sitemap generation failure is non-fatal
      log.debug('Sitemap generation skipped or failed');
    }
  } catch (err) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new SsrRenderError('SSG pipeline', cause);
  } finally {
    // Clean up CJS polyfill — don't leave global pollution
    delete (globalThis as Record<string, unknown>).module;
    delete (globalThis as Record<string, unknown>).exports;

    try {
      unlinkSync(tmpEntryPath);
    } catch (e) {
      // Temp file cleanup failure is non-fatal
      log.debug(
        `Could not remove temp entry: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
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

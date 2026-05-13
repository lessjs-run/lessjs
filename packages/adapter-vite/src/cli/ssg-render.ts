/**
 * @lessjs/adapter-vite - SSG Render Pipeline (ADR 0022)
 *
 * Shared SSG rendering logic used by both:
 *   - build-ssg.ts (Vite inline mode, called from closeBundle)
 *   - ssg.ts (standalone CLI, loads SSR bundle via importmap)
 *
 * This module has zero Vite dependency — it only needs the SSR bundle module.
 */

import { join, resolve } from 'node:path';
import process from 'node:process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import type { LessBuildContext } from '../build-context.js';
import { SsrRenderError } from '@lessjs/core/errors';
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('ssg');

// ─── Types ──────────────────────────────────────────────────────

export interface SsrBundle {
  default: unknown;
  routeInfo?: Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
  }>;
  renderRoute?: (path: string, opts?: Record<string, unknown>) => Promise<string>;
  getStaticPaths?: (path: string) => Promise<Array<Record<string, string>>>;
  posts?: unknown[];
  [key: string]: unknown;
}

export interface SsgRenderOptions {
  root: string;
  outDir: string;
  base?: string;
  headExtras?: string;
  html?: { lang?: string; title?: string };
  middleware?: { csp?: { policy?: string; reportOnly?: boolean; nonce?: boolean } };
  upgradeStrategy?: string;
  pwa?: { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string };
  viewTransition?: boolean;
  speculation?: boolean | Record<string, unknown>;
  islandTagNames?: string[];
  routesDir?: string;
}

// ─── Helpers ───────────────────────────────────────────────────

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findHtmlFiles(fullPath));
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist yet
  }
  return results;
}

// ─── Core render pipeline ──────────────────────────────────────

export async function ssgRender(
  module: SsrBundle,
  options: SsgRenderOptions,
  ctx?: LessBuildContext,
): Promise<void> {
  const root = options.root || process.cwd();
  const outDir = options.outDir || 'dist';
  const basePath = options.base || '/';

  // ── Dynamic route expansion via bundle.getStaticPaths() ──────
  const routeInfo = (module.routeInfo ?? []) as Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
  }>;
  const renderRoute = module.renderRoute as
    | ((path: string, opts?: Record<string, unknown>) => Promise<string>)
    | undefined;
  const getStaticPaths = module.getStaticPaths as
    | ((path: string) => Promise<Array<Record<string, string>>>)
    | undefined;

  const dynamicRoutes = routeInfo.filter((r) => r.isDynamic);
  log.info(
    `Routes: ${routeInfo.length} total` +
      (dynamicRoutes.length > 0
        ? ` (${dynamicRoutes.length} dynamic: ${dynamicRoutes.map((r) => r.path).join(', ')})`
        : ''),
  );

  if (dynamicRoutes.length > 0 && renderRoute && getStaticPaths) {
    for (const route of dynamicRoutes) {
      const paramNames = route.paramNames;
      let paramsList: Array<Record<string, string>>;

      try {
        paramsList = await getStaticPaths(route.path);
      } catch (e) {
        log.warn(
          `Failed to get static paths for ${route.path}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
        continue;
      }

      if (paramsList.length === 0) {
        log.info(`Dynamic route ${route.path} has no static paths — skipping`);
        continue;
      }

      for (const params of paramsList) {
        let resolvedPath = route.path;
        for (const name of paramNames) {
          resolvedPath = resolvedPath.replace(`:${name}`, params[name] || name);
        }

        try {
          const html = await renderRoute(route.path, {
            params,
            title: options.html?.title,
            lang: options.html?.lang,
            headExtras: options.headExtras,
          });

          const outputDir = join(root, outDir);
          const pageDir = join(outputDir, resolvedPath);
          mkdirSync(pageDir, { recursive: true });
          writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');
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

  // ── Main SSG via Hono's toSSG() ────────────────────────────
  const { toSSG } = await import('hono/ssg');
  const nodeFs = await import('node:fs');
  const nodePath = await import('node:path');

  const fsModule = {
    writeFile: async (path: string, data: string | Uint8Array) => {
      // deno-lint-ignore require-await
      const dir = nodePath.dirname(path);
      if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir, { recursive: true });
      nodeFs.writeFileSync(path, data);
    },
    mkdir: async (path: string) => {
      // deno-lint-ignore require-await
      if (!nodeFs.existsSync(path)) nodeFs.mkdirSync(path, { recursive: true });
    },
    isDirectory: (path: string) => {
      try {
        return nodeFs.statSync(path).isDirectory();
      } catch {
        return false;
      }
    },
  };

  const outputDir = join(root, outDir);
  const app = module.default as { fetch: (req: Request, ...args: unknown[]) => Promise<Response> };
  const result = await toSSG(app as never, fsModule, { dir: outputDir });

  if (!result.success) throw result.error;

  // ── Post-processing ─────────────────────────────────────────

  // Rename 404/index.html → 404.html for GitHub Pages
  const _404Dir = join(outputDir, '404');
  const _404Html = join(outputDir, '404.html');
  const _404Index = join(_404Dir, 'index.html');
  if (existsSync(_404Index)) {
    renameSync(_404Index, _404Html);
    if (existsSync(_404Dir)) {
      try {
        rmdirSync(_404Dir);
      } catch {
        // Non-empty — not an error
      }
    }
    log.info('404 page → dist/404.html (GitHub Pages)');
  }

  // Convert flat HTML files to clean URLs: about.html → about/index.html
  const allHtmlFiles = findHtmlFiles(outputDir);
  for (const filePath of allHtmlFiles) {
    const rel = nodePath.relative(outputDir, filePath);
    if (rel.endsWith('index.html') || rel === '404.html') continue;
    const baseName = rel.replace(/\.html$/, '');
    const dirPath = join(outputDir, baseName);
    const indexPath = join(dirPath, 'index.html');
    if (existsSync(dirPath)) continue;
    nodeFs.mkdirSync(dirPath, { recursive: true });
    nodeFs.renameSync(filePath, indexPath);
    log.info(`Clean URL: /${baseName} → ${baseName}/index.html`);
  }

  log.info(`Static site generated → ${outputDir}`);

  // ── i18n locale expansion (if ctx available) ────────────────
  const i18nOpts = ctx?.plugins?.i18nOptions || null;
  if (i18nOpts && renderRoute) {
    const locales: string[] = i18nOpts.locales || [];
    if (locales.length > 1) {
      log.info(`i18n: expanding for locales: ${locales.join(', ')}`);
      for (const locale of locales) {
        for (const route of routeInfo) {
          let paramsList: Array<Record<string, string>> = [{}];
          if (route.isDynamic) {
            if (!getStaticPaths) continue;
            try {
              paramsList = await getStaticPaths(route.path);
            } catch {
              continue;
            }
            if (paramsList.length === 0) continue;
          }

          const paramNames = route.paramNames;
          for (const params of paramsList) {
            let resolvedPath = route.path;
            for (const name of paramNames) {
              resolvedPath = resolvedPath.replace(`:${name}`, params[name] || name);
            }
            const localePath = `/${locale}${resolvedPath}`;
            try {
              const html = await renderRoute(route.path, {
                params,
                locale,
                title: options.html?.title,
                lang: locale,
                headExtras: options.headExtras,
              });
              const pageDir = join(outputDir, localePath);
              mkdirSync(pageDir, { recursive: true });
              writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');
              log.info(`i18n: ${localePath}/index.html`);
            } catch (e) {
              log.warn(
                `i18n: failed for locale ${locale} on ${resolvedPath}: ${
                  e instanceof Error ? e.message : String(e)
                }`,
              );
            }
          }
        }
      }
    }
  }

  // ── Inject client script ────────────────────────────────────
  const clientManifestPath = join(root, outDir, 'client', '.vite', 'manifest.json');
  if (existsSync(clientManifestPath)) {
    try {
      const manifestRaw = readFileSync(clientManifestPath, 'utf-8');
      const manifest = JSON.parse(manifestRaw);
      for (const [src, entry] of Object.entries(manifest) as [string, { file?: string }][]) {
        if (
          (src.includes('less-client-entry') || src.includes('virtual:less-client')) && entry.file
        ) {
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
  }

  // ── Post-processing modules ─────────────────────────────────
  const {
    buildIslandChunkMap,
    injectCspMeta,
    injectDsdPolyfill,
    injectViewTransitionMeta,
    injectSpeculationRules,
    buildSpeculationRulesJson,
  } = await import('../ssg-postprocess.js');

  const islandTagNames = options.islandTagNames || [];
  const _islandChunkMap = buildIslandChunkMap(root, outDir, islandTagNames, basePath);

  if (options.viewTransition !== false) {
    injectViewTransitionMeta(outputDir);
    log.info('View Transitions meta tag injected');
  }

  if (options.speculation) {
    const specOpts = typeof options.speculation === 'boolean'
      ? {}
      : options.speculation as Record<string, unknown>;
    const rulesJson = buildSpeculationRulesJson(
      specOpts,
      routeInfo.map((r) => ({ path: r.path, type: 'page' as const })),
    );
    if (rulesJson) {
      injectSpeculationRules(outputDir, rulesJson);
      log.info('Speculation Rules injected');
    }
  }

  const cspPolicy = options.middleware?.csp?.policy;
  if (cspPolicy) {
    injectCspMeta(
      outputDir,
      cspPolicy,
      options.middleware?.csp?.reportOnly || false,
      options.middleware?.csp?.nonce || false,
    );
    log.info('CSP meta tag injected');
  }

  injectDsdPolyfill(outputDir);
  log.info('DSD polyfill injected');

  // ── Build manifest ──────────────────────────────────────────
  const { printBuildManifest } = await import('../build-manifest.js');
  printBuildManifest({ root, outDir, phase: 3, headExtras: options.headExtras });

  // ── PWA files ──────────────────────────────────────────────
  const pwa = options.pwa;
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
    log.info(`PWA: injected into ${htmlFiles.length} HTML files`);
  }

  // ── Sitemap (via ctx) ──────────────────────────────────────
  try {
    if (ctx?.plugins?.sitemapOptions) {
      const sitemapPkg = '@lessjs/content/sitemap';
      const sitemapModule = await import(sitemapPkg) as Record<string, unknown>;
      if (typeof sitemapModule.generateSitemap === 'function') {
        (sitemapModule.generateSitemap as (dir: string, opts: unknown) => string[])(
          join(root, outDir),
          ctx.plugins.sitemapOptions,
        );
      }
    }
  } catch {
    log.debug('Sitemap generation skipped or failed');
  }
}

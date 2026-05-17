/**
 * @lessjs/adapter-vite - SSG Render Pipeline (ADR 0022)
 *
 * Shared SSG rendering logic used by both:
 *   - build-ssg.ts (Vite inline mode, called from closeBundle)
 *   - ssg.ts (standalone CLI, loads SSR bundle via importmap)
 *
 * This module has zero Vite dependency — it only needs the SSR bundle module.
 */

import { join } from 'node:path';
import process from 'node:process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type { LessBuildContext } from '../build-context.js';
import type {
  CemCompatibilityReport,
  CompatibilityClassification,
  HydrationHint,
  ManifestDecision,
  RenderError,
} from '@lessjs/core';
import { createLogger } from '@lessjs/core/logger';
import { stableHash } from '../island-manifest.js';

const log = createLogger('ssg');

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * H-03 fix: Escape a string for safe use in HTML attributes.
 * Prevents XSS when injecting user-controlled values like basePath into HTML.
 */
function escapeAttr(str: string): string {
  return str.replace(/["'&<>]/g, (c) => {
    switch (c) {
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return c;
    }
  });
}

// ─── Types ──────────────────────────────────────────────────────

/** Per-page render diagnostics returned by renderRoute() */
export interface SsgPageOutput {
  /** Rendered HTML string */
  html: string;
  /** Render errors collected during rendering */
  errors: RenderError[];
  /** Hydration hints collected during rendering */
  hydrationHints: HydrationHint[];
  /** Number of DSD components rendered on this page */
  componentCount: number;
  /** Total render time for all components on this page (ms) */
  renderTimeMs: number;
}

export interface SsrBundle {
  default: unknown;
  routeInfo?: Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
  }>;
  renderRoute?: (
    path: string,
    opts?: Record<string, unknown>,
  ) => Promise<SsgPageOutput>;
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
  middleware?: {
    csp?: { policy?: string; reportOnly?: boolean; nonce?: boolean };
  };
  upgradeStrategy?: string;
  pwa?: {
    name?: string;
    shortName?: string;
    themeColor?: string;
    backgroundColor?: string;
  };
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

function joinUrlPath(...parts: string[]): string {
  const segments = parts
    .flatMap((part) => part.split('/'))
    .map((part) => part.trim())
    .filter(Boolean);
  return '/' + segments.join('/');
}

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function resolveDynamicRoutePath(
  routePath: string,
  paramNames: string[],
  params: Record<string, string>,
): string {
  let resolvedPath = routePath;
  for (const name of paramNames) {
    const raw = params[name];
    if (raw === undefined || raw === null || raw === '') {
      throw new Error(
        `Missing value for route parameter "${name}" in ${routePath}`,
      );
    }

    const value = String(raw);
    if (
      value === '.' ||
      value === '..' ||
      /[\\/]/.test(value) ||
      hasControlCharacter(value)
    ) {
      throw new Error(
        `Unsafe value for route parameter "${name}" in ${routePath}: ${value}`,
      );
    }

    // Use raw value — getStaticPaths already validates for .., /, \\, control chars
    // encodeURIComponent would encode @ → %40, breaking file-to-URL matching
    resolvedPath = resolvedPath.replace(`:${name}`, value);
  }
  return resolvedPath;
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

  // ── Report collection (v0.15.3: dsd-report.json) ──────────────
  const pageDiagnostics: Array<{
    path: string;
    errors: RenderError[];
    hydrationHints: HydrationHint[];
    componentCount: number;
    renderTimeMs: number;
  }> = [];

  function collectPageOutput(
    routePath: string,
    output: SsgPageOutput | string,
  ): string {
    // Backward compat: renderRoute may return string from older bundles
    const html = typeof output === 'string' ? output : output.html;
    if (typeof output !== 'string') {
      pageDiagnostics.push({
        path: routePath,
        errors: output.errors,
        hydrationHints: output.hydrationHints,
        componentCount: output.componentCount,
        renderTimeMs: output.renderTimeMs,
      });
    }
    return html;
  }

  // ── Dynamic route expansion via bundle.getStaticPaths() ──────
  const routeInfo = (module.routeInfo ?? []) as Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
  }>;
  const renderRoute = module.renderRoute as
    | ((path: string, opts?: Record<string, unknown>) => Promise<SsgPageOutput>)
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
        let resolvedPath: string;
        try {
          resolvedPath = resolveDynamicRoutePath(
            route.path,
            paramNames,
            params,
          );
        } catch (e) {
          log.warn(
            `Skipping unsafe dynamic route ${route.path}: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
          continue;
        }

        try {
          const output = await renderRoute(route.path, {
            params,
            title: options.html?.title,
            lang: options.html?.lang,
            headExtras: options.headExtras,
          });
          const html = collectPageOutput(resolvedPath, output);

          const outputDir = join(root, outDir);
          const pageDir = join(outputDir, resolvedPath);
          mkdirSync(pageDir, { recursive: true });
          writeFileSync(join(pageDir, 'index.html'), html, 'utf-8');
          log.info(
            `Dynamic route: ${resolvedPath} → ${resolvedPath}/index.html`,
          );
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
  const nodeFs = await import('node:fs/promises');
  const nodePath = await import('node:path');

  // v0.14.6: Use async fs/promises methods instead of sync methods wrapped in Promise
  const fsModule = {
    writeFile: async (path: string, data: string | Uint8Array) => {
      const dir = nodePath.dirname(path);
      await nodeFs.mkdir(dir, { recursive: true }).catch(() => {});
      await nodeFs.writeFile(path, data);
    },
    mkdir: async (path: string) => {
      await nodeFs.mkdir(path, { recursive: true }).catch(() => {});
    },
    isDirectory: async (path: string) => {
      try {
        return (await nodeFs.stat(path)).isDirectory();
      } catch {
        return false;
      }
    },
  };

  const outputDir = join(root, outDir);
  const app = module.default as
    | { fetch: (req: Request, ...args: unknown[]) => Promise<Response> }
    | undefined;
  if (!app) {
    throw new Error(
      'SSR bundle loaded but no Hono app found (no default export)',
    );
  }
  const result = await toSSG(app as never, fsModule, { dir: outputDir });

  if (!result.success) throw result.error;

  // ── Post-processing ─────────────────────────────────────────

  // Rename 404/index.html → 404.html for GitHub Pages
  const _404Dir = join(outputDir, '404');
  const _404Html = join(outputDir, '404.html');
  const _404Index = join(_404Dir, 'index.html');
  if (existsSync(_404Index)) {
    // Check if target already exists before renaming
    if (existsSync(_404Html)) {
      log.warn(
        '404.html already exists in output dir — removing before rename',
      );
      rmSync(_404Html, { force: true });
    }
    renameSync(_404Index, _404Html);
    if (existsSync(_404Dir)) {
      rmSync(_404Dir, { recursive: true, force: true });
    }
    log.info('404 page → dist/404.html (GitHub Pages)');
  }

  // Convert flat HTML files to clean URLs: about.html → about/index.html
  const allHtmlFiles = findHtmlFiles(outputDir);
  for (const filePath of allHtmlFiles) {
    const rel = nodePath.relative(outputDir, filePath);
    if (rel.endsWith('index.html') || rel === '404.html') continue;
    const baseName = rel.replace(/\.html$/, '');
    const urlBaseName = baseName.replace(/\\/g, '/');
    const dirPath = join(outputDir, baseName);
    const indexPath = join(dirPath, 'index.html');
    if (existsSync(dirPath)) continue;
    mkdirSync(dirPath, { recursive: true });
    renameSync(filePath, indexPath);
    log.info(`Clean URL: /${urlBaseName} → ${urlBaseName}/index.html`);
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
          let paramsList: Array<Record<string, string>>;
          // v0.14.6: Fix pre-existing bug — static routes use [{}] directly;
          // only dynamic routes should call getStaticPaths()
          if (!route.isDynamic) {
            paramsList = [{}];
          } else if (getStaticPaths) {
            try {
              paramsList = await getStaticPaths(route.path);
            } catch {
              log.warn(
                `i18n: getStaticPaths failed for ${route.path}, skipping`,
              );
              continue;
            }
          } else {
            continue;
          }
          if (paramsList.length === 0) continue;

          const paramNames = route.paramNames;
          for (const params of paramsList) {
            let resolvedPath: string;
            try {
              resolvedPath = resolveDynamicRoutePath(
                route.path,
                paramNames,
                params,
              );
            } catch (e) {
              log.warn(
                `i18n: skipping unsafe dynamic route ${route.path}: ${
                  e instanceof Error ? e.message : String(e)
                }`,
              );
              continue;
            }
            // v0.14.10: Skip routes already under a locale prefix (e.g. /zh/decisions/...)
            // to prevent duplicate expansion like /en/zh/... or /zh/zh/...
            const pathSegment = resolvedPath.split('/')[1] || '';
            if (locales.includes(pathSegment)) {
              continue;
            }
            const localePath = joinUrlPath(locale, resolvedPath);
            try {
              const output = await renderRoute(route.path, {
                params,
                locale,
                title: options.html?.title,
                lang: locale,
                headExtras: options.headExtras,
              });
              const html = collectPageOutput(localePath, output);
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
  const _islandChunkMap = buildIslandChunkMap(
    root,
    outDir,
    islandTagNames,
    basePath,
  );

  if (options.viewTransition !== false) {
    injectViewTransitionMeta(outputDir);
    log.info('View Transitions meta tag injected');
  }

  if (options.speculation) {
    const specOpts = typeof options.speculation === 'boolean'
      ? {}
      : (options.speculation as Record<string, unknown>);
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
      icons: [
        { src: '/assets/less-logo.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    };
    writeFileSync(
      join(outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
    );
    log.info('PWA manifest.json generated');

    const cacheHash = stableHash(
      JSON.stringify({
        basePath,
        manifest,
        routes: routeInfo.map((route) => route.path).sort(),
      }),
    );
    const swCode = `const CACHE = 'less-${cacheHash}';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => clients.claim())
));
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }
  if (e.request.method !== 'GET') return;
  if (e.request.headers.has('authorization')) return;
  const url = new URL(e.request.url);
  // Only handle same-origin requests — cross-origin (CDN, analytics) pass through
  if (url.origin !== location.origin || !url.protocol.startsWith('http')) return;
  if (/\\/(api|rpc)(?:\\/|$)/.test(url.pathname)) return;
  if (/\\/(auth|session|login|logout)(?:\\/|$)/.test(url.pathname)) return;
  const destination = e.request.destination;
  const isStaticDestination = ['style', 'script', 'image', 'font', 'manifest'].includes(destination);
  const isAsset = /\\.[a-z0-9]+$/i.test(url.pathname) && isStaticDestination;
  if (isAsset) {
    e.respondWith(cacheFirst(e.request));
  }
  // Non-asset, non-navigate GET requests pass through without SW interception
});
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cl = res.clone();
      caches.open(CACHE).then(c => c.put(req, cl)).catch(() => {});
    }
    return res;
  } catch {
    return new Response('', { status: 408, statusText: 'Request timeout' });
  }
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
    return new Response('offline', { status: 503 });
  }
}`;
    writeFileSync(join(outputDir, 'sw.js'), swCode);
    log.info('PWA sw.js generated');

    // H-03 fix: Escape basePath to prevent attribute injection
    const escapedBasePath = escapeAttr(basePath);
    const manifestLink = `<link rel="manifest" href="${escapedBasePath}manifest.json">`;
    const swScript =
      `<script>addEventListener("load",()=>{navigator.serviceWorker?.register("${escapedBasePath}sw.js")})</script>`;
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
  const { printBuildManifest } = await import('../build-manifest.js');
  printBuildManifest({
    root,
    outDir,
    phase: 3,
    headExtras: options.headExtras,
  });

  try {
    if (ctx?.plugins?.sitemapOptions) {
      // Dynamic import: adapter-vite cannot statically depend on @lessjs/content
      // (would create a JSR publish-time circular dependency).
      // At runtime, the Deno workspace import map or the SSR bundle's import map
      // resolves '@lessjs/content/sitemap' correctly.
      const { generateSitemap } = await import(
        '@lessjs/content/sitemap'
      ) as { generateSitemap: (dir: string, opts: unknown) => string[] };
      generateSitemap(join(root, outDir), ctx.plugins.sitemapOptions);
    }
  } catch {
    log.debug('Sitemap generation skipped or failed');
  }

  // ── dsd-report.json (v0.15.3) ──────────────────────────────────
  const totalErrors = pageDiagnostics.reduce((sum, p) => sum + p.errors.length, 0);
  const totalComponents = pageDiagnostics.reduce((sum, p) => sum + p.componentCount, 0);
  const totalRenderTimeMs = pageDiagnostics.reduce((sum, p) => sum + p.renderTimeMs, 0);
  const totalTemplateSize = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.length, // proxy — exact size from collector
    0,
  );
  const errorComponentCount = pageDiagnostics.filter((p) => p.errors.length > 0).length;
  const maxNestingDepth = 0; // Determined from collector, not per-page
  const interactiveCount = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.filter((h) => h.layer === 'dsd-interactive').length,
    0,
  );
  const pureIslandCount = pageDiagnostics.reduce(
    (sum, p) => sum + p.hydrationHints.filter((h) => h.layer === 'pure-island').length,
    0,
  );
  const totalHints = pageDiagnostics.reduce((sum, p) => sum + p.hydrationHints.length, 0);

  const report: import('@lessjs/core').DsdBuildReport = {
    reportVersion: '1.1.0',
    timestamp: new Date().toISOString(),
    totalPages: pageDiagnostics.length,
    totalErrors,
    renderErrors: pageDiagnostics.map((p) => ({
      path: p.path,
      errors: p.errors,
      hydrationHints: p.hydrationHints,
      componentCount: p.componentCount,
      renderTimeMs: p.renderTimeMs,
    })),
    metricsSummary: {
      totalComponents,
      totalRenderTimeMs,
      avgRenderTimeMs: totalComponents > 0
        ? Math.round(totalRenderTimeMs / totalComponents * 100) / 100
        : 0,
      totalTemplateSize,
      maxNestingDepth,
      errorComponentCount,
    },
    hydrationHintSummary: {
      totalHints,
      interactiveCount,
      pureIslandCount,
    },
    // v0.17.2: Manifest-driven render decisions per package island
    manifestDecisions: buildManifestDecisions(ctx),
    admissionDecisions: ctx?.phase1?.ssrAdmissionPlan?.decisions || [],
    // v0.18.0: CEM compatibility classification summary
    cemCompatibility: buildCemCompatibilityReport(ctx?.phase1?.cemClassifications),
  };

  const reportPath = join(outputDir, 'dsd-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log.info(`DSD report → ${reportPath} (${pageDiagnostics.length} pages, ${totalErrors} errors)`);
}

// ─── Manifest Decisions Builder (v0.17.2) ───────────────────────

/**
 * Build manifest-driven render decisions from ctx.
 *
 * For each package island declaration, records how the pipeline resolved
 * manifest flags (ssr, dsd, hydrate) into a concrete render path:
 * - 'ssr+client': component is SSR-rendered + client-upgraded
 * - 'client-only': component is client-only (ssr === false)
 *
 * When ctx or packageIslandDecls is absent, returns an empty array.
 */
function buildManifestDecisions(ctx?: LessBuildContext): ManifestDecision[] {
  const decls = ctx?.phase1?.packageIslandDecls;
  const manifests = ctx?.phase1?.packageManifests;
  if (!decls?.length || !manifests?.length) return [];

  // Build a tagName → packageName lookup from manifests
  const tagNameToPackage = new Map<string, string>();
  for (const pkg of manifests) {
    for (const decl of pkg.declarations) {
      tagNameToPackage.set(decl.tagName, pkg.packageName);
    }
  }

  return decls.map((island) => {
    const admission = ctx?.phase1?.ssrAdmissionPlan?.decisions.find((d) =>
      d.tagName === island.tagName
    );
    const ssr = admission?.renderPath === 'ssr+client';
    const dsd = island.dsd !== false; // default: true
    const renderPath: ManifestDecision['renderPath'] = ssr ? 'ssr+client' : 'client-only';

    return {
      tagName: island.tagName,
      packageName: tagNameToPackage.get(island.tagName) || 'unknown',
      ssr,
      dsd,
      hydrate: island.hydrate,
      renderPath,
      reason: admission?.reason,
      source: 'package',
    };
  });
}

// ─── CEM Compatibility Report Builder (v0.18.0) ─────────────────

/**
 * Build a CEM compatibility report from CEM classifications.
 *
 * Summarizes how the compatibility classifier classified each third-party
 * WC package component into a tier (ssr-capable, client-only, rejected,
 * experimental-dom). Written to dsd-report.json for CI assertion.
 *
 * Returns undefined when no CEM classifications exist.
 */
function buildCemCompatibilityReport(
  classifications?: CompatibilityClassification[],
): CemCompatibilityReport | undefined {
  if (!classifications?.length) return undefined;

  const ssrCapableCount = classifications.filter((c) => c.tier === 'ssr-capable').length;
  const clientOnlyCount = classifications.filter((c) => c.tier === 'client-only').length;
  const rejectedCount = classifications.filter((c) => c.tier === 'rejected').length;
  const experimentalDomCount = classifications.filter((c) => c.tier === 'experimental-dom').length;

  // Order: rejected first (most critical), then ssr-capable, client-only, experimental-dom
  const sortedClassifications = [...classifications].sort((a, b) => {
    const tierOrder = { rejected: 0, 'ssr-capable': 1, 'client-only': 2, 'experimental-dom': 3 };
    return (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
  });

  const summaryParts: string[] = [];
  if (ssrCapableCount > 0) summaryParts.push(`${ssrCapableCount} ssr-capable`);
  if (clientOnlyCount > 0) summaryParts.push(`${clientOnlyCount} client-only`);
  if (rejectedCount > 0) summaryParts.push(`${rejectedCount} rejected`);
  if (experimentalDomCount > 0) summaryParts.push(`${experimentalDomCount} experimental-dom`);

  return {
    totalClassified: classifications.length,
    ssrCapableCount,
    clientOnlyCount,
    rejectedCount,
    experimentalDomCount,
    classifications: sortedClassifications,
    summary: summaryParts.length > 0
      ? `CEM: ${summaryParts.join(', ')}`
      : 'CEM: no components classified',
  };
}

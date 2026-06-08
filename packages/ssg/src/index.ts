/**
 * @openelement/ssg — Static Site Generation engine.
 *
 * Provides parallel SSG rendering using Deno Workers.
 * Extracted from @openelement/adapter-vite as part of the v0.36.0
 * adapter decomposition (ADR-0090).
 *
 * Architecture:
 *   - Sequential rendering (baseline): render pages one at a time
 *   - Parallel rendering (Workers): distribute pages across workers
 *
 * @module @openelement/ssg
 */

// ─── Types ─────────────────────────────────────────────────────

/** A single page to be rendered during SSG. */
export interface SsgPageInput {
  /** Route path (e.g. '/about', '/blog/hello') */
  path: string;
  /** Route params (e.g. { slug: 'hello' }) */
  params?: Record<string, string>;
}

/** Result of rendering a single page through the concurrency helper. */
export interface ParallelRenderPageOutput {
  path: string;
  html: string;
  durationMs: number;
  error?: string;
}

/** Options for parallel SSG rendering. */
export interface ParallelRenderOptions {
  /** Pages to render. */
  pages: SsgPageInput[];
  /** Render function called for each page. */
  renderPage: (page: SsgPageInput) => Promise<string>;
  /** Number of concurrent workers. Defaults to hardware concurrency or 4. */
  concurrency?: number;
}

/** Summary of a parallel render run. */
export interface ParallelRenderResult {
  pages: ParallelRenderPageOutput[];
  totalDurationMs: number;
  successCount: number;
  errorCount: number;
}

// ─── Sequential Renderer (baseline) ────────────────────────────

/**
 * Render pages sequentially. Useful for debugging and as a
 * performance baseline.
 */
export async function renderSequential(
  options: ParallelRenderOptions,
): Promise<ParallelRenderResult> {
  const start = performance.now();
  const results: ParallelRenderPageOutput[] = [];

  for (const page of options.pages) {
    const pageStart = performance.now();
    try {
      const html = await options.renderPage(page);
      results.push({
        path: page.path,
        html,
        durationMs: Math.round(performance.now() - pageStart),
      });
    } catch (err) {
      results.push({
        path: page.path,
        html: '',
        durationMs: Math.round(performance.now() - pageStart),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    pages: results,
    totalDurationMs: Math.round(performance.now() - start),
    successCount: results.filter((r) => !r.error).length,
    errorCount: results.filter((r) => !!r.error).length,
  };
}

// ─── Parallel Renderer (pool-based) ────────────────────────────

/**
 * Render pages in parallel using a concurrency-limited pool.
 *
 * This uses Promise-based concurrency (not Workers) for simplicity.
 * For CPU-heavy rendering, consider Worker-based parallelism.
 */
export async function renderParallel(
  options: ParallelRenderOptions,
): Promise<ParallelRenderResult> {
  const concurrency = options.concurrency ?? 4;
  const start = performance.now();
  const results: ParallelRenderPageOutput[] = [];

  // Split pages into batches of `concurrency` size
  for (let i = 0; i < options.pages.length; i += concurrency) {
    const batch = options.pages.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const pageStart = performance.now();
        try {
          const html = await options.renderPage(page);
          return {
            path: page.path,
            html,
            durationMs: Math.round(performance.now() - pageStart),
          } as ParallelRenderPageOutput;
        } catch (err) {
          return {
            path: page.path,
            html: '',
            durationMs: Math.round(performance.now() - pageStart),
            error: err instanceof Error ? err.message : String(err),
          } as ParallelRenderPageOutput;
        }
      }),
    );

    results.push(...batchResults);
  }

  return {
    pages: results,
    totalDurationMs: Math.round(performance.now() - start),
    successCount: results.filter((r) => !r.error).length,
    errorCount: results.filter((r) => !!r.error).length,
  };
}

export { resolveDynamicRoutePath, ssgRender } from './ssg-render.ts';
export type {
  SsgIslandDeclForReport,
  SsgPageOutput,
  SsgRenderEvidence,
  SsgRenderOptions,
  SsrBundle,
} from './ssg-render.ts';
export {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from './postprocess.ts';
export type { SpeculationRulesOptions } from './postprocess.ts';

export { generateSsrPolyfillBanner } from './ssr-polyfills.ts';
export {
  buildFallbackManifest,
  completeExternalSpecifiers,
  extractExternalSpecifiers,
  resolveExternalManifest,
  resolvePackageExports,
  walkExports,
} from './external-resolver.ts';
export type { ExternalManifest } from './external-resolver.ts';

export {
  detectAndClassifyCemPackages,
  fileToTagName,
  scanCemManifests,
  scanIslandMeta,
  scanIslands,
  scanPackageManifests,
  scanRoutes,
} from './route-scanner.ts';
export type { CemScanResult, LocalIslandMeta } from './route-scanner.ts';

export { generateRouteTypes } from './route-type-generator.ts';

export { buildEntryDescriptor, buildSsrAdmissionPlan } from './entry-descriptor.ts';
export type {
  ApiRouteDecl,
  AppShellDecl,
  AppShellPlan,
  CorsOriginConfig,
  CspConfig,
  DocumentConfig,
  EntryDescriptor,
  ImportDecl,
  IslandDecl,
  MiddlewareDecl,
  MiddlewareScopeDecl,
  PageRouteDecl,
  RendererDecl,
  ResolvedAppShell,
  RouteDecl,
  SsrAdmissionPlan,
} from './entry-descriptor.ts';

export { generateHonoEntryCode, renderEntry } from './entry-renderer.ts';
export type { HonoEntryOptions } from './entry-renderer.ts';

export { extractHubClientOnlyTags, loadHubClientOnlyTags } from './hub-client-only-tags.ts';
export type {
  HubClientOnlyRecord,
  HubClientOnlyTag,
  HubClientOnlyTagsOptions,
  HubClientOnlyTagsResult,
} from './hub-client-only-tags.ts';

export {
  createGeneratedDataResolverPlugin,
  GENERATED_BLOG_DATA_ID,
  GENERATED_I18N_ID,
  GENERATED_NAV_ID,
  generatedDataPath,
} from './generated-data-resolver.ts';
export type { GeneratedDataResolverOptions } from './generated-data-resolver.ts';

export { createOpenJsrPackageResolverPlugin } from './ssg-package-resolver.ts';

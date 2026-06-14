/**
 * SSG engine protocol contracts.
 *
 * Runtime-free data contracts consumed by
 * the SSG engine and build adapters.
 *
 * These types keep the SSG engine adapter-agnostic: the engine
 * depends only on protocol, core, router, and content — never
 * on Vite or adapter-vite.
 *
 * This module is zero-dependency — it imports nothing outside
 * protocol itself.
 */

import type { HydrationStrategy } from './renderer.ts';
import type { SsrAdmissionPlan } from './routes.ts';

// ─── Concurrency types (from ssg/index.ts) ───────────────────

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

// ─── SSG render pipeline types ───────────────────────────────

/** Per-page render diagnostics. */
export interface SsgPageOutput {
  /** Rendered HTML string */
  html: string;
  /** Render errors collected during rendering */
  errors: Array<{
    code: string;
    severity: 'error' | 'warning';
    phase: string;
    tagName: string;
    message: string;
    recoverable: boolean;
  }>;
  /** Hydration hints collected during rendering */
  hydrationHints: Array<{
    tagName: string;
    layer: 'static' | 'interactive' | 'pure-island';
    strategy?: HydrationStrategy;
  }>;
  /** Number of DSD components rendered on this page */
  componentCount: number;
  /** Total render time for all components on this page (ms) */
  renderTimeMs: number;
}

/** SSR bundle structure loaded by SSG render pipeline. */
export interface SsrBundle {
  default: unknown;
  routeInfo?: Array<{
    path: string;
    tagName: string;
    isDynamic: boolean;
    paramNames: string[];
    revalidate?: number;
    params?: Record<string, string>;
  }>;
  renderRoute?: (
    path: string,
    opts?: Record<string, unknown>,
  ) => Promise<SsgPageOutput>;
  getStaticPaths?: (path: string) => Promise<Array<Record<string, string>>>;
  posts?: unknown[];
  [key: string]: unknown;
}

/** Options passed to the shared SSG render pipeline. */
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

/** Island declaration shape used in SSG render evidence reports. */
export interface SsgIslandDeclForReport {
  tagName: string;
  hydrate?: HydrationStrategy | string;
  dsd?: boolean;
}

/** SSR admission decision imported from core for type compatibility. */
export interface SsgAdmissionDecision {
  tagName: string;
  modulePath?: string;
  source?: 'local' | 'package' | 'nested';
  renderPath: 'ssr+client' | 'client-only' | 'rejected';
  reason: string;
}

/** Compatibility classification imported from core for type compatibility. */
export interface SsgCompatibilityClassification {
  tagName: string;
  tier?: string;
  compatible?: boolean;
  reason?: string;
  [key: string]: unknown;
}

/** OpenElement package manifest (simplified for protocol boundary). */
export interface SsgPackageManifest {
  name: string;
  declarations?: Array<{
    tagName: string;
    openElement?: {
      module?: string;
      hydrate?: string;
      ssr?: boolean;
      dsd?: boolean;
    };
  }>;
  [key: string]: unknown;
}

/** Evidence ledger produced by SSG render pipeline. */
export interface SsgRenderEvidence {
  i18nOptions?: {
    locales: string[];
    defaultLocale?: string;
    [key: string]: unknown;
  } | null;
  localIslandMeta?: Record<string, { hydrate?: HydrationStrategy | string }>;
  packageIslandDecls?: SsgIslandDeclForReport[];
  packageManifests?: SsgPackageManifest[];
  admissionDecisions?: SsgAdmissionDecision[];
  cemClassifications?: SsgCompatibilityClassification[];
  ssrAdmissionPlan?: SsrAdmissionPlan;
  onPrintBuildManifest?: (input: {
    root: string;
    outDir: string;
    phase: 3;
    headExtras?: string;
  }) => Promise<void>;
}

// ─── External resolver types ─────────────────────────────────

/** Manifest produced by Deno dependency pre-resolution. */
export interface ExternalManifest {
  /** Complete list of bare specifiers to mark as external. */
  specifiers: string[];
  /** Redirect map (bare specifier to npm: URL) for importmap generation. */
  importMap: Record<string, string>;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** SHA-256 hash prefix of deno.lock at time of generation. */
  lockHash: string;
}

// ─── Entry generator types ───────────────────────────────────

/** Client island entry shape passed to entry generator. */
export interface ClientIslandEntry {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  strategy: HydrationStrategy;
  strategySource?: 'default' | 'manifest' | 'component' | 'route';
  ssr?: boolean;
  dsd?: boolean;
  reason?: string;
}

// ─── Route scanner types ─────────────────────────────────────

/** Local island metadata indexed by tag name. */
export interface LocalIslandMeta {
  hydrate?: HydrationStrategy | string;
  ssr?: boolean;
  dsd?: boolean;
  reason?: string;
  strategySource?: 'default' | 'manifest' | 'component' | 'route';
}

/** Output of CEM manifest scan. */
export interface CemScanResult {
  islandMeta?: Record<string, LocalIslandMeta>;
  packageIslandDecls?: SsgIslandDeclForReport[];
  packageManifests?: SsgPackageManifest[];
}

/**
 * @lessjs/adapter-vite - LessJS Build Context
 *
 * Shared mutable state for all LessJS Vite plugins.
 * Replaces the closure-captured variables (honoEntryCode, scannedIslandTagNames, etc.)
 * with a single object that's explicitly passed around.
 *
 * Also replaces the .less/ temp directory as IPC between build phases:
 * - Phase 1 (less:build) writes metadata -> ctx fields
 * - Phase 2 (build-client) reads metadata -> ctx fields
 * - Phase 3 (build-ssg) reads metadata -> ctx fields
 * - Sub-plugins (lessContent, lessI18n) write their data -> ctx fields
 *
 * ctx is passed via explicit parameter - no globalThis or module-level discovery.
 * Use lessjs() from @lessjs/app for the recommended unified entry.
 *
 * Fields are grouped by Phase to improve type safety and maintainability.
 */

import type { Alias, Plugin, ResolvedConfig } from 'vite';
import type {
  CompatibilityClassification,
  FrameworkOptions,
  HydrationStrategy,
  LessPackageManifest,
  RouteEntry,
} from '@lessjs/core';
import type { LessPluginMeta } from '@lessjs/protocols/build-types';
import type { IslandDecl, SsrAdmissionPlan } from './entry-descriptor.js';

// ─── Phase Branded Types (compile-time ordering enforcement) ───
// These branded types ensure Phase 2 can only run after Phase 1,
// and Phase 3 can only run after Phase 2. The compiler catches
// out-of-order phase calls at build time.
export type Phase1Token = { readonly __phase1: unique symbol };
export type Phase2Token = { readonly __phase2: unique symbol };
export type Phase3Token = { readonly __phase3: unique symbol };

// ─── Phase 1: Route scanning & build metadata ───────────────────
export class Phase1Meta {
  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = '';

  /** Cached routes from buildStart() for virtual entry regeneration */
  cachedRoutes: RouteEntry[] = [];

  /** Island tag names discovered during route scanning (local islands) */
  islandTagNames: string[] = [];

  /** Relative file paths for local islands */
  islandFiles: string[] = [];

  /** Local island metadata indexed by tag name. */
  islandMeta: Record<string, Partial<IslandDecl>> = {};

  /** Package manifests discovered from npm/JSR packages */
  packageManifests: LessPackageManifest[] = [];

  /** Package island declarations extracted from manifests */
  packageIslandDecls: IslandDecl[] = [];

  /** SSR admission plan produced before SSR entry generation. */
  ssrAdmissionPlan: SsrAdmissionPlan | null = null;

  /** v0.18.0: CEM-derived compatibility classifications from the classifier. */
  cemClassifications: CompatibilityClassification[] = [];

  /** Whether the SSR+client build has completed */
  buildCompleted: boolean = false;

  /** Vite resolved config (set in configResolved hook) */
  resolvedConfig: ResolvedConfig | null = null;

  /** User-provided resolve.alias in its original format */
  userResolveAlias: Record<string, string> | Alias[] | null = null;
}

// ─── Phase 2: Client island build state ─────────────────────────
export class Phase2Meta {
  /** Generated client island entry code */
  clientEntryCode: string = '';
}

// ─── Phase 3: SSG rendering state ───────────────────────────────
export class Phase3Meta {
  /** Generated SSG entry code (for viteBuild SSR input) */
  ssgEntryCode: string = '';

  /** Project root directory */
  root: string = '';

  /** Output directory (default: 'dist') */
  outDir: string = 'dist';

  /** Base URL path (default: '/') */
  base: string = '/';

  /** Middleware config from less() options */
  middleware: FrameworkOptions['middleware'] | null = null;

  /** HTML document options from less() options */
  html: { lang?: string; title?: string } | null = null;

  /** PWA config from less() options */
  pwa: FrameworkOptions['pwa'] | null = null;

  /** Island hydration strategy (default: 'idle') */
  upgradeStrategy: HydrationStrategy = 'idle';

  /** View Transitions enabled (default: true) */
  viewTransition: boolean = true;

  /** Speculation Rules config from less() options */
  speculation: FrameworkOptions['speculation'] | null = null;

  /** Extra HTML to inject into <head> */
  headExtras: string = '';

  /** Whether headExtras scripts were produced by structured injection APIs. */
  allowHeadExtrasScripts: boolean = false;

  /** SSR noExternal patterns (serialized) */
  ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[] = [];

  /** SSR deps to keep as external (resolved by Deno import() at runtime per ADR-0043) */
  ssrExternal: string[] = [];

  /** Routes directory */
  routesDir: string = 'app/routes';

  /** Islands directory */
  islandsDir: string = 'app/islands';

  /** Components directory */
  componentsDir: string = 'app/components';

  /** ADR-0047: Pre-resolved external dependency manifest (auto-generated from deno info). */
  externalManifest?: import('./external-resolver.js').ExternalManifest;

  /** Skip Deno pre-resolution, use regex fallback. */
  skipPreResolution?: boolean;
}

// ─── Plugin data from content/i18n sub-plugins ──────────────────
export class PluginMeta implements LessPluginMeta {
  /** Index signature to satisfy LessPluginMeta interface */
  [key: string]: unknown;

  /** Blog options from @lessjs/content plugin */
  blogOptions: { contentDir?: string; basePath?: string } | null = null;

  /** Blog data virtual module plugin, registered by @lessjs/content */
  blogDataPlugin: Plugin | null = null;

  /** i18n data virtual module plugin, registered by @lessjs/i18n */
  i18nDataPlugin: Plugin | null = null;

  /** Navigation sections from @lessjs/content plugin */
  navSections: Array<
    { section: string; items: Array<{ path: string; label: string; order?: number }> }
  > = [];

  /** Header navigation links from @lessjs/content plugin */
  headerNav: Array<{ href: string; label: string }> = [];

  /** Sitemap options from @lessjs/content plugin */
  sitemapOptions: Record<string, unknown> | null = null;

  /** i18n options from @lessjs/i18n plugin */
  i18nOptions: {
    locales: string[];
    defaultLocale: string;
    [key: string]: unknown;
  } | null = null;
}

// ─── Root context ────────────────────────────────────────────────
export class LessBuildContext {
  /** Phase completion tokens - used for compile-time ordering enforcement */
  readonly _phaseTokens: {
    1: Phase1Token | null;
    2: Phase2Token | null;
    3: Phase3Token | null;
  } = { 1: null, 2: null, 3: null };

  /** Mark Phase 1 as complete and return the token for subsequent phases */
  completePhase1(): Phase1Token {
    const token: Phase1Token = { __phase1: Symbol() as never };
    this._phaseTokens[1] = token;
    return token;
  }

  /** Mark Phase 2 as complete (after Phase 1 or Phase 3) */
  completePhase2(token: Phase1Token | Phase3Token): Phase2Token {
    if (this._phaseTokens[1] !== token && this._phaseTokens[3] !== token) {
      throw new Error('Phase 2 called before Phase 1 completed');
    }
    const t2: Phase2Token = { __phase2: Symbol() as never };
    this._phaseTokens[2] = t2;
    return t2;
  }

  /** Mark Phase 3 as complete (only requires Phase 1, not Phase 2) */
  completePhase3(token: Phase1Token): Phase3Token {
    if (this._phaseTokens[1] !== token) {
      throw new Error('Phase 3 called before Phase 1 completed');
    }
    const t3: Phase3Token = { __phase3: Symbol() as never };
    this._phaseTokens[3] = t3;
    return t3;
  }
  /** Phase 1: Route scanning & build metadata */
  readonly phase1: Phase1Meta = new Phase1Meta();

  /** Phase 2: Client island build state */
  readonly phase2: Phase2Meta = new Phase2Meta();

  /** Phase 3: SSG rendering state */
  readonly phase3: Phase3Meta = new Phase3Meta();

  /** Plugin data from content/i18n sub-plugins */
  readonly plugins: PluginMeta = new PluginMeta();

  /** Resolved framework options with defaults applied (read-only after construction) */
  readonly options: FrameworkOptions;

  constructor(options: FrameworkOptions) {
    this.options = options;
  }

  /** Reset all mutable state (for watch mode / testing) */
  reset(): void {
    // M-12 fix: Clear phase tokens to prevent stale state in watch mode
    this._phaseTokens[1] = null;
    this._phaseTokens[2] = null;
    this._phaseTokens[3] = null;
    this.phase1.honoEntryCode = '';
    this.phase1.cachedRoutes = [];
    this.phase1.islandTagNames = [];
    this.phase1.islandFiles = [];
    this.phase1.islandMeta = {};
    this.phase1.packageManifests = [];
    this.phase1.packageIslandDecls = [];
    this.phase1.ssrAdmissionPlan = null;
    this.phase1.cemClassifications = [];
    this.phase1.buildCompleted = false;
    this.phase1.resolvedConfig = null;
    // NOTE: userResolveAlias is NOT reset - it's user configuration, not
    // build state. It's set in config()/configResolved() and must persist
    // through buildStart() for Phase 2 and 3 to use.
    this.phase2.clientEntryCode = '';
    this.phase3.ssgEntryCode = '';
    this.phase3.root = '';
    this.phase3.outDir = 'dist';
    this.phase3.base = '/';
    this.phase3.middleware = null;
    this.phase3.html = null;
    this.phase3.pwa = null;
    this.phase3.upgradeStrategy = 'idle';
    this.phase3.viewTransition = true;
    this.phase3.speculation = null;
    this.phase3.headExtras = '';
    this.phase3.allowHeadExtrasScripts = false;
    this.phase3.ssrNoExternal = [];
    this.phase3.ssrExternal = [];
    this.phase3.routesDir = 'app/routes';
    this.phase3.islandsDir = 'app/islands';
    this.phase3.componentsDir = 'app/components';
    this.phase3.externalManifest = undefined;
    this.phase3.skipPreResolution = undefined;
    this.plugins.blogOptions = null;
    this.plugins.blogDataPlugin = null;
    this.plugins.i18nDataPlugin = null;
    this.plugins.navSections = [];
    this.plugins.headerNav = [];
    this.plugins.sitemapOptions = null;
    this.plugins.i18nOptions = null;
  }
}

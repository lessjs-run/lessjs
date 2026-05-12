/**
 * @lessjs/adapter-vite - LessJS Build Context
 *
 * Shared mutable state for all LessJS Vite plugins.
 * Replaces the closure-captured variables (honoEntryCode, scannedIslandTagNames, etc.)
 * with a single object that's explicitly passed around.
 *
 * Also replaces the .less/ temp directory as IPC between build phases:
 * - Phase 1 (less:build) writes metadata → ctx fields
 * - Phase 2 (build-client) reads metadata → ctx fields
 * - Phase 3 (build-ssg) reads metadata → ctx fields
 * - Sub-plugins (lessContent, lessI18n) write their data → ctx fields
 *
 * ctx is passed via explicit parameter — no globalThis or module-level discovery.
 * Use lessjs() from @lessjs/app for the recommended unified entry.
 *
 * Fields are grouped by Phase to improve type safety and maintainability.
 */

import type { Alias, ResolvedConfig } from 'vite';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from '@lessjs/core';

// ─── Phase 1: Route scanning & build metadata ───────────────────
export class Phase1Meta {
  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = '';

  /** Cached routes from buildStart() for lazy load() regeneration */
  cachedRoutes: RouteEntry[] = [];

  /** Island tag names discovered during route scanning (local islands) */
  islandTagNames: string[] = [];

  /** Relative file paths for local islands */
  islandFiles: string[] = [];

  /** Package islands discovered from npm/JSR packages */
  packageIslands: PackageIslandMeta[] = [];

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

  /** Island upgrade strategy (default: 'lazy') */
  upgradeStrategy: 'eager' | 'lazy' | 'idle' | 'visible' = 'lazy';

  /** View Transitions enabled (default: true) */
  viewTransition: boolean = true;

  /** Speculation Rules config from less() options */
  speculation: FrameworkOptions['speculation'] | null = null;

  /** Extra HTML to inject into <head> */
  headExtras: string = '';

  /** SSR noExternal patterns (serialized) */
  ssrNoExternal: (string | { __type: 'RegExp'; source: string; flags: string })[] = [];

  /** Routes directory */
  routesDir: string = 'app/routes';

  /** Islands directory */
  islandsDir: string = 'app/islands';

  /** Components directory */
  componentsDir: string = 'app/components';
}

// ─── Plugin data from content/i18n sub-plugins ──────────────────
export class PluginMeta {
  /** Blog options from @lessjs/content plugin */
  blogOptions: { contentDir?: string; basePath?: string } | null = null;

  /** Navigation sections from @lessjs/content plugin */
  navSections: unknown[] = [];

  /** Header navigation links from @lessjs/content plugin */
  headerNav: unknown[] = [];

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
    this.phase1.honoEntryCode = '';
    this.phase1.cachedRoutes = [];
    this.phase1.islandTagNames = [];
    this.phase1.islandFiles = [];
    this.phase1.packageIslands = [];
    this.phase1.buildCompleted = false;
    this.phase1.resolvedConfig = null;
    // NOTE: userResolveAlias is NOT reset — it's user configuration, not
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
    this.phase3.upgradeStrategy = 'lazy';
    this.phase3.viewTransition = true;
    this.phase3.speculation = null;
    this.phase3.headExtras = '';
    this.phase3.ssrNoExternal = [];
    this.phase3.routesDir = 'app/routes';
    this.phase3.islandsDir = 'app/islands';
    this.phase3.componentsDir = 'app/components';
    this.plugins.blogOptions = null;
    this.plugins.navSections = [];
    this.plugins.headerNav = [];
    this.plugins.sitemapOptions = null;
    this.plugins.i18nOptions = null;
  }
}

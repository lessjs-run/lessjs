/**
 * @lessjs/core - LessJS Build Context
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
 */

import type { Alias, ResolvedConfig } from 'vite';
import type { FrameworkOptions, PackageIslandMeta } from '@lessjs/core';

export class LessBuildContext {
  // ─── From less:core route scanning ────────────────────────────

  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = '';

  /** Island tag names discovered during route scanning (local islands) */
  islandTagNames: string[] = [];

  /** Relative file paths for local islands (e.g., 'my-counter.ts', 'posts/index.ts') */
  islandFiles: string[] = [];

  /** Package islands discovered from npm/JSR packages */
  packageIslands: PackageIslandMeta[] = [];

  /** Whether the SSR+client build has completed */
  buildCompleted: boolean = false;

  /** Vite resolved config (set in configResolved hook) */
  resolvedConfig: ResolvedConfig | null = null;

  /** User-provided resolve.alias in its original format.
   * Vite accepts both Record<string, string> and Alias[].
   * Saved during the config() hook so SSG can pass it to the internal Vite SSR server.
   */
  userResolveAlias: Record<string, string> | Alias[] | null = null;

  /** Resolved framework options with defaults applied */
  readonly options: FrameworkOptions;

  // ─── From less:build closeBundle (replaces .less/build-metadata.json) ──

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

  // ─── From lessContent buildStart (replaces .less/blog-options.json, nav-data.json, etc.) ──

  /** Blog options from @lessjs/content plugin */
  blogOptions: { contentDir?: string; basePath?: string } | null = null;

  /** Navigation sections from @lessjs/content plugin */
  navSections: unknown[] = [];

  /** Header navigation links from @lessjs/content plugin */
  headerNav: unknown[] = [];

  /** Sitemap options from @lessjs/content plugin */
  sitemapOptions: Record<string, unknown> | null = null;

  // ─── From lessI18n buildStart (replaces .less/i18n-options.json) ──

  /** i18n options from @lessjs/i18n plugin */
  i18nOptions: {
    locales: string[];
    defaultLocale: string;
    [key: string]: unknown;
  } | null = null;

  // ─── Generated entry code (replaces .less/.less-ssg-entry.ts, .less/.less-client-entry.ts) ──

  /** Generated SSG entry code (for viteBuild SSR input) */
  ssgEntryCode: string = '';

  /** Generated client island entry code */
  clientEntryCode: string = '';

  constructor(options: FrameworkOptions) {
    this.options = options;
  }

  /** Reset all mutable state (for watch mode / testing) */
  reset(): void {
    this.honoEntryCode = '';
    this.islandTagNames = [];
    this.islandFiles = [];
    this.packageIslands = [];
    this.buildCompleted = false;
    this.resolvedConfig = null;
    // NOTE: userResolveAlias is NOT reset — it's user configuration, not
    // build state. It's set in config()/configResolved() and must persist
    // through buildStart() for Phase 2 and 3 to use.
    this.root = '';
    this.outDir = 'dist';
    this.base = '/';
    this.middleware = null;
    this.html = null;
    this.pwa = null;
    this.upgradeStrategy = 'lazy';
    this.viewTransition = true;
    this.speculation = null;
    this.headExtras = '';
    this.ssrNoExternal = [];
    this.routesDir = 'app/routes';
    this.islandsDir = 'app/islands';
    this.componentsDir = 'app/components';
    this.blogOptions = null;
    this.navSections = [];
    this.headerNav = [];
    this.sitemapOptions = null;
    this.i18nOptions = null;
    this.ssgEntryCode = '';
    this.clientEntryCode = '';
  }
}

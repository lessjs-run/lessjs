/**
 * @lessjs/core - Public types.
 *
 * LessJS Architecture types:
 * - SSG is always on (no ssr.preRender option)
 * - No CSR/SPA mode
 * - UI is generic head injection, not tied to one component library
 * - Islands are the only client JS allowed
 */

import type { Plugin } from 'vite';

/** Package Island metadata exported from npm/JSR packages */
export interface PackageIslandMeta {
  /** Custom element tag name (e.g. 'less-theme-toggle') */
  tagName: string;
  /** Module path for import (e.g. '@lessjs/ui/less-theme-toggle') */
  modulePath: string;
  /** Island upgrade strategy metadata */
  strategy?: 'eager' | 'lazy';
}

/** @deprecated Planned for v0.6 — now partially implemented. @see FrameworkOptions.island.upgradeStrategy */
/**
 * @deprecated Planned for v0.6 — now partially implemented.
 * 'idle' and 'visible' are available via island() wrapper and entry-generators.
 * @see FrameworkOptions.island.upgradeStrategy
 */
export type PlannedIslandStrategy = 'idle' | 'visible';

/** Framework configuration options */
export interface FrameworkOptions {
  /** Directory for file-based routes (default: 'app/routes') */
  routesDir?: string;
  /** Directory for island components (default: 'app/islands') */
  islandsDir?: string;
  /** Directory for shared components (default: 'app/components') */
  componentsDir?: string;

  /**
   * Package islands to auto-import from npm/JSR packages.
   * Each package should export an `islands` array in its main entry.
   * Example: ['@lessjs/ui'] will scan package.main.islands.
   */
  packageIslands?: string[];

  /**
   * Extra HTML to inject into <head> (e.g. CDN links, analytics).
   *
   * @dangerous This value is injected as-is without sanitization. Only use
   * with content you fully control (e.g. hardcoded CDN links). Never pass
   * user-supplied strings here — that would create an XSS vector. For
   * user-controllable URLs, use `inject.stylesheets` or `inject.scripts`
   * instead, which validate and escape URLs.
   */
  headExtras?: string;

  /** Document <html> attributes */
  html?: {
    /** Language attribute (default: 'en') */
    lang?: string;
    /** Document title (default: 'LessJS') */
    title?: string;
  };

  /**
   * External resource injection for UI libraries.
   * Generic mechanism, not tied to any specific UI framework.
   * Can be used for Web Awesome, Shoelace, custom CSS, etc.
   */
  inject?: {
    /** CSS stylesheet URLs to inject into <head> */
    stylesheets?: string[];
    /** Module script URLs to inject into <head> */
    scripts?: string[];
    /** Arbitrary HTML fragments to inject into <head> */
    headFragments?: string[];
  };

  /** SSR build configuration (build-time only, no runtime server) */
  ssr?: {
    /** Packages that should not be externalized in SSR build (default: lit packages) */
    noExternal?: (string | RegExp)[];
  };

  /** Island configuration */
  island?: {
    /**
     * Controls when island modules are imported for custom element upgrade.
     * 'lazy' (default): import on requestIdleCallback
     * 'eager': import immediately
     * 'idle': same as 'lazy' (requestIdleCallback)
     * 'visible': import when element enters viewport (IntersectionObserver)
     * NOTE: 'idle' and 'visible' are available in v0.6 via island() wrapper.
     */
    upgradeStrategy?: 'eager' | 'lazy' | 'idle' | 'visible';
  };

  /** Build configuration */
  build?: {
    /** Output directory (default: 'dist') */
    outDir?: string;
  };

  /**
   * PWA configuration. When set, the SSG phase generates:
   * - manifest.json (Web App Manifest)
   * - sw.js (CacheFirst service worker)
   * - manifest link + sw registration in all HTML pages
   */
  pwa?: {
    name?: string;
    shortName?: string;
    themeColor?: string;
    backgroundColor?: string;
  };

  /** Middleware configuration (build-time Hono + dev server only) */
  middleware?: {
    /** Enable CORS (default: true) */
    cors?: boolean;
    /** Allowed CORS origins. Web Standards: no process.env. */
    corsOrigin?: string | string[] | ((origin: string) => string | undefined);
    /** Enable request ID (default: true) */
    requestId?: boolean;
    /** Enable structured logger (default: true) */
    logger?: boolean;
    /** Enable rate limiting (default: false in dev) */
    rateLimit?: boolean;
    /** Enable security headers (default: true) */
    securityHeaders?: boolean;
    /**
     * Content Security Policy configuration.
     * When set, a Content-Security-Policy header is added.
     *
     * For production with islands, you typically need:
     * - script-src: 'self' (for Vite-built client entry)
     * - style-src: 'self' 'unsafe-inline' (Lit uses inline styles)
     *
     * Nonce support: set `nonce: true` to auto-generate a per-request nonce
     * and add it to both the CSP header and <script> tags.
     */
    csp?: {
      /** CSP directive string (e.g. "default-src 'self'; script-src 'self'") */
      policy?: string;
      /** Auto-generate nonce for <script> tags (default: false) */
      nonce?: boolean;
      /** Report-only mode (default: false; uses Content-Security-Policy-Report-Only) */
      reportOnly?: boolean;
    };
  };
}

/** Special file types in the routes directory */
export type SpecialFileType = 'renderer' | 'middleware';

/**
 * LessRenderer interface for _renderer.ts files.
 *
 * Renderers wrap page SSR output, like Next.js layout.tsx or SvelteKit +layout.svelte.
 * They apply to their directory and all subdirectories.
 * Multiple renderers are composed outer to inner (root first, deeper dirs later).
 *
 * Usage:
 * ```ts
 * // app/routes/_renderer.ts
 * import type { LessRenderer } from '@lessjs/core';
 *
 * const renderer: LessRenderer = {
 *   wrap(html, ctx) {
 *     return `<div class="layout"><nav>...</nav><main>${html}</main></div>`;
 *   }
 * };
 * export default renderer;
 * ```
 */
export interface LessRenderer {
  /**
   * Wrap page HTML with layout chrome.
   * @param html - The page's SSR-rendered HTML
   * @param ctx - Request context (provides c.req.path etc.)
   * @returns Wrapped HTML string (or Promise for async operations)
   */
  wrap(
    html: string,
    ctx: { req: { path: string }; [key: string]: unknown },
  ): string | Promise<string>;
}

/**
 * LessMiddleware interface for _middleware.ts files.
 *
 * Middleware is mounted as Hono middleware on the directory prefix.
 * Like Next.js middleware.ts or SvelteKit hooks.server.ts.
 *
 * Usage:
 * ```ts
 * // app/routes/api/_middleware.ts
 * import type { LessMiddleware } from '@lessjs/core';
 * import type { MiddlewareHandler } from 'hono';
 *
 * const middleware: MiddlewareHandler = async (c, next) => {
 *   console.log('API request:', c.req.path);
 *   await next();
 * };
 * export default middleware;
 * ```
 */
export type LessMiddleware = import('hono').MiddlewareHandler;

/** Resolved route entry from file-based routing */
export interface RouteEntry {
  /** URL path pattern (e.g. '/', '/about', '/posts/:id') */
  path: string;
  /** Relative file path from routesDir */
  filePath: string;
  /** Route type */
  type: 'page' | 'api' | 'island' | 'special';
  /** Variable name for module import */
  varName: string;
  /** Special file type (renderer or middleware), if applicable */
  special?: SpecialFileType;
}

/** Metadata extracted from a route module */
export interface RouteMeta {
  title?: string;
  description?: string;
  [key: string]: unknown;
  /** Island chunk URLs for preload hints */
  islandChunks?: string[];
}

export type { SsrContext } from './context.js';

/** The main less() function signature */
export type FrameworkPlugin = (options?: FrameworkOptions) => Plugin[];

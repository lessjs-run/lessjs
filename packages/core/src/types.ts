/**
 * @lessjs/core - Public types.
 *
 * LessJS Architecture types:
 * - SSG is always on (no ssr.preRender option)
 * - No CSR/SPA mode
 * - UI is generic head injection, not tied to one component library
 * - Islands are the only client JS allowed
 */

/** Package Island metadata exported from npm/JSR packages */
export interface PackageIslandMeta {
  /** Custom element tag name (e.g. 'less-theme-toggle') */
  tagName: string;
  /** Module path for import (e.g. '@lessjs/ui/less-theme-toggle') */
  modulePath: string;
  /** Island upgrade strategy */
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

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
    stylesheets?: Array<
      | string
      | {
        href: string;
        /** Subresource Integrity hash for CDN security */
        integrity?: string;
        /** CORS mode for SRI-enabled resources */
        crossorigin?: 'anonymous' | 'use-credentials';
        /** Additional <link> attributes */
        attrs?: Record<string, string | number | boolean>;
      }
    >;
    /** Script URLs to inject into <head>. String entries are emitted as module scripts. */
    scripts?: Array<
      | string
      | {
        src: string;
        type?: string;
        async?: boolean;
        defer?: boolean;
        /** Subresource Integrity hash (e.g. "sha384-...") for CDN security */
        integrity?: string;
        /** CORS mode for SRI-enabled resources (default: "anonymous" when integrity is set) */
        crossorigin?: 'anonymous' | 'use-credentials';
        attrs?: Record<string, string | number | boolean>;
      }
    >;
    /**
     * Arbitrary HTML fragments to inject into <head>.
     *
     * @dangerous Fragments are injected as-is without sanitization. Only use
     * with content you fully control. Never pass user-supplied strings here.
     * For safe URL injection, use `stylesheets` or `scripts` instead.
     */
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

  /**
   * View Transitions API configuration.
   * When true (default), injects <meta name="view-transition" content="same-origin">
   * into all SSG HTML files for smooth cross-page animations.
   * Set to false to disable.
   * @default true
   */
  viewTransition?: boolean;

  /**
   * Speculation Rules API configuration.
   * Enables browser prefetch/prerender of pages before the user navigates.
   * - true: auto-generate rules from route list (heuristic mode)
   * - Object: explicit rules with prerender/prefetch/exclude patterns
   *
   * Only Chromium-based browsers (Chrome 121+, Edge 121+) support this.
   * Safari and Firefox silently ignore the speculationrules script tag.
   */
  speculation?: boolean | {
    /** URL patterns to prerender (full background render) */
    prerender?: string[];
    /** URL patterns to prefetch (fetch resources without rendering) */
    prefetch?: string[];
    /** URL patterns to exclude from speculative loading */
    exclude?: string[];
    /** Eagerness: 'immediate' | 'moderate' (default) | 'conservative' */
    eagerness?: 'immediate' | 'moderate' | 'conservative';
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
/**
 * LessMiddleware type for _middleware.ts files.
 *
 * Middleware is mounted as Hono middleware on the directory prefix.
 * Uses a generic function type to avoid importing Hono at runtime.
 * When used with Hono, the actual type is Hono.MiddlewareHandler.
 */
// deno-lint-ignore no-explicit-any
export type LessMiddleware = (c: any, next: () => Promise<void>) => Promise<void> | void;

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

export type { SsrContext } from './context.js';

// ─── DSD Render Types (from render-dsd.ts refactoring) ──────────

/** Component layer in the three-layer model */
export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island';

/**
 * Declarative event binding for DSD Interactive components.
 *
 * When a component's shadow root is pre-populated by DSD, framework template
 * bindings (e.g. Lit's @click) are never executed because render() returns nothing.
 * This descriptor tells the adapter which DOM events need manual wiring.
 *
 * @example
 * ```ts
 * static hydrateEvents: HydrateEventDescriptor[] = [
 *   { selector: 'button.theme-toggle', event: 'click', method: '_handleToggle' },
 * ];
 * ```
 */
export interface HydrateEventDescriptor {
  /** CSS selector within shadow root to find the target element */
  selector: string;
  /** DOM event name (e.g. 'click', 'input', 'keydown') */
  event: string;
  /** Method name on the component instance to call */
  method: string;
}

/**
 * Adapter interface for framework-specific rendering.
 *
 * v0.6.2: DSD hydration is handled at the component level via
 * WithDsdHydration Mixin (in @lessjs/adapter-lit) and declarative
 * hydrateEvents. The adapter only needs render + isTemplate + extractStyles.
 */
export interface RenderAdapter {
  /** Check if a value is a template type this adapter handles */
  isTemplate?: (value: unknown) => boolean;
  /** Render a template value to HTML string */
  render?: (value: unknown, tagName: string) => Promise<string>;
  /** Extract static CSS from a component class */
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}

/**
 * Interface that components must implement to be DSD-renderable.
 * Works with any Custom Element class that has render() and connectedCallback().
 *
 * render() MUST return a string. If you use Lit components that return
 * TemplateResult, install @lessjs/adapter-lit to handle the conversion.
 *
 * v0.6.2: Added `layer` property for three-layer component model.
 *   - 'dsd-static' (default): static content, no hydration needed
 *   - 'dsd-interactive': needs event bindings after DSD upgrade
 *   - 'pure-island': no DSD, framework fully owns shadow root
 *
 * v0.6.2: Added `hydrateEvents` for declarative event binding (Layer 2).
 */
export interface DsdComponent {
  /** Return Shadow DOM inner HTML as a string */
  render(): string | unknown;

  /** Optional: called after setting props, before render() */
  connectedCallback?(): void;

  /**
   * Component layer in the three-layer model.
   * - 'dsd-static': default, no client-side hydration needed
   * - 'dsd-interactive': DSD for first paint, adapter hydrates events
   * - 'pure-island': no DSD, framework fully owns shadow root
   * @default 'dsd-static'
   */
  layer?: ComponentLayer;

  /**
   * Declarative event bindings for DSD Interactive components.
   * Used by adapters to attach event listeners to existing DSD DOM.
   * Only relevant when layer === 'dsd-interactive'.
   */
  hydrateEvents?: HydrateEventDescriptor[];

  /** Set named property/value */
  [key: string]: unknown;
}

/** DSD template options per WHATWG HTML Living Standard */
export interface DsdOptions {
  /** Add shadowrootdelegatesfocus — improves focus management for interactive components */
  delegatesFocus?: boolean;
  /** Add shadowrootclonable — allows cloneNode()/importNode() to include the shadow root */
  clonable?: boolean;
  /** Add shadowrootserializable — enables getInnerHTML() serialization */
  serializable?: boolean;
  /** Set shadowrootslotassignment="manual" — for precise slot control */
  slotAssignment?: 'named' | 'manual';
  /**
   * Add shadowrootcustomelementregistry.
   *
   * Per the HTML Living Standard this is a boolean content attribute.
   * String values are accepted for v0.x compatibility, but the value is not
   * serialized because the standard attribute has no value.
   */
  customElementRegistry?: boolean | string;
  /**
   * Component layer — controls whether DSD template is emitted.
   * 'pure-island' → no DSD template, framework owns shadow root entirely.
   * 'dsd-static' | 'dsd-interactive' → DSD template emitted.
   * @default 'dsd-static'
   */
  layer?: ComponentLayer;
}

/** Per-component DSD rendering metrics collected during SSR */
export interface DsdRenderMetrics {
  tagName: string;
  renderTimeMs: number;
  templateSize: number;
  layer: ComponentLayer;
  hasError: boolean;
  nestingDepth: number;
}

/** Aggregate DSD rendering report for a build */
export interface DsdReport {
  totalComponents: number;
  dsdComponents: number;
  hydratedComponents: number;
  pureIslands: number;
  totalDsdSize: number;
  maxNestingDepth: number;
}

/** Collects DSD render metrics during SSR for post-build reporting */
export class DsdRenderCollector {
  private _metrics: DsdRenderMetrics[] = [];

  add(metrics: DsdRenderMetrics): void {
    this._metrics.push(metrics);
  }

  get metrics(): readonly DsdRenderMetrics[] {
    return this._metrics;
  }

  getReport(): DsdReport {
    const dsdComponents = this._metrics.filter((m) => m.layer !== 'pure-island');
    const pureIslands = this._metrics.filter((m) => m.layer === 'pure-island');
    // v0.14.3: Only dsd-interactive components need hydration.
    // dsd-static components have no event bindings — they don't need hydration.
    const hydrated = this._metrics.filter(
      (m) => !m.hasError && m.layer === 'dsd-interactive',
    );

    return {
      totalComponents: this._metrics.length,
      dsdComponents: dsdComponents.length,
      hydratedComponents: hydrated.length,
      pureIslands: pureIslands.length,
      totalDsdSize: this._metrics.reduce((sum, m) => sum + m.templateSize, 0),
      maxNestingDepth: Math.max(...this._metrics.map((m) => m.nestingDepth), 0),
    };
  }
}

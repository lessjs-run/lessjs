/**
 * @lessjs/core - Public types.
 *
 * LessJS Architecture types:
 * - SSG is always on (no ssr.preRender option)
 * - No CSR/SPA mode
 * - UI is generic head injection, not tied to one component library
 * - Islands are the only client JS allowed
 */

// ─── WC Package Protocol (v0.16+) ───────────────────────────────────

/** Custom element attribute descriptor (CEM-compatible) */
export interface LessAttribute {
  /** Attribute name */
  name: string;
  /** Attribute type (e.g. 'string', 'boolean', 'number') */
  type?: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Whether the attribute reflects to the corresponding property */
  reflects?: boolean;
  /** Field name on the element class (if different from attribute name) */
  fieldName?: string;
}

/** Custom element class member descriptor (CEM-compatible) */
export interface LessMember {
  /** Member name */
  name: string;
  /** Member kind */
  kind: 'field' | 'method' | 'property';
  /** Type string */
  type?: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Privacy level */
  privacy?: 'public' | 'protected' | 'private';
  /** Whether this member is static */
  static?: boolean;
  /** Whether this member is readonly */
  readonly?: boolean;
}

/** Custom element event descriptor (CEM-compatible) */
export interface LessEvent {
  /** Event name */
  name: string;
  /** Event type (e.g. 'CustomEvent<{ value: string }>') */
  type?: string;
  /** Description */
  description?: string;
}

/** Custom element slot descriptor (CEM-compatible) */
export interface LessSlot {
  /** Slot name (empty string for default slot) */
  name: string;
  /** Description */
  description?: string;
}

/** Custom element CSS custom property descriptor (CEM-compatible) */
export interface LessCssProperty {
  /** CSS property name (e.g. '--button-padding') */
  name: string;
  /** Default value */
  default?: string;
  /** Description */
  description?: string;
  /** Type (e.g. 'length', 'color') */
  type?: string;
}

/** Custom element CSS part descriptor (CEM-compatible) */
export interface LessCssPart {
  /** Part name */
  name: string;
  /** Description */
  description?: string;
}

/** SSR/DSD/hydration declarations for a LessJS custom element */
export interface LessElementExtensions {
  /** Whether this component can be server-side rendered */
  ssr?: boolean;
  /** Whether this component uses Declarative Shadow DOM for SSR output */
  dsd?: boolean;
  /** Component layer in the three-layer model */
  layer?: ComponentLayer;
  /** Hydration strategy for client-side upgrade */
  hydrate?: 'eager' | 'lazy' | 'idle' | 'visible';
  /** Declarative event bindings for dsd-interactive components */
  hydrateEvents?: HydrateEventDescriptor[];
  /** Module path for import (e.g. '@lessjs/ui/less-button') */
  module?: string;
  /** Export name from the module (default: tagName in PascalCase) */
  export?: string;
}

/** Package-level LessJS declarations */
export interface LessPackageExtensions {
  /** Minimum LessJS core version required */
  lessjsVersion?: string;
  /** Adapter required for SSR rendering (e.g. 'lit', 'vanilla') */
  adapter?: string;
  /** Whether this package provides a default CSS stylesheet */
  hasStylesheet?: boolean;
  /** CSS custom property prefix (e.g. 'less') */
  cssPrefix?: string;
}

/** Named export descriptor within a package module */
export interface LessExport {
  /** Export name (e.g. 'LessButton') */
  name: string;
  /** Reference path (e.g. './less-button.js') */
  path?: string;
  /** Description */
  description?: string;
}

/** Custom element declaration within a LessJS package manifest */
export interface LessDeclaration {
  /** Custom element tag name (must be valid per HTML spec) */
  tagName: string;
  /** Element class name */
  className?: string;
  /** Super class name (e.g. 'LitElement') */
  superclassName?: string;
  /** Attributes */
  attributes?: LessAttribute[];
  /** Class members */
  members?: LessMember[];
  /** Events */
  events?: LessEvent[];
  /** Slots */
  slots?: LessSlot[];
  /** CSS custom properties */
  cssProperties?: LessCssProperty[];
  /** CSS shadow parts */
  cssParts?: LessCssPart[];
  /** LessJS SSR/DSD/hydration extensions */
  less?: LessElementExtensions;
  /** Description */
  description?: string;
}

/** Module entry within a LessJS package manifest */
export interface LessModule {
  /** Module path relative to package root (e.g. './less-button.js') */
  path: string;
  /** Named exports from this module */
  exports?: LessExport[];
  /** Declarations defined in this module */
  declarations?: string[];
}

/** CEM-compatible package manifest for LessJS Web Component packages.
 *
 * Structured, tool-consumable metadata for an entire WC package.
 */
export interface LessPackageManifest {
  /** Schema version of the manifest format */
  schemaVersion: string;
  /** Package name on JSR/npm (e.g. '@lessjs/ui') */
  packageName: string;
  /** Package version (semver) */
  version: string;
  /** Human-readable package description */
  description?: string;
  /** Author or organization */
  author?: string;
  /** License identifier (e.g. 'MIT') */
  license?: string;
  /** Homepage URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** Custom element declarations in this package */
  declarations: LessDeclaration[];
  /** Module entry points */
  modules?: LessModule[];
  /** Package-level LessJS extensions */
  less?: LessPackageExtensions;
}

/** Result of validating a LessPackageManifest */
export interface ValidationResult {
  /** Whether the manifest is valid */
  valid: boolean;
  /** Validation errors (blocking) */
  errors: ValidationError[];
  /** Validation warnings (non-blocking) */
  warnings: ValidationWarning[];
}

/** A validation error from manifest checking */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Path to the problematic field (e.g. 'declarations[0].tagName') */
  path?: string;
}

/** A validation warning from manifest checking */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Path to the field that triggered the warning */
  path?: string;
}

/** Index entry generated from a registered manifest */
export interface RegistryIndexEntry {
  /** Tag name */
  tagName: string;
  /** Package name */
  packageName: string;
  /** Package version */
  version: string;
  /** Module path */
  module?: string;
  /** SSR capability */
  ssr?: boolean;
  /** DSD capability */
  dsd?: boolean;
  /** Hydration strategy */
  hydrate?: string;
}

/** Aggregated index of all registered manifests */
export interface RegistryIndex {
  /** Total packages registered */
  totalPackages: number;
  /** Total declarations across all packages */
  totalDeclarations: number;
  /** Index entries, sorted by tagName */
  entries: RegistryIndexEntry[];
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
   * Package names to scan for WC manifests.
   * Each package should export a `manifest` LessPackageManifest in its main entry.
   * Example: ['@lessjs/ui'] will scan package.main.manifest.
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
 * Renderer Protocol — the adapter interface for framework-specific rendering.
 *
 * Every adapter MUST provide a `name` for diagnostics and multi-adapter support.
 * The last registered adapter is the default (returned by `getAdapter()`).
 */
export interface RendererProtocol {
  /** Adapter name for diagnostics, logging, and named lookup */
  name: string;
  /** Check if a value is a template type this adapter handles */
  isTemplate?: (value: unknown) => boolean;
  /** Render a template value to HTML string */
  render?: (value: unknown, tagName: string) => Promise<string>;
  /** Extract static CSS from a component class */
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}

/**
 * Phase in the render pipeline where an error can occur.
 */
export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';

/**
 * Structured error from the render pipeline.
 *
 * Provides a typed, machine-readable error representation instead of
 * ad-hoc HTML comments and console logs.
 */
export interface RenderError {
  /** Pipeline phase where the error occurred */
  phase: RenderPhase;
  /** Tag name of the component that errored */
  tagName: string;
  /** Human-readable error message */
  message: string;
  /** Whether the error is recoverable (pipeline can continue) */
  recoverable: boolean;
}

/**
 * Input to a single renderDSD() call.
 */
export interface RenderInput {
  /** Custom element tag name */
  tagName: string;
  /** Custom Element class constructor */
  componentClass: CustomElementConstructor;
  /** Attribute/property key-value pairs */
  props: Record<string, unknown>;
  /** DSD template attributes per HTML Living Standard */
  dsdOptions?: DsdOptions;
  /** Current nesting depth (0 = top-level) */
  nestingDepth: number;
}

/**
 * Hydration hint emitted during SSR for client-side adapter use.
 */
export interface HydrationHint {
  /** Custom element tag name */
  tagName: string;
  /** Component layer */
  layer: ComponentLayer;
  /** Declarative event bindings (dsd-interactive only) */
  events?: HydrateEventDescriptor[];
  /** Island upgrade strategy */
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

/**
 * Hooks for observing and intercepting the render pipeline.
 *
 * All hooks are optional — when omitted, the pipeline behaves exactly
 * as before (zero overhead).
 */
export interface RenderHooks {
  /** Called before component instantiation. */
  beforeRender?: (input: RenderInput) => void;
  /** Called after serialization is complete. */
  afterRender?: (output: RenderOutput) => void;
  /** Called for any classified render error (from any phase). */
  onError?: (error: RenderError) => void;
}

/**
 * Structured output from renderDSD().
 *
 * Provides errors, metrics, and hydration hints alongside the HTML.
 */
export interface RenderOutput {
  /** Rendered DSD HTML string */
  html: string;
  /** Errors collected during rendering */
  errors: RenderError[];
  /** Per-component render metrics */
  metrics: DsdRenderMetrics;
  /** Hydration hints for client-side adapter use */
  hydrationHints: HydrationHint[];
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
   */
  customElementRegistry?: boolean;
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

/**
 * Per-page render diagnostics collected during SSG build.
 * One entry per rendered page/route.
 */
export interface DsdPageDiagnostics {
  /** Route path or URL path of the rendered page */
  path: string;
  /** Render errors collected from all components on this page */
  errors: RenderError[];
  /** Hydration hints collected from all components on this page */
  hydrationHints: HydrationHint[];
  /** Number of DSD components rendered on this page */
  componentCount: number;
  /** Total render time for all components on this page (ms) */
  renderTimeMs: number;
}

/**
 * Metrics summary aggregated across all pages in the SSG build.
 */
export interface DsdMetricsSummary {
  /** Total number of DSD components rendered across all pages */
  totalComponents: number;
  /** Total render time across all pages and components (ms) */
  totalRenderTimeMs: number;
  /** Average render time per component (ms) */
  avgRenderTimeMs: number;
  /** Total template size (bytes) across all components */
  totalTemplateSize: number;
  /** Maximum nesting depth encountered */
  maxNestingDepth: number;
  /** Number of components that had errors */
  errorComponentCount: number;
}

/**
 * Hydration hint summary aggregated across all pages.
 */
export interface DsdHydrationHintSummary {
  /** Total number of hydration hints */
  totalHints: number;
  /** Count of dsd-interactive components needing hydration */
  interactiveCount: number;
  /** Count of pure-island components */
  pureIslandCount: number;
}

/**
 * Manifest-driven render decision for a single island declaration.
 *
 * Records how the build pipeline resolved each package island's manifest
 * flags (ssr, dsd, hydrate) into a concrete render path. Written to
 * `dsd-report.json` for build observability and CI assertion.
 *
 * v0.17.2: Added to DsdBuildReport.
 */
export interface ManifestDecision {
  /** Custom element tag name */
  tagName: string;
  /** Package name that declares this component */
  packageName: string;
  /** Whether this component supports SSR (from manifest `less.ssr`) */
  ssr: boolean;
  /** Whether this component uses Declarative Shadow DOM (from manifest `less.dsd`) */
  dsd: boolean;
  /** Hydration strategy from manifest (eager/lazy/idle/visible) */
  hydrate?: string;
  /** Resolved render path: 'ssr+client' = SSR rendering + client upgrade; 'client-only' = client-only */
  renderPath: 'ssr+client' | 'client-only';
}

/**
 * Build report written to `dsd-report.json` after SSG rendering.
 *
 * Provides a machine-readable summary of render diagnostics,
 * enabling CI/release to fail on render errors and making
 * SSG output observable.
 */
export interface DsdBuildReport {
  /** Report schema version (semver) — bump when fields change */
  reportVersion: string;
  /** ISO 8601 timestamp of when the report was generated */
  timestamp: string;
  /** Total number of pages rendered */
  totalPages: number;
  /** Total number of render errors across all pages */
  totalErrors: number;
  /** All render errors, grouped by page */
  renderErrors: DsdPageDiagnostics[];
  /** Aggregated metrics across all pages */
  metricsSummary: DsdMetricsSummary;
  /** Aggregated hydration hint summary */
  hydrationHintSummary: DsdHydrationHintSummary;
  /**
   * Manifest-driven render decisions per package island.
   * Records how each island's manifest flags resolved to a render path.
   * Empty when no package manifests are configured.
   */
  manifestDecisions?: ManifestDecision[];
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

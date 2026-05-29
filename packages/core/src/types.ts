import type { VNode } from './vnode.js';

/**
 * @lessjs/core - Public types.
 *
 * LessJS Architecture types:
 * - SSG is always on (no ssr.preRender option)
 * - No CSR/SPA mode
 * - UI is generic head injection, not tied to one component library
 * - Islands are the only client JS allowed
 *
 * ─── SSR Import Discovery Audit (Step1) ─────────────────────
 *
 * This file ONLY defines types. It does NOT handle SSR imports.
 * For SSR import logic, see:
 *   - entry-descriptor.ts (SsrAdmissionPlan interface)
 *   - entry-renderer.ts (SSR entry code generation)
 *   - route-scanner.ts (island discovery)
 *   - render-dsd.ts (nested element rendering)
 *
 * Audit completed: 2026-05-17
 * Auditor: AI agent (LessJS v0.17.4 SOP compliance check)
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
  hydrate?: HydrationStrategy;
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
   * user-supplied strings here - that would create an XSS vector. For
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
    /**
     * v0.18.3: DOM simulation experiment for client-only components.
     * When set to 'explicit', selected client-only packages attempt rendering
     * through an isolated DOM environment (Happy DOM).
     * @default 'off'
     */
    domSimulation?: 'off' | 'explicit';
    /**
     * Timeout in milliseconds for DOM simulation rendering.
     * @default 500
     */
    domSimulationTimeoutMs?: number;
  };

  /** Island configuration */
  island?: {
    /**
     * Controls when island modules are imported for custom element upgrade.
     * 'idle' (default): import on requestIdleCallback
     * 'load': import immediately
     * 'visible': import when element enters viewport (IntersectionObserver)
     * 'only': client-only render; excluded from SSR admission
     */
    upgradeStrategy?: HydrationStrategy;
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
  /** Static custom element tag name exported by the route module, when present */
  tagName?: string;
  /** Special file type (renderer or middleware), if applicable */
  special?: SpecialFileType;
  /** v0.21 ISR: revalidation interval in seconds. 0 = always, missing = static. */
  revalidate?: number;
}

export type { SsrContext } from './context.js';

// ─── DSD Render Types (from render-dsd.ts refactoring) ──────────

/** Component layer in the three-layer model */
export type ComponentLayer = 'dsd-static' | 'dsd-interactive' | 'pure-island';

/** v0.21 hydration strategies. Legacy eager/lazy names are intentionally not accepted. */
export type HydrationStrategy = 'load' | 'idle' | 'visible' | 'only';

/** v0.21 strategy origin tracking for diagnostics and build reports. */
export type StrategySource = 'directive' | 'island-options' | 'manifest' | 'default';

/**
 * Declarative event binding descriptor.
 *
 * @deprecated Removed in v0.21.0. Use `@click` / `@keydown` etc. in `html` tagged templates.
 * See ADR-0039 and SOP-006 for migration.
 *
 * @example
 * ```ts
 * // Before (hydrateEvents — removed in v0.21.0):
 * // static hydrateEvents = [
 * //   { selector: 'button', event: 'click', method: '_handleToggle' },
 * // ];
 *
 * // After (html + @click):
 * // render() {
 * //   return html`<button @click=${this._handleToggle}>Toggle</button>`;
 * // }
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
 * Unsubscribe function returned by reactive subscriptions.
 */
export type Unsubscribe = () => void;

/**
 * ReactiveHost protocol — explicit interface for DsdElement Signal integration.
 *
 * Instead of Duck Typing signals via `isSignalLike()`, external signal libraries
 * and reactive sources target this protocol. DsdElement implements ReactiveHost,
 * and the template runtime calls `host.subscribeTo(source)` during binding.
 *
 * This replaces the v0.21.0-alpha Duck Typing approach with an explicit contract.
 *
 * @since v0.21.0
 */
export interface ReactiveHost {
  /**
   * Subscribe to a reactive source. The host decides how to handle updates
   * (e.g. schedule a microtask-batched re-render).
   *
   * @param source - Any object with `subscribe(fn)` (satisfies SignalLike contract)
   * @returns Unsubscribe function to clean up the subscription
   */
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): Unsubscribe }): Unsubscribe;

  /**
   * Request a reactive update. Called by the reactive source on value change.
   * The host batches multiple requests via microtask queue.
   */
  requestReactiveUpdate(): void;
} /**
 * Renderer Protocol - the adapter interface for framework-specific rendering.
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

/** Stable machine-readable render error code. */
export type RenderErrorCode =
  | 'LESS_RENDER_INSTANTIATE_FAILED'
  | 'LESS_RENDER_INVALID_OUTPUT'
  | 'LESS_RENDER_RENDER_FAILED'
  | 'LESS_RENDER_NESTED_FAILED'
  | 'LESS_RENDER_STYLE_FAILED'
  | 'LESS_RENDER_SERIALIZE_FAILED';

/** Render error severity for gates and build reports. */
export type RenderErrorSeverity = 'error' | 'warning';

/**
 * Structured error from the render pipeline.
 *
 * Provides a typed, machine-readable error representation instead of
 * ad-hoc HTML comments and console logs.
 */
export interface RenderError {
  /** Stable machine-readable error code */
  code: string;
  /** Gate severity. Non-recoverable errors are always error severity. */
  severity: RenderErrorSeverity;
  /** Pipeline phase where the error occurred */
  phase: string;
  /** Tag name of the component that errored */
  tagName: string;
  /** Human-readable error message */
  message: string;
  /** Whether the error is recoverable (pipeline can continue) */
  recoverable: boolean;
}

/**
 * Input to a single renderDsd() call.
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
  /** Island upgrade strategy */
  strategy?: HydrationStrategy;
}

/**
 * Hooks for observing and intercepting the render pipeline.
 *
 * All hooks are optional - when omitted, the pipeline behaves exactly
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
 * Structured output from renderDsd().
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
 * v0.24.3 (ADR-0058): TemplateResult removed. Components return string or VNode.
 * Works with any Custom Element class that has render() and connectedCallback().
 *
 * v0.6.2: Added `layer` property for three-layer component model.
 *   - 'dsd-static' (default): static content, no hydration needed
 *   - 'dsd-interactive': needs event bindings after DSD upgrade
 *   - 'pure-island': no DSD, framework fully owns shadow root
 */
export interface DsdComponent {
  /** Return Shadow DOM inner HTML as a string or VNode */
  render(): string | VNode | unknown;

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

  /** Set named property/value */
  [key: string]: unknown;
}

/** DSD template options per WHATWG HTML Living Standard */
export interface DsdOptions {
  /** Add shadowrootdelegatesfocus - improves focus management for interactive components */
  delegatesFocus?: boolean;
  /** Add shadowrootclonable - allows cloneNode()/importNode() to include the shadow root */
  clonable?: boolean;
  /** Add shadowrootserializable - enables getInnerHTML() serialization */
  serializable?: boolean;
  /** Set shadowrootslotassignment="manual" - for precise slot control */
  slotAssignment?: 'named' | 'manual';
  /**
   * Add shadowrootcustomelementregistry.
   *
   * Per the HTML Living Standard this is a boolean content attribute.
   */
  customElementRegistry?: boolean;
  /**
   * Component layer - controls whether DSD template is emitted.
   * 'pure-island' -> no DSD template, framework owns shadow root entirely.
   * 'dsd-static' | 'dsd-interactive' -> DSD template emitted.
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

/** v0.21 strategy evidence aggregated into dsd-report.json. */
export interface DsdHydrationStrategySummary {
  load: number;
  idle: number;
  visible: number;
  only: number;
  clientOnlyExcluded: number;
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
  /** Hydration strategy from manifest (load/idle/visible/only) */
  hydrate?: string;
  /** v0.21: strategy origin (directive/island-options/manifest/default) */
  strategySource?: StrategySource;
  /** Resolved render path: 'ssr+client' = SSR rendering + client upgrade; 'client-only' = client-only */
  renderPath: 'ssr+client' | 'client-only';
  /** Admission reason shown in build reports */
  reason?: string;
  /** Source of the declaration */
  source?: 'local' | 'package' | 'nested';
}

/** SSR admission decision emitted by adapter-vite before SSR bundle generation. */
export interface SsrAdmissionDecision {
  tagName: string;
  modulePath: string;
  source: 'local' | 'package' | 'nested';
  renderPath: 'ssr+client' | 'client-only' | 'rejected';
  reason: string;
}

/**
 * Build report written to `dsd-report.json` after SSG rendering.
 *
 * Provides a machine-readable summary of render diagnostics,
 * enabling CI/release to fail on render errors and making
 * SSG output observable.
 */
export interface DsdBuildReport {
  /** Report schema version (semver) - bump when fields change */
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
  /** v0.21 hydration strategy counts and client-only exclusion evidence. */
  hydrationStrategySummary?: DsdHydrationStrategySummary;
  /**
   * Manifest-driven render decisions per package island.
   * Records how each island's manifest flags resolved to a render path.
   * Empty when no package manifests are configured.
   */
  manifestDecisions?: ManifestDecision[];
  /** v0.17.4: all SSR admission decisions, including local client-only islands. */
  admissionDecisions?: SsrAdmissionDecision[];
  /**
   * v0.18.0: CEM compatibility tier summary.
   * Records how each third-party WC package component was classified
   * by the compatibility classifier (ssr-capable, client-only, rejected, experimental-dom).
   * Empty when no CEM manifests were parsed.
   */
  cemCompatibility?: CemCompatibilityReport;
  /**
   * v0.18.3: DOM simulation experiment results.
   * Records attempt outcomes for experimental-dom components rendered
   * through the Happy DOM simulation path. Absent when domSimulation is 'off'.
   */
  domSimulation?: DomSimulationReport;
  /** v0.21: ISR route records for routes exporting revalidate. */
  isrRoutes?: IsrRouteRecord[];
}

/** v0.21 ISR route record published in dsd-report.json. */
export interface IsrRouteRecord {
  path: string;
  revalidate: number;
  cacheKey: string;
}

/**
 * v0.18.3: DOM simulation report section in dsd-report.json.
 */
export interface DomSimulationReport {
  /** Whether DOM simulation is enabled */
  enabled: boolean;
  /** Strategy used (always 'experimental-dom' for v0.18.3) */
  strategy: string;
  /** Total number of components attempted */
  attemptedCount: number;
  /** Number of successful renders */
  succeededCount: number;
  /** Number of failed renders */
  failedCount: number;
  /** Number of timed-out renders */
  timeoutCount: number;
  /** Per-component attempt details */
  attempts: DomSimulationAttempt[];
}

/**
 * Per-component DOM simulation attempt detail.
 */
export interface DomSimulationAttempt {
  /** Tag name */
  tagName: string;
  /** Whether the simulation succeeded */
  success: boolean;
  /** Render time in milliseconds */
  renderTimeMs: number;
  /** Serialized byte size (on success) */
  byteSize?: number;
  /** Error message (on failure) */
  error?: string;
  /** Whether a timeout occurred */
  timedOut: boolean;
  /** Fallback decision */
  fallback: 'client-only' | 'none';
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
    // dsd-static components have no event bindings - they don't need hydration.
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

// ─── CEM (Custom Elements Manifest) Types (v0.18.0) ───────────────────────

/**
 * CEM compatibility report section in dsd-report.json.
 *
 * Records how the CEM compatibility classifier classified each component
 * from third-party WC packages. This enables CI assertion on compatibility
 * tiers and provides a machine-readable summary of the admission decisions.
 *
 * v0.18.0: Added to DsdBuildReport.
 */
export interface CemCompatibilityReport {
  /** Total number of CEM components classified */
  totalClassified: number;
  /** Number of components classified as ssr-capable */
  ssrCapableCount: number;
  /** Number of components classified as client-only */
  clientOnlyCount: number;
  /** Number of components classified as rejected */
  rejectedCount: number;
  /** Number of components classified as experimental-dom */
  experimentalDomCount: number;
  /** All classifications, ordered by tier (rejected first, then ssr-capable, client-only) */
  classifications: CompatibilityClassification[];
  /** Human-readable summary for CI logs */
  summary: string;
}

/**
 * Standard Custom Elements Manifest (CEM) schema types.
 *
 * CEM is a community standard for describing custom elements metadata.
 * @see https://github.com/webcomponents/custom-elements-manifest
 */

/** CEM schema version */
export type CemSchemaVersion = string;

/** CEM module kind */
export type CemModuleKind = 'javascript-module' | 'css' | 'html';

/** CEM declaration kind */
export type CemDeclarationKind =
  | 'custom-element'
  | 'custom-element-definition'
  | 'mixin'
  | 'variable'
  | 'function'
  | 'class'
  | 'method'
  | 'field'
  | 'property'
  | 'attribute'
  | 'event'
  | 'slot'
  | 'css-property'
  | 'css-part';

/** CEM visibility/privacy */
export type CemPrivacy = 'public' | 'protected' | 'private';

/** CEM attribute type */
export type CemAttributeType = 'string' | 'boolean' | 'number' | 'array' | 'object' | 'function';

/** CEM member type */
export type CemMemberType = 'field' | 'method' | 'property';

/** CEM export kind */
export type CemExportKind = 'default' | 'named';

/**
 * Base CEM entry with common fields.
 */
interface CemBase {
  /** Declaration kind */
  kind: CemDeclarationKind;
  /** Human-readable description */
  description?: string;
  /** Deprecation notice */
  deprecated?: boolean | string;
  /** Since version */
  since?: string;
  /** Author name */
  author?: string;
  /** Additional metadata (preserve unknown CEM fields) */
  [key: string]: unknown;
}

/** CEM attribute descriptor */
export interface CemAttribute extends CemBase {
  kind: 'attribute';
  /** Attribute name */
  name: string;
  /** Attribute type */
  type?: CemAttributeType | string;
  /** Default value */
  defaultValue?: string;
  /** Whether the attribute reflects to a property */
  reflects?: boolean;
  /** Property name (if different from attribute name) */
  propertyName?: string;
  /** Whether the attribute is required */
  required?: boolean;
}

/** CEM property descriptor */
export interface CemProperty extends CemBase {
  kind: 'property';
  /** Property name */
  name: string;
  /** Property type */
  type?: string;
  /** Default value */
  defaultValue?: string;
  /** Whether the property is readonly */
  readonly?: boolean;
  /** Whether the property is static */
  static?: boolean;
  /** Privacy level */
  privacy?: CemPrivacy;
}

/** CEM method descriptor */
export interface CemMethod extends CemBase {
  kind: 'method';
  /** Method name */
  name: string;
  /** Return type */
  returns?: string;
  /** Parameters */
  params?: CemParameter[];
  /** Privacy level */
  privacy?: CemPrivacy;
  /** Whether the method is static */
  static?: boolean;
  /** Whether the method is async */
  async?: boolean;
}

/** CEM parameter descriptor */
export interface CemParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type?: string;
  /** Whether the parameter is optional */
  optional?: boolean;
  /** Default value */
  default?: string;
  /** Whether the parameter is a rest parameter */
  rest?: boolean;
}

/** CEM event descriptor */
export interface CemEvent extends CemBase {
  kind: 'event';
  /** Event name */
  name: string;
  /** Event type (e.g. 'CustomEvent', 'Event') */
  type?: string;
  /** Event detail type */
  detailType?: string;
  /** Whether the event bubbles */
  bubbles?: boolean;
  /** Whether the event is cancelable */
  cancelable?: boolean;
  /** Whether the event is composed */
  composed?: boolean;
}

/** CEM slot descriptor */
export interface CemSlot extends CemBase {
  kind: 'slot';
  /** Slot name (empty string for default slot) */
  name: string;
  /** Whether the slot is required */
  required?: boolean;
}

/** CEM CSS custom property descriptor */
export interface CemCssProperty extends CemBase {
  kind: 'css-property';
  /** CSS property name (e.g. '--button-padding') */
  name: string;
  /** Default value */
  defaultValue?: string;
  /** CSS type (e.g. 'length', 'color', 'number') */
  syntax?: string;
  /** Whether the property inherits */
  inherits?: boolean;
  /** Initial value */
  initialValue?: string;
}

/** CEM CSS part descriptor */
export interface CemCssPart extends CemBase {
  kind: 'css-part';
  /** Part name */
  name: string;
  /** Whether the part is required */
  required?: boolean;
}

/** CEM custom element declaration */
export interface CemCustomElement extends CemBase {
  kind: 'custom-element';
  /** Custom element tag name */
  tagName: string;
  /** Class name */
  className?: string;
  /** Super class name or reference */
  superClass?: CemReference;
  /** Attributes */
  attributes?: CemAttribute[];
  /** Properties */
  properties?: CemProperty[];
  /** Methods */
  methods?: CemMethod[];
  /** Events */
  events?: CemEvent[];
  /** Slots */
  slots?: CemSlot[];
  /** CSS custom properties */
  cssProperties?: CemCssProperty[];
  /** CSS shadow parts */
  cssParts?: CemCssPart[];
  /** Whether the element uses shadow DOM */
  shadowDOM?: boolean;
  /** Shadow root mode */
  shadowRootMode?: 'open' | 'closed';
  /** Whether the element is a form-associated custom element */
  formAssociated?: boolean;
  /** LessJS SSR/DSD/hydration extensions (non-standard, LessJS-specific) */
  less?: LessElementExtensions;
}

/** CEM reference to another declaration */
export interface CemReference {
  /** Module path */
  module?: string;
  /** Declaration name */
  name: string;
}

/** CEM custom element definition (e.g. customElements.define call) */
export interface CemCustomElementDefinition extends CemBase {
  kind: 'custom-element-definition';
  /** Custom element tag name */
  tagName: string;
  /** Reference to the class declaration */
  declaration: CemReference;
  /** Module where the definition occurs */
  module?: string;
}

/** CEM export descriptor */
export interface CemExport {
  /** Export kind */
  kind: CemExportKind;
  /** Exported name (for named exports) */
  name?: string;
  /** Declaration reference */
  declaration: CemReference;
}

/** CEM module descriptor */
export interface CemModule {
  /** Module kind */
  kind: CemModuleKind;
  /** Module path relative to package root */
  path: string;
  /** Declarations defined in this module */
  declarations?: (CemCustomElement | CemCustomElementDefinition | CemBase)[];
  /** Exports from this module */
  exports?: CemExport[];
  /** Imports in this module */
  imports?: CemImport[];
}

/** CEM import descriptor */
export interface CemImport {
  /** Imported name */
  name: string;
  /** Export name in the source module */
  exportName?: string;
  /** Source module path or package name */
  module: string;
  /** Whether the import is a type-only import */
  typeOnly?: boolean;
}

/** Custom Elements Manifest (CEM) root schema */
export interface CustomElementsManifest {
  /** Schema version */
  schemaVersion: CemSchemaVersion;
  /** Package name */
  packageName?: string;
  /** Package version */
  version?: string;
  /** Readme content */
  readme?: string;
  /** Modules described by this manifest */
  modules: CemModule[];
  /** Preserve unknown top-level fields for future compatibility */
  [key: string]: unknown;
}

// ─── CEM Parse Result Types ─────────────────────────────────────

/** Result of parsing a CEM file */
export interface CemParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed manifest (when success is true) */
  manifest?: CustomElementsManifest;
  /** Parse errors */
  errors: CemParseError[];
  /** Parse warnings */
  warnings: CemParseWarning[];
}

/** CEM parse error */
export interface CemParseError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Path to the problematic field */
  path?: string;
}

/** CEM parse warning */
export interface CemParseWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Path to the field that triggered the warning */
  path?: string;
}

/** Compatibility tier for a package/component */
export type CompatibilityTier = 'ssr-capable' | 'client-only' | 'rejected' | 'experimental-dom';

/** Compatibility classification result */
export interface CompatibilityClassification {
  /** Tag name */
  tagName: string;
  /** Assigned tier */
  tier: CompatibilityTier;
  /** Reason for the classification */
  reason: string;
  /** Source of the declaration */
  source: 'local' | 'package' | 'nested';
  /** Module path */
  modulePath?: string;
  /** Whether SSR is supported */
  ssr?: boolean;
  /** Whether DSD is supported */
  dsd?: boolean;
  /** Hydration strategy */
  hydrate?: string;
}

// ─── CEM Validation Types (v0.18.1) ───────────────────────────

/**
 * A single validation diagnostic - either an error or warning.
 *
 * Used in ManifestValidationReport to communicate actionable
 * feedback about a CEM manifest. Every diagnostic includes
 * a machine-readable code, severity, human message, and
 * an actionable fix suggestion.
 */
export interface ValidationDiagnostic {
  /** Machine-readable error/warning code (e.g. 'INVALID_TAG_NAME', 'MISSING_MODULE_PATH') */
  code: string;
  /** Severity */
  severity: 'error' | 'warning';
  /** Human-readable message */
  message: string;
  /** Custom element tag name this diagnostic applies to (if applicable) */
  tagName?: string;
  /** File or module path this diagnostic applies to (if applicable) */
  filePath?: string;
  /** Actionable fix suggestion */
  fix?: string;
}

/**
 * Result of validating a single custom element declaration
 * from a CEM manifest.
 */
export interface ValidatedTag {
  /** Tag name */
  tagName: string;
  /** Whether the tag passed all validations */
  valid: boolean;
  /** Assigned compatibility tier */
  compatibility: CompatibilityTier;
  /** Module path (from CEM declaration) */
  modulePath?: string;
  /** Class name (from CEM declaration) */
  className?: string;
  /** Whether SSR is declared as supported */
  ssr?: boolean;
  /** Whether DSD is declared as supported */
  dsd?: boolean;
}

/**
 * Full validation report for a CEM manifest.
 *
 * Produced by validateManifest() as the standard output,
 * consumed by the `less validate-manifest` CLI and by
 * CI pipelines for pre-install gating.
 */
export interface ManifestValidationReport {
  /** Package name (from CEM or inferred) */
  packageName?: string;
  /** Package version (from CEM or inferred) */
  version?: string;
  /** Whether the manifest as a whole is valid */
  valid: boolean;
  /** CEM schema version */
  schemaVersion?: string;
  /** Overall compatibility tier of the package */
  compatibility: CompatibilityTier;
  /** Validation errors (fatal) */
  errors: ValidationDiagnostic[];
  /** Validation warnings (non-fatal) */
  warnings: ValidationDiagnostic[];
  /** Per-tag validation results */
  tags: ValidatedTag[];
}

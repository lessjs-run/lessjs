/**
 * @lessjs/core - Pure runtime.
 *
 * LessJS is a static-first framework with a pure runtime core:
 * - Zero node:* imports - no filesystem, no process, no path
 * - Zero Vite dependency - no Plugin, no build orchestration
 * - Zero npm: specifiers - works in Deno, Node, Bun, Edge
 * - Pure Web Standard: URL, fetch, import.meta.url, console
 *
 * Rendering: DSD (Declarative Shadow DOM) string concatenation
 * Islands: Custom Element registration + prop deserialization
 * Adapter: registerAdapter() + RendererProtocol interface
 *
 * Build orchestration (Vite plugins) lives in @lessjs/adapter-vite.
 * For the unified lessjs() entry, use @lessjs/app instead.
 */

// --- Public API re-exports -----------------------------------------

export type {
  FrameworkOptions,
  LessMiddleware,
  LessRenderer,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';

export {
  BuildError,
  ErrorCode,
  IslandRenderError,
  LessError,
  NavigationError,
  PropValidationError,
  RenderError,
  reportError,
  setErrorTelemetryHook,
  SsrErrorContext,
  SsrRenderError,
} from './errors.js';
export type { ErrorPhase, ErrorSeverity, ErrorTelemetryHook, SsrErrorEntry } from './errors.js';
export { ErrorBoundary } from './error-boundary.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './html-escape.js';
export type { LessApiContext } from './api.js';
export { createIsrCacheKey, isIsrRouteConfig, MemoryIsrCache } from './isr.js';
export type {
  IsrCache,
  IsrCacheEntry,
  IsrCacheResult,
  IsrCacheState,
  IsrManifestEntry,
  IsrRouteConfig,
} from './isr.js';
export { DsdElement } from './dsd-element.js';
export {
  createRenderDsdStreamMetrics,
  renderDsd,
  renderDsdByName,
  renderDsdStream,
} from './render-dsd.js';
export type {
  RenderDsdStreamChunk,
  RenderDsdStreamComponent,
  RenderDsdStreamMetrics,
  RenderDsdStreamOptions,
} from './render-dsd-stream.js';
export { camelToKebab } from './render-serialize.js';
export { getAdapter, getRegisteredAdapters, registerAdapter } from './adapter-registry.js';
export type {
  CemCompatibilityReport,
  CompatibilityClassification,
  CompatibilityTier,
  ComponentLayer,
  DomSimulationAttempt,
  DomSimulationReport,
  DsdBuildReport,
  DsdHydrationHintSummary,
  DsdHydrationStrategySummary,
  DsdMetricsSummary,
  DsdOptions,
  DsdPageDiagnostics,
  HydrateEventDescriptor,
  HydrationHint,
  HydrationStrategy,
  IsrRouteRecord,
  LessAttribute,
  LessCssPart,
  LessCssProperty,
  LessDeclaration,
  LessElementExtensions,
  LessEvent,
  LessExport,
  LessMember,
  LessModule,
  LessPackageExtensions,
  LessPackageManifest,
  LessSlot,
  ManifestDecision,
  ManifestValidationReport,
  ReactiveHost,
  RegistryIndex,
  RegistryIndexEntry,
  RendererProtocol,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
  SsrAdmissionDecision,
  StrategySource,
  Unsubscribe,
  ValidatedTag,
  ValidationDiagnostic,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types.js';
export {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  type SafeHtml,
  type UnsafeHtml,
} from './html-escape.js';
export {
  // v0.24.3: Neutral signal utilities — no template dependency
  isSignalLike,
  type SignalLike,
  unwrapSignalLike,
} from './signal-like.js';
export { consumeContext, type Context, createContext, provideContext } from './signal-context.js';
export { createLogger, LessLogger, LogLevel } from './logger.js';
/** @internal — use @lessjs/core/security subpath */
export { DANGEROUS_KEYS } from './security.js';
export { isValidTagName } from './tag-utils.js';
export { defineCustomElement } from './custom-element.js';
export { bindEvents, defineIsland, getSsrProps, type IslandOptions } from './island.js';
export { transformIslandSource } from './island-transform.js';
export type { IslandTransformOptions, IslandTransformResult } from './island-transform.js';

// v0.23: Build-time shared types live in @lessjs/protocols/build-types.

// WC Package Protocol (v0.17+)
export {
  clear as clearRegistry,
  generateIndex,
  getAll as getAllManifests,
  getByTagName,
  register as registerManifest,
  validate as validateManifest,
} from './registry.js';
// v0.24.1 (ADR-0057): JSX + Signal component model
// VNode & jsx-runtime
export type { VNode } from './vnode.js';
export { isVNode } from './vnode.js';
export { Fragment } from './jsx-runtime.js';
// Renderers
export { renderToDom } from './jsx-render-dom.js';
export { renderDsdTree, renderToString } from './jsx-render-string.js';
export {
  collectEventBindings,
  createEventMarkerContext,
  type EventBindingRecord,
  type EventMarkerContext,
  eventTypeFromProp,
  hydrateEventMarkers,
  serializeEventMarkers,
} from './event-hydration.js';
// static props runtime + Signal unwrap
export {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  registerStaticObservedAttributes,
  syncStaticPropsFromAttributes,
  unwrap,
} from './prop.js';
// Type-inference utilities
export type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from './prop-types.js';

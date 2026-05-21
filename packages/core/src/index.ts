/**
 * @lessjs/core - Pure runtime.
 *
 * LessJS is a static-first framework with a pure runtime core:
 * - Zero node:* imports — no filesystem, no process, no path
 * - Zero Vite dependency — no Plugin, no build orchestration
 * - Zero npm: specifiers — works in Deno, Node, Bun, Edge
 * - Pure Web Standard: URL, fetch, import.meta.url, console
 *
 * Rendering: DSD (Declarative Shadow DOM) string concatenation
 * Islands: Custom Element registration + prop deserialization
 * Adapter: registerAdapter() + RendererProtocol interface
 *
 * Build orchestration (Vite plugins) lives in @lessjs/adapter-vite.
 * For the unified lessjs() entry, use @lessjs/app instead.
 */

// ─── Public API re-exports ─────────────────────────────────────────

export type {
  FrameworkOptions,
  LessMiddleware,
  LessRenderer,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';

export { LessError, SsrRenderError } from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './html-escape.js';
export { DsdElement } from './dsd-element.js';
export { StyleSheet } from './style-sheet.js';
export type { StyleSheetLike, StyleSheetRule } from './style-sheet.js';
export { renderDSD, renderDSDByName } from './render-dsd.js';
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
  DsdMetricsSummary,
  DsdOptions,
  DsdPageDiagnostics,
  HydrateEventDescriptor,
  HydrationHint,
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
  RegistryIndex,
  RegistryIndexEntry,
  RendererProtocol,
  RenderError,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
  SsrAdmissionDecision,
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
export { createLogger, LessLogger, LogLevel } from './logger.js';
export { DANGEROUS_KEYS, getSSRProps, island, type IslandOptions, lessBind } from './island.js';
export { hasNavigationApi, matchRoute, navigate, onNavigate } from './navigation.js';
export type { NavigationCallback } from './navigation.js';

// G10 fix: Build-time shared types — breaks adapter-vite ↔ content circular dep
export type {
  LessBlogOptions,
  LessBuildContextLike,
  LessHeaderNavLink,
  LessI18nContextOptions,
  LessNavSection,
  LessPluginMeta,
} from './build-types.js';

// WC Package Protocol (v0.17+)
export {
  clear as clearRegistry,
  generateIndex,
  getAll as getAllManifests,
  getByTagName,
  register as registerManifest,
  validate as validateManifest,
} from './registry.js';

// CEM Manifest Validation (v0.18.1)
export {
  validateManifest as validateCemManifest,
  validateManifestFromJson as validateCemFromJson,
} from './validate-manifest.js';

// Less Add Install Flow (v0.18.2)
export { generateAddPlan } from './less-add.js';
export type { AddPlan, AddTagEntry, FileMutation, PackageSource } from './less-add.js';

// DOM Simulation Experiment (v0.18.3)
// DEPRECATED from barrel — import from '@lessjs/core/dom-simulation' instead.
// This experimental API requires happy-dom at runtime, which violates
// core's "zero npm/node/vite" constraint when imported via the barrel.
// The subpath export is retained for backward compatibility.
// export { buildDomSimulationReport, renderWithDomSimulation } from './dom-simulation.js';
// export type { DomSimulationOptions, DomSimulationResult } from './dom-simulation.js';

// G10 fix: Virtual module IDs — shared across adapter-vite, content, i18n
export {
  RESOLVED_BLOG_DATA_ID,
  RESOLVED_I18N_DATA_ID,
  RESOLVED_NAV_ID,
  RESOLVED_PAGE_DATA_ID,
  VIRTUAL_BLOG_DATA_ID,
  VIRTUAL_I18N_DATA_ID,
  VIRTUAL_NAV_ID,
  VIRTUAL_PAGE_DATA_ID,
} from './virtual-ids.js';

/**
 * @lessjs/compat-check — Compatibility types.
 *
 * Canonical owner of compatibility-specific types.
 * Shared domain types (ComponentLayer, HydrationStrategy, etc.)
 * are imported from @lessjs/core where they are canonically defined.
 */

import type { CompatibilityTier, ComponentLayer, HydrationStrategy } from '@lessjs/core';

// ─── Re-exports from @lessjs/core ────────────────────────────────────

export type {
  CompatibilityTier,
  ComponentLayer,
  HydrationStrategy,
  ManifestDecision,
  ManifestValidationReport,
  SsrAdmissionDecision,
  StrategySource,
  ValidatedTag,
  ValidationDiagnostic,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '@lessjs/core';

// ─── Compatibility Tiers ─────────────────────────────────────────────

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

/**
 * CEM compatibility report section in dsd-report.json.
 *
 * Records how the CEM compatibility classifier classified each component
 * from third-party WC packages. This enables CI assertion on compatibility
 * tiers and provides a machine-readable summary of the admission decisions.
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
 * Declarative event binding descriptor.
 *
 * @deprecated Removed in v0.21.0. Use `@click` / `@keydown` etc. in `html` tagged templates.
 * See ADR-0039 and SOP-006 for migration.
 */
export interface HydrateEventDescriptor {
  /** CSS selector within shadow root to find the target element */
  selector: string;
  /** DOM event name (e.g. 'click', 'input', 'keydown') */
  event: string;
  /** Method name on the component instance to call */
  method: string;
}

// ─── Hydration Hints ────────────────────────────────────────────────

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

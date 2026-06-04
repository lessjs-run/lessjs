/**
 * @lessjs/compat-check - compatibility types.
 *
 * Shared domain types are re-exported from @lessjs/core. This package owns the
 * compatibility classifier implementation, not duplicate copies of shared
 * public contracts.
 */

import type { CompatibilityClassification } from '@lessjs/core';

export type {
  CompatibilityClassification,
  CompatibilityTier,
  ComponentLayer,
  HydrateEventDescriptor,
  HydrationHint,
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
  /** All classifications, ordered by tier */
  classifications: CompatibilityClassification[];
  /** Human-readable summary for CI logs */
  summary: string;
}

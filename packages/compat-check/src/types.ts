/**
 * @lessjs/compat-check — Compatibility types.
 *
 * Canonical owner of compatibility, validation, hydration, and
 * manifest-decision types. Formerly defined in @lessjs/core/types.ts
 * and migrated here in v0.23.0 (SOP-001).
 *
 * Types owned by this package:
 * - Compatibility tiers & classifications
 * - Component layer & hydration strategy
 * - Manifest validation & diagnostics
 * - Hydration hints & event descriptors
 * - SSR admission & manifest decisions
 */

// ─── Compatibility Tiers ─────────────────────────────────────────────

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

// ─── Component Layer & Hydration ────────────────────────────────────

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

// ─── Manifest Decisions ─────────────────────────────────────────────

/**
 * Manifest-driven render decision for a single island declaration.
 *
 * Records how the build pipeline resolved each package island's manifest
 * flags (ssr, dsd, hydrate) into a concrete render path. Written to
 * `dsd-report.json` for build observability and CI assertion.
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

// ─── Validation & Diagnostics ───────────────────────────────────────

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

/**
 * @openelement/compat-check — SSR Compatibility Classifier.
 *
 * Extracted from @openelement/core in v0.21.0 (SOP-007).
 *
 * Classifies Web Component packages into 4 compatibility tiers:
 *   - ssr-capable: Fully SSR-safe, DSD output works
 *   - client-only: Browser-only, needs CSR fallback
 *   - rejected: Known issues, cannot be used
 *   - experimental-dom: Uses experimental DOM features
 *
 * This package is standalone — usable by any WC ecosystem tool,
 * not just LessJS. Use `npx @openelement/compat-check my-package` to
 * check a package's SSR readiness.
 */

// v0.23.0: Canonical implementation moved from @openelement/core/compatibility.
export {
  classifyCemManifest,
  classifyComponent,
  classifyComponent as classifyTag,
  classifyComponents,
  classifyLessManifest,
  getClassificationSummary,
  isKnownSsrAdapter,
  isKnownSsrSuperclass,
  isValidTagName,
  mergeClassifications,
  validateModulePath,
} from './compatibility.js';

// v0.23.0: Canonical type owner for compatibility types.
export type {
  CemCompatibilityReport,
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
} from './types.js';

// v0.23.0: Validate-manifest moved from @openelement/core.
export { validateManifest, validateManifestFromJson } from './validate-manifest.js';

// v0.23.0: less-add moved from @openelement/core.
export { generateAddPlan } from './less-add.js';
export type { AddPlan, AddTagEntry, FileMutation, PackageSource } from './less-add.js';

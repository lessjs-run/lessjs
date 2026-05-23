/**
 * @lessjs/compat-check — SSR Compatibility Classifier.
 *
 * Extracted from @lessjs/core in v0.21.0 (SOP-007).
 *
 * Classifies Web Component packages into 4 compatibility tiers:
 *   - ssr-capable: Fully SSR-safe, DSD output works
 *   - client-only: Browser-only, needs CSR fallback
 *   - rejected: Known issues, cannot be used
 *   - experimental-dom: Uses experimental DOM features
 *
 * This package is standalone — usable by any WC ecosystem tool,
 * not just LessJS. Use `npx @lessjs/compat-check my-package` to
 * check a package's SSR readiness.
 */

// Re-export from core for now (shared implementation)
// In a future release, the classifier will live here directly.
export {
  classifyCemManifest,
  classifyTag,
  isValidTagName,
  validateModulePath,
} from '@lessjs/core/compatibility';

export type { CompatibilityTier } from '@lessjs/core';

/**
 * @lessjs/cem — Custom Elements Manifest Parser.
 *
 * Extracted from @lessjs/core in v0.21.0 (SOP-007).
 *
 * Parses and validates Custom Elements Manifest (CEM) JSON files.
 * Extracts LessJS-specific declarations, finds module paths for tags,
 * and validates CEM structure.
 *
 * This package is standalone — usable by any tool that needs to
 * parse CEM files, not just LessJS.
 */

// Re-export from core for now (shared implementation)
export {
  parseCem,
  readCemFile,
  classifyCemManifest,
  extractLessDeclarations,
  findModulePathForTag,
  validateModulePaths,
} from '@lessjs/core/cem-parser';

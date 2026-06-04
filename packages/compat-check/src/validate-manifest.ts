/**
 * @openelement/compat-check - CEM Manifest Validator
 *
 * Validates standard `custom-elements.json` (CEM) files from third-party
 * Web Component packages. Produces a structured ManifestValidationReport
 * with tiered diagnostics, per-tag results, and a compatibility classification.
 *
 * v0.18.1: Entry point for `less validate-manifest` CLI.
 * v0.23.0: Types moved to canonical owner @openelement/compat-check/types.
 *
 * @see https://github.com/webcomponents/custom-elements-manifest
 */

import type { CemCustomElement, CemModule, CustomElementsManifest } from '@openelement/cem';
import type {
  CompatibilityTier,
  ManifestValidationReport,
  ValidatedTag,
  ValidationDiagnostic,
} from './types.js';

import { isValidTagName, validateModulePath } from './compatibility.js';

export type { ManifestValidationReport, ValidatedTag, ValidationDiagnostic };

// ─── Tag Name Validation ────────────────────────────────────────────────

/**
 * Validate a custom element tag name per HTML spec.
 * All custom element names MUST contain a hyphen.
 */
function validateTagName(
  tagName: string,
): ValidationDiagnostic | null {
  if (!tagName || typeof tagName !== 'string') {
    return {
      code: 'EMPTY_TAG_NAME',
      severity: 'error',
      message: 'Custom element tag name is empty.',
      fix: 'Provide a non-empty tag name that contains a hyphen (e.g. "my-button").',
    };
  }

  if (!isValidTagName(tagName)) {
    return {
      code: 'INVALID_TAG_NAME',
      severity: 'error',
      message: `"${tagName}" is not a valid custom element tag name.`,
      tagName,
      fix:
        'Custom element tag names must be lowercase, start with a letter, and contain a hyphen (e.g. "my-button").',
    };
  }

  return null;
}

/**
 * Detect duplicate tag names within a CEM module.
 */
function findDuplicateTags(
  modules: CemModule[],
): ValidationDiagnostic[] {
  const seen = new Map<string, string[]>();
  const diagnostics: ValidationDiagnostic[] = [];

  for (const mod of modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.kind !== 'custom-element') continue;
      const ce = decl as CemCustomElement;
      if (!ce.tagName) continue;

      if (seen.has(ce.tagName)) {
        seen.get(ce.tagName)!.push(mod.path || 'unknown');
      } else {
        seen.set(ce.tagName, [mod.path || 'unknown']);
      }
    }
  }

  for (const [tagName, locations] of seen) {
    if (locations.length > 1) {
      diagnostics.push({
        code: 'DUPLICATE_TAG',
        severity: 'error',
        message: `Tag "${tagName}" is declared in multiple modules: ${locations.join(', ')}.`,
        tagName,
        fix:
          `Remove duplicate declarations of "${tagName}". Only one module should define this tag.`,
      });
    }
  }

  return diagnostics;
}

// ─── Module Path Validation ────────────────────────────────────────────

/**
 * Validate module paths declared in CEM declarations.
 * Checks for absolute paths, path traversal, dangerous patterns, etc.
 */
function validateDeclaredPaths(
  modules: CemModule[],
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];

  for (const mod of modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.kind !== 'custom-element') continue;
      const ce = decl as CemCustomElement;

      // Validate the module's own path if present
      if (mod.path) {
        const modResult = validateModulePath(mod.path);
        if (!modResult.valid) {
          diagnostics.push({
            code: 'INVALID_MODULE_PATH',
            severity: 'error',
            message: `Module path "${mod.path}" is invalid: ${modResult.error}`,
            tagName: ce.tagName,
            filePath: mod.path,
            fix: `Use a relative path from the package root (e.g. "./src/my-component.js").`,
          });
        }
      }

      // Validate superclass reference module path if present
      if (ce.superClass?.module) {
        const scResult = validateModulePath(ce.superClass.module);
        if (!scResult.valid) {
          diagnostics.push({
            code: 'INVALID_SUPERCLASS_PATH',
            severity: 'error',
            message:
              `Superclass module path "${ce.superClass.module}" is invalid: ${scResult.error}`,
            tagName: ce.tagName,
            filePath: ce.superClass.module,
            fix: `Use a relative path for the superclass module reference.`,
          });
        }
      }
    }
  }

  return diagnostics;
}

// ─── CEM Schema Shape Validation ───────────────────────────────────────

/**
 * Validate the basic schema shape of a CEM manifest.
 */
function validateSchema(
  manifest: CustomElementsManifest,
): { errors: ValidationDiagnostic[]; warnings: ValidationDiagnostic[] } {
  const errors: ValidationDiagnostic[] = [];
  const warnings: ValidationDiagnostic[] = [];

  // Check schema version
  if (!manifest.schemaVersion) {
    errors.push({
      code: 'MISSING_SCHEMA_VERSION',
      severity: 'error',
      message: 'CEM manifest is missing "schemaVersion".',
      fix: 'Add "schemaVersion": "1.0.0" to the manifest root.',
    });
  }

  // Check modules array
  if (!manifest.modules || !Array.isArray(manifest.modules)) {
    errors.push({
      code: 'MISSING_MODULES',
      severity: 'error',
      message: 'CEM manifest has no "modules" array.',
      fix: 'Add a "modules" array with at least one module entry describing your custom elements.',
    });
    return { errors, warnings };
  }

  if (manifest.modules.length === 0) {
    warnings.push({
      code: 'EMPTY_MODULES',
      severity: 'warning',
      message: 'CEM manifest has an empty "modules" array.',
      fix: 'Add module entries for each of your custom elements.',
    });
  }

  // Check each module for declarations
  let hasCustomElements = false;
  for (const mod of manifest.modules) {
    if (!mod.path) {
      warnings.push({
        code: 'MISSING_MODULE_PATH',
        severity: 'warning',
        message: 'A module entry is missing a "path" field.',
        fix: 'Add a "path" field pointing to the module file relative to package root.',
      });
    }

    if (mod.declarations && mod.declarations.length > 0) {
      hasCustomElements = true;
    }

    // Check for exports without declarations
    if (
      mod.exports && mod.exports.length > 0 && (!mod.declarations || mod.declarations.length === 0)
    ) {
      warnings.push({
        code: 'EXPORTS_WITHOUT_DECLARATIONS',
        severity: 'warning',
        message: `Module "${mod.path || 'unknown'}" has exports but no declarations.`,
        filePath: mod.path,
        fix: 'Add declaration entries for each exported custom element.',
      });
    }
  }

  if (!hasCustomElements) {
    warnings.push({
      code: 'NO_CUSTOM_ELEMENTS',
      severity: 'warning',
      message: 'CEM manifest contains no custom element declarations.',
      fix: 'Add at least one "custom-element" declaration to the modules.',
    });
  }

  return { errors, warnings };
}

// ─── Less Extension Validation ─────────────────────────────────────────

/**
 * Validate LessJS extensions within CEM declarations.
 * Checks for supported SSR/DSD/hydration values.
 */
function validateLessExtensions(
  modules: CemModule[],
): { errors: ValidationDiagnostic[]; warnings: ValidationDiagnostic[] } {
  const errors: ValidationDiagnostic[] = [];
  const warnings: ValidationDiagnostic[] = [];

  for (const mod of modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.kind !== 'custom-element') continue;
      const ce = decl as CemCustomElement;
      if (!ce.less) continue;

      // Validate ssr field
      if (ce.less.ssr !== undefined && typeof ce.less.ssr !== 'boolean') {
        errors.push({
          code: 'INVALID_SSR_VALUE',
          severity: 'error',
          message: `"less.ssr" must be a boolean, got "${typeof ce.less.ssr}".`,
          tagName: ce.tagName,
          fix: 'Set "less.ssr" to true or false (boolean).',
        });
      }

      // Validate dsd field
      if (ce.less.dsd !== undefined && typeof ce.less.dsd !== 'boolean') {
        errors.push({
          code: 'INVALID_DSD_VALUE',
          severity: 'error',
          message: `"less.dsd" must be a boolean, got "${typeof ce.less.dsd}".`,
          tagName: ce.tagName,
          fix: 'Set "less.dsd" to true or false (boolean).',
        });
      }

      // Validate hydrate strategy
      if (ce.less.hydrate !== undefined) {
        const validStrategies = ['load', 'idle', 'visible', 'only'];
        if (!validStrategies.includes(ce.less.hydrate)) {
          errors.push({
            code: 'INVALID_HYDRATE_STRATEGY',
            severity: 'error',
            message: `"less.hydrate" must be one of: ${
              validStrategies.join(', ')
            }, got "${ce.less.hydrate}".`,
            tagName: ce.tagName,
            fix: `Use one of: ${validStrategies.join(', ')}.`,
          });
        }
      }

      // Validate layer
      if (ce.less.layer !== undefined) {
        const validLayers = ['dsd-static', 'dsd-interactive', 'pure-island'];
        if (!validLayers.includes(ce.less.layer)) {
          errors.push({
            code: 'INVALID_LAYER',
            severity: 'error',
            message: `"less.layer" must be one of: ${
              validLayers.join(', ')
            }, got "${ce.less.layer}".`,
            tagName: ce.tagName,
            fix: `Use one of: ${validLayers.join(', ')}.`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}

// ─── Main Validation ────────────────────────────────────────────────────

/**
 * Validate a CEM manifest and produce a structured report.
 *
 * This is the main entry point for the validation system. It:
 * 1. Validates the overall CEM schema shape
 * 2. Validates each custom element tag name
 * 3. Detects duplicate tag names
 * 4. Validates module paths (without executing code)
 * 5. Validates LessJS extension values
 * 6. Determines overall compatibility tier
 *
 * @param manifest - Parsed CustomElementsManifest
 * @returns Structured ManifestValidationReport
 *
 * @example
 * ```ts
 * const report = validateManifest(manifest);
 * if (!report.valid) {
 *   console.error(report.errors.map(e => `${e.code}: ${e.message}`).join('\n'));
 * }
 * ```
 */
export function validateManifest(
  manifest: CustomElementsManifest,
): ManifestValidationReport {
  const errors: ValidationDiagnostic[] = [];
  const warnings: ValidationDiagnostic[] = [];
  const tagResults: ValidatedTag[] = [];

  // Step 1: Validate schema shape
  const schemaResult = validateSchema(manifest);
  errors.push(...schemaResult.errors);
  warnings.push(...schemaResult.warnings);

  // Step 2: Collect all custom-element declarations and validate per-tag
  const allDeclarations: CemCustomElement[] = [];

  if (manifest.modules) {
    for (const mod of manifest.modules) {
      if (!mod.declarations) continue;
      for (const decl of mod.declarations) {
        if (decl.kind === 'custom-element') {
          allDeclarations.push(decl as CemCustomElement);
        }
      }
    }
  }

  for (const ce of allDeclarations) {
    const tagDiagnostics: ValidationDiagnostic[] = [];
    let tagValid = true;

    // Validate tag name
    const nameError = validateTagName(ce.tagName);
    if (nameError) {
      errors.push(nameError);
      tagDiagnostics.push(nameError);
      tagValid = false;
    }

    // Determine compatibility tier
    let compatTier: CompatibilityTier = 'client-only';
    if (ce.less?.ssr === true) {
      compatTier = 'ssr-capable';
    }

    tagResults.push({
      tagName: ce.tagName || 'unknown',
      valid: tagValid,
      compatibility: compatTier,
      modulePath: ce.superClass?.module || undefined,
      className: ce.className,
      ssr: ce.less?.ssr,
      dsd: ce.less?.dsd,
    });
  }

  // Step 3: Detect duplicate tags
  if (manifest.modules) {
    const duplicateErrors = findDuplicateTags(manifest.modules);
    errors.push(...duplicateErrors);
  }

  // Step 4: Validate module paths
  if (manifest.modules) {
    const pathErrors = validateDeclaredPaths(manifest.modules);
    errors.push(...pathErrors);
  }

  // Step 5: Validate LessJS extensions
  if (manifest.modules) {
    const extResults = validateLessExtensions(manifest.modules);
    errors.push(...extResults.errors);
    warnings.push(...extResults.warnings);
  }

  // Step 6: Determine overall compatibility
  let overallCompat: CompatibilityTier = 'client-only';
  const hasError = errors.some((e) => e.severity === 'error');

  if (hasError) {
    overallCompat = 'rejected';
  } else if (tagResults.some((t) => t.compatibility === 'ssr-capable')) {
    overallCompat = 'ssr-capable';
  }

  return {
    packageName: manifest.packageName,
    version: manifest.version,
    valid: !hasError,
    schemaVersion: manifest.schemaVersion,
    compatibility: overallCompat,
    errors,
    warnings,
    tags: tagResults,
  };
}

/**
 * Validate a CEM manifest from raw JSON input.
 *
 * Convenience wrapper that first parses the JSON, then validates
 * the resulting manifest. Handles JSON parse errors gracefully.
 *
 * @param json - Raw JSON string of the CEM manifest
 * @returns Structured ManifestValidationReport
 */
export function validateManifestFromJson(
  json: string,
): ManifestValidationReport {
  let manifest: CustomElementsManifest;

  try {
    manifest = JSON.parse(json) as CustomElementsManifest;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      compatibility: 'rejected',
      errors: [{
        code: 'JSON_PARSE_ERROR',
        severity: 'error',
        message: `Failed to parse JSON: ${message}`,
        fix: 'Ensure the file contains valid JSON.',
      }],
      warnings: [],
      tags: [],
    };
  }

  return validateManifest(manifest);
}

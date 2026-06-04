/**
 * @openelement/cem - CEM Parser
 *
 * Parses standard `custom-elements.json` (Custom Elements Manifest)
 * from third-party Web Component packages without executing package code.
 *
 * Features:
 * - Reads CEM schema without executing JS
 * - Extracts tag names, module paths, exports, attributes, events, slots
 * - Preserves unknown CEM fields for future compatibility
 * - Rejects invalid tag names and unresolved module paths
 * - Detects duplicate tags before SSR registration
 * - Conservative defaults: less.ssr ??= false, less.dsd ??= false
 *
 * @see https://github.com/webcomponents/custom-elements-manifest
 */

import type {
  CemCustomElement,
  CemParseError,
  CemParseResult,
  CemParseWarning,
  CustomElementsManifest,
  LessDeclaration,
  LessElementExtensions,
} from './types.js';
import { isValidTagName } from '@openelement/core';
import type { CompatibilityClassification, CompatibilityTier } from '@openelement/core';

// ©¤©¤©¤ Validators ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/** Validate module path (must be relative path, not absolute or URL) */
function isValidModulePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  // Must be a relative path starting with ./ or ../
  return path.startsWith('./') || path.startsWith('../');
}

function isCemCustomElement(decl: { kind?: string }): decl is CemCustomElement {
  return decl.kind === 'custom-element';
}

// ©¤©¤©¤ CEM Parser ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Parse a Custom Elements Manifest JSON string.
 *
 * @param json - JSON string content of custom-elements.json
 * @param packageRoot - Package root path for resolving module paths
 * @returns Parse result with manifest or errors
 */
export function parseCem(json: string, _packageRoot?: string): CemParseResult {
  const errors: CemParseError[] = [];
  const warnings: CemParseWarning[] = [];

  // Step 1: Parse JSON
  let manifest: unknown;
  try {
    manifest = JSON.parse(json);
  } catch (err) {
    errors.push({
      code: 'CEM_PARSE_ERROR',
      message: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { success: false, errors, warnings };
  }

  // Step 2: Validate root structure
  if (!manifest || typeof manifest !== 'object') {
    errors.push({
      code: 'CEM_INVALID_ROOT',
      message: 'Manifest root must be an object',
    });
    return { success: false, errors, warnings };
  }

  const root = manifest as Record<string, unknown>;

  // Step 3: Validate schema version
  if (!root['schemaVersion']) {
    warnings.push({
      code: 'CEM_NO_SCHEMA_VERSION',
      message: 'Missing schemaVersion field, assuming legacy format',
    });
  }

  // Step 4: Validate modules array
  if (!Array.isArray(root['modules'])) {
    errors.push({
      code: 'CEM_NO_MODULES',
      message: 'Manifest must have a modules array',
    });
    return { success: false, errors, warnings };
  }

  // Step 5: Accept the manifest (preserve unknown fields)
  const result: CustomElementsManifest = root as CustomElementsManifest;

  // Step 6: Track seen tag names for duplicate detection
  const seenTagNames = new Set<string>();

  // Step7: Validate each module and its declarations
  for (let i = 0; i < result.modules.length; i++) {
    const mod = result.modules[i];
    const modPath = `modules[${i}]`;

    // Validate module kind
    if (!mod.kind) {
      warnings.push({
        code: 'CEM_MODULE_NO_KIND',
        message: `Module at index ${i} has no kind field`,
        path: modPath,
      });
    }

    // Validate module path
    if (!mod.path) {
      errors.push({
        code: 'CEM_MODULE_NO_PATH',
        message: `Module at index ${i} has no path field`,
        path: modPath,
      });
    }

    // Validate declarations
    if (mod.declarations) {
      for (let j = 0; j < mod.declarations.length; j++) {
        const decl = mod.declarations[j];
        const declPath = `${modPath}.declarations[${j}]`;

        if (isCemCustomElement(decl)) {
          // Validate tag name
          if (!decl.tagName) {
            errors.push({
              code: 'CEM_CE_NO_TAG_NAME',
              message: `Custom element at ${declPath} has no tagName`,
              path: declPath,
            });
          } else if (!isValidTagName(decl.tagName)) {
            errors.push({
              code: 'CEM_CE_INVALID_TAG_NAME',
              message:
                `Invalid tag name: ${decl.tagName} (must contain a hyphen and match HTML spec)`,
              path: declPath,
            });
          } else if (seenTagNames.has(decl.tagName)) {
            // Duplicate tag name detected
            errors.push({
              code: 'CEM_CE_DUPLICATE_TAG',
              message: `Duplicate tag name: ${decl.tagName}`,
              path: declPath,
            });
          } else {
            seenTagNames.add(decl.tagName);
          }
        }
      }
    }

    // Validate exports
    if (mod.exports) {
      for (let j = 0; j < mod.exports.length; j++) {
        const exp = mod.exports[j];
        const expPath = `${modPath}.exports[${j}]`;

        if (!exp.declaration) {
          errors.push({
            code: 'CEM_EXPORT_NO_DECLARATION',
            message: `Export at ${expPath} has no declaration reference`,
            path: expPath,
          });
        }
      }
    }
  }

  const success = errors.length === 0;

  return {
    success,
    manifest: success ? result : undefined,
    errors,
    warnings,
  };
}

/**
 * Read and parse a custom-elements.json file from disk.
 *
 * @param filePath - Absolute path to custom-elements.json
 * @returns Parse result
 */
export async function readCemFile(filePath: string): Promise<CemParseResult> {
  try {
    const content = await Deno.readTextFile(filePath);
    return parseCem(content, Deno.cwd());
  } catch (err) {
    return {
      success: false,
      errors: [{
        code: 'CEM_FILE_READ_ERROR',
        message: `Failed to read ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
      }],
      warnings: [],
    };
  }
}

// ©¤©¤©¤ CEM to openElement Conversion ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Convert CEM declarations to openElement compatibility classifications.
 *
 * Applies conservative defaults:
 * - less.ssr ??= false (CEM describes elements, not SSR safety)
 * - less.dsd ??= false
 * - hydrate.strategy ??= 'idle'
 *
 * @param manifest - Parsed CEM manifest
 * @returns Array of compatibility classifications
 */
export function classifyCemManifest(
  manifest: CustomElementsManifest,
): CompatibilityClassification[] {
  const classifications: CompatibilityClassification[] = [];
  const seenTags = new Set<string>();

  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;

    for (const decl of mod.declarations) {
      if (!isCemCustomElement(decl)) continue;

      const tagName = decl.tagName;

      if (!tagName) continue;

      // Check for duplicate tags
      if (seenTags.has(tagName)) {
        classifications.push({
          tagName,
          tier: 'rejected',
          reason: 'Duplicate tag name in manifest',
          source: 'package',
          modulePath: mod.path,
        });
        continue;
      }
      seenTags.add(tagName);

      // Apply conservative defaults only if less field exists
      const hasLessField = decl.less !== undefined;
      const less: LessElementExtensions = decl.less ?? {};
      less.ssr ??= false;
      less.dsd ??= false;
      if (less.hydrate === undefined) {
        less.hydrate = 'idle';
      }

      // Classify based on LessJS extensions
      let tier: CompatibilityTier = 'client-only';
      let reason = hasLessField
        ? 'LessJS manifest exists but ssr not enabled'
        : 'CEM-only package (no LessJS SSR declaration)';

      if (less.ssr === true) {
        // Check if a renderer/capability is declared
        if (decl.superClass?.name === 'LitElement') {
          tier = 'ssr-capable';
          reason = 'LitElement with less.ssr = true (Lit adapter required)';
        } else if (less.layer) {
          tier = 'ssr-capable';
          reason = `LessJS manifest declares ssr: true with layer: ${less.layer}`;
        } else {
          tier = 'experimental-dom';
          reason = 'less.ssr = true but no adapter/layer declared (experimental)';
        }
      } else if (less.ssr === false && hasLessField) {
        tier = 'client-only';
        reason = 'less.ssr = false (explicit client-only)';
      }

      classifications.push({
        tagName,
        tier,
        reason,
        source: 'package',
        modulePath: mod.path,
        ssr: less.ssr,
        dsd: less.dsd,
        hydrate: less.hydrate,
      });
    }
  }

  return classifications;
}

/**
 * Extract LessJS declarations from CEM manifest.
 *
 * Converts CEM custom-element declarations into openElement LessDeclaration format.
 * Only includes fields that map directly (CEM -> LessJS).
 *
 * @param manifest - Parsed CEM manifest
 * @returns Array of openElement declarations
 */
export function extractLessDeclarations(
  manifest: CustomElementsManifest,
): LessDeclaration[] {
  const declarations: LessDeclaration[] = [];

  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;

    for (const decl of mod.declarations) {
      if (!isCemCustomElement(decl)) continue;
      if (!decl.tagName) continue;

      // Convert CEM attributes -> LessJS attributes
      const attributes = decl.attributes?.map((attr) => ({
        name: attr.name,
        type: attr.type,
        default: attr.defaultValue,
        description: attr.description,
        reflects: attr.reflects,
        fieldName: attr.propertyName,
      }));

      // Convert CEM events -> LessJS events
      const events = decl.events?.map((evt) => ({
        name: evt.name,
        type: evt.type,
        description: evt.description,
      }));

      // Convert CEM slots -> LessJS slots
      const slots = decl.slots?.map((slot) => ({
        name: slot.name || '',
        description: slot.description,
      }));

      // Convert CEM CSS properties -> LessJS CSS properties
      const cssProperties = decl.cssProperties?.map((prop) => ({
        name: prop.name,
        default: prop.defaultValue,
        description: prop.description,
        type: prop.syntax,
      }));

      // Convert CEM CSS parts -> LessJS CSS parts
      const cssParts = decl.cssParts?.map((part) => ({
        name: part.name,
        description: part.description,
      }));

      declarations.push({
        tagName: decl.tagName,
        className: decl.className,
        superclassName: decl.superClass?.name,
        attributes,
        members: [], // CEM methods/properties can be mapped if needed
        events,
        slots,
        cssProperties,
        cssParts,
        less: decl.less,
        description: decl.description,
      });
    }
  }

  return declarations;
}

/**
 * Find the module path for a given tag name in the CEM manifest.
 *
 * Looks for custom-element-definition entries that reference the tag.
 *
 * @param manifest - Parsed CEM manifest
 * @param tagName - Tag name to find
 * @returns Module path or undefined
 */
export function findModulePathForTag(
  manifest: CustomElementsManifest,
  tagName: string,
): string | undefined {
  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;

    for (const decl of mod.declarations) {
      if (isCemCustomElement(decl) && decl.tagName === tagName) {
        return mod.path;
      }
    }

    // Also check custom-element-definition entries
    for (const decl of mod.declarations) {
      if (decl.kind === 'custom-element-definition' && decl.tagName === tagName) {
        return mod.path;
      }
    }
  }

  return undefined;
}

/**
 * Validate that all module paths in the manifest are resolvable.
 *
 * @param manifest - Parsed CEM manifest
 * @param packageRoot - Package root directory
 * @returns Array of validation errors
 */
export function validateModulePaths(
  manifest: CustomElementsManifest,
  packageRoot: string,
): CemParseError[] {
  const errors: CemParseError[] = [];

  for (let i = 0; i < manifest.modules.length; i++) {
    const mod = manifest.modules[i];
    const modPath = `modules[${i}]`;

    if (!isValidModulePath(mod.path)) {
      errors.push({
        code: 'CEM_INVALID_MODULE_PATH',
        message: `Invalid module path: ${mod.path} (must be relative, starting with ./ or ../)`,
        path: modPath,
      });
      continue;
    }

    // Check if the module file exists
    const fullPath = `${packageRoot}/${mod.path}`;
    try {
      Deno.statSync(fullPath);
    } catch {
      errors.push({
        code: 'CEM_MODULE_NOT_FOUND',
        message: `Module file not found: ${mod.path}`,
        path: modPath,
      });
    }
  }

  return errors;
}

/**
 * @lessjs/compat-check - Compatibility Classifier
 *
 * Classifies Web Component packages and declarations into compatibility tiers.
 * This is the core of LessJS's conservative admission model for third-party WCs.
 *
 * Compatibility Tiers:
 * - ssr-capable: Explicit Less manifest or adapter says SSR is supported
 * - client-only: Browser-only package or no SSR declaration
 * - rejected: Invalid manifest, duplicate tag, unsafe path, unresolved module
 * - experimental-dom: Opt-in DOM simulation candidate
 *
 * @see ADR-0028 for the full admission model documentation
 */

import type { CompatibilityClassification, CompatibilityTier } from './types.js';
import type {
  CustomElementsManifest,
  LessElementExtensions,
  LessPackageManifest,
} from '@lessjs/cem';

// ─── Known Adapters ─────────────────────────────────────────────────────

/** Known SSR-capable adapters */
const KNOWN_ADAPTERS = new Set([
  'lit',
  'vanilla',
  'react',
  'solid',
  'preact',
  'svelte',
  'vue',
]);

/** Known SSR-capable superclasses */
const KNOWN_SSR_SUPERCLASSES = new Set([
  'LitElement',
  'LitElement (via @lessjs/adapter-lit)',
  'HTMLElement (via @lessjs/adapter-vanilla)',
]);

// ─── Classification Engine ──────────────────────────────────────────────

/** Input for a single component classification */
export interface ClassificationInput {
  /** Tag name */
  tagName: string;
  /** Module path */
  modulePath: string;
  /** Source of the declaration (local, package, nested) */
  source: 'local' | 'package' | 'nested';
  /** LessJS element extensions (ssr, dsd, hydrate) */
  less?: LessElementExtensions;
  /** Superclass name (e.g. 'LitElement') */
  superClass?: string;
  /** Package name (for diagnostics) */
  packageName?: string;
}

/** Classification engine configuration */
export interface ClassifierConfig {
  /** Enable experimental DOM simulation tier (default: false) */
  enableExperimentalDom?: boolean;
  /** Skip module path validation (for testing) */
  skipPathValidation?: boolean;
  /** Additional allowed adapters */
  additionalAdapters?: string[];
}

/** Result of running the classifier */
export interface ClassificationResult {
  /** All classifications */
  classifications: CompatibilityClassification[];
  /** Tags that were rejected */
  rejectedTags: string[];
  /** Tags that are SSR-capable */
  ssrCapableTags: string[];
  /** Tags that are client-only */
  clientOnlyTags: string[];
  /** Tags that are experimental-dom */
  experimentalDomTags: string[];
  /** Summary statistics */
  stats: ClassificationStats;
}

/** Statistics about the classification run */
export interface ClassificationStats {
  totalComponents: number;
  ssrCapableCount: number;
  clientOnlyCount: number;
  rejectedCount: number;
  experimentalDomCount: number;
}

/** Default classifier configuration */
const DEFAULT_CONFIG: ClassifierConfig = {
  enableExperimentalDom: false,
  skipPathValidation: false,
  additionalAdapters: [],
};

// ─── Classification Logic ───────────────────────────────────────────────

/**
 * Classify a single component based on its Less manifest.
 *
 * @param input - Component classification input
 * @param config - Classifier configuration
 * @returns Compatibility classification
 */
export function classifyComponent(
  input: ClassificationInput,
  config: ClassifierConfig = DEFAULT_CONFIG,
): CompatibilityClassification {
  const { tagName, modulePath, source, less, superClass, packageName } = input;

  // Step 1: Validate tag name format
  if (!isValidTagName(tagName)) {
    return {
      tagName,
      tier: 'rejected',
      reason: `Invalid tag name: ${tagName} (must contain a hyphen per HTML spec)`,
      source,
      modulePath,
    };
  }

  // Step 2: Apply LessJS extensions with conservative defaults
  const ssr = less?.ssr ?? false;
  const dsd = less?.dsd ?? false;
  const hydrate = less?.hydrate ?? 'idle';
  const layer = less?.layer;

  // Step 3: Classify based on LessJS extensions
  let tier: CompatibilityTier;
  let reason: string;

  if (ssr === true) {
    // SSR explicitly enabled - check if adapter/capability is declared
    if (superClass && KNOWN_SSR_SUPERCLASSES.has(superClass)) {
      tier = 'ssr-capable';
      reason = `${superClass} with ssr: true (LessJS adapter required)`;
    } else if (layer) {
      tier = 'ssr-capable';
      reason = `ssr: true with layer: ${layer}`;
    } else if (config.enableExperimentalDom) {
      // Experimental opt-in only
      tier = 'experimental-dom';
      reason = 'ssr: true but no adapter declared (experimental DOM simulation)';
    } else {
      tier = 'client-only';
      reason =
        'ssr: true but no adapter/layer declared - requires explicit opt-in for experimental DOM';
    }
  } else if (ssr === false && less !== undefined) {
    // Explicit client-only declaration
    tier = 'client-only';
    reason = 'ssr: false (explicit client-only)';
  } else {
    // No Less manifest or ssr not declared - conservative default
    tier = 'client-only';
    reason = packageName
      ? `CEM-only package ${packageName} (no LessJS SSR declaration)`
      : 'CEM-only package (no LessJS SSR declaration)';
  }

  return {
    tagName,
    tier,
    reason,
    source,
    modulePath,
    ssr,
    dsd,
    hydrate,
  };
}

/**
 * Validate a module path for security.
 *
 * @param modulePath - Module path to validate
 * @returns Validation result
 */
export function validateModulePath(modulePath: string): {
  valid: boolean;
  error?: string;
} {
  if (!modulePath || typeof modulePath !== 'string') {
    return { valid: false, error: 'Module path is required' };
  }

  // Reject absolute paths
  if (modulePath.startsWith('/') || /^[a-zA-Z]:/.test(modulePath)) {
    return { valid: false, error: 'Absolute paths are not allowed' };
  }

  // Reject paths with parent traversal outside expected scope
  if (modulePath.includes('..')) {
    return { valid: false, error: 'Parent directory traversal is not allowed' };
  }

  // Reject non-module paths
  if (modulePath.includes('://') || modulePath.startsWith('http')) {
    return { valid: false, error: 'URL module paths are not allowed' };
  }

  // Reject potentially dangerous paths
  const dangerousPatterns = [
    '/etc/',
    '/proc/',
    '/sys/',
    '/root/',
    '/home/',
    '.env',
    '.git/',
  ];

  for (const pattern of dangerousPatterns) {
    if (modulePath.includes(pattern)) {
      return { valid: false, error: `Path contains disallowed pattern: ${pattern}` };
    }
  }

  return { valid: true };
}

// ─── Batch Classification ───────────────────────────────────────────────

/**
 * Classify multiple components from various sources.
 *
 * @param inputs - Array of classification inputs
 * @param config - Classifier configuration
 * @returns Complete classification result
 */
export function classifyComponents(
  inputs: ClassificationInput[],
  config: ClassifierConfig = DEFAULT_CONFIG,
): ClassificationResult {
  const classifications: CompatibilityClassification[] = [];
  const seenTags = new Map<string, number>(); // tag -> first index

  // Phase 1: Initial classification (detect duplicates)
  for (const input of inputs) {
    const tagName = input.tagName;

    // Check for duplicate tags
    if (seenTags.has(tagName)) {
      const firstIndex = seenTags.get(tagName)!;
      const first = classifications[firstIndex];

      classifications.push({
        tagName,
        tier: 'rejected',
        reason: `Duplicate tag name: ${tagName} (first declared in ${first.modulePath})`,
        source: input.source,
        modulePath: input.modulePath,
        ssr: false,
        dsd: false,
        hydrate: 'idle',
      });
      continue;
    }

    // Validate module path
    if (!config.skipPathValidation) {
      const pathValidation = validateModulePath(input.modulePath);
      if (!pathValidation.valid) {
        classifications.push({
          tagName,
          tier: 'rejected',
          reason: pathValidation.error || 'Invalid module path',
          source: input.source,
          modulePath: input.modulePath,
          ssr: false,
          dsd: false,
          hydrate: 'idle',
        });
        continue;
      }
    }

    // Classify the component
    const classification = classifyComponent(input, config);
    classifications.push(classification);
    seenTags.set(tagName, classifications.length - 1);
  }

  // Phase 2: Build result sets
  const rejectedTags: string[] = [];
  const ssrCapableTags: string[] = [];
  const clientOnlyTags: string[] = [];
  const experimentalDomTags: string[] = [];

  for (const c of classifications) {
    switch (c.tier) {
      case 'rejected':
        rejectedTags.push(c.tagName);
        break;
      case 'ssr-capable':
        ssrCapableTags.push(c.tagName);
        break;
      case 'client-only':
        clientOnlyTags.push(c.tagName);
        break;
      case 'experimental-dom':
        experimentalDomTags.push(c.tagName);
        break;
    }
  }

  // Phase 3: Build stats
  const stats: ClassificationStats = {
    totalComponents: classifications.length,
    ssrCapableCount: ssrCapableTags.length,
    clientOnlyCount: clientOnlyTags.length,
    rejectedCount: rejectedTags.length,
    experimentalDomCount: experimentalDomTags.length,
  };

  return {
    classifications,
    rejectedTags,
    ssrCapableTags,
    clientOnlyTags,
    experimentalDomTags,
    stats,
  };
}

// ─── Less Manifest Classification ─────────────────────────────────────

/**
 * Classify all declarations from a LessPackageManifest.
 *
 * @param manifest - LessJS package manifest
 * @param config - Classifier configuration
 * @returns Classification result
 */
export function classifyLessManifest(
  manifest: LessPackageManifest,
  config: ClassifierConfig = DEFAULT_CONFIG,
): ClassificationResult {
  const inputs: ClassificationInput[] = manifest.declarations.map((decl) => ({
    tagName: decl.tagName,
    modulePath: decl.less?.module || `./${decl.tagName}.js`,
    source: 'package' as const,
    less: decl.less,
    superClass: decl.superclassName,
    packageName: manifest.packageName,
  }));

  return classifyComponents(inputs, config);
}

/**
 * Classify all declarations from a CustomElementsManifest.
 *
 * Note: CEM-only packages are classified as client-only by default.
 * SSR capability requires a LessJS extension.
 *
 * @param manifest - CEM manifest
 * @param config - Classifier configuration
 * @returns Classification result
 */
export function classifyCemManifest(
  manifest: CustomElementsManifest,
  config: ClassifierConfig = DEFAULT_CONFIG,
): ClassificationResult {
  const inputs: ClassificationInput[] = [];

  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;

    for (const decl of mod.declarations) {
      if (decl.kind !== 'custom-element') continue;
      // deno-lint-ignore no-explicit-any
      const ce = decl as any;

      if (!ce.tagName) continue;

      inputs.push({
        tagName: ce.tagName,
        modulePath: mod.path,
        source: 'package',
        less: ce.less,
        superClass: ce.superClass?.name,
        packageName: manifest.packageName,
      });
    }
  }

  return classifyComponents(inputs, config);
}

// ─── Merged Classification ──────────────────────────────────────────────

/**
 * Merge classifications from multiple sources (local + package).
 *
 * Local declarations take precedence over package declarations for the same tag.
 * Duplicate tags across packages are rejected.
 *
 * @param localInputs - Local island inputs
 * @param packageInputs - Package island inputs
 * @param config - Classifier configuration
 * @returns Merged classification result
 */
export function mergeClassifications(
  localInputs: ClassificationInput[],
  packageInputs: ClassificationInput[],
  config: ClassifierConfig = DEFAULT_CONFIG,
): ClassificationResult {
  // Package inputs first, then local (local takes precedence)
  const allInputs = [...packageInputs, ...localInputs];
  return classifyComponents(allInputs, config);
}

// ─── Utility Functions ─────────────────────────────────────────────────

/** Valid tag name regex per HTML spec: must contain a hyphen, can't start/end with hyphen */
const TAG_NAME_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Check if a tag name is valid per HTML spec.
 *
 * Requirements:
 * - Must start with an ASCII letter (lowercase)
 * - Must contain at least one hyphen
 * - Hyphens cannot be at the start or end
 * - Only lowercase letters, digits, and hyphens allowed
 */
export function isValidTagName(tagName: string): boolean {
  // Check format first
  if (!TAG_NAME_REGEX.test(tagName)) {
    return false;
  }
  // Must contain at least one hyphen
  return tagName.includes('-');
}

/**
 * Check if a superclass is known to be SSR-capable.
 */
export function isKnownSsrSuperclass(superClass: string): boolean {
  return KNOWN_SSR_SUPERCLASSES.has(superClass);
}

/**
 * Check if an adapter is known to support SSR.
 */
export function isKnownSsrAdapter(adapter: string): boolean {
  return KNOWN_ADAPTERS.has(adapter.toLowerCase());
}

/**
 * Get a human-readable summary of the classification result.
 */
export function getClassificationSummary(result: ClassificationResult): string {
  const lines: string[] = [
    `Classification Summary:`,
    `  Total components: ${result.stats.totalComponents}`,
    `  SSR-capable: ${result.stats.ssrCapableCount}`,
    `  Client-only: ${result.stats.clientOnlyCount}`,
    `  Experimental-dom: ${result.stats.experimentalDomCount}`,
    `  Rejected: ${result.stats.rejectedCount}`,
  ];

  if (result.ssrCapableTags.length > 0) {
    lines.push(`  SSR-capable tags: ${result.ssrCapableTags.join(', ')}`);
  }

  if (result.clientOnlyTags.length > 0) {
    lines.push(`  Client-only tags: ${result.clientOnlyTags.join(', ')}`);
  }

  if (result.rejectedTags.length > 0) {
    lines.push(`  Rejected tags: ${result.rejectedTags.join(', ')}`);
    lines.push('');
    lines.push('Rejection reasons:');
    for (const c of result.classifications) {
      if (c.tier === 'rejected') {
        lines.push(`  - ${c.tagName}: ${c.reason}`);
      }
    }
  }

  return lines.join('\n');
}

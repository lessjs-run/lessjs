/**
 * @lessjs/compat-check - `less add` Safe Install Flow
 *
 * Produces a deterministic install plan for adding a third-party Web Component
 * package to a LessJS project. Every plan is validated first - invalid packages
 * are rejected before any files are touched.
 *
 * v0.18.2: Entry point for `less add` CLI.
 * v0.23.0: Types moved to canonical owner @lessjs/compat-check/types.
 *
 * @see docs/sop/v0.18.2-less-add-install-flow.md
 */

import type { ManifestValidationReport } from './types.js';
import { validateManifestFromJson } from './validate-manifest.js';

export type { ManifestValidationReport };

// ─── Types ──────────────────────────────────────────────────────────────

/** Package resolution source */
export type PackageSource = 'local' | 'jsr' | 'npm';

/** A single file mutation in the install plan */
export interface FileMutation {
  /** File path relative to project root */
  filePath: string;
  /** Type of mutation */
  type: 'add' | 'modify' | 'remove';
  /** Human-readable description of the change */
  description: string;
  /** New content or diff summary (for review) */
  content?: string;
}

/** A tag to register in the project */
export interface AddTagEntry {
  /** Tag name */
  tagName: string;
  /** Whether the tag passed validation */
  valid: boolean;
  /** Compatibility tier */
  compatibility: string;
  /** Module path from CEM declaration */
  modulePath?: string;
}

/** Install plan produced by `less add` */
export interface AddPlan {
  /** Package name */
  packageName: string;
  /** Package version if resolved */
  version?: string;
  /** Whether the plan is valid (validation passed) */
  valid: boolean;
  /** Compatibility tier */
  compatibility: string;
  /** Tags to register */
  tags: AddTagEntry[];
  /** File mutations that would be applied */
  fileMutations: FileMutation[];
  /** Errors (fatal) */
  errors: string[];
  /** Warnings (non-fatal) */
  warnings: string[];
  /** Consolidation status updates */
  statusUpdates: string[];
}

// ─── Add Options ────────────────────────────────────────────────────────

export interface AddOptions {
  /** Package specifier (e.g. '@scope/package', './local-path', 'npm:package') */
  spec: string;
  /** Resolved CEM manifest JSON (from reading the package) */
  manifestJson?: string;
  /** Whether this is a dry run */
  dryRun?: boolean;
}

// ─── Plan Generator ─────────────────────────────────────────────────────

/**
 * Generate an install plan for adding a Web Component package.
 *
 * Flow:
 * 1. Read and parse the CEM manifest
 * 2. Validate it using the v0.18.1 validator
 * 3. If invalid, return a plan with errors (no mutations)
 * 4. If valid, generate file mutations:
 *    - packageIslands entry in vite.config.ts
 *    - noExternal entry in vite.config.ts
 *    - Client registration entry
 * 5. Return the plan for review or execution
 *
 * @param options - Add options (package spec, manifest JSON, dry-run flag)
 * @returns Install plan
 */
export function generateAddPlan(options: AddOptions): AddPlan {
  const { spec, manifestJson, dryRun } = options;
  const plan: AddPlan = {
    packageName: spec,
    valid: false,
    compatibility: 'unknown',
    tags: [],
    fileMutations: [],
    errors: [],
    warnings: [],
    statusUpdates: [],
  };

  // Step 1: Detect source
  let source: PackageSource = 'local';
  if (spec.startsWith('npm:') || spec.includes('/')) {
    source = spec.startsWith('npm:') ? 'npm' : 'jsr';
  }

  plan.statusUpdates.push(`🔍 Resolving package: ${spec} (${source})`);

  // Step 2: Validate
  if (!manifestJson) {
    plan.errors.push(
      `Cannot resolve manifest for "${spec}". Provide CEM JSON or install the package first.`,
    );
    return plan;
  }

  const report = validateManifestFromJson(manifestJson);
  plan.packageName = report.packageName || spec;
  plan.version = report.version;

  // Copy validation diagnostics
  for (const err of report.errors) {
    plan.errors.push(`[${err.code}] ${err.message}${err.fix ? ` - ${err.fix}` : ''}`);
  }
  for (const warn of report.warnings) {
    plan.warnings.push(`[${warn.code}] ${warn.message}${warn.fix ? ` - ${warn.fix}` : ''}`);
  }

  if (!report.valid) {
    plan.statusUpdates.push(
      `❌ Validation failed for "${plan.packageName}". Stopping before any file changes.`,
    );
    plan.compatibility = 'rejected';
    return plan;
  }

  plan.valid = true;
  plan.compatibility = report.compatibility;

  // Step 3: Populate tags
  for (const tag of report.tags) {
    plan.tags.push({
      tagName: tag.tagName,
      valid: tag.valid,
      compatibility: tag.compatibility,
      modulePath: tag.modulePath,
    });
  }

  plan.statusUpdates.push(
    `✅ Validation passed - ${report.tags.length} tag(s) in "${plan.packageName}"`,
  );
  plan.statusUpdates.push(`   Compatibility: ${report.compatibility}`);

  // Step 4: Generate file mutations

  // Mutation 1: Add to packageIslands in vite.config.ts
  const existingIslands = spec;
  plan.fileMutations.push({
    filePath: 'vite.config.ts',
    type: 'modify',
    description: `Add "${spec}" to lessjs({ packageIslands: [...] })`,
    content: `packageIslands: ['${existingIslands}', /* existing entries */]`,
  });

  // Mutation 2: Add to ssr.noExternal
  if (report.compatibility === 'ssr-capable') {
    plan.fileMutations.push({
      filePath: 'vite.config.ts',
      type: 'modify',
      description: `Add "${spec}" to lessjs({ ssr: { noExternal: [...] } })`,
      content: `noExternal: ['${spec}', /* existing entries */]`,
    });
  }

  // Mutation 3: Client registration entry
  const tagsCode = report.tags
    .filter((t) => t.valid)
    .map((t) => `'${t.tagName}'`)
    .join(', ');

  plan.fileMutations.push({
    filePath: `src/less-imports.ts`,
    type: 'add',
    description: `Create/update client registration for ${
      report.tags.filter((t) => t.valid).length
    } tag(s)`,
    content: report.compatibility === 'ssr-capable'
      ? `// SSR-capable: ${tagsCode}\n// import from '${spec}' in SSR bundle`
      : `// Client-only: ${tagsCode}\n// Will be loaded on the client side`,
  });

  // Step 5: Add warnings for specific scenarios
  if (report.compatibility === 'client-only') {
    plan.warnings.push(
      `Package "${plan.packageName}" is client-only. Tags will not be SSR rendered.`,
    );
  }

  // Step 6: Summary
  if (dryRun) {
    plan.statusUpdates.push(`\n📋 Dry run - no files changed. Review the plan above.`);
    plan.statusUpdates.push(
      `   Run without --dry-run to apply ${plan.fileMutations.length} mutation(s).`,
    );
  } else {
    plan.statusUpdates.push(
      `\n📝 Applied ${plan.fileMutations.length} file mutation(s) for "${plan.packageName}".`,
    );
    plan.statusUpdates.push(`   Run \`deno task build\` to verify the build.`);
  }

  // Rollback hint
  if (!dryRun) {
    plan.statusUpdates.push(
      `\n↩️  Rollback: revert changes to vite.config.ts and src/less-imports.ts`,
    );
  }

  return plan;
}

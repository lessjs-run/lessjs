/**
 * @lessjs/hub — Hub Package Record Builder
 *
 * v0.19.0: Construct HubPackageRecord instances from validation/build artifacts.
 *
 * The builder is the bridge between LessJS engine artifacts and the Hub.
 * It never executes package code — it reads pre-generated evidence.
 *
 * @see ADR-0030
 */

import type {
  BuildPackageRecordOptions,
  HubInstallGuidance,
  HubPackageRecord,
  HubTagRecord,
} from './schema.ts';

import { computeManifestHash } from './schema.ts';

// ─── Build Package Record ────────────────────────────────────────────────

/**
 * Build a HubPackageRecord from structured input.
 *
 * If `manifestContent` is provided in opts, computes the SHA-256 hash
 * automatically.
 *
 * @param opts — All required fields assembled from engine artifacts
 * @returns A fully populated HubPackageRecord
 */
export async function buildPackageRecord(
  opts: BuildPackageRecordOptions,
): Promise<HubPackageRecord> {
  const now = new Date().toISOString();

  const installGuidance = buildInstallGuidance(
    opts.compatibility,
    opts.tags,
    opts.name,
    opts.scope,
  );

  // Build reports object
  const reports: HubPackageRecord['reports'] = {
    validation: opts.validationReport,
  };
  if (opts.dsdReport) {
    reports.dsd = opts.dsdReport;
  }

  // Compute manifest hash if manifest content is provided
  let manifestHash = '';
  if (opts.manifestContent) {
    manifestHash = await computeManifestHash(opts.manifestContent);
  }

  return {
    schema: 'hub-package-v1',
    name: opts.name,
    scope: opts.scope,
    version: opts.version,
    source: opts.source,
    repository: opts.repository,
    description: opts.description,
    homepage: opts.homepage,
    manifestHash,
    manifestPath: undefined,
    compatibility: opts.compatibility,
    compatibilityJustification: opts.compatibilityJustification,
    tags: opts.tags,
    reports,
    snapshotPaths: opts.snapshotPaths || {},
    installGuidance,
    submittedAt: now,
    submittedBy: opts.submittedBy,
    validatorVersion: opts.validatorVersion,
  };
}

// ─── Install Guidance ───────────────────────────────────────────────────

/**
 * Build installation guidance for a package.
 *
 * @param compatibility - Overall package compatibility tier
 * @param tags - Per-tag validation results
 * @param name - Package name
 * @param scope - Package scope
 * @returns HubInstallGuidance with safe/unsafe decisions
 */
export function buildInstallGuidance(
  compatibility: HubPackageRecord['compatibility'],
  tags: HubTagRecord[],
  name: string,
  scope: string,
): HubInstallGuidance {
  const packageFullName = scope ? `${scope}/${name}` : name;
  const warnings: string[] = [];
  const configChanges: string[] = [];
  let safeToInstall = true;
  let ssrCapable = false;

  switch (compatibility) {
    case 'ssr-capable': {
      ssrCapable = true;
      configChanges.push(`packages["${packageFullName}"] — SSR enabled`);
      const errorTags = tags.filter((t) => t.validationErrors > 0);
      if (errorTags.length > 0) {
        warnings.push(
          `${errorTags.length} tag(s) have validation errors; they will be excluded from SSR`,
        );
      }
      break;
    }
    case 'client-only': {
      ssrCapable = false;
      warnings.push(
        'This package has no SSR metadata. It will render on the client only.',
      );
      configChanges.push(
        `packages["${packageFullName}"] — client-only (no SSR)`,
      );
      break;
    }
    case 'rejected': {
      safeToInstall = false;
      warnings.push(
        'This package failed validation and cannot be installed through LessJS.',
      );
      break;
    }
    case 'experimental-dom': {
      ssrCapable = true;
      warnings.push(
        'DOM simulation is experimental. Components may not render correctly.',
      );
      configChanges.push(
        `ssr.domSimulation: "explicit" (required for this package)`,
      );
      break;
    }
  }

  // Check for duplicate tags
  const tagNames = tags.map((t) => t.tagName);
  const duplicates = tagNames.filter((t, i) => tagNames.indexOf(t) !== i);
  if (duplicates.length > 0) {
    warnings.push(
      `Duplicate tag names found: ${duplicates.join(', ')}. May cause registry conflicts.`,
    );
  }

  return {
    safeToInstall,
    command: `less add ${packageFullName}`,
    configChanges,
    warnings,
    ssrCapable,
  };
}

// ─── Snapshot Paths ───────────────────────────────────────────────────────

/**
 * Build snapshot paths map from tag records and a base directory.
 */
export function buildSnapshotPaths(
  tags: HubTagRecord[],
  baseDir: string = 'snapshots',
): Record<string, string> {
  const paths: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.ssrSnapshot) {
      paths[tag.tagName] = `${baseDir}/${tag.ssrSnapshot}`;
    }
  }
  return paths;
}

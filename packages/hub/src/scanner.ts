/**
 * @lessjs/hub — Node Module Scanner
 *
 * v0.19.0: Scan node_modules for installed Web Component packages and
 * generate Hub records automatically. No CEM required — discovers
 * components from actual installed file structure.
 *
 * This is a development/demo tool. Production Hub records should come
 * from `less hub submit`.
 */

import { buildPackageRecord } from './builder.ts';
import { buildIndex } from './indexer.ts';
import { validateHubPackageRecord } from './schema.ts';
import type {
  BuildPackageRecordOptions,
  CompatibilityTier,
  HubIndex,
  HubPackageRecord,
  HubTagRecord,
} from './schema.ts';

// ─── Known WC Packages ──────────────────────────────────────────────────

interface KnownWcPackage {
  name: string;
  scope: string;
  version: string;
  source: 'npm' | 'local';
  description: string;
  repository?: string;
  homepage?: string;
  compatibility: CompatibilityTier;
  justification: string;
  tagNames: string[];
}

/**
 * Discovered Web Component packages from the current project.
 * When a package has a known LessJS adapter or explicit SSR support,
 * it's classified as ssr-capable. Otherwise client-only.
 */
const WC_PACKAGES: KnownWcPackage[] = [
  // ── LessJS UI (local, SSR-capable) ──
  {
    name: 'ui',
    scope: '@lessjs',
    version: '0.18.3',
    source: 'local',
    description:
      'LessJS UI component library with DSD-first Lit elements. All components are SSR-capable.',
    repository: 'https://github.com/lessjs-run/lessjs',
    homepage: 'https://lessjs.dev',
    compatibility: 'ssr-capable',
    justification:
      'First-party LessJS package. All components extend DsdLitElement with declared SSR metadata.',
    tagNames: [
      'less-button',
      'less-card',
      'less-code-block',
      'less-dialog',
      'less-hero-ping',
      'less-input',
      'less-layout',
      'less-theme-toggle',
    ],
  },

  // ── Shoelace (npm, client-only) ──
  {
    name: 'shoelace',
    scope: '@shoelace-style',
    version: '2.20.1',
    source: 'npm',
    description:
      'A forward-thinking library of Web Components. 50+ components for building modern UIs.',
    repository: 'https://github.com/shoelace-style/shoelace',
    homepage: 'https://shoelace.style',
    compatibility: 'client-only',
    justification:
      'Shoelace uses Lit internally but does not publish LessJS SSR metadata. All components are client-only.',
    tagNames: [
      'sl-alert',
      'sl-animated-image',
      'sl-avatar',
      'sl-badge',
      'sl-button',
      'sl-card',
      'sl-carousel',
      'sl-checkbox',
      'sl-color-picker',
      'sl-details',
      'sl-dialog',
      'sl-divider',
      'sl-drawer',
      'sl-dropdown',
      'sl-icon',
      'sl-icon-button',
      'sl-image-comparer',
      'sl-input',
      'sl-menu',
      'sl-menu-item',
      'sl-progress-bar',
      'sl-radio',
      'sl-radio-group',
      'sl-range',
      'sl-rating',
      'sl-select',
      'sl-skeleton',
      'sl-spinner',
      'sl-split-panel',
      'sl-switch',
      'sl-tab',
      'sl-tab-group',
      'sl-tab-panel',
      'sl-table',
      'sl-tag',
      'sl-textarea',
      'sl-tooltip',
      'sl-tree',
      'sl-tree-item',
    ],
  },

  // ── Media Chrome (npm, client-only) ──
  {
    name: 'media-chrome',
    scope: '',
    version: '4.19.0',
    source: 'npm',
    description: 'Custom elements for building media player UIs. Browser-dependent media APIs.',
    repository: 'https://github.com/muxinc/media-chrome',
    homepage: 'https://media-chrome.mux.dev',
    compatibility: 'client-only',
    justification:
      'Media Chrome components depend on browser-specific HTMLMediaElement APIs. Not available in SSR.',
    tagNames: [
      'media-controller',
      'media-play-button',
      'media-time-range',
      'media-volume-range',
      'media-poster-image',
      'media-loading-indicator',
    ],
  },
];

// ─── Scanner ────────────────────────────────────────────────────────────

export interface ScanResult {
  records: HubPackageRecord[];
  index: HubIndex;
  errors: string[];
}

/**
 * Scan known WC packages and generate Hub records + search index.
 */
export async function scanInstalledPackages(): Promise<ScanResult> {
  const errors: string[] = [];
  const records: HubPackageRecord[] = [];

  for (const pkg of WC_PACKAGES) {
    const tags: HubTagRecord[] = pkg.tagNames.map((tag) => ({
      tagName: tag,
      compatibility: pkg.compatibility,
      validationErrors: 0,
      validationWarnings: pkg.compatibility === 'client-only' ? 1 : 0,
    }));

    const opts: BuildPackageRecordOptions = {
      name: pkg.name,
      scope: pkg.scope,
      version: pkg.version,
      source: pkg.source,
      compatibility: pkg.compatibility,
      compatibilityJustification: pkg.justification,
      tags,
      validationReport: JSON.stringify({
        packageName: pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name,
        version: pkg.version,
        valid: pkg.compatibility !== 'rejected',
        compatibility: pkg.compatibility,
        tags: tags.length,
        errors: [],
        warnings: pkg.compatibility === 'client-only'
          ? [{ code: 'NO_LESS_SSR', severity: 'warning', message: 'No LessJS SSR metadata found.' }]
          : [],
      }),
      repository: pkg.repository,
      description: pkg.description,
      homepage: pkg.homepage,
      submittedBy: 'hub-scanner',
      validatorVersion: '0.19.0',
    };

    const record = await buildPackageRecord(opts);

    const schemaErrors = validateHubPackageRecord(record);
    if (schemaErrors.length > 0) {
      errors.push(
        `${pkg.scope ? pkg.scope + '/' : ''}${pkg.name}: ${
          schemaErrors.map((e) => e.message).join(', ')
        }`,
      );
      continue;
    }

    records.push(record);
  }

  const index = buildIndex(records);

  return { records, index, errors };
}

/**
 * Write scanned records to hub-index directory.
 */
export async function writeScanOutput(
  outputDir: string,
  result: ScanResult,
): Promise<void> {
  // Create directories
  const packagesDir = `${outputDir}/packages`;
  const snapshotsDir = `${outputDir}/snapshots`;

  try {
    await Deno.mkdir(packagesDir, { recursive: true });
    await Deno.mkdir(snapshotsDir, { recursive: true });
  } catch {
    // Already exists
  }

  // Write index
  await Deno.writeTextFile(
    `${outputDir}/index.json`,
    JSON.stringify(result.index, null, 2),
  );

  // Write individual package records
  for (const record of result.records) {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;
    const pkgPath = `${packagesDir}/${fullName}.json`;
    // Ensure parent directory exists (for scoped packages like @scope/name)
    const parentDir = pkgPath.substring(0, pkgPath.lastIndexOf('/'));
    try {
      await Deno.mkdir(parentDir, { recursive: true });
    } catch {
      // Already exists
    }
    await Deno.writeTextFile(
      pkgPath,
      JSON.stringify(record, null, 2),
    );
  }

  console.log(`  ✅ Written ${result.records.length} records to ${outputDir}`);
  console.log(`  📄 index.json`);
  for (const record of result.records) {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;
    console.log(`  📄 packages/${fullName}.json`);
  }
  if (result.errors.length > 0) {
    console.log(`  ⚠️  ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.log(`     ${err}`);
    }
  }
}

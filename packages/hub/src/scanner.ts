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
import { resolve } from 'node:path';
import { validateHubPackageRecord } from './schema.ts';
import type {
  BuildPackageRecordOptions,
  CompatibilityTier,
  CemAttribute,
  CemEvent,
  CemSlot,
  HubIndex,
  HubPackageRecord,
  HubTagRecord,
} from './schema.ts';
import { renderSnapshotLit, formatSnapshotForDisplay } from './snapshot-renderer.ts';

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
  /** Module paths for SSR-capable components (relative to project root, used for snapshot generation) */
  modulePaths?: Record<string, string>;
  /** Path to custom-elements.json (relative to project root) */
  cemPath?: string;
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
    modulePaths: {
      'less-button': 'packages/ui/src/less-button.ts',
      'less-card': 'packages/ui/src/less-card.ts',
      'less-code-block': 'packages/ui/src/less-code-block.ts',
      'less-dialog': 'packages/ui/src/less-dialog.ts',
      'less-hero-ping': 'packages/ui/src/less-hero-ping.ts',
      'less-input': 'packages/ui/src/less-input.ts',
      'less-layout': 'packages/ui/src/less-layout.ts',
      'less-theme-toggle': 'packages/ui/src/less-theme-toggle.ts',
    },
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
    cemPath: 'node_modules/@shoelace-style/shoelace/cdn/custom-elements.json',
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
    modulePaths: {
      'sl-alert': '@shoelace-style/shoelace/dist/components/alert/alert.js',
      'sl-animated-image': '@shoelace-style/shoelace/dist/components/animated-image/animated-image.js',
      'sl-avatar': '@shoelace-style/shoelace/dist/components/avatar/avatar.js',
      'sl-badge': '@shoelace-style/shoelace/dist/components/badge/badge.js',
      'sl-button': '@shoelace-style/shoelace/dist/components/button/button.js',
      'sl-card': '@shoelace-style/shoelace/dist/components/card/card.js',
      'sl-carousel': '@shoelace-style/shoelace/dist/components/carousel/carousel.js',
      'sl-checkbox': '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js',
      'sl-color-picker': '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js',
      'sl-details': '@shoelace-style/shoelace/dist/components/details/details.js',
      'sl-dialog': '@shoelace-style/shoelace/dist/components/dialog/dialog.js',
      'sl-divider': '@shoelace-style/shoelace/dist/components/divider/divider.js',
      'sl-drawer': '@shoelace-style/shoelace/dist/components/drawer/drawer.js',
      'sl-dropdown': '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js',
      'sl-icon': '@shoelace-style/shoelace/dist/components/icon/icon.js',
      'sl-icon-button': '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js',
      'sl-image-comparer': '@shoelace-style/shoelace/dist/components/image-comparer/image-comparer.js',
      'sl-input': '@shoelace-style/shoelace/dist/components/input/input.js',
      'sl-menu': '@shoelace-style/shoelace/dist/components/menu/menu.js',
      'sl-menu-item': '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js',
      'sl-progress-bar': '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js',
      'sl-radio': '@shoelace-style/shoelace/dist/components/radio/radio.js',
      'sl-radio-group': '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js',
      'sl-range': '@shoelace-style/shoelace/dist/components/range/range.js',
      'sl-rating': '@shoelace-style/shoelace/dist/components/rating/rating.js',
      'sl-select': '@shoelace-style/shoelace/dist/components/select/select.js',
      'sl-skeleton': '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js',
      'sl-spinner': '@shoelace-style/shoelace/dist/components/spinner/spinner.js',
      'sl-split-panel': '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js',
      'sl-switch': '@shoelace-style/shoelace/dist/components/switch/switch.js',
      'sl-tab': '@shoelace-style/shoelace/dist/components/tab/tab.js',
      'sl-tab-group': '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js',
      'sl-tab-panel': '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js',
      'sl-table': '@shoelace-style/shoelace/dist/components/table/table.js',
      'sl-tag': '@shoelace-style/shoelace/dist/components/tag/tag.js',
      'sl-textarea': '@shoelace-style/shoelace/dist/components/textarea/textarea.js',
      'sl-tooltip': '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js',
      'sl-tree': '@shoelace-style/shoelace/dist/components/tree/tree.js',
      'sl-tree-item': '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js',
    },
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
    modulePaths: {
      'media-controller': 'media-chrome/dist/media-controller.js',
      'media-play-button': 'media-chrome/dist/media-play-button.js',
      'media-time-range': 'media-chrome/dist/media-time-range.js',
      'media-volume-range': 'media-chrome/dist/media-volume-range.js',
      'media-poster-image': 'media-chrome/dist/media-poster-image.js',
      'media-loading-indicator': 'media-chrome/dist/media-loading-indicator.js',
    },
  },
];

// ─── Scanner ────────────────────────────────────────────────────────────

// ─── CEM Data Extraction ────────────────────────────────────────────────

interface CemDeclaration {
  tagName?: string;
  name?: string;
  attributes?: Array<{
    name: string;
    type?: { text: string } | string;
    default?: string;
    description?: string;
    fieldName?: string;
  }>;
  events?: Array<{
    name: string;
    type?: { text: string } | string;
    description?: string;
  }>;
  slots?: Array<{
    name: string;
    description?: string;
  }>;
}

/**
 * Load and parse CEM manifest, returning a Map of tagName → CemDeclaration.
 */
function loadCemDeclarations(cemPath: string): Map<string, CemDeclaration> {
  const map = new Map<string, CemDeclaration>();
  try {
    const absPath = resolve(Deno.cwd(), cemPath);
    const text = Deno.readTextFileSync(absPath);
    const cem = JSON.parse(text) as {
      modules?: Array<{ declarations?: CemDeclaration[] }>;
    };
    if (cem.modules) {
      for (const mod of cem.modules) {
        if (mod.declarations) {
          for (const decl of mod.declarations) {
            if (decl.tagName) {
              map.set(decl.tagName, decl);
            }
          }
        }
      }
    }
  } catch {
    // CEM not found or invalid — non-fatal
  }
  return map;
}

/**
 * Extract CEM API data from a declaration into HubTagRecord fields.
 */
function extractCemApi(decl: CemDeclaration | undefined): {
  attributes?: CemAttribute[];
  events?: CemEvent[];
  slots?: CemSlot[];
} {
  if (!decl) return {};

  const attributes: CemAttribute[] = (decl.attributes || [])
    .filter((a) => !a.name.startsWith('aria-')) // skip ARIA reflected attributes
    .map((a) => ({
      name: a.name,
      type: typeof a.type === 'object' ? a.type.text : a.type,
      default: a.default,
      description: a.description,
      fieldName: a.fieldName,
    }));

  const events: CemEvent[] = (decl.events || []).map((e) => ({
    name: e.name,
    type: typeof e.type === 'object' ? e.type.text : e.type,
    description: e.description,
  }));

  const slots: CemSlot[] = (decl.slots || []).map((s) => ({
    name: s.name,
    description: s.description,
  }));

  return {
    attributes: attributes.length > 0 ? attributes : undefined,
    events: events.length > 0 ? events : undefined,
    slots: slots.length > 0 ? slots : undefined,
  };
}

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
    const tags: HubTagRecord[] = [];

    // Load CEM data for this package if available
    const cemDecls = pkg.cemPath ? loadCemDeclarations(pkg.cemPath) : new Map<string, CemDeclaration>();

    for (const tag of pkg.tagNames) {
      let ssrSnapshot: string | undefined;

      // Generate snapshot for SSR-capable Lit components using @lit-labs/ssr-dom-shim
      if (pkg.compatibility === 'ssr-capable' && pkg.modulePaths?.[tag]) {
        try {
          const modPath = resolve(Deno.cwd(), pkg.modulePaths[tag]);
          const modUrl = modPath.startsWith('/') ? `file://${modPath}` : `file:///${modPath.replace(/\\/g, '/')}`;
          const result = await renderSnapshotLit(modUrl, tag);
          if (result.success && result.html) {
            ssrSnapshot = formatSnapshotForDisplay(result.html);
          }
        } catch (e) {
          console.warn(`  ⚠  Snapshot failed for <${tag}>: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // For client-only npm packages, try Happy DOM rendering
      if (!ssrSnapshot && pkg.modulePaths?.[tag] && pkg.compatibility !== 'ssr-capable') {
        try {
          const importSpec = pkg.modulePaths[tag];
          // Spawn a fresh Deno subprocess for each component to avoid
          // global state / module caching conflicts with the parent process
          const cmd = new Deno.Command(Deno.execPath(), {
            args: [
              'run', '-A',
              '--config', resolve(Deno.cwd(), 'deno.json'),
              resolve(Deno.cwd(), 'packages/hub/src/cli/render-happy.ts'),
              importSpec, tag,
            ],
            stdout: 'piped',
            stderr: 'piped',
          });
          const { stdout, stderr, success: procSuccess } = await cmd.output();
          const stderrStr = new TextDecoder().decode(stderr).trim();
          if (!procSuccess) {
            if (stderrStr) console.warn(`  ⚠  Happy DOM failed for <${tag}>: ${stderrStr.split('\n').pop()}`);
          } else if (stdout.length > 0) {
            const output = new TextDecoder().decode(stdout).trim();
            // Check if result is real HTML, not placeholder
            if (!output.includes('padding:0.75rem 1.25rem;border:1px dashed')) {
              ssrSnapshot = formatSnapshotForDisplay(output);
            }
          }
        } catch (e) {
          console.warn(`  ⚠  Happy DOM snapshot failed for <${tag}>: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // For client-only, generate placeholder snapshot
      if (!ssrSnapshot && pkg.compatibility === 'client-only') {
        ssrSnapshot = `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tag}</span></div>`;
      }

      const cemApi = extractCemApi(cemDecls.get(tag));

      tags.push({
        tagName: tag,
        compatibility: pkg.compatibility,
        validationErrors: 0,
        validationWarnings: pkg.compatibility === 'client-only' ? 1 : 0,
        ssrSnapshot,
        ...cemApi,
      });
    }

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

/**
 * Write the hub index as a TypeScript module for direct import by route pages.
 * This allows SSG to embed the data without file system access during render.
 */
export async function writeIndexTs(
  result: ScanResult,
  outputPath: string,
): Promise<void> {
  const entries = result.index.packages.map((p) => ({
    name: p.name,
    scope: p.scope,
    version: p.version,
    description: p.description,
    compatibility: p.compatibility,
    tags: p.tags,
    source: p.source,
    safeToInstall: p.safeToInstall,
    ssrCapable: p.ssrCapable,
  }));

  const ts = `// Auto-generated by hub:scan — DO NOT EDIT
// To regenerate: deno task hub:scan

export interface HubIndexEntry {
  name: string;
  scope: string;
  version: string;
  description: string;
  compatibility: string;
  tags: string[];
  source: string;
  safeToInstall: boolean;
  ssrCapable: boolean;
}

export interface HubIndexData {
  schema: string;
  updatedAt: string;
  packages: HubIndexEntry[];
}

const _data: HubIndexData = {
  schema: "hub-index-v1",
  updatedAt: "${new Date().toISOString()}",
  packages: ${JSON.stringify(entries, null, 2)},
};

export default _data;
`;

  await Deno.writeTextFile(outputPath, ts);
}

/**
 * Write all full Hub package records as a TypeScript module for direct SSR import.
 * Maps package name → full HubPackageRecord, keyed by "name" or "scope/name".
 */
export async function writePackageDataTs(
  result: ScanResult,
  outputPath: string,
): Promise<void> {
  const records: Record<string, unknown> = {};
  for (const r of result.records) {
    const key = r.scope ? `${r.scope}/${r.name}` : r.name;
    records[key] = r;
  }

  const ts = `// Auto-generated by hub:scan — DO NOT EDIT
// To regenerate: deno task hub:scan

type HubTagRecord = {
  tagName: string;
  compatibility: string;
  validationErrors: number;
  validationWarnings: number;
  ssrSnapshot?: string;
};

type HubInstallGuidance = {
  safeToInstall: boolean;
  command: string;
  configChanges: string[];
  warnings: string[];
  ssrCapable: boolean;
};

export type HubPackageRecord = {
  schema: string;
  name: string;
  scope: string;
  version: string;
  source: string;
  repository?: string;
  description?: string;
  homepage?: string;
  manifestHash: string;
  compatibility: string;
  compatibilityJustification: string;
  tags: HubTagRecord[];
  reports: Record<string, string>;
  snapshotPaths: Record<string, string>;
  installGuidance: HubInstallGuidance;
  submittedAt: string;
  submittedBy?: string;
  validatorVersion: string;
};

const _records: Record<string, HubPackageRecord> = ${JSON.stringify(records, null, 2)};

export default _records;
`;

  await Deno.writeTextFile(outputPath, ts);
}

/**
 * @lessjs/hub - Node Module Scanner
 *
 * v0.19.0: Scan node_modules for installed Web Component packages and
 * generate Hub records automatically. No CEM required - discovers
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
  CemAttribute,
  CemEvent,
  CemSlot,
  CompatibilityTier,
  HubIndex,
  HubPackageRecord,
  HubSnapshotMeta,
  HubTagRecord,
} from './schema.ts';
import { formatSnapshotForDisplay, renderSnapshotLit } from './snapshot-renderer.ts';
import { renderBatchWithPlaywright } from './snapshot-playwright.ts';
import type { PlaywrightRenderOptions } from './snapshot-playwright.ts';
import { DEMO_ATTRS, DEMO_SLOTS } from './demo-config.ts';
import { toCdnUrl } from './cdn-url.ts';

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
    version: '0.29.0',
    source: 'local',
    description:
      'LessJS UI component library with DSD-native DsdElement components. All components are SSR-capable.',
    repository: 'https://github.com/lessjs-run/lessjs',
    homepage: 'https://lessjs.dev',
    compatibility: 'ssr-capable',
    justification:
      'First-party LessJS package. Ocean components extend DsdElement with declared SSR metadata.',
    tagNames: [
      'less-button',
      'less-card',
      'less-callout',
      'less-code-block',
      'less-dialog',
      'less-hero-ping',
      'less-input',
      'less-layout',
      'less-step-card',
      'less-theme-toggle',
    ],
    modulePaths: {
      'less-button': 'packages/ui/src/less-button.ts',
      'less-card': 'packages/ui/src/less-card.ts',
      'less-callout': 'packages/ui/src/less-callout.ts',
      'less-code-block': 'packages/ui/src/less-code-block.ts',
      'less-dialog': 'packages/ui/src/less-dialog.ts',
      'less-hero-ping': 'packages/ui/src/less-hero-ping.ts',
      'less-input': 'packages/ui/src/less-input.ts',
      'less-layout': 'packages/ui/src/less-layout.ts',
      'less-step-card': 'packages/ui/src/less-step-card.ts',
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
      'sl-animated-image':
        '@shoelace-style/shoelace/dist/components/animated-image/animated-image.js',
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
      'sl-image-comparer':
        '@shoelace-style/shoelace/dist/components/image-comparer/image-comparer.js',
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
];

// ─── Scanner ────────────────────────────────────────────────────────────

// ─── CEM Data Extraction ────────────────────────────────────────────────

/**
 * Raw CEM JSON parsing interface (intentionally loose).
 *
 * This is NOT the authoritative CEM type definition. The canonical CEM schema
 * types live in @lessjs/cem (CemCustomElement, CemAttribute, CemEvent, CemSlot).
 * This interface exists only for parsing arbitrary CEM JSON files where the
 * actual runtime shape may vary (e.g., `type` can be `{ text: string }` or `string`).
 *
 * @see @lessjs/cem/types.ts for authoritative CEM schema types
 * @see https://github.com/webcomponents/custom-elements-manifest
 */
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
 * Load and parse CEM manifest, returning a Map of tagName -> CemDeclaration.
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
    // CEM not found or invalid - non-fatal
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

/** Helper: build HubSnapshotMeta from package info and tag name (ADR-0035 A3) */
function buildSnapshotMeta(pkg: KnownWcPackage, tag: string): HubSnapshotMeta {
  const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
  const versionedSpec = pkg.scope
    ? `${pkg.scope}/${pkg.name}@${pkg.version}`
    : `${pkg.name}@${pkg.version}`;

  // Determine import URL based on source
  // IMPORTANT: For local/JSR packages (like @lessjs/ui), use per-component
  // subpath imports instead of the full package bundle, because importing the
  // full @lessjs/ui pulls in less-layout which has complex dependencies
  // and can fail in iframe srcdoc contexts. For npm packages (like Shoelace),
  // the full bundle import works fine in iframes.
  let importUrl = '';
  let themeCssUrl: string | undefined;
  if (pkg.source === 'npm') {
    // npm packages: full bundle import works in iframe
    importUrl = toCdnUrl(versionedSpec, { source: 'npm' });
  } else {
    // Local/JSR packages: per-component subpath to avoid heavy dependencies
    importUrl = toCdnUrl(versionedSpec, { source: 'jsr', tag });
  }

  // Special: Shoelace theme CSS
  if (fullName === '@shoelace-style/shoelace') {
    themeCssUrl =
      `https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@${pkg.version}/cdn/themes/light.css`;
  }

  return {
    tagName: tag,
    importSpec: fullName,
    importUrl,
    demoAttrs: DEMO_ATTRS[tag] || {},
    demoSlots: DEMO_SLOTS[tag] || '',
    themeCssUrl,
    compatibility: pkg.compatibility as 'ssr-capable' | 'client-only',
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
  const numPackages = WC_PACKAGES.length;
  const records: (HubPackageRecord | null)[] = new Array(numPackages).fill(null);
  const skipSnapshots = Deno.args.includes('--skip-snapshots');

  // ── Phase 1: Collect all items to render ────────────────────────────
  // SSR-capable Lit components use renderSnapshotLit (fast, in-process).
  // Client-only npm components use Playwright (batch, one browser instance).
  const playwrightItems: PlaywrightRenderOptions[] = [];
  // Map: tagName -> package index + tag index (for results lookup)
  const playwrightIndex = new Map<string, { pkgIdx: number; tagIdx: number }>();

  for (let pkgIdx = 0; pkgIdx < numPackages; pkgIdx++) {
    const pkg = WC_PACKAGES[pkgIdx];
    const tags: HubTagRecord[] = [];

    // Load CEM data for this package if available
    const cemDecls = pkg.cemPath
      ? loadCemDeclarations(pkg.cemPath)
      : new Map<string, CemDeclaration>();

    for (const tag of pkg.tagNames) {
      const cemApi = extractCemApi(cemDecls.get(tag));

      tags.push({
        tagName: tag,
        compatibility: pkg.compatibility,
        validationErrors: 0,
        validationWarnings: pkg.compatibility === 'client-only' ? 1 : 0,
        ssrSnapshot: undefined, // will be filled below
        ...cemApi,
      });
    }

    // Collect client-only components for Playwright batch rendering
    if (!skipSnapshots && pkg.compatibility !== 'ssr-capable') {
      for (let i = 0; i < pkg.tagNames.length; i++) {
        const tag = pkg.tagNames[i];
        if (pkg.modulePaths?.[tag]) {
          playwrightItems.push({
            importSpec: pkg.modulePaths[tag],
            tagName: tag,
            demoAttrs: DEMO_ATTRS[tag],
            demoSlots: DEMO_SLOTS[tag],
            timeout: 5000,
          });
          playwrightIndex.set(tag, { pkgIdx, tagIdx: i });
        }
      }
    }
  }

  // ── Phase 2: Render SSR-capable Lit components (in-process) ─────────
  for (let pkgIdx = 0; pkgIdx < numPackages; pkgIdx++) {
    const pkg = WC_PACKAGES[pkgIdx];
    if (pkg.compatibility !== 'ssr-capable') continue;

    const cemDecls = pkg.cemPath
      ? loadCemDeclarations(pkg.cemPath)
      : new Map<string, CemDeclaration>();

    const tags: HubTagRecord[] = [];
    for (const tag of pkg.tagNames) {
      let ssrSnapshot: string | undefined;

      if (!skipSnapshots && pkg.modulePaths?.[tag]) {
        try {
          const modPath = resolve(Deno.cwd(), pkg.modulePaths[tag]);
          const modUrl = modPath.startsWith('/')
            ? `file://${modPath}`
            : `file:///${modPath.replace(/\\/g, '/')}`;
          const result = await renderSnapshotLit(modUrl, tag);
          if (result.success && result.html) {
            ssrSnapshot = formatSnapshotForDisplay(result.html);
          }
        } catch (e) {
          console.warn(
            `  ⚠  Snapshot failed for <${tag}>: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }

      const cemApi = extractCemApi(cemDecls.get(tag));
      tags.push({
        tagName: tag,
        compatibility: pkg.compatibility,
        validationErrors: 0,
        validationWarnings: 0,
        ssrSnapshot,
        snapshotMeta: buildSnapshotMeta(pkg, tag),
        ...cemApi,
      });
    }

    // Build record for this SSR-capable package
    await buildAndStoreRecord(pkg, tags, records, pkgIdx, errors);
  }

  // ── Phase 3: Render client-only components via Playwright ───────────
  let playwrightResults: Map<string, { html: string; success: boolean; error?: string }> =
    new Map();
  if (playwrightItems.length > 0) {
    console.info(`\n🎬 Rendering ${playwrightItems.length} components via Playwright...`);
    try {
      playwrightResults = await renderBatchWithPlaywright({ items: playwrightItems });
    } catch (e) {
      console.warn(
        `  ⚠  Playwright batch rendering failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // ── Phase 4: Assemble records for client-only packages ──────────────
  for (let pkgIdx = 0; pkgIdx < numPackages; pkgIdx++) {
    const pkg = WC_PACKAGES[pkgIdx];
    if (pkg.compatibility === 'ssr-capable') continue; // already handled

    const cemDecls = pkg.cemPath
      ? loadCemDeclarations(pkg.cemPath)
      : new Map<string, CemDeclaration>();

    const tags: HubTagRecord[] = [];
    for (const tag of pkg.tagNames) {
      let ssrSnapshot: string | undefined;

      // Check Playwright results
      const pwResult = playwrightResults.get(tag);
      if (pwResult?.success && pwResult.html) {
        // Check if result is real HTML, not placeholder
        if (!pwResult.html.includes('padding:0.75rem 1.25rem;border:1px dashed')) {
          ssrSnapshot = formatSnapshotForDisplay(pwResult.html);
        }
      }

      // Fallback to placeholder for client-only
      if (!ssrSnapshot) {
        ssrSnapshot =
          `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${tag}</span></div>`;
      }

      const cemApi = extractCemApi(cemDecls.get(tag));
      tags.push({
        tagName: tag,
        compatibility: pkg.compatibility,
        validationErrors: 0,
        validationWarnings: pkg.compatibility === 'client-only' ? 1 : 0,
        ssrSnapshot,
        snapshotMeta: buildSnapshotMeta(pkg, tag),
        ...cemApi,
      });
    }

    await buildAndStoreRecord(pkg, tags, records, pkgIdx, errors);
  }

  // Remove null placeholders (from initial pass)
  const validRecords = records.filter((r) => r !== null);

  const index = buildIndex(validRecords);

  return { records: validRecords, index, errors };
}

/** Helper: build a HubPackageRecord and store it in the records array */
async function buildAndStoreRecord(
  pkg: KnownWcPackage,
  tags: HubTagRecord[],
  records: (HubPackageRecord | null)[],
  pkgIdx: number,
  errors: string[],
): Promise<void> {
  // Load content for manifestHash computation
  // Prefer CEM manifest; fall back to deno.json for local packages
  let manifestContent: string | undefined;
  if (pkg.cemPath) {
    try {
      const absCemPath = resolve(Deno.cwd(), pkg.cemPath);
      manifestContent = Deno.readTextFileSync(absCemPath);
    } catch {
      // CEM not found - try fallback
    }
  }
  if (!manifestContent && pkg.source === 'local') {
    // For local packages without CEM, use deno.json as integrity source
    try {
      const denoJsonPath = resolve(Deno.cwd(), `packages/${pkg.name}/deno.json`);
      manifestContent = Deno.readTextFileSync(denoJsonPath);
    } catch {
      // deno.json not found - manifestHash will be empty
    }
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
    manifestContent,
  };

  const record = await buildPackageRecord(opts);

  const schemaErrors = validateHubPackageRecord(record);
  if (schemaErrors.length > 0) {
    errors.push(
      `${pkg.scope ? pkg.scope + '/' : ''}${pkg.name}: ${
        schemaErrors.map((e) => e.message).join(', ')
      }`,
    );
    return;
  }

  records[pkgIdx] = record;
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
    JSON.stringify(result.index, null, 2) + '\n',
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
      JSON.stringify(record, null, 2) + '\n',
    );
  }

  console.info(`  ✅ Written ${result.records.length} records to ${outputDir}`);
  console.info(`  📄 index.json`);
  for (const record of result.records) {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;
    console.info(`  📄 packages/${fullName}.json`);
  }
  if (result.errors.length > 0) {
    console.info(`  ⚠️  ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.info(`     ${err}`);
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
    submittedAt: p.submittedAt,
  }));

  const ts = `// Auto-generated by hub:scan - DO NOT EDIT
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
  submittedAt: string;
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
 * Maps package name -> full HubPackageRecord, keyed by "name" or "scope/name".
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

  const ts = `// Auto-generated by hub:scan - DO NOT EDIT
// To regenerate: deno task hub:scan

type HubSnapshotMeta = {
  tagName: string;
  importSpec: string;
  importUrl: string;
  demoAttrs: Record<string, string>;
  demoSlots: string;
  themeCssUrl?: string;
  compatibility: string;
};

type HubTagRecord = {
  tagName: string;
  compatibility: string;
  validationErrors: number;
  validationWarnings: number;
  ssrSnapshot?: string;
  snapshotMeta?: HubSnapshotMeta;
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

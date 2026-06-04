/**
 * Registry Hub - Component Detail Page
 *
 * v0.19.0 Phase 2: Per-component detail view with rendered preview,
 * usage example, and compatibility details.
 *
 * Route: /registry/:package/:component
 *
 * Data from hub-data-full.ts at build time - static SSG, no client fetch.
 *
 * @see ADR-0031
 * @see docs/sop/v0.19.0-component-browser.md
 */

export const meta = { section: 'Registry', label: 'Component Detail', order: 6 };

import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import pkgRecords from '../../../data/registry/hub-data.ts';
import type { HubPackageRecord } from '../../../data/registry/hub-data.ts';

// ─── Snapshot Sanitizer ──────────────────────────────────────────────────
// Strip dangerous elements and attributes from snapshot HTML before
// rendering with unsafeHTML. This is the trust boundary for external
// Hub submissions - never render raw third-party HTML without sanitization.

const DANGEROUS_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'link',
  'meta',
  'base',
]);

const DANGEROUS_ATTRS = /^(on\w+|srcdoc|formaction|xlink:href|data-bind|javascript:)/i;
const DANGEROUS_URL = /^\s*(javascript|data|vbscript):/i;

function sanitizeSnapshot(raw: string): string {
  // Remove dangerous self-closing and open tags with their content
  let safe = raw;

  // Remove <script>...</script> and similar dangerous tag pairs
  for (const tag of DANGEROUS_TAGS) {
    const openRe = new RegExp(`<${tag}[\\s>]`, 'gi');
    const closeRe = new RegExp(`</${tag}>`, 'gi');
    safe = safe.replace(openRe, '&lt;blocked&gt;');
    safe = safe.replace(closeRe, '&lt;/blocked&gt;');
  }

  // Remove dangerous attributes from all remaining tags
  safe = safe.replace(
    /<([a-z][a-z0-9-]*)((?:\s+[^>]*?)?)>/gi,
    (_match: string, tagName: string, attrs: string) => {
      // Filter out dangerous attributes
      const cleanAttrs = attrs.replace(
        /\s+([a-z][a-z0-9:-]*)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi,
        (attrMatch: string, attrName: string) => {
          if (DANGEROUS_ATTRS.test(attrName)) return '';
          // Check for javascript: URLs in href/src/action
          if (/^(href|src|action)$/i.test(attrName)) {
            const valMatch = attrMatch.match(/=\s*(?:"([^"]*)"|'([^']*)')/);
            if (valMatch) {
              const val = valMatch[1] || valMatch[2] || '';
              if (DANGEROUS_URL.test(val)) return '';
            }
          }
          return attrMatch;
        },
      );
      return `<${tagName}${cleanAttrs}>`;
    },
  );

  return safe;
}

interface ComponentPageParams {
  package: string;
  component: string;
}

export const tagName = 'docs-registry-component-detail';

/** Static paths for SSG - pre-renders all (package, component) pairs */
export function getStaticPaths(): ComponentPageParams[] {
  const paths: ComponentPageParams[] = [];
  const records = pkgRecords as Record<string, HubPackageRecord>;
  for (const [key, record] of Object.entries(records)) {
    const packagePath = key.replace('/', '~');
    for (const tag of record.tags) {
      paths.push({ package: packagePath, component: tag.tagName });
    }
  }
  return paths;
}

const COMPAT_LABELS: Record<string, string> = {
  'ssr-capable': 'SSR Capable',
  'client-only': 'Client Only',
  'rejected': 'Rejected',
  'experimental-dom': 'Experimental DOM',
};

// CSS custom properties for compat colors — used in stylesheet and inline styles
const COMPAT_COLORS: Record<string, string> = {
  'ssr-capable': 'var(--green-6)',
  'client-only': 'var(--orange-6)',
  'rejected': 'var(--red-6)',
  'experimental-dom': 'var(--indigo-5)',
};

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      /* ── Compat color tokens ──────────────────────────── */
      --compat-ssr: #22c55e;
      --compat-client: #f59e0b;
      --compat-rejected: #ef4444;
      --compat-experimental: #8b5cf6;
      --compat-default: #888;

      .detail-header {
        margin-bottom: 2rem;
      }
      .breadcrumb {
        font-size: 0.8125rem;
        color: var(--gray-6);
        margin-bottom: 0.75rem;
      }
      .breadcrumb a {
        color: var(--indigo-5);
        text-decoration: none;
      }
      .breadcrumb a:hover {
        text-decoration: underline;
      }
      .section {
        border: 1px solid var(--gray-3);
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        background: var(--gray-1);
        box-shadow: var(--shadow-1);
      }
      .section-title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .tag-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .tag-name {
        font-size: 1.5rem;
        font-weight: 700;
        font-family: monospace;
        margin: 0;
      }
      .compat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 14px;
        font-size: 0.8125rem;
        font-weight: 600;
      }
      .compat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      /* Preview area */
      .preview-frame {
        border: 1px solid var(--gray-3);
        border-radius: 10px;
        padding: 1.5rem;
        background: var(--gray-0);
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        box-shadow: var(--shadow-1);
      }
      .preview-iframe {
        width: 100%;
        border: none;
        min-height: 80px;
        background: var(--gray-0);
        border-radius: 6px;
      }
      .preview-placeholder {
        color: var(--gray-6);
        font-size: 0.8125rem;
        text-align: center;
      }
      .preview-note {
        font-size: 0.75rem;
        color: var(--gray-6);
        margin-top: 0.5rem;
        text-align: center;
      }
      .preview-label {
        font-size: 0.75rem;
        color: var(--gray-6);
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      /* Usage code block */
      .usage-block {
        background: var(--gray-2);
        border-radius: 6px;
        padding: 1rem;
        font-family: monospace;
        font-size: 0.8125rem;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-x: auto;
        user-select: all;
      }

      .meta-table {
        width: 100%;
        border-collapse: collapse;
      }
      .meta-table th, .meta-table td {
        text-align: left;
        padding: 0.375rem 0.5rem;
        font-size: 0.8125rem;
        border-bottom: 0.5px solid var(--gray-3);
      }
      .meta-table th {
        color: var(--gray-6);
        font-weight: 500;
      }
      .meta-table th:not(:first-child) {
        width: auto;
      }

      .not-found {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--gray-6);
      }

      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
        font-size: 0.8125rem;
        color: var(--indigo-5);
        text-decoration: none;
      }
      .back-link:hover {
        text-decoration: underline;
      }

      /* Migrated inline styles */
      .not-found-link { color: var(--indigo-5); font-size: 0.875rem; }
      .validation-error { color: var(--red-6); font-size: 0.8125rem; }
      .validation-warning { color: var(--orange-6); font-size: 0.8125rem; }
      .preview-full-width { width: 100%; }
      .preview-tag-name { font-size: 0.875rem; margin-bottom: 0.25rem; }
      .client-only-note { margin-top: 0.5rem; font-size: 0.75rem; }
      .usage-hint { margin-bottom: 0.5rem; font-size: 0.8125rem; color: var(--gray-7); }
      .pkg-link { color: var(--indigo-5); }
      .mono-text-sm { font-family: monospace; font-size: 0.8125rem; }
      .meta-muted-sm { font-size: 0.75rem; color: var(--gray-6); }
      .meta-text-sm { font-size: 0.8125rem; }
      .preview-details-text { font-size: 0.8125rem; color: var(--gray-7); line-height: 1.6; }
      .install-hint { margin-bottom: 0.5rem; font-size: 0.8125rem; }
      .install-warnings { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--gray-7); }
      .warning-item { padding: 0.125rem 0; }
      .related-container { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .related-link { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; background: var(--gray-2); border-radius: 4px; font-size: 0.8125rem; font-family: monospace; color: inherit; text-decoration: none; border: 0.5px solid transparent; }
      .related-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
      .text-error { color: var(--red-6); }
      .text-success { color: var(--green-6); }

      /* Compat color classes */
      .compat-dot-ssr-capable { background: var(--green-6); }
      .compat-dot-client-only { background: var(--orange-6); }
      .compat-dot-rejected { background: var(--red-6); }
      .compat-dot-experimental-dom { background: var(--indigo-5); }
      .compat-dot-default { background: var(--gray-6); }

      .compat-badge-ssr-capable { background: color-mix(in srgb, var(--green-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--green-6) 25%, transparent); }
      .compat-badge-client-only { background: color-mix(in srgb, var(--orange-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--orange-6) 25%, transparent); }
      .compat-badge-rejected { background: color-mix(in srgb, var(--red-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--red-6) 25%, transparent); }
      .compat-badge-experimental-dom { background: color-mix(in srgb, var(--indigo-5) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--indigo-5) 25%, transparent); }
      .compat-badge-default { background: color-mix(in srgb, var(--gray-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--gray-6) 25%, transparent); }

      .compat-badge-sm-ssr-capable { background: color-mix(in srgb, var(--green-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--green-6) 25%, transparent); font-size: 0.75rem; }
      .compat-badge-sm-client-only { background: color-mix(in srgb, var(--orange-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--orange-6) 25%, transparent); font-size: 0.75rem; }
      .compat-badge-sm-rejected { background: color-mix(in srgb, var(--red-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--red-6) 25%, transparent); font-size: 0.75rem; }
      .compat-badge-sm-experimental-dom { background: color-mix(in srgb, var(--indigo-5) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--indigo-5) 25%, transparent); font-size: 0.75rem; }
      .compat-badge-sm-default { background: color-mix(in srgb, var(--gray-6) 8%, transparent); border: 0.5px solid color-mix(in srgb, var(--gray-6) 25%, transparent); font-size: 0.75rem; }
    `);

export default class DocsRegistryComponentDetail extends DsdElement {
  /** Route parameter: "package" */
  package = '';
  /** Route parameter: "component" */
  component = '';

  private _record: HubPackageRecord | null = null;

  static override styles = [openPropsTokenSheet, routeSheet];

  constructor() {
    super();
  }

  /** Lazy-load record from hub data */
  private _getRecord(): HubPackageRecord | null {
    if (this._record !== null) return this._record;
    if (!this.package) return null;
    const decodedName = this.package.replace('~', '/');
    this._record = (pkgRecords as Record<string, HubPackageRecord>)[decodedName] || null;
    return this._record;
  }

  /** Find specific tag record within package */
  private _getTag(record: HubPackageRecord) {
    return record.tags.find((t) => t.tagName === this.component) || null;
  }

  /** Build a usage code snippet for the component */
  private _buildUsageSnippet(
    tagName: string,
    record: HubPackageRecord,
  ): string {
    const fullName = record.scope ? `${record.scope}/${record.name}` : record.name;
    const lines: string[] = [];

    if (record.source === 'npm') {
      lines.push(`import '${fullName}';`);
    } else if (record.source === 'jsr') {
      lines.push(`import 'jsr:${fullName}';`);
    } else {
      lines.push(`import '${fullName}';`);
    }

    lines.push('');
    lines.push(`// Use <${tagName}> in any LessJS page template`);
    lines.push(`<${tagName}></${tagName}>`);

    if (!record.installGuidance.ssrCapable) {
      lines.push('');
      lines.push('// This component is client-only. If SSR-rendering,');
      lines.push('// wrap it in a client-only island or use client:only.');
    }

    return lines.join('\n');
  }

  /** Build iframe srcdoc from HubSnapshotMeta (ADR-0035 A3) */
  private _buildSrcdoc(
    meta: {
      tagName: string;
      importUrl: string;
      importSpec: string;
      demoAttrs: Record<string, string>;
      demoSlots: string;
      themeCssUrl?: string;
    },
  ): string {
    const attrs = Object.entries(meta.demoAttrs)
      .map(([k, v]) => v === '' ? k : `${k}="${v}"`)
      .join(' ');
    const attrStr = attrs ? ` ${attrs}` : '';
    const themeLink = meta.themeCssUrl ? `<link rel="stylesheet" href="${meta.themeCssUrl}">` : '';
    // LessJS UI components need design token CSS injected inline because their
    // styles reference CSS custom properties (--bg-card, --border, etc.)
    // that are normally declared on :root by lessRootColorCSS. In the iframe
    // there is no LessJS runtime, so we inline the light-theme tokens directly.
    const lessThemeCss = meta.importSpec === '@openelement/ui'
      ? '<style>:root{--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-2:#e9ecef;--gray-3:#dee2e6;--gray-4:#ced4da;--gray-5:#adb5bd;--gray-6:#868e96;--gray-7:#495057;--gray-8:#343a40;--gray-9:#212529;--gray-10:#16191d;--gray-11:#0d0f12;--gray-12:#030507;--indigo-5:#5c7cfa;--indigo-6:#4c6ef5;--indigo-1:#dbe4ff;--green-6:#40c057;--red-6:#fa5252;--orange-6:#fd7e14;color-scheme:light}</style>'
      : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${themeLink}${lessThemeCss}<script type="module" src="${meta.importUrl}"></script><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;padding:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;color:var(--gray-12);background:var(--gray-0);overflow:hidden}</style></head><body><${meta.tagName}${attrStr}>${meta.demoSlots}</${meta.tagName}></body></html>`;
  }

  override render() {
    const pkg = this._getRecord();

    // Build breadcrumb package display name
    const fullPkgName = pkg
      ? (pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name)
      : this.package?.replace('~', '/') || 'unknown';

    if (!pkg) {
      return (
        
          <div class='container'>
            <div class='not-found'>
              <h2>Component Not Found</h2>
              <p>"{fullPkgName}" is not in the registry.</p>
              <a href='/registry' class='not-found-link'>
                ← Back to Registry
              </a>
            </div>
          </div>
        
      );
    }

    const tag = this._getTag(pkg);
    const tagName = this.component || 'unknown';

    if (!tag) {
      return (
        
          <div class='container'>
            <div class='not-found'>
              <h2>Component Not Found</h2>
              <p>
                "{'<'}
                {tagName}
                {'>'}" is not in the {fullPkgName} package.
              </p>
              <a href='/registry' class='not-found-link'>
                ← Back to Registry
              </a>
            </div>
          </div>
        
      );
    }

    const compatSuffix = COMPAT_COLORS[tag.compatibility] ? tag.compatibility : 'default';
    const compatLabel = COMPAT_LABELS[tag.compatibility] || tag.compatibility;
    const hasSnapshot = !!tag.ssrSnapshot;

    // Count other components in the same package for "related" links
    const relatedComponents = pkg.tags
      .filter((t) => t.tagName !== tagName)
      .slice(0, 6);

    const usageSnippet = this._buildUsageSnippet(tagName, pkg);

    return (
      
        <div class='container'>
          <a class='back-link' href={`/registry/${this.package}`}>
            ← Back to {fullPkgName}
          </a>
          <div class='breadcrumb'>
            <a href='/registry'>Registry</a> /{' '}
            <a href={`/registry/${this.package}`}>{fullPkgName}</a> / <span>{tagName}</span>
          </div>

          {/* Header */}
          <div class='detail-header'>
            <div class='tag-header'>
              <h1 class='tag-name'>{'<'}{tagName}{'>'}</h1>
              <span class={`compat-badge compat-badge-${compatSuffix}`}>
                <span class={`compat-dot compat-dot-${compatSuffix}`}></span>
                {compatLabel}
              </span>
              {tag.validationErrors > 0
                ? (
                  <span class='validation-error'>
                    {tag.validationErrors} error(s)
                  </span>
                )
                : null}
              {tag.validationWarnings > 0
                ? (
                  <span class='validation-warning'>
                    {tag.validationWarnings} warning(s)
                  </span>
                )
                : null}
            </div>
          </div>

          {/* Preview */}
          <div class='section'>
            <div class='section-title'>Rendered Preview</div>
            <div class='preview-label'>Pre-rendered at build time</div>
            <div class='preview-frame'>
              {tag.snapshotMeta
                ? (
                  <iframe
                    class='preview-iframe'
                    data-srcdoc={btoa(this._buildSrcdoc(tag.snapshotMeta))}
                  >
                  </iframe>
                )
                : hasSnapshot
                ? (
                  <div
                    class='preview-full-width'
                    innerHTML={sanitizeSnapshot(tag.ssrSnapshot)}
                    trustedHtml={true}
                  >
                  </div>
                )
                : (
                  <div class='preview-placeholder'>
                    <div class='preview-tag-name'>
                      {'<'}
                      {tagName}
                      {'>'}
                    </div>
                    <div>No preview snapshot available.</div>
                    {tag.compatibility === 'client-only'
                      ? (
                        <div class='client-only-note'>
                          Client-only components require a browser to render.
                        </div>
                      )
                      : null}
                  </div>
                )}
            </div>
            <div class='preview-note'>
              {tag.compatibility === 'ssr-capable'
                ? 'SSR-rendered. This component is rendered at build time and available immediately.'
                : 'Client-only. This component renders in the browser after JavaScript loads.'}
            </div>
          </div>

          {/* Usage */}
          <div class='section'>
            <div class='section-title'>Usage</div>
            <div class='usage-hint'>
              Copy the code below into your LessJS route file.
            </div>
            <div class='usage-block'>{usageSnippet}</div>
          </div>

          {/* Compatibility */}
          <div class='section'>
            <div class='section-title'>Compatibility</div>
            <table class='meta-table'>
              <tr>
                <th>Package</th>
                <td>
                  <a href={`/registry/${this.package}`} class='pkg-link'>
                    {fullPkgName}
                  </a>
                </td>
              </tr>
              <tr>
                <th>Version</th>
                <td>v{pkg.version}</td>
              </tr>
              <tr>
                <th>Tag</th>
                <td class='mono-text-sm'>{tagName}</td>
              </tr>
              <tr>
                <th>Tier</th>
                <td>
                  <span
                    class={`compat-badge compat-badge-sm-${compatSuffix}`}
                  >
                    <span class={`compat-dot compat-dot-${compatSuffix}`}></span>
                    {compatLabel}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Errors</th>
                <td class={tag.validationErrors > 0 ? 'text-error' : 'text-success'}>
                  {tag.validationErrors}
                </td>
              </tr>
              <tr>
                <th>Warnings</th>
                <td class={tag.validationWarnings > 0 ? 'validation-warning' : 'text-success'}>
                  {tag.validationWarnings}
                </td>
              </tr>
              <tr>
                <th>Source</th>
                <td>{pkg.source}</td>
              </tr>
              <tr>
                <th>Validator</th>
                <td>@openelement/core v{pkg.validatorVersion}</td>
              </tr>
            </table>
          </div>

          {/* Snapshot info (when available) */}
          {hasSnapshot
            ? (
              <div class='section'>
                <div class='section-title'>Preview Details</div>
                <div class='preview-details-text'>
                  This preview was generated during package validation and stored as a static HTML
                  snapshot. The snapshot is pre-rendered at build time - no client-side rendering
                  needed.
                </div>
              </div>
            )
            : null}

          {/* API Reference (from CEM) */}
          {tag.attributes && tag.attributes.length > 0
            ? (
              <div class='section'>
                <div class='section-title'>Attributes</div>
                <table class='meta-table'>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                  {tag.attributes.map((a) => (
                    <tr>
                      <td class='mono-text-sm'>{a.name}</td>
                      <td class='meta-muted-sm'>
                        {a.type || '-'}
                      </td>
                      <td class='meta-muted-sm'>
                        {a.default || '-'}
                      </td>
                      <td class='meta-text-sm'>{a.description || ''}</td>
                    </tr>
                  ))}
                </table>
              </div>
            )
            : null}

          {/* Events */}
          {tag.events && tag.events.length > 0
            ? (
              <div class='section'>
                <div class='section-title'>Events</div>
                <table class='meta-table'>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                  {tag.events.map((e) => (
                    <tr>
                      <td class='mono-text-sm'>{e.name}</td>
                      <td class='meta-muted-sm'>
                        {e.type || '-'}
                      </td>
                      <td class='meta-text-sm'>{e.description || ''}</td>
                    </tr>
                  ))}
                </table>
              </div>
            )
            : null}

          {/* Slots */}
          {tag.slots && tag.slots.length > 0
            ? (
              <div class='section'>
                <div class='section-title'>Slots</div>
                <table class='meta-table'>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                  {tag.slots.map((s) => (
                    <tr>
                      <td class='mono-text-sm'>
                        {s.name || '(default)'}
                      </td>
                      <td class='meta-text-sm'>{s.description || ''}</td>
                    </tr>
                  ))}
                </table>
              </div>
            )
            : null}

          {/* Install */}
          <div class='section'>
            <div class='section-title'>Install</div>
            <div class='install-hint'>
              To use this component in your project:
            </div>
            <div class='usage-block'>less add {fullPkgName}</div>
            {pkg.installGuidance.warnings.length > 0
              ? (
                <div class='install-warnings'>
                  {pkg.installGuidance.warnings.map((w) => (
                    <div class='warning-item'>⚠ {w}</div>
                  ))}
                </div>
              )
              : null}
          </div>

          {/* Related components in the same package */}
          {relatedComponents.length > 0
            ? (
              <div class='section'>
                <div class='section-title'>Other Components in {fullPkgName}</div>
                <div class='related-container'>
                  {relatedComponents.map((t) => (
                    <a
                      href={`/registry/${this.package}/${t.tagName}`}
                      class='related-link'
                    >
                      <span class={`related-dot compat-dot-${COMPAT_COLORS[t.compatibility] ? t.compatibility : 'default'}`}>
                      </span>
                      {t.tagName}
                    </a>
                  ))}
                </div>
              </div>
            )
            : null}
        </div>
      
    );
  }
}

customElements.define(tagName, DocsRegistryComponentDetail);

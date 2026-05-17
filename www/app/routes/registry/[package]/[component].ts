/**
 * Registry Hub — Component Detail Page
 *
 * v0.19.0 Phase 2: Per-component detail view with rendered preview,
 * usage example, and compatibility details.
 *
 * Route: /registry/:package/:component
 *
 * Data from hub-data-full.ts at build time — static SSG, no client fetch.
 *
 * @see ADR-0031
 * @see docs/sop/v0.19.0-component-browser.md
 */

export const meta = { section: 'Registry', label: 'Component Detail', order: 6 };

import { css, html, LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import pkgRecords from '../_hub-data-full.ts';
import type { HubPackageRecord } from '../_hub-data-full.ts';

interface ComponentPageParams {
  package: string;
  component: string;
}

export const tagName = 'docs-registry-component-detail';

/** Static paths for SSG — pre-renders all (package, component) pairs */
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

const COMPAT_COLORS: Record<string, string> = {
  'ssr-capable': '#22c55e',
  'client-only': '#f59e0b',
  'rejected': '#ef4444',
  'experimental-dom': '#8b5cf6',
};

export default class DocsRegistryComponentDetail extends LitElement {
  /** Route parameter: "package" */
  package = '';
  /** Route parameter: "component" */
  component = '';

  private _record: HubPackageRecord | null = null;

  static override properties = {
    package: { type: String },
    component: { type: String },
  };

  static override styles = [
    pageStyles,
    css`
      .detail-header { margin-bottom: 2rem; }
      .breadcrumb { font-size: 0.8125rem; color: var(--less-text-tertiary); margin-bottom: 0.75rem; }
      .breadcrumb a { color: var(--less-accent); text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .section { border: 0.5px solid var(--less-border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; background: var(--less-bg-surface); }
      .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }

      .tag-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
      .tag-name { font-size: 1.5rem; font-weight: 700; font-family: monospace; margin: 0; }
      .compat-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 14px; font-size: 0.8125rem; font-weight: 600; }
      .compat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

      /* Preview area */
      .preview-frame {
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        padding: 1.5rem;
        background: #fff;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
      }
      .preview-placeholder {
        color: var(--less-text-tertiary);
        font-size: 0.8125rem;
        text-align: center;
      }
      .preview-note {
        font-size: 0.75rem;
        color: var(--less-text-tertiary);
        margin-top: 0.5rem;
        text-align: center;
      }
      .preview-label {
        font-size: 0.75rem;
        color: var(--less-text-tertiary);
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      /* Usage code block */
      .usage-block {
        background: var(--less-bg-code);
        border-radius: 6px;
        padding: 1rem;
        font-family: monospace;
        font-size: 0.8125rem;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-x: auto;
        user-select: all;
      }

      .meta-table { width: 100%; border-collapse: collapse; }
      .meta-table th, .meta-table td { text-align: left; padding: 0.375rem 0.5rem; font-size: 0.8125rem; border-bottom: 0.5px solid var(--less-border); }
      .meta-table th { color: var(--less-text-tertiary); font-weight: 500; }
      .meta-table th:not(:first-child) { width: auto; }

      .not-found { text-align: center; padding: 3rem 1rem; color: var(--less-text-tertiary); }

      .back-link {
        display: inline-block;
        margin-bottom: 1rem;
        font-size: 0.8125rem;
        color: var(--less-accent);
        text-decoration: none;
      }
      .back-link:hover { text-decoration: underline; }
    `,
  ];

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

  override render() {
    const pkg = this._getRecord();

    // Build breadcrumb package display name
    const fullPkgName = pkg
      ? (pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name)
      : this.package?.replace('~', '/') || 'unknown';
    const pkgRoute = this.package?.replace('~', '/') || '';

    if (!pkg) {
      return html`
        <less-layout .navItems="${navSections}" .headerNav="${headerNav}" current-path="/registry/${pkgRoute}" locale="en" .locales="${['en', 'zh']}">
          <div class="container">
            <div class="not-found">
              <h2>Component Not Found</h2>
              <p>"${fullPkgName}" is not in the registry.</p>
              <a href="/registry" style="color:var(--less-accent);font-size:0.875rem;">← Back to Registry</a>
            </div>
          </div>
        </less-layout>
      `;
    }

    const tag = this._getTag(pkg);
    const tagName = this.component || 'unknown';

    if (!tag) {
      return html`
        <less-layout .navItems="${navSections}" .headerNav="${headerNav}" current-path="/registry/${pkgRoute}" locale="en" .locales="${['en', 'zh']}">
          <div class="container">
            <div class="not-found">
              <h2>Component Not Found</h2>
              <p>"&lt;${tagName}&gt;" is not in the ${fullPkgName} package.</p>
              <a href="/registry" style="color:var(--less-accent);font-size:0.875rem;">← Back to Registry</a>
            </div>
          </div>
        </less-layout>
      `;
    }

    const compatColor = COMPAT_COLORS[tag.compatibility] || '#888';
    const compatLabel = COMPAT_LABELS[tag.compatibility] || tag.compatibility;
    const hasSnapshot = !!tag.ssrSnapshot;

    // Count other components in the same package for "related" links
    const relatedComponents = pkg.tags
      .filter((t) => t.tagName !== tagName)
      .slice(0, 6);

    const usageSnippet = this._buildUsageSnippet(tagName, pkg);

    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" current-path="/registry/${pkgRoute}" locale="en" .locales="${['en', 'zh']}">
        <div class="container">
          <a class="back-link" href="/registry/${this.package}">← Back to ${fullPkgName}</a>
          <div class="breadcrumb">
            <a href="/registry">Registry</a> /
            <a href="/registry/${this.package}">${fullPkgName}</a> /
            <span>${tagName}</span>
          </div>

          <!-- Header -->
          <div class="detail-header">
            <div class="tag-header">
              <h1 class="tag-name">&lt;${tagName}&gt;</h1>
              <span class="compat-badge" style="background:${compatColor}15;border:0.5px solid ${compatColor}40;">
                <span class="compat-dot" style="background:${compatColor}"></span>${compatLabel}
              </span>
              ${tag.validationErrors > 0 ? html`<span style="color:#ef4444;font-size:0.8125rem;">${tag.validationErrors} error(s)</span>` : ''}
              ${tag.validationWarnings > 0 ? html`<span style="color:#f59e0b;font-size:0.8125rem;">${tag.validationWarnings} warning(s)</span>` : ''}
            </div>
          </div>

          <!-- Preview -->
          <div class="section">
            <div class="section-title">Rendered Preview</div>
            <div class="preview-label">Pre-rendered at build time</div>
            <div class="preview-frame">
              ${hasSnapshot ? html`
                <div style="width:100%;">${unsafeHTML(tag.ssrSnapshot)}</div>
              ` : html`
                <div class="preview-placeholder">
                  <div style="font-size:0.875rem;margin-bottom:0.25rem;">&lt;${tagName}&gt;</div>
                  <div>No preview snapshot available.</div>
                  ${tag.compatibility === 'client-only'
                    ? html`<div style="margin-top:0.5rem;font-size:0.75rem;">Client-only components require a browser to render.</div>`
                    : ''}
                </div>
              `}
            </div>
            <div class="preview-note">
              ${tag.compatibility === 'ssr-capable'
                ? 'SSR-rendered. This component is rendered at build time and available immediately.'
                : 'Client-only. This component renders in the browser after JavaScript loads.'}
            </div>
          </div>

          <!-- Usage -->
          <div class="section">
            <div class="section-title">Usage</div>
            <div style="margin-bottom:0.5rem;font-size:0.8125rem;color:var(--less-text-secondary);">
              Copy the code below into your LessJS route file.
            </div>
            <div class="usage-block">${usageSnippet}</div>
          </div>

          <!-- Compatibility -->
          <div class="section">
            <div class="section-title">Compatibility</div>
            <table class="meta-table">
              <tr><th>Package</th><td><a href="/registry/${this.package}" style="color:var(--less-accent);">${fullPkgName}</a></td></tr>
              <tr><th>Version</th><td>v${pkg.version}</td></tr>
              <tr><th>Tag</th><td style="font-family:monospace;">${tagName}</td></tr>
              <tr><th>Tier</th><td><span class="compat-badge" style="background:${compatColor}15;border:0.5px solid ${compatColor}40;font-size:0.75rem;"><span class="compat-dot" style="background:${compatColor}"></span>${compatLabel}</span></td></tr>
              <tr><th>Errors</th><td style="color:${tag.validationErrors > 0 ? '#ef4444' : '#22c55e'};">${tag.validationErrors}</td></tr>
              <tr><th>Warnings</th><td style="color:${tag.validationWarnings > 0 ? '#f59e0b' : '#22c55e'};">${tag.validationWarnings}</td></tr>
              <tr><th>Source</th><td>${pkg.source}</td></tr>
              <tr><th>Validator</th><td>@lessjs/core v${pkg.validatorVersion}</td></tr>
            </table>
          </div>

          <!-- Snapshot info (when available) -->
          ${hasSnapshot ? html`
          <div class="section">
            <div class="section-title">Preview Details</div>
            <div style="font-size:0.8125rem;color:var(--less-text-secondary);line-height:1.6;">
              This preview was generated during package validation and stored as a static HTML snapshot.
              The snapshot is pre-rendered at build time — no client-side rendering needed.
            </div>
          </div>
          ` : ''}

          <!-- API Reference (from CEM) -->
          ${tag.attributes && tag.attributes.length > 0 ? html`
          <div class="section">
            <div class="section-title">Attributes</div>
            <table class="meta-table">
              <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
              ${tag.attributes.map(a => html`
                <tr>
                  <td style="font-family:monospace;font-size:0.8125rem;">${a.name}</td>
                  <td style="font-size:0.75rem;color:var(--less-text-tertiary);">${a.type || '—'}</td>
                  <td style="font-size:0.75rem;color:var(--less-text-tertiary);">${a.default || '—'}</td>
                  <td style="font-size:0.8125rem;">${a.description || ''}</td>
                </tr>
              `)}
            </table>
          </div>
          ` : ''}

          ${tag.events && tag.events.length > 0 ? html`
          <div class="section">
            <div class="section-title">Events</div>
            <table class="meta-table">
              <tr><th>Name</th><th>Type</th><th>Description</th></tr>
              ${tag.events.map(e => html`
                <tr>
                  <td style="font-family:monospace;font-size:0.8125rem;">${e.name}</td>
                  <td style="font-size:0.75rem;color:var(--less-text-tertiary);">${e.type || '—'}</td>
                  <td style="font-size:0.8125rem;">${e.description || ''}</td>
                </tr>
              `)}
            </table>
          </div>
          ` : ''}

          ${tag.slots && tag.slots.length > 0 ? html`
          <div class="section">
            <div class="section-title">Slots</div>
            <table class="meta-table">
              <tr><th>Name</th><th>Description</th></tr>
              ${tag.slots.map(s => html`
                <tr>
                  <td style="font-family:monospace;font-size:0.8125rem;">${s.name || '(default)'}</td>
                  <td style="font-size:0.8125rem;">${s.description || ''}</td>
                </tr>
              `)}
            </table>
          </div>
          ` : ''}

          <!-- Install -->
          <div class="section">
            <div class="section-title">Install</div>
            <div style="margin-bottom:0.5rem;font-size:0.8125rem;">
              To use this component in your project:
            </div>
            <div class="usage-block">less add ${fullPkgName}</div>
            ${pkg.installGuidance.warnings.length > 0 ? html`
              <div style="margin-top:0.75rem;font-size:0.8125rem;color:var(--less-text-secondary);">
                ${pkg.installGuidance.warnings.map(w => html`<div style="padding:0.125rem 0;">⚠ ${w}</div>`)}
              </div>
            ` : ''}
          </div>

          <!-- Related components in the same package -->
          ${relatedComponents.length > 0 ? html`
          <div class="section">
            <div class="section-title">Other Components in ${fullPkgName}</div>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${relatedComponents.map(t => html`
                <a href="/registry/${this.package}/${t.tagName}"
                   style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.625rem;background:var(--less-bg-code);border-radius:4px;font-size:0.8125rem;font-family:monospace;color:inherit;text-decoration:none;border:0.5px solid transparent;">
                  <span style="width:6px;height:6px;border-radius:50%;display:inline-block;background:${COMPAT_COLORS[t.compatibility] || '#888'}"></span>
                  ${t.tagName}
                </a>
              `)}
            </div>
          </div>
          ` : ''}
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, DocsRegistryComponentDetail);

/**
 * Registry Hub — Package Detail Page
 *
 * v0.19.0: Detailed view of a Hub package with compatibility evidence,
 * tags, install guidance, and snapshot previews.
 *
 * Route parameter: [package] — e.g. /registry/@shoelace-style~shoelace
 * Scoped packages (e.g. @lessjs/ui) use ~ as separator in the URL
 * and are decoded by the connectedCallback.
 *
 * Data is fetched client-side from /hub/packages/*.json.
 * SSR renders a loading state, then client hydrates with real data.
 *
 * @see docs/sop/v0.19.0-platform-hub.md
 * @see ADR-0030
 */

import { css, html, LitElement } from 'lit';
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

// ─── Types ────────────────────────────────────────────────────────────────

interface HubTagRecord {
  tagName: string;
  compatibility: string;
  validationErrors: number;
  validationWarnings: number;
  ssrSnapshot?: string;
}

interface HubInstallGuidance {
  safeToInstall: boolean;
  command: string;
  configChanges: string[];
  warnings: string[];
  ssrCapable: boolean;
}

interface HubPackageRecord {
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
}

export const tagName = 'docs-registry-detail';

/** Static paths for SSG — reads hub-index to pre-render all package detail pages */
export function getStaticPaths(): Array<Record<string, string>> {
  try {
    const cwd = Deno.cwd(); // www/ during SSG build
    const indexPath = `${cwd}/public/hub/index.json`;
    const content = Deno.readTextFileSync(indexPath);
    const index = JSON.parse(content) as { packages: Array<{ name: string; scope: string }> };
    return index.packages.map((pkg) => ({
      package: pkg.scope ? `${pkg.scope}/${pkg.name}`.replace('/', '~') : pkg.name,
    }));
  } catch {
    return [];
  }
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

export default class DocsRegistryDetail extends LitElement {
  declare packageName: string;
  private _record: HubPackageRecord | null = null;
  private _loading = true;
  private _error = '';
  private _showValidation = false;

  static override properties = {
    packageName: { type: String },
  };

  static override styles = [
    pageStyles,
    css`
      .detail-header { margin-bottom: 2rem; }
      .breadcrumb { font-size: 0.8125rem; color: var(--less-text-tertiary); margin-bottom: 0.75rem; }
      .breadcrumb a { color: var(--less-accent); text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .pkg-title { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin: 0 0 0.5rem; }
      .pkg-title h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
      .pkg-title code { font-size: 1.25rem; background: var(--less-bg-code); padding: 0.125rem 0.5rem; border-radius: 4px; }
      .compat-badge-lg { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 14px; font-size: 0.8125rem; font-weight: 600; }
      .compat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .pkg-desc { font-size: 0.9375rem; color: var(--less-text-secondary); line-height: 1.6; margin: 0 0 0.75rem; max-width: 640px; }
      .pkg-links { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; font-size: 0.8125rem; }
      .pkg-links a { color: var(--less-accent); text-decoration: none; }
      .pkg-links a:hover { text-decoration: underline; }
      .section { border: 0.5px solid var(--less-border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; background: var(--less-bg-surface); }
      .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
      .install-box { padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem; }
      .install-safe { background: rgba(34, 197, 94, 0.08); border: 0.5px solid rgba(34, 197, 94, 0.2); }
      .install-unsafe { background: rgba(239, 68, 68, 0.08); border: 0.5px solid rgba(239, 68, 68, 0.2); }
      .install-cmd { font-family: monospace; background: var(--less-bg-code); padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.875rem; margin: 0.5rem 0; user-select: all; }
      .warning-list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
      .warning-list li { font-size: 0.8125rem; padding: 0.25rem 0; padding-left: 1.25rem; position: relative; color: var(--less-text-secondary); }
      .warning-list li::before { content: '⚠️'; position: absolute; left: 0; }
      .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .tag-item { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; background: var(--less-bg-code); border-radius: 4px; font-size: 0.8125rem; font-family: monospace; }
      .tag-status { width: 6px; height: 6px; border-radius: 50%; }
      .meta-table { width: 100%; border-collapse: collapse; }
      .meta-table th, .meta-table td { text-align: left; padding: 0.375rem 0.5rem; font-size: 0.8125rem; border-bottom: 0.5px solid var(--less-border); }
      .meta-table th { width: 140px; color: var(--less-text-tertiary); font-weight: 500; }
      .snapshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
      .snapshot-card { border: 0.5px solid var(--less-border); border-radius: 6px; overflow: hidden; }
      .snapshot-header { padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 600; background: var(--less-bg-code); border-bottom: 0.5px solid var(--less-border); font-family: monospace; }
      .snapshot-body { padding: 1rem; font-size: 0.75rem; color: var(--less-text-secondary); text-align: center; }
      .no-snapshot { padding: 2rem; text-align: center; color: var(--less-text-tertiary); font-size: 0.875rem; }
      .accordion-toggle { background: none; border: none; color: var(--less-accent); cursor: pointer; font-size: 0.8125rem; padding: 0.25rem 0; }
      .accordion-toggle:hover { text-decoration: underline; }
      .accordion-content { margin-top: 0.75rem; padding: 0.75rem; background: var(--less-bg-code); border-radius: 4px; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; max-height: 400px; overflow: auto; }
      .loading-state, .error-state { text-align: center; padding: 3rem 1rem; color: var(--less-text-tertiary); }
    `,
  ];

  override connectedCallback() {
    super.connectedCallback();
    this._loadData();
  }

  private async _loadData() {
    if (!this.packageName) return;

    // Decode scoped package names: ~ → /
    const pkgPath = this.packageName.replace('~', '/');

    try {
      const res = await fetch(`/hub/packages/${pkgPath}.json`);
      if (!res.ok) throw new Error(`Package not found (${res.status})`);
      this._record = await res.json() as HubPackageRecord;
    } catch (e) {
      this._error = `Could not load package: ${e}`;
    }

    this._loading = false;
    this.requestUpdate();
  }

  private _toggleValidation() {
    this._showValidation = !this._showValidation;
    this.requestUpdate();
  }

  private _formatJson(json: string): string {
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
  }

  override render() {
    if (this._loading) {
      return html`
        <less-layout .navItems="${navSections}" .headerNav="${headerNav}" current-path="/registry/${this.packageName}" locale="en" .locales="${['en', 'zh']}">
          <div class="container"><div class="loading-state">Loading package details...</div></div>
        </less-layout>
      `;
    }

    if (this._error || !this._record) {
      const fullName = this.packageName?.replace('~', '/') || 'unknown';
      return html`
        <less-layout .navItems="${navSections}" .headerNav="${headerNav}" current-path="/registry/${this.packageName}" locale="en" .locales="${['en', 'zh']}">
          <div class="container">
            <div class="error-state">
              <h2>Package Not Found</h2>
              <p>${this._error || `The package "${fullName}" is not in the registry.`}</p>
              <a href="/registry" style="color:var(--less-accent);font-size:0.875rem;">← Back to Registry</a>
            </div>
          </div>
        </less-layout>
      `;
    }

    const pkg = this._record;
    const fullName = pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
    const compatColor = COMPAT_COLORS[pkg.compatibility] || '#888';
    const compatLabel = COMPAT_LABELS[pkg.compatibility] || pkg.compatibility;
    const hasSnapshots = Object.keys(pkg.snapshotPaths).length > 0;

    return html`
      <less-layout
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/registry/${fullName}"
        locale="en"
        .locales="${['en', 'zh']}"
      >
        <div class="container">
          <div class="breadcrumb"><a href="/registry">Registry</a> / <span>${fullName}</span></div>

          <div class="detail-header">
            <div class="pkg-title">
              <code>${fullName}</code>
              <span style="font-size:1rem;color:var(--less-text-tertiary);">v${pkg.version}</span>
              <span class="compat-badge-lg" style="background:${compatColor}15;border:0.5px solid ${compatColor}40;">
                <span class="compat-dot" style="background:${compatColor}"></span>${compatLabel}
              </span>
            </div>
            ${pkg.description ? html`<p class="pkg-desc">${pkg.description}</p>` : ''}
            <div class="pkg-links">
              ${pkg.repository ? html`<a href="${pkg.repository}" target="_blank">Repository →</a>` : ''}
              ${pkg.homepage ? html`<a href="${pkg.homepage}" target="_blank">Homepage →</a>` : ''}
              <span>Source: ${pkg.source}</span>
              <span>Validated: ${new Date(pkg.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📦 Install</div>
            <div class="install-box ${pkg.installGuidance.safeToInstall ? 'install-safe' : 'install-unsafe'}">
              <div style="font-weight:600;font-size:0.875rem;margin-bottom:0.25rem;">
                ${pkg.installGuidance.safeToInstall ? '✅ Safe to install' : '❌ Not installable'}
              </div>
              <div style="font-size:0.8125rem;color:var(--less-text-secondary);margin-bottom:0.5rem;">
                ${pkg.installGuidance.ssrCapable ? 'SSR-capable. Server-rendered.' : 'Client-only rendering.'}
              </div>
              <div class="install-cmd">${pkg.installGuidance.command}</div>
              ${pkg.installGuidance.configChanges.length > 0 ? html`
                <div style="font-size:0.8125rem;color:var(--less-text-secondary);margin-top:0.5rem;">
                  <strong>Config changes:</strong>
                  <ul style="margin:0.25rem 0 0;padding-left:1.25rem;">
                    ${pkg.installGuidance.configChanges.map(c => html`<li style="font-size:0.75rem;">${c}</li>`)}
                  </ul>
                </div>
              ` : ''}
              ${pkg.installGuidance.warnings.length > 0 ? html`
                <ul class="warning-list">${pkg.installGuidance.warnings.map(w => html`<li>${w}</li>`)}</ul>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔍 Compatibility</div>
            <div style="margin-bottom:0.75rem;">
              <span class="compat-badge-lg" style="background:${compatColor}15;border:0.5px solid ${compatColor}40;">
                <span class="compat-dot" style="background:${compatColor}"></span>${compatLabel}
              </span>
            </div>
            <p style="font-size:0.875rem;color:var(--less-text-secondary);margin:0 0 0.75rem;line-height:1.6;">${pkg.compatibilityJustification}</p>
            <table class="meta-table">
              <tr><th>Validator</th><td>@lessjs/core v${pkg.validatorVersion}</td></tr>
              <tr><th>Manifest hash</th><td style="font-family:monospace;font-size:0.75rem;">${pkg.manifestHash}</td></tr>
              <tr><th>Submitted by</th><td>${pkg.submittedBy || '—'}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">🏷️ Components (${pkg.tags.length})</div>
            <div class="tag-list">
              ${pkg.tags.map(tag => {
                const tagColor = tag.validationErrors > 0 ? '#ef4444' : tag.compatibility === 'ssr-capable' ? '#22c55e' : '#f59e0b';
                return html`
                  <div class="tag-item">
                    <span class="tag-status" style="background:${tagColor}"></span>
                    &lt;${tag.tagName}&gt;
                    ${tag.validationErrors > 0 ? html`<span style="color:#ef4444;font-size:0.6875rem;">(${tag.validationErrors} err)</span>` : ''}
                    ${tag.validationWarnings > 0 ? html`<span style="color:#f59e0b;font-size:0.6875rem;">(${tag.validationWarnings} warn)</span>` : ''}
                  </div>
                `;
              })}
            </div>
          </div>

          <div class="section">
            <div class="section-title">🖼️ Previews</div>
            ${hasSnapshots ? html`
              <div class="snapshot-grid">
                ${Object.entries(pkg.snapshotPaths).map(([tagName]) => html`
                  <div class="snapshot-card">
                    <div class="snapshot-header">&lt;${tagName}&gt;</div>
                    <div class="snapshot-body">SSR snapshot available.</div>
                  </div>
                `)}
              </div>
            ` : html`
              <div class="no-snapshot">
                ${pkg.compatibility === 'ssr-capable' ? 'No SSR snapshots generated.'
                  : pkg.compatibility === 'client-only' ? 'Client-only package — no SSR preview.'
                  : pkg.compatibility === 'rejected' ? 'Rejected — no preview.'
                  : ''}
              </div>
            `}
          </div>

          <div class="section">
            <div class="section-title">📋 Validation Report</div>
            <button class="accordion-toggle" @click="${this._toggleValidation}">
              ${this._showValidation ? 'Hide' : 'Show'} validation details
            </button>
            ${this._showValidation ? html`
              <div class="accordion-content">${this._formatJson(pkg.reports.validation)}</div>
            ` : ''}
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, DocsRegistryDetail);

/**
 * Registry Hub - Package Detail Page
 *
 * v0.19.0: Detailed view of a Hub package with compatibility evidence,
 * tags, install guidance, and snapshot previews.
 *
 * Data is embedded during SSG via hub-data-full.ts import.
 * No client-side fetch needed - works on static deployments.
 *
 * @see docs/sop/v0.19.0-platform-hub.md
 * @see ADR-0030
 */

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { headerNav, navSections } from '@lessjs/content/nav';
import { filterHubNav } from '../../utils/nav-filter.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import pkgRecords from '../../data/registry/hub-data.ts';

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

/** Static paths for SSG - pre-renders all package detail pages */
export function getStaticPaths(): Array<Record<string, string>> {
  try {
    const cwd = Deno.cwd();
    const paths = [
      `${cwd}/public/hub/index.json`,
      `${cwd}/hub/index.json`,
    ];
    let index: { packages: Array<{ name: string; scope: string }> } | null = null;
    for (const p of paths) {
      try {
        index = JSON.parse(Deno.readTextFileSync(p));
        break;
      } catch {
        continue;
      }
    }
    if (!index) return [];
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

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .detail-header { margin-bottom: 2rem; }
      .breadcrumb { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.75rem; }
      .breadcrumb a { color: var(--brand); text-decoration: none; }
      .breadcrumb a:hover { text-decoration: underline; }
      .pkg-title { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin: 0 0 0.5rem; }
      .pkg-title h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
      .pkg-title code { font-size: 1.25rem; background: var(--bg-code); padding: 0.125rem 0.5rem; border-radius: 4px; }
      .compat-badge-lg { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 14px; font-size: 0.8125rem; font-weight: 600; }
      .compat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      .pkg-desc { font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 0.75rem; max-width: 640px; }
      .pkg-links { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; font-size: 0.8125rem; }
      .pkg-links a { color: var(--brand); text-decoration: none; }
      .pkg-links a:hover { text-decoration: underline; }
      .section { border: 0.5px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; background: var(--bg-surface); }
      .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
      .install-box { padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem; }
      .install-safe { background: rgba(34, 197, 94, 0.08); border: 0.5px solid rgba(34, 197, 94, 0.2); }
      .install-unsafe { background: rgba(239, 68, 68, 0.08); border: 0.5px solid rgba(239, 68, 68, 0.2); }
      .install-cmd { font-family: monospace; background: var(--bg-code); padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.875rem; margin: 0.5rem 0; user-select: all; }
      .warning-list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
      .warning-list li { font-size: 0.8125rem; padding: 0.25rem 0; padding-left: 1.25rem; position: relative; color: var(--text-secondary); }
      .warning-list li::before { content: '\\u26a0\\ufe0f'; position: absolute; left: 0; }
      .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .tag-item { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; background: var(--bg-code); border-radius: 4px; font-size: 0.8125rem; font-family: monospace; }
      .tag-status { width: 6px; height: 6px; border-radius: 50%; }
      .meta-table { width: 100%; border-collapse: collapse; }
      .meta-table th, .meta-table td { text-align: left; padding: 0.375rem 0.5rem; font-size: 0.8125rem; border-bottom: 0.5px solid var(--border); }
      .meta-table th { width: 140px; color: var(--text-muted); font-weight: 500; }
      .not-found { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
      .accordion-toggle { background: none; border: none; color: var(--brand); cursor: pointer; font-size: 0.8125rem; padding: 0.25rem 0; }
      .accordion-toggle:hover { text-decoration: underline; }
      .accordion-content { margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-code); border-radius: 4px; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; max-height: 400px; overflow: auto; }

      /* Migrated inline styles */
      .not-found-link { color: var(--brand); font-size: 0.875rem; }
      .pkg-version { font-size: 1rem; color: var(--text-muted); }
      .install-title { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
      .install-info { font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
      .config-changes { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.5rem; }
      .config-item { font-size: 0.75rem; }
      .justification-text { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 0.75rem; line-height: 1.6; }
      .mono-sm { font-family: monospace; font-size: 0.75rem; }
      .usage-hint { margin-bottom: 0.5rem; font-size: 0.8125rem; color: var(--text-secondary); }
      .import-hint { margin-top: 0.75rem; font-size: 0.8125rem; color: var(--text-secondary); }
      .import-cmd { margin-top: 0.375rem; }
      .click-hint { margin-top: 0.5rem; font-size: 0.8125rem; }
      .components-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.75rem; }
      .tag-item-link { text-decoration: none; color: inherit; transition: border-color 0.15s; border: 0.5px solid transparent; }
      .tag-dot-error { background: #ef4444; }
      .tag-dot-ssr { background: #22c55e; }
      .tag-dot-warn { background: #f59e0b; }
      .validation-errors { color: #ef4444; font-size: 0.6875rem; }
      .validation-warnings { color: #f59e0b; font-size: 0.6875rem; }
      .tag-arrow { font-size: 0.625rem; color: var(--text-muted); margin-left: 0.25rem; }
      .preview-text { font-size: 0.875rem; color: var(--text-secondary); }

      /* Compat color classes */
      .compat-dot-ssr-capable { background: #22c55e; }
      .compat-dot-client-only { background: #f59e0b; }
      .compat-dot-rejected { background: #ef4444; }
      .compat-dot-experimental-dom { background: #8b5cf6; }
      .compat-dot-default { background: #888; }
      .compat-badge-lg-ssr-capable { background: #22c55e15; border: 0.5px solid #22c55e40; }
      .compat-badge-lg-client-only { background: #f59e0b15; border: 0.5px solid #f59e0b40; }
      .compat-badge-lg-rejected { background: #ef444415; border: 0.5px solid #ef444440; }
      .compat-badge-lg-experimental-dom { background: #8b5cf615; border: 0.5px solid #8b5cf640; }
      .compat-badge-lg-default { background: #88888815; border: 0.5px solid #88888840; }

      .config-list { margin: 0.25rem 0 0; padding-left: 1.25rem; }
      .compat-badge-wrap { margin-bottom: 0.75rem; }
    `);

export default class DocsRegistryDetail extends DsdElement {
  /** Route parameter: "package" - set by the framework from `[package].ts` */
  package = '';

  private _record: HubPackageRecord | null = null;
  private _showValidation = false;

  static override styles = [openPropsTokenSheet, routeSheet];

  constructor() {
    super();
  }

  /** Lazy-load record data - works in SSR (after properties are set) and client */
  private _getRecord(): HubPackageRecord | null {
    if (this._record !== null) return this._record;
    if (!this.package) return null;
    const decodedName = this.package.replace('~', '/');
    this._record = (pkgRecords as Record<string, HubPackageRecord>)[decodedName] || null;
    return this._record;
  }

  private _toggleValidation() {
    this._showValidation = !this._showValidation;
    this.update();
  }

  private _formatJson(json: string): string {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }

  /** Build link to a component in this package */
  private _componentLink(tagName: string): string {
    return `/registry/${this.package}/${tagName}`;
  }

  /** Package name display */
  private _getFullName(): string {
    if (!this._record) return this.package?.replace('~', '/') || 'unknown';
    const pkg = this._record;
    return pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name;
  }

  override render() {
    const pkg = this._getRecord();
    const fullName = pkg
      ? (pkg.scope ? `${pkg.scope}/${pkg.name}` : pkg.name)
      : this.package?.replace('~', '/') || 'unknown';
    const compatLabel = pkg ? COMPAT_LABELS[pkg.compatibility] || pkg.compatibility : 'Unknown';
    const compatSuffix = pkg && COMPAT_COLORS[pkg.compatibility] ? pkg.compatibility : 'default';

    if (!pkg) {
      return `
        <less-layout nav-items='${JSON.stringify(filterHubNav(navSections))}' header-nav='${
        JSON.stringify(headerNav)
      }' current-path="/registry/${fullName}" locale="en" locales='${JSON.stringify(['en'])}'>
          <div class="container">
            <div class="not-found"><h2>Package Not Found</h2><p>"${fullName}" is not in the registry.</p>
            <a href="/registry" class="not-found-link">← Back to Registry</a></div>
          </div>
        </less-layout>
      `;
    }

    const hasSnapshots = Object.keys(pkg.snapshotPaths).length > 0;

    return `
      <less-layout nav-items='${JSON.stringify(filterHubNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/registry/${fullName}" locale="en" locales='${JSON.stringify(['en'])}'>
        <div class="container">
          <div class="breadcrumb"><a href="/registry">Registry</a> / <span>${fullName}</span></div>

          <div class="detail-header">
            <div class="pkg-title">
              <code>${fullName}</code>
              <span class="pkg-version">v${pkg.version}</span>
              <span class="compat-badge-lg compat-badge-lg-${compatSuffix}">
                <span class="compat-dot compat-dot-${compatSuffix}"></span>${compatLabel}
              </span>
            </div>
            ${pkg.description ? `<p class="pkg-desc">${pkg.description}</p>` : ''}
            <div class="pkg-links">
              ${
      pkg.repository ? `<a href="${pkg.repository}" target="_blank">Repository -></a>` : ''
    }
              ${pkg.homepage ? `<a href="${pkg.homepage}" target="_blank">Homepage -></a>` : ''}
              <span>Source: ${pkg.source}</span>
              <span>Validated: ${new Date(pkg.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Install</div>
            <div class="install-box ${
      pkg.installGuidance.safeToInstall ? 'install-safe' : 'install-unsafe'
    }">
              <div class="install-title">
                ${pkg.installGuidance.safeToInstall ? 'Safe to install' : 'Not installable'}
              </div>
              <div class="install-info">
                ${
      pkg.installGuidance.ssrCapable ? 'SSR-capable. Server-rendered.' : 'Client-only rendering.'
    }
              </div>
              <div class="install-cmd">${pkg.installGuidance.command}</div>
              ${
      pkg.installGuidance.configChanges.length > 0
        ? `
                <div class="config-changes">
                  <strong>Config changes:</strong>
                  <ul class="config-list">
                    ${
          pkg.installGuidance.configChanges.map((c) => `<li class="config-item">${c}</li>`)
        }
                  </ul>
                </div>
              `
        : ''
    }
              ${
      pkg.installGuidance.warnings.length > 0
        ? `
                <ul class="warning-list">${
          pkg.installGuidance.warnings.map((w) => `<li>${w}</li>`)
        }</ul>
              `
        : ''
    }
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔍 Compatibility</div>
            <div class="compat-badge-wrap">
              <span class="compat-badge-lg compat-badge-lg-${compatSuffix}">
                <span class="compat-dot compat-dot-${compatSuffix}"></span>${compatLabel}
              </span>
            </div>
            <p class="justification-text">${pkg.compatibilityJustification}</p>
            <table class="meta-table">
              <tr><th>Validator</th><td>@lessjs/core v${pkg.validatorVersion}</td></tr>
              <tr><th>Manifest hash</th><td class="mono-sm">${pkg.manifestHash}</td></tr>
              <tr><th>Submitted by</th><td>${pkg.submittedBy || '-'}</td></tr>
            </table>
          </div>

          <!-- Usage -->
          <div class="section">
            <div class="section-title">Usage</div>
            <div class="usage-hint">
              Add this package to your LessJS project:
            </div>
            <div class="install-cmd">${pkg.installGuidance.command}</div>
            <div class="import-hint">
              Then import it in your route:
            </div>
            <div class="install-cmd import-cmd">import '${fullName}';</div>
            <div class="click-hint">
              Click a component below for usage examples and rendered previews.
            </div>
          </div>

          <div class="section">
            <div class="section-title">Components (${pkg.tags.length})</div>
            <div class="components-subtitle">
              Click a component to see its rendered preview, usage example, and compatibility details.
            </div>
            <div class="tag-list">
              ${
      pkg.tags.map((tag) => {
        const tagDotClass = tag.validationErrors > 0
          ? 'error'
          : tag.compatibility === 'ssr-capable'
          ? 'ssr'
          : 'warn';
        return `
                  <a class="tag-item tag-item-link" href="${
          this._componentLink(tag.tagName)
        }">
                    <span class="tag-status tag-dot-${tagDotClass}"></span>
                    &lt;${tag.tagName}&gt;
                    ${
          tag.validationErrors > 0
            ? `<span class="validation-errors">(${tag.validationErrors} err)</span>`
            : ''
        }
                    ${
          tag.validationWarnings > 0
            ? `<span class="validation-warnings">(${tag.validationWarnings} warn)</span>`
            : ''
        }
                    <span class="tag-arrow">-></span>
                  </a>
                `;
      })
    }
            </div>
          </div>

          <div class="section">
            <div class="section-title">Previews</div>
            ${
      hasSnapshots
        ? `<div class="preview-text">SSR snapshots available for ${
          Object.keys(pkg.snapshotPaths).length
        } component(s). Visit component detail pages to view them.</div>`
        : `<div class="preview-text">No preview available. Previews are generated during package validation.</div>`
    }
          </div>

          <div class="section">
            <div class="section-title">Validation Report</div>
            <button class="accordion-toggle" @click="${this._toggleValidation}">${
      this._showValidation ? 'Hide' : 'Show'
    } validation details</button>
            ${
      this._showValidation
        ? `<div class="accordion-content">${this._formatJson(pkg.reports.validation)}</div>`
        : ''
    }
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, DocsRegistryDetail);

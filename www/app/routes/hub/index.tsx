/**
 * Hub landing page - v0.23 artifact-first.
 *
 * Package evidence surface: compatibility tiers, validation status, trust policy.
 */
export const meta = { section: 'Registry', label: 'Hub', order: 0 };
export const tagName = 'page-hub';

import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { headerNav, navSections } from '@lessjs/content/nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }

  .shell { max-width: 1120px; margin: 0 auto; padding: 44px var(--size-6) 72px; }

  h1 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
  }

  .lede {
    max-width: 680px;
    margin: 18px 0 0;
    color: var(--text-muted);
    font-size: 16px;
    line-height: 1.75;
  }

  .grid {
    margin-top: 38px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .card {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fff;
    padding: 22px;
    text-decoration: none;
    color: inherit;
  }

  .card:hover { border-color: rgba(81,72,184,0.28); }
  .card h2 { margin: 0 0 var(--size-2); color: var(--text-primary); font-size: var(--font-size-2); }
  .card p { margin: 0; color: var(--text-muted); font-size: var(--font-size-00); line-height: var(--font-lineheight-4); }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    margin-bottom: 12px;
    padding: 0 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 750;
    color: var(--brand);
    border: 1px solid rgba(81,72,184,0.22);
    background: rgba(81,72,184,0.06);
  }

  @media (max-width: 780px) { .grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .shell { padding: 32px 16px 56px; } }
`);

export class HubPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/hub"
      >
        <div class="shell">
          <h1>Hub</h1>
          <p class="lede">
            The Hub is package evidence, not a marketplace. Every listed
            package shows compatibility tier, SSR/DSD status, manifest
            validation, and last verified date.
          </p>
          <div class="grid">
            <a class="card" href="/registry">
              <span class="chip">Browse</span>
              <h2>Package Index</h2>
              <p>Browse registered Web Components with compatibility tiers and DSD conformance status.</p>
            </a>
            <a class="card" href="/architecture/package-compatibility">
              <span class="chip">Validate</span>
              <h2>Compatibility Check</h2>
              <p>Understand SSR, DSD, island, and client-only classifications for third-party components.</p>
            </a>
            <a class="card" href="/architecture/standards-registry">
              <span class="chip">Policy</span>
              <h2>Trust Policy</h2>
              <p>Manifest hash verification, artifact integrity, and submission trust gates.</p>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-hub', HubPage);
export default HubPage;

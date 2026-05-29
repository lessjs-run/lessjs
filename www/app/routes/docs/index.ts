/**
 * Docs landing page - v0.23 artifact-first.
 *
 * Four entry paths: Build an app, Learn the engine, Integrate packages, Maintain LessJS.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from '@lessjs/content/nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    --ink: #14151d;
    --muted: #626676;
    --border: rgba(20,24,36,0.12);
    --accent: #5148b8;
    --success: #13795b;
  }

  .shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 44px 24px 72px;
  }

  h1 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
  }

  .lede {
    max-width: 680px;
    margin: 18px 0 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.75;
  }

  .paths {
    margin-top: 38px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .path {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fff;
    padding: 22px;
    text-decoration: none;
    color: inherit;
  }

  .path:hover {
    border-color: rgba(81,72,184,0.28);
  }

  .path h2 {
    margin: 0 0 8px;
    color: var(--ink);
    font-size: 17px;
  }

  .path p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.65;
  }

  .path .chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    margin-bottom: 12px;
    padding: 0 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 750;
    color: var(--accent);
    border: 1px solid rgba(81,72,184,0.22);
    background: rgba(81,72,184,0.06);
  }

  @media (max-width: 680px) {
    .paths { grid-template-columns: 1fr; }
    .shell { padding: 32px 16px 56px; }
  }
`);

export class DocsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterDocsNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/docs"
      >
        <div class="shell">
          <h1>Docs</h1>
          <p class="lede">
            LessJS documentation is organized around what you want to do.
            Pick an entry path and follow the workflow.
          </p>
          <div class="paths">
            <a class="path" href="/guide/getting-started">
              <span class="chip">Entry</span>
              <h2>Build an app</h2>
              <p>Create a project, write DSD components, add routes, islands, content, i18n, and deploy.</p>
            </a>
            <a class="path" href="/engine/dsd">
              <span class="chip">Concepts</span>
              <h2>Learn the engine</h2>
              <p>Understand DSD rendering, island architecture, Hono API routes, and the SSG build pipeline.</p>
            </a>
            <a class="path" href="/engine/package-compatibility">
              <span class="chip">Integrate</span>
              <h2>Integrate packages</h2>
              <p>Publish Web Components to the Hub. Prove compatibility, DSD conformance, and runtime behavior.</p>
            </a>
            <a class="path" href="/architecture">
              <span class="chip">Contribute</span>
              <h2>Maintain LessJS</h2>
              <p>Read the package graph, ADR decisions, SOP execution maps, and release gate mechanics.</p>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-docs', DocsPage);
export default DocsPage;

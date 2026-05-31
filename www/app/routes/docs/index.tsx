/**
 * Docs landing page - v0.23 artifact-first.
 *
 * Four entry paths: Build an app, Learn the engine, Integrate packages, Maintain LessJS.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1120px; margin: 0 auto; padding: 44px var(--size-6) 72px; }
  h1 { margin: 0; color: var(--text-primary); font-size: clamp(2.5rem, 7vw, 5rem); line-height: 0.95; }
  .lede { max-width: 680px; margin: 18px 0 0; color: var(--text-muted); font-size: var(--font-size-4); line-height: var(--font-lineheight-4); }
  .paths { margin-top: 38px; display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--size-4); }
  .path { border: 1px solid var(--border); border-radius: var(--radius-2); background: var(--bg-card); padding: var(--size-5); text-decoration: none; color: inherit; }
  .path:hover { border-color: rgba(81,72,184,0.28); }
  .path h2 { margin: 0 0 var(--size-2); color: var(--text-primary); font-size: 17px; }
  .path p { margin: 0; color: var(--text-muted); font-size: var(--font-size-1); line-height: var(--font-lineheight-4); }
  .path .chip { display: inline-flex; align-items: center; min-height: 26px; margin-bottom: var(--size-3); padding: 0 var(--size-2); border-radius: var(--radius-1); font-size: 11px; font-weight: 750; color: var(--brand); border: 1px solid rgba(81,72,184,0.22); background: rgba(81,72,184,0.06); }
  @media (max-width: 680px) { .paths { grid-template-columns: 1fr; } .shell { padding: var(--size-8) var(--size-4) 56px; } }
`);

export class DocsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return (
      <less-layout
        locale={this._getLocale('en')}
        locales={JSON.stringify(['en', 'zh'])}
      >
        <div class='shell'>
          <h1>Docs</h1>
          <p class='lede'>
            LessJS documentation is organized around what you want to do.
            Pick an entry path and follow the workflow.
          </p>
          <div class='paths'>
            <a class='path' href='/guide/getting-started'>
              <span class='chip'>Entry</span>
              <h2>Build an app</h2>
              <p>Create a project, write DSD components, add routes, islands, content, i18n, and deploy.</p>
            </a>
            <a class='path' href='/architecture/dsd'>
              <span class='chip'>Concepts</span>
              <h2>Learn the engine</h2>
              <p>Understand DSD rendering, island architecture, Hono API routes, and the SSG build pipeline.</p>
            </a>
            <a class='path' href='/architecture/package-compatibility'>
              <span class='chip'>Integrate</span>
              <h2>Integrate packages</h2>
              <p>Publish Web Components to the Hub. Prove compatibility, DSD conformance, and runtime behavior.</p>
            </a>
            <a class='path' href='/architecture'>
              <span class='chip'>Contribute</span>
              <h2>Maintain LessJS</h2>
              <p>Read the package graph, ADR decisions, SOP execution maps, and release gate mechanics.</p>
            </a>
          </div>
        </div>
      </less-layout>
    );
  }
}

customElements.define('page-docs', DocsPage);
export default DocsPage;

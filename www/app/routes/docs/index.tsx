/**
 * Docs landing page - v0.23 artifact-first.
 *
 * Four entry paths: Build an app, Learn the engine, Integrate packages, Maintain openElement.
 */
export const meta = { section: 'Quick Start', label: 'Docs', order: 0 };
export const tagName = 'page-docs';

import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/core/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1120px; margin: 0 auto; padding: 44px var(--size-6) 72px; }
  h1 { margin: 0; color: var(--gray-10); font-size: clamp(2.5rem, 7vw, 5rem); line-height: 0.95; }
  .lede { max-width: 680px; margin: 18px 0 0; color: var(--gray-6); font-size: var(--font-size-4); line-height: var(--font-lineheight-4); }
  .paths { margin-top: 38px; display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--size-4); }
  @media (max-width: 680px) { .paths { grid-template-columns: 1fr; } .shell { padding: var(--size-8) var(--size-4) 56px; } }
`);

export class DocsPage extends DsdElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet, sheet];

  override render() {
    return (
      
        <div class='shell'>
          <h1>Docs</h1>
          <p class='lede'>
            openElement documentation is organized around what you want to do.
            Pick an entry path and follow the workflow.
          </p>
          <div class='paths'>
            <a class='card card-bordered p-5 text-inherit no-underline hover:border-indigo-5/28' href='/guide/getting-started'>
              <span class='badge badge-outline mb-3'>Entry</span>
              <h2 class='card-title'>Build an app</h2>
              <p>Create a project, write DSD components, add routes, islands, content, i18n, and deploy.</p>
            </a>
            <a class='card card-bordered p-5 text-inherit no-underline hover:border-indigo-5/28' href='/architecture/dsd'>
              <span class='badge badge-outline mb-3'>Concepts</span>
              <h2 class='card-title'>Learn the engine</h2>
              <p>Understand DSD rendering, island architecture, Hono API routes, and the SSG build pipeline.</p>
            </a>
            <a class='card card-bordered p-5 text-inherit no-underline hover:border-indigo-5/28' href='/architecture/package-compatibility'>
              <span class='badge badge-outline mb-3'>Integrate</span>
              <h2 class='card-title'>Integrate packages</h2>
              <p>Publish Web Components to the Hub. Prove compatibility, DSD conformance, and runtime behavior.</p>
            </a>
            <a class='card card-bordered p-5 text-inherit no-underline hover:border-indigo-5/28' href='/architecture'>
              <span class='badge badge-outline mb-3'>Contribute</span>
              <h2 class='card-title'>Maintain openElement</h2>
              <p>Read the package graph, ADR decisions, SOP execution maps, and release gate mechanics.</p>
            </a>
          </div>
        </div>
      
    );
  }
}

customElements.define('page-docs', DocsPage);
export default DocsPage;

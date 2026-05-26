/**
 * Examples landing page - v0.23 artifact-first.
 *
 * Gallery of runnable LessJS examples with preview/source/output/status layout.
 */
export const meta = { section: 'Quick Start', label: 'Examples', order: 1 };
export const tagName = 'page-examples';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    --ink: #14151d;
    --muted: #626676;
    --border: rgba(20,24,36,0.12);
    --accent: #5148b8;
    --success: #13795b;
    --warning: #a05a00;
  }

  .shell { max-width: 1120px; margin: 0 auto; padding: 44px 24px 72px; }

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

  .gallery {
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

  .card h2 { margin: 0 0 8px; color: var(--ink); font-size: 17px; }
  .card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    margin-bottom: 12px;
    padding: 0 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 750;
  }

  .chip.shipped { color: var(--success); border: 1px solid rgba(19,121,91,0.22); background: rgba(19,121,91,0.06); }
  .chip.planned { color: var(--warning); border: 1px solid rgba(160,90,0,0.22); background: rgba(160,90,0,0.06); }

  @media (max-width: 780px) { .gallery { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .shell { padding: 32px 16px 56px; } }
`);

export class ExamplesPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/examples"
        home
      >
        <div class="shell">
          <h1>Examples</h1>
          <p class="lede">
            Every example shows real rendered output, source code, generated
            artifacts, and status classification side by side.
          </p>
          <div class="gallery">
            <a class="card" href="/engine/dsd">
              <span class="chip shipped">Shipped</span>
              <h2>DSD Rendering</h2>
              <p>Declarative Shadow DOM output with nested custom elements and streaming.</p>
            </a>
            <a class="card" href="/engine/islands">
              <span class="chip shipped">Shipped</span>
              <h2>Island Architecture</h2>
              <p>load, idle, visible, and only upgrade strategies with counter demos.</p>
            </a>
            <a class="card" href="/guide/content-system">
              <span class="chip shipped">Shipped</span>
              <h2>Content + Blog</h2>
              <p>Markdown content system with frontmatter, routing, and SSG integration.</p>
            </a>
            <a class="card" href="/guide/routing">
              <span class="chip shipped">Shipped</span>
              <h2>File-Based Routing</h2>
              <p>Dynamic routes, static paths, API handlers, and Hono middleware.</p>
            </a>
            <a class="card" href="/guide/api">
              <span class="chip shipped">Shipped</span>
              <h2>Hono API Routes</h2>
              <p>Fetch-native API endpoints with typed request/response contracts.</p>
            </a>
            <a class="card" href="/guide/deployment">
              <span class="chip shipped">Shipped</span>
              <h2>Deployment</h2>
              <p>Static output to GitHub Pages, Deno Deploy, and edge platforms.</p>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-examples', ExamplesPage);
export default ExamplesPage;

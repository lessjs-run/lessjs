/**
 * @lessjs/docs - Comparison: LessJS vs Alternatives
 */

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'comparison-page';

export const meta = { section: 'Strategy', label: 'Comparison', order: 50 };

export default class ComparisonPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .table-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        margin: 1.5rem 0 2.5rem;
        border: 0.5px solid var(--less-border);
        border-radius: 8px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        min-width: 640px;
      }

      thead {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      th {
        background: var(--less-bg-surface, #f8f8f8);
        font-weight: 500;
        color: var(--less-text-primary);
        text-align: left;
        padding: 0.75rem 1rem;
        border-bottom: 0.5px solid var(--less-border);
        white-space: nowrap;
      }

      td {
        padding: 0.625rem 1rem;
        border-bottom: 0.5px solid var(--less-border);
        color: var(--less-text-secondary);
        line-height: 1.5;
      }

      tbody tr {
        transition: background 0.12s;
      }

      tbody tr:hover {
        background: var(--less-bg-surface, #f5f5f5);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      td:first-child {
        font-weight: 500;
        color: var(--less-text-primary);
        white-space: nowrap;
      }

      td:not(:first-child) {
        font-variant-numeric: tabular-nums;
      }

      .tag-yes {
        color: var(--less-text-primary);
      }

      .tag-no {
        color: var(--less-text-tertiary);
      }

      .tag-partial {
        color: var(--less-text-tertiary);
        font-style: italic;
      }

      /* Prose lists */
      ul {
        padding-left: 1.25rem;
        color: var(--less-text-secondary);
        line-height: 1.7;
        font-size: 0.875rem;
      }
      li {
        margin: 0.5rem 0;
      }
      li strong {
        color: var(--less-text-primary);
        font-weight: 500;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container">
          <h1>LessJS vs Alternatives</h1>
          <p class="subtitle">
            A candid comparison with similar frameworks. LessJS is opinionated — it makes different
            trade-offs.
          </p>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>LessJS</th>
                  <th>Astro</th>
                  <th>Fresh (Deno)</th>
                  <th>Next.js</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Runtime</td>
                  <td>Deno</td>
                  <td>Node.js</td>
                  <td>Deno</td>
                  <td>Node.js</td>
                </tr>
                <tr>
                  <td>Rendering</td>
                  <td>SSG + DSD + Islands</td>
                  <td>SSG + SSR + Islands</td>
                  <td>SSR + Islands</td>
                  <td>SSR + RSC + SSG</td>
                </tr>
                <tr>
                  <td>Minimum JS</td>
                  <td><span class="tag-yes">0 KB</span></td>
                  <td><span class="tag-yes">0 KB</span></td>
                  <td><span class="tag-no">~23 KB</span></td>
                  <td><span class="tag-no">~70 KB</span></td>
                </tr>
                <tr>
                  <td>Web Standards</td>
                  <td><span class="tag-yes">DSD, CE, WA</span></td>
                  <td><span class="tag-no">.astro syntax</span></td>
                  <td><span class="tag-no">JSX + Preact</span></td>
                  <td><span class="tag-no">React-specific</span></td>
                </tr>
                <tr>
                  <td>Component Model</td>
                  <td>3-layer (DSD/Island)</td>
                  <td>Islands only</td>
                  <td>Islands only</td>
                  <td>Full hydration</td>
                </tr>
                <tr>
                  <td>Server</td>
                  <td>Hono (optional)</td>
                  <td>Built-in + adapters</td>
                  <td>Oak (optional)</td>
                  <td>Next.js server</td>
                </tr>
                <tr>
                  <td>Ecosystem</td>
                  <td><span class="tag-partial">Emerging</span></td>
                  <td>Mature</td>
                  <td><span class="tag-partial">Small</span></td>
                  <td>Massive</td>
                </tr>
                <tr>
                  <td>Learning Curve</td>
                  <td><span class="tag-yes">Low (Web Standards)</span></td>
                  <td>Medium (.astro syntax)</td>
                  <td>Low (JSX)</td>
                  <td>High (React + concepts)</td>
                </tr>
                <tr>
                  <td>UI Framework</td>
                  <td>Lit (pluggable)</td>
                  <td>Any (React, Vue, Svelte)</td>
                  <td>Preact</td>
                  <td>React only</td>
                </tr>
                <tr>
                  <td>Package Registry</td>
                  <td>JSR only</td>
                  <td>npm</td>
                  <td>JSR + npm</td>
                  <td>npm</td>
                </tr>
                <tr>
                  <td>SSR (request-time)</td>
                  <td><span class="tag-no">No (by design)</span></td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Tailwind / CSS</td>
                  <td>Lit CSS + tokens</td>
                  <td>Any</td>
                  <td>Twind + any</td>
                  <td>Any (CSS Modules)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>What LessJS Optimizes For</h2>
          <ul>
            <li><strong>Zero JS by default</strong> — Content sites deliver 0 KB client JS</li>
            <li>
              <strong>Web Standards first</strong> — DSD, Custom Elements, Shadow DOM. No compiler step
            </li>
            <li>
              <strong>DSD-first rendering</strong> — Readable HTML before JS exists. Not 'SSR also
              supports DSD'
            </li>
            <li>
              <strong>Framework-agnostic core</strong> — Zero UI framework dependency. Lit is a choice,
              not a requirement
            </li>
            <li>
              <strong>Fine-grained interactivity</strong> — Three-layer component model controls exactly
              how much JS each component needs
            </li>
          </ul>

          <h2>What LessJS Does Not Optimize For</h2>
          <ul>
            <li>
              <strong>Per-request SSR</strong> — For highly personalized pages, use islands + client fetch
              + serverless
            </li>
            <li>
              <strong>Large SPA apps</strong> — LessJS starts from static-first. Dynamic pages are
              explicit islands
            </li>
            <li>
              <strong>npm ecosystem</strong> — JSR-only package distribution requires extra setup for npm
              users
            </li>
            <li>
              <strong>Browser compatibility</strong> — Requires DSD-supporting browsers (Chrome 90+,
              Safari 16.4+, Firefox 123+)
            </li>
          </ul>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ComparisonPage);

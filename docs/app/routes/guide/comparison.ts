/**
 * @lessjs/docs - Comparison: LessJS vs Alternatives
 */

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'comparison-page';

export const meta = { section: 'Strategy', label: 'Comparison', order: 50 };

export default class ComparisonPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      table {
        font-size: 0.8125rem;
      }
      th {
        white-space: nowrap;
      }
      .y {
        color: var(--less-text-primary);
      }
      .n {
        color: var(--less-text-tertiary);
      }
      .partial {
        color: var(--less-text-tertiary);
        font-style: italic;
      }
      td strong {
        font-weight: 500;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container">
          <h1>LessJS vs Alternatives</h1>
          <p class="subtitle">
            A candid comparison with similar frameworks. LessJS is opinionated — it makes different
            trade-offs.
          </p>

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
                <td><strong>Runtime</strong></td>
                <td>Deno</td>
                <td>Node.js</td>
                <td>Deno</td>
                <td>Node.js</td>
              </tr>
              <tr>
                <td><strong>Rendering</strong></td>
                <td>SSG + DSD + Islands</td>
                <td>SSG + SSR + Islands</td>
                <td>SSR + Islands</td>
                <td>SSR + RSC + SSG</td>
              </tr>
              <tr>
                <td><strong>Minimum JS</strong></td>
                <td><span class="y">0 KB</span></td>
                <td><span class="y">0 KB</span></td>
                <td><span class="n">~23 KB</span></td>
                <td><span class="n">~70 KB</span></td>
              </tr>
              <tr>
                <td><strong>Web Standards</strong></td>
                <td><span class="y">DSD, CE, WA</span></td>
                <td><span class="n">.astro syntax</span></td>
                <td><span class="n">JSX + Preact</span></td>
                <td><span class="n">React-specific</span></td>
              </tr>
              <tr>
                <td><strong>Component Model</strong></td>
                <td>3-layer (DSD/Island)</td>
                <td>Islands only</td>
                <td>Islands only</td>
                <td>Full hydration</td>
              </tr>
              <tr>
                <td><strong>Server</strong></td>
                <td>Hono (optional)</td>
                <td>Built-in + adapters</td>
                <td>Oak (optional)</td>
                <td>Next.js server</td>
              </tr>
              <tr>
                <td><strong>Ecosystem</strong></td>
                <td><span class="partial">Emerging</span></td>
                <td>Mature</td>
                <td><span class="partial">Small</span></td>
                <td>Massive</td>
              </tr>
              <tr>
                <td><strong>Learning Curve</strong></td>
                <td><span class="y">Low (Web Standards)</span></td>
                <td>Medium (.astro syntax)</td>
                <td>Low (JSX)</td>
                <td>High (React + concepts)</td>
              </tr>
              <tr>
                <td><strong>UI Framework</strong></td>
                <td>Lit (pluggable)</td>
                <td>Any (React, Vue, Svelte)</td>
                <td>Preact</td>
                <td>React only</td>
              </tr>
              <tr>
                <td><strong>Package Registry</strong></td>
                <td>JSR only</td>
                <td>npm</td>
                <td>JSR + npm</td>
                <td>npm</td>
              </tr>
              <tr>
                <td><strong>SSR (request-time)</strong></td>
                <td><span class="n">No (by design)</span></td>
                <td>Yes</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td><strong>Tailwind / CSS</strong></td>
                <td>Lit CSS + tokens</td>
                <td>Any</td>
                <td>Twind + any</td>
                <td>Any (CSS Modules)</td>
              </tr>
            </tbody>
          </table>

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

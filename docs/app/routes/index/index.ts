import { css, html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static styles = css`
    :host { display: block; }

    /* Hero — full-width, modern, dark */
    .hero {
      background: #000;
      margin: 0 0 3rem;
      position: relative;
      overflow: hidden;
      min-height: 280px;
      display: flex;
      align-items: center;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -80px; right: -80px;
      width: 300px; height: 500px;
      background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 100%);
      transform: rotate(20deg);
    }
    .hero::after {
      content: '';
      position: absolute;
      bottom: -60px; left: 40%;
      width: 200px; height: 200px;
      background: rgba(255,255,255,0.02);
      border-radius: 50%;
    }
    .hero-content {
      max-width: 720px;
      margin: 0 auto;
      padding: 4rem 2rem;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    .hero-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }
    .hero-brand { display: flex; flex-direction: column; gap: 6px; }
    .hero-kiss {
      font-size: 3.5rem;
      font-weight: 500;
      color: #fff;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    .hero-slogan {
      font-size: 0.8125rem;
      color: #555;
      line-height: 1.6;
      max-width: 320px;
    }
    .hero-term { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

    /* Content */
    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }

    .section-title {
      font-size: 0.6875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--kiss-text-muted);
      margin: 0 0 1.5rem;
    }
    .section { margin-bottom: 3rem; }

    .lead {
      font-size: 0.9375rem;
      color: var(--kiss-text-secondary);
      line-height: 1.7;
      margin: 0 0 2rem;
    }

    /* Feature grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .grid-item {
      padding: 1.25rem 1rem 1.25rem 0;
      border-top: 0.5px solid var(--kiss-border);
    }
    .grid-item:nth-child(odd) { padding-right: 1.5rem; }
    .grid-item:nth-child(-n+2) { border-top: none; }
    .grid-item h3 {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 4px;
    }
    .grid-item p {
      font-size: 0.75rem;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.6;
    }

    /* Stats row */
    .stats {
      display: flex;
      gap: 0;
      border-top: 0.5px solid var(--kiss-border);
      padding-top: 1.5rem;
    }
    .stat { flex: 1; text-align: center; }
    .stat + .stat { border-left: 0.5px solid var(--kiss-border); }
    .stat-val {
      font-size: 1.75rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 0.625rem;
      color: var(--kiss-text-muted);
      letter-spacing: 0.1em;
    }

    /* Comparison table */
    .cmp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }
    .cmp-table th, .cmp-table td {
      padding: 0.75rem 0.75rem;
      text-align: left;
      border-bottom: 0.5px solid var(--kiss-border);
    }
    .cmp-table th {
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--kiss-text-muted);
    }
    .cmp-table td { color: var(--kiss-text-tertiary); }
    .cmp-table td:first-child { color: var(--kiss-text-primary); font-weight: 500; }
    .cmp-table tr:last-child td { border-bottom: none; }
    .cmp-table .check { color: var(--kiss-text-primary); }
    .cmp-table .dash { color: var(--kiss-border); }

    /* Links */
    .links {
      display: flex;
      gap: 0;
      border-top: 0.5px solid var(--kiss-border);
      margin-top: 2rem;
    }
    .link-item {
      flex: 1;
      text-align: center;
      font-size: 0.75rem;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      padding: 0.875rem 0;
      transition: all 0.15s;
    }
    .link-item + .link-item { border-left: 0.5px solid var(--kiss-border); }
    .link-item:hover { color: var(--kiss-text-primary); background: var(--kiss-bg-surface); }

    @media (max-width: 640px) {
      .hero-content { padding: 2.5rem 1.5rem; }
      .hero-row { flex-direction: column; align-items: flex-start; gap: 16px; }
      .hero-kiss { font-size: 2.5rem; }
      .grid-2 { grid-template-columns: 1fr; }
      .grid-item:nth-child(2) { border-top: 0.5px solid var(--kiss-border); }
      .stats { flex-wrap: wrap; }
      .stat { flex: 1 1 50%; padding: 0.5rem 0; }
      .stat:nth-child(2) { border-left: none; }
      .cmp-table { font-size: 0.6875rem; }
      .cmp-table th, .cmp-table td { padding: 0.5rem; }
    }
  `;

  override render() {
    return html`
      <kiss-layout home>
        <div class="hero">
          <div class="hero-content">
            <div class="hero-row">
              <div class="hero-brand">
                <div class="hero-kiss">KISS</div>
                <div class="hero-slogan">
                  A Jamstack framework built on web standards.<br>
                  Zero runtime lock-in. Just the platform.
                </div>
              </div>
              <div class="hero-term">
                <hero-ping></hero-ping>
              </div>
            </div>
          </div>
        </div>

        <div class="content">
          <p class="lead">
            HTTP through the Fetch API. UI through Web Components. Modules through ESM.
            KISS has no custom abstractions, no framework-specific syntax, and no build step
            requirement. Your code works without KISS — it's just JavaScript, running on the web platform.
          </p>

          <div class="section">
            <div class="section-title">Package sizes</div>
            <div class="stats">
              <div class="stat">
                <div class="stat-val">49KB</div>
                <div class="stat-label">@kissjs/core</div>
              </div>
              <div class="stat">
                <div class="stat-val">.5-19KB</div>
                <div class="stat-label">@kissjs/ui components</div>
              </div>
              <div class="stat">
                <div class="stat-val">0KB</div>
                <div class="stat-label">static pages</div>
              </div>
              <div class="stat">
                <div class="stat-val">~6KB</div>
                <div class="stat-label">single island</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Why KISS</div>
            <div class="grid-2">
              <div class="grid-item">
                <h3>Web standards first</h3>
                <p>HTTP via Fetch API, UI via Web Components, modules via ESM. If you know the platform, you know KISS.</p>
              </div>
              <div class="grid-item">
                <h3>Islands architecture</h3>
                <p>Only interactive components ship JS. Zero-interaction pages: 0 KB of JavaScript.</p>
              </div>
              <div class="grid-item">
                <h3>Type-safe RPC</h3>
                <p>End-to-end type safety via Hono RPC — server and client share types directly. No code generation.</p>
              </div>
              <div class="grid-item">
                <h3>SSG + DSD</h3>
                <p>Build-time static generation with Declarative Shadow DOM. HTML hydrates instantly on the client.</p>
              </div>
              <div class="grid-item">
                <h3>Multi-runtime</h3>
                <p>Same codebase runs on Deno, Node.js, Bun, and Cloudflare Workers. Zero runtime lock-in.</p>
              </div>
              <div class="grid-item">
                <h3>Progressive enhancement</h3>
                <p>The Semantic constraint guarantees your content is readable without JavaScript enabled.</p>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">vs other frameworks</div>
            <table class="cmp-table">
              <tr>
                <th></th>
                <th>KISS</th>
                <th>Astro</th>
                <th>Next.js</th>
              </tr>
              <tr>
                <td>HTTP layer</td>
                <td class="check">Fetch API</td>
                <td>Fetch API</td>
                <td class="dash">Custom</td>
              </tr>
              <tr>
                <td>UI layer</td>
                <td class="check">Web Components</td>
                <td class="dash">.astro syntax</td>
                <td class="dash">React only</td>
              </tr>
              <tr>
                <td>Module system</td>
                <td class="check">ESM</td>
                <td class="check">ESM</td>
                <td class="dash">Custom bundler</td>
              </tr>
              <tr>
                <td>Runtimes</td>
                <td class="check">Deno / Node / Bun / CFW</td>
                <td class="check">Node / Deno / CFW</td>
                <td class="dash">Node only</td>
              </tr>
              <tr>
                <td>Static pages</td>
                <td class="check">0 KB JS</td>
                <td class="check">0 KB JS</td>
                <td class="dash">~70 KB</td>
              </tr>
              <tr>
                <td>Declarative Shadow DOM</td>
                <td class="check">Built-in</td>
                <td class="dash">Third-party</td>
                <td class="dash">Not supported</td>
              </tr>
            </table>
          </div>

          <div class="links">
            <a class="link-item" href="/guide/getting-started">Getting started →</a>
            <a class="link-item" href="/demo">Live demo →</a>
            <a class="link-item" href="https://github.com/SisyphusZheng/kiss">GitHub →</a>
            <a class="link-item" href="https://jsr.io/@kissjs/core">JSR →</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

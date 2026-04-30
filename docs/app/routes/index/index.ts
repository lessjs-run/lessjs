import { css, html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static styles = css`
    :host { display: block; }

    /* ===== Hero ===== */
    .hero {
      background: #000;
      margin: 0 0 2.5rem;
      min-height: auto;
      padding: 3.5rem 0;
    }
    .hero-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem;
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
    .hero-desc {
      font-size: 0.8125rem;
      color: #555;
      line-height: 1.6;
      max-width: 340px;
    }
    .hero-tech {
      font-size: 0.625rem;
      color: #444;
      margin-top: 0.75rem;
      letter-spacing: 0.05em;
    }
    .hero-term { flex-shrink: 0; }

    /* ===== Content wrapper ===== */
    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
    }
    .section-title {
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--kiss-text-muted);
      margin: 0 0 1.25rem;
    }
    .section { margin-bottom: 2.5rem; }

    /* ===== Stats ===== */
    .stats {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .stat {
      flex: 1;
      text-align: center;
      padding: 1.25rem 0.5rem;
    }
    .stat + .stat { border-left: 0.5px solid var(--kiss-border); }
    .stat-val {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 0.625rem;
      color: var(--kiss-text-muted);
    }

    /* ===== How it works ===== */
    .code-row {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .code-panel {
      flex: 1;
      padding: 1rem;
      background: var(--kiss-code-bg);
    }
    .code-panel + .code-panel { border-left: 0.5px solid var(--kiss-border); }
    .code-panel .label {
      font-size: 0.625rem;
      color: var(--kiss-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }
    .code-panel pre {
      margin: 0;
      font-family: 'SF Mono','Fira Code','Consolas',monospace;
      font-size: 0.6875rem;
      line-height: 1.6;
      color: var(--kiss-text-secondary);
    }
    .code-panel pre .hl { color: var(--kiss-text-primary); }

    /* ===== Features ===== */
    .feat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .feat {
      padding: 1rem 0 1rem 0.75rem;
      border-top: 0.5px solid var(--kiss-border);
      border-left: 2px solid var(--kiss-border);
    }
    .feat:nth-child(-n+2) { border-top: none; }
    .feat:nth-child(odd) { border-left: 2px solid var(--kiss-text-primary); }
    .feat h3 {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 3px;
    }
    .feat p {
      font-size: 0.6875rem;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.5;
    }

    /* ===== Quick start ===== */
    .qstart {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .qstep {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .qstep + .qstep {
      border-left: 0.5px solid var(--kiss-border);
    }
    .qstep .num {
      font-size: 0.5rem;
      color: var(--kiss-text-muted);
      letter-spacing: 0.15em;
    }
    .qstep code {
      font-family: 'SF Mono','Fira Code','Consolas',monospace;
      font-size: 0.6875rem;
      color: var(--kiss-text-primary);
      background: var(--kiss-code-bg);
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
    }
    .qstep .desc {
      font-size: 0.625rem;
      color: var(--kiss-text-tertiary);
    }

    /* ===== Comparison ===== */
    .cmp {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.6875rem;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .cmp th, .cmp td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 0.5px solid var(--kiss-border);
    }
    .cmp th {
      font-size: 0.5625rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--kiss-text-muted);
      background: var(--kiss-bg-surface);
    }
    .cmp td { color: var(--kiss-text-tertiary); }
    .cmp td:first-child { color: var(--kiss-text-secondary); font-size: 0.625rem; }
    .cmp .ours { color: var(--kiss-text-primary); font-weight: 500; }
    .cmp tr:last-child td { border-bottom: none; }

    /* ===== Links ===== */
    .links {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .link-item {
      flex: 1;
      text-align: center;
      font-size: 0.6875rem;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      padding: 0.875rem 0;
      transition: all 0.15s;
    }
    .link-item + .link-item { border-left: 0.5px solid var(--kiss-border); }
    .link-item:hover { color: var(--kiss-text-primary); background: var(--kiss-bg-surface); }

    @media (max-width: 640px) {
      .hero-inner { flex-direction: column; align-items: flex-start; gap: 16px; padding: 0 1.5rem; }
      .hero-kiss { font-size: 2.5rem; }
      .hero { padding: 2.5rem 0; }
      .feat-grid { grid-template-columns: 1fr; }
      .feat:nth-child(2) { border-top: 0.5px solid var(--kiss-border); }
      .qstart { flex-direction: column; }
      .qstep + .qstep { border-left: none; border-top: 0.5px solid var(--kiss-border); }
      .stats { flex-wrap: wrap; }
      .stat { flex: 1 1 50%; }
      .code-row { flex-direction: column; }
      .content { padding: 0 1.5rem 3rem; }
    }
  `;

  override render() {
    return html`
      <kiss-layout home>
        <div class="hero">
          <div class="hero-inner">
            <div class="hero-brand">
              <div class="hero-kiss">KISS</div>
              <div class="hero-desc">
                A Jamstack framework built on web standards.<br>
                Zero runtime lock-in. Just the platform.
              </div>
              <div class="hero-tech">HTTP Fetch API · Web Components · ESM</div>
            </div>
            <div class="hero-term">
              <hero-ping></hero-ping>
            </div>
          </div>
        </div>

        <div class="content">
          <!-- Stats -->
          <div class="section">
            <div class="section-title">By the numbers</div>
            <div class="stats">
              <div class="stat">
                <div class="stat-val">~7KB</div>
                <div class="stat-label">runtime (gzip)</div>
              </div>
              <div class="stat">
                <div class="stat-val">0KB</div>
                <div class="stat-label">static pages</div>
              </div>
              <div class="stat">
                <div class="stat-val">4</div>
                <div class="stat-label">runtimes</div>
              </div>
              <div class="stat">
                <div class="stat-val">100%</div>
                <div class="stat-label">web standards</div>
              </div>
            </div>
          </div>

          <!-- How it works -->
          <div class="section">
            <div class="section-title">How it works</div>
            <div class="code-row">
              <div class="code-panel">
                <div class="label">Server (Hono)</div>
                <pre>import { Hono } from 'hono'
const app = new Hono()
app.get('/api', (c) => <span class="hl">c.json({ ok: true })</span>)
export default app</pre>
              </div>
              <div class="code-panel">
                <div class="label">Client (Lit)</div>
                <pre>import { LitElement, html } from 'lit'
class App extends LitElement {
  render() { return html${'`'}&lt;h1&gt;hello&lt;/h1&gt;${'`'}
  }
}</pre>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div class="section">
            <div class="section-title">Why KISS</div>
            <div class="feat-grid">
              <div class="feat">
                <h3>Web standards first</h3>
                <p>HTTP via Fetch API, UI via Web Components, modules via ESM. If you know the platform, you know KISS.</p>
              </div>
              <div class="feat">
                <h3>Islands architecture</h3>
                <p>Only interactive components ship JavaScript. Zero-interaction pages: 0 KB of JS.</p>
              </div>
              <div class="feat">
                <h3>Type-safe RPC</h3>
                <p>End-to-end type safety via Hono RPC — server and client share types directly. No code generation.</p>
              </div>
              <div class="feat">
                <h3>SSG + DSD</h3>
                <p>Build-time static generation with Declarative Shadow DOM. HTML hydrates instantly on the client.</p>
              </div>
              <div class="feat">
                <h3>Multi-runtime</h3>
                <p>Same code runs on Deno, Node.js, Bun, and Cloudflare Workers. Zero runtime lock-in.</p>
              </div>
              <div class="feat">
                <h3>Progressive enhancement</h3>
                <p>The Semantic constraint guarantees your content reads correctly without JavaScript enabled.</p>
              </div>
            </div>
          </div>

          <!-- Quick start -->
          <div class="section">
            <div class="section-title">Quick start</div>
            <div class="qstart">
              <div class="qstep">
                <span class="num">Step 1</span>
                <code>npm create @kissjs/app</code>
                <span class="desc">Scaffold a new project</span>
              </div>
              <div class="qstep">
                <span class="num">Step 2</span>
                <code>cd my-app && npm install</code>
                <span class="desc">Install dependencies</span>
              </div>
              <div class="qstep">
                <span class="num">Step 3</span>
                <code>deno task dev</code>
                <span class="desc">Start the dev server</span>
              </div>
            </div>
          </div>

          <!-- Comparison -->
          <div class="section">
            <div class="section-title">vs other frameworks</div>
            <table class="cmp">
              <tr>
                <th></th>
                <th>KISS</th>
                <th>Fresh</th>
                <th>Nuxt</th>
                <th>Next.js</th>
              </tr>
              <tr>
                <td>HTTP layer</td>
                <td class="ours">Fetch API</td>
                <td>Fetch API</td>
                <td>Nitro (custom)</td>
                <td>Custom</td>
              </tr>
              <tr>
                <td>UI layer</td>
                <td class="ours">Web Comp.</td>
                <td>Preact/JSX</td>
                <td>Vue</td>
                <td>React</td>
              </tr>
              <tr>
                <td>Module system</td>
                <td class="ours">ESM</td>
                <td class="ours">ESM</td>
                <td>Custom bundler</td>
                <td>Custom bundler</td>
              </tr>
              <tr>
                <td>Static pages</td>
                <td class="ours">0 KB JS</td>
                <td class="ours">0 KB JS</td>
                <td>~60 KB</td>
                <td>~70 KB</td>
              </tr>
              <tr>
                <td>Runtime gzip</td>
                <td class="ours">~7 KB</td>
                <td>~3 KB+</td>
                <td>~45 KB</td>
                <td>~50 KB</td>
              </tr>
              <tr>
                <td>Runtimes</td>
                <td class="ours">Deno/Node/Bun/CFW</td>
                <td>Deno/CFW/Docker</td>
                <td>Node/Deno/Serverless</td>
                <td>Node only</td>
              </tr>
              <tr>
                <td>Declarative SD</td>
                <td class="ours">Built-in</td>
                <td class="dash">—</td>
                <td class="dash">—</td>
                <td class="dash">—</td>
              </tr>
            </table>
          </div>

          <!-- Links -->
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

/**
 * Homepage - v0.23 artifact-first console.
 *
 * The home page is a working product surface: current release state, generated
 * project contract, DSD output, package graph, and release gates are visible in
 * the first viewport.
 */
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';
import '../../islands/less-search.js';

export const tagName = 'docs-home';

const DSD_OUTPUT = `<home-page>
  <template shadowrootmode="open">
    <style>main{display:grid;gap:1rem}</style>
    <main>
      <h1>LessJS</h1>
      <my-counter client:idle></my-counter>
    </main>
  </template>
</home-page>`;

const RUNTIME_SOURCE = `import { DsdElement, html, signal, StyleSheet } from '@lessjs/runtime';

export class MyCounter extends DsdElement {
  count = signal(0);
  render() {
    return html\`<button @click=\${() => this.count.value++}>
      Count \${this.count.value}
    </button>\`;
  }
}`;

const PACKAGE_GRAPH = `@lessjs/protocols
  -> content, i18n, adapter-vite
@lessjs/core
  -> runtime kernel
@lessjs/signals
  -> alien-signals facade
@lessjs/runtime
  -> core + signals + style-sheet
@lessjs/app
  -> configuration facade`;

const BUILD_REPORT = `Package graph check passed
18 packages
18 publish steps
0 cycles
0 undeclared @lessjs/* source imports
current line: 0.23.0`;

function escHtml(source: string): string {
  return source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const indexSheet = new StyleSheet();
indexSheet.replaceSync(`
  :host {
    display: block;
    --home-ink: #12131a;
    --home-muted: #626676;
    --home-border: rgba(20, 24, 36, 0.12);
    --home-panel: #ffffff;
    --home-soft: #f6f7f9;
    --home-accent: #5148b8;
    --home-success: #13795b;
    --home-warning: #a05a00;
    --home-danger: #b42318;
    --home-info: #1769aa;
  }

  :host([data-theme="dark"]) {
    --home-ink: #f4f6fb;
    --home-muted: #a7adbd;
    --home-border: rgba(225, 231, 242, 0.16);
    --home-panel: #11131a;
    --home-soft: #171a23;
    --home-accent: #9b93ff;
    --home-success: #6bd7af;
    --home-warning: #f2ba66;
    --home-danger: #ff9b91;
    --home-info: #8bc7ff;
  }

  less-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  a {
    color: inherit;
  }

  .home-shell {
    background:
      linear-gradient(180deg, #fbfbfd 0%, #ffffff 46%, #f5f6f8 100%);
    color: var(--home-ink);
  }

  :host([data-theme="dark"]) .home-shell {
    background:
      linear-gradient(180deg, #080a10 0%, #0d1017 48%, #11131a 100%);
  }

  .hero {
    border-bottom: 1px solid var(--home-border);
  }

  .hero-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 48px 24px 22px;
    min-height: min(720px, calc(100vh - 96px));
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
    gap: 28px;
    align-items: center;
  }

  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid var(--home-border);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--home-muted);
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
  }

  .chip.current {
    color: var(--home-accent);
    border-color: rgba(81, 72, 184, 0.28);
    background: rgba(81, 72, 184, 0.08);
  }

  .chip.success {
    color: var(--home-success);
    border-color: rgba(19, 121, 91, 0.24);
    background: rgba(19, 121, 91, 0.08);
  }

  h1 {
    margin: 0;
    font-size: clamp(3.2rem, 10vw, 7.2rem);
    line-height: 0.9;
    letter-spacing: 0;
    font-weight: 820;
  }

  .definition {
    max-width: 620px;
    margin: 22px 0 0;
    color: var(--home-muted);
    font-size: 17px;
    line-height: 1.72;
  }

  .command {
    margin: 26px 0 0;
    border: 1px solid rgba(18, 19, 26, 0.16);
    border-radius: 8px;
    background: #11131a;
    color: #f5f7fb;
    overflow: hidden;
    box-shadow: 0 18px 42px rgba(17, 19, 26, 0.16);
  }

  .command-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(245, 247, 251, 0.66);
    font-size: 12px;
  }

  .command code {
    display: block;
    padding: 16px 18px 18px;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.6;
    white-space: nowrap;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 7px;
    border: 1px solid var(--home-border);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  .action.primary {
    color: #fff;
    background: var(--home-accent);
    border-color: var(--home-accent);
  }

  .action.secondary {
    background: rgba(255, 255, 255, 0.76);
    color: var(--home-ink);
  }

  :host([data-theme="dark"]) .action.secondary {
    background: rgba(255, 255, 255, 0.06);
  }

  .artifact {
    border: 1px solid rgba(18, 19, 26, 0.14);
    border-radius: 8px;
    background: var(--home-panel);
    box-shadow: 0 22px 70px rgba(20, 24, 36, 0.12);
    overflow: hidden;
  }

  .artifact-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--home-border);
    background: #fbfbfc;
  }

  :host([data-theme="dark"]) .artifact-top,
  :host([data-theme="dark"]) .artifact-pane,
  :host([data-theme="dark"]) .path-step,
  :host([data-theme="dark"]) .layer,
  :host([data-theme="dark"]) .owner-table,
  :host([data-theme="dark"]) .owner-row,
  :host([data-theme="dark"]) .status-card,
  :host([data-theme="dark"]) .proof,
  :host([data-theme="dark"]) .footer {
    background: var(--home-panel);
  }

  .artifact-title {
    display: grid;
    gap: 2px;
  }

  .artifact-title strong {
    font-size: 13px;
  }

  .artifact-title span {
    color: var(--home-muted);
    font-size: 12px;
  }

  .artifact-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .tab {
    padding: 5px 8px;
    border: 1px solid var(--home-border);
    border-radius: 6px;
    background: #fff;
    color: var(--home-muted);
    font-size: 11px;
    font-weight: 700;
  }

  .tab.active {
    color: var(--home-accent);
    border-color: rgba(81, 72, 184, 0.28);
    background: rgba(81, 72, 184, 0.08);
  }

  .artifact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 430px;
  }

  .artifact-pane {
    padding: 16px;
    border-right: 1px solid var(--home-border);
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .artifact-pane:last-child {
    border-right: 0;
  }

  .panel-label {
    margin: 0;
    color: var(--home-muted);
    font-size: 11px;
    font-weight: 760;
    text-transform: uppercase;
  }

  pre {
    margin: 0;
    padding: 14px;
    border-radius: 8px;
    background: #11131a;
    color: #eef1f7;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.62;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  code {
    font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace;
  }

  .mini-report {
    display: grid;
    gap: 10px;
  }

  .metric {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--home-border);
    font-size: 13px;
  }

  .metric strong {
    color: var(--home-ink);
  }

  .metric span {
    color: var(--home-muted);
  }

  .proof-strip {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px 30px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  .proof {
    min-height: 94px;
    padding: 13px;
    border: 1px solid var(--home-border);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.75);
  }

  .proof strong {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .proof span {
    display: block;
    color: var(--home-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .band {
    border-bottom: 1px solid var(--home-border);
  }

  .band-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 54px 24px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }

  .section-kicker {
    margin: 0 0 8px;
    color: var(--home-accent);
    font-size: 12px;
    font-weight: 780;
    text-transform: uppercase;
  }

  .section-title {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1.08;
    font-weight: 780;
    letter-spacing: 0;
  }

  .section-copy {
    max-width: 460px;
    margin: 0;
    color: var(--home-muted);
    line-height: 1.7;
    font-size: 14px;
  }

  .path-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  .path-step {
    padding: 14px;
    min-height: 138px;
    border: 1px solid var(--home-border);
    border-radius: 8px;
    background: #fff;
  }

  .path-step b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #11131a;
    color: #fff;
    font-size: 12px;
  }

  .path-step h3 {
    margin: 14px 0 8px;
    font-size: 14px;
  }

  .path-step p {
    margin: 0;
    color: var(--home-muted);
    font-size: 12px;
    line-height: 1.55;
  }

  .architecture-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 16px;
  }

  .layer-map,
  .owner-table {
    border: 1px solid var(--home-border);
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
  }

  .layer {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--home-border);
  }

  .layer:last-child {
    border-bottom: 0;
  }

  .layer strong {
    font-size: 13px;
  }

  .layer span {
    color: var(--home-muted);
    font-size: 12px;
    line-height: 1.55;
  }

  .owner-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--home-border);
    font-size: 12px;
  }

  .owner-row:last-child {
    border-bottom: 0;
  }

  .owner-row code {
    color: var(--home-accent);
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .status-card {
    padding: 16px;
    border: 1px solid var(--home-border);
    border-radius: 8px;
    background: #fff;
  }

  .status-card h3 {
    margin: 0 0 8px;
    font-size: 14px;
  }

  .status-card p {
    margin: 0;
    color: var(--home-muted);
    font-size: 12px;
    line-height: 1.6;
  }

  .footer {
    background: #11131a;
    color: #f5f7fb;
  }

  .footer .band-inner {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
  }

  .footer p {
    margin: 0;
    color: rgba(245, 247, 251, 0.66);
    font-size: 13px;
  }

  .footer a {
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  @media (max-width: 980px) {
    .hero-inner,
    .architecture-grid {
      grid-template-columns: 1fr;
    }

    .proof-strip,
    .path-grid,
    .status-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .artifact-grid {
      grid-template-columns: 1fr;
    }

    .artifact-pane {
      border-right: 0;
      border-bottom: 1px solid var(--home-border);
    }

    .artifact-pane:last-child {
      border-bottom: 0;
    }
  }

  @media (max-width: 640px) {
    .hero-inner {
      padding: 34px 16px 18px;
      min-height: auto;
    }

    .proof-strip,
    .path-grid,
    .status-grid {
      grid-template-columns: 1fr;
      padding-left: 16px;
      padding-right: 16px;
    }

    .band-inner {
      padding: 38px 16px;
    }

    .section-head,
    .footer .band-inner {
      display: grid;
    }

    .layer,
    .owner-row {
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .artifact-tabs {
      justify-content: flex-start;
    }
  }
`);

export class DocsHome extends DsdElement {
  static override styles = [openPropsTokenSheet, indexSheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/"
        home
      >
        <div class="home-shell">
          <section class="hero">
            <div class="hero-inner">
              <div>
                <div class="eyebrow">
                  <span class="chip current">v0.23.0 current</span>
                  <span class="chip success">graph gate passing</span>
                  <span class="chip">DSD-first</span>
                  <span class="chip">JSR unified release</span>
                </div>
                <h1>LessJS</h1>
                <p class="definition">
                  A DSD-first Web Components app framework with static output,
                  progressive islands, Hono routes, and architecture gates that
                  make package behavior deterministic.
                </p>
                <div class="command">
                  <div class="command-head">
                    <span>create a LessJS project</span>
                    <span>0.23.0</span>
                  </div>
                  <code>deno run -A jsr:@lessjs/create my-app</code>
                </div>
                <div class="actions">
                  <a class="action primary" href="/docs">Start building</a>
                  <a class="action secondary" href="/architecture">Read architecture</a>
                  <a class="action secondary" href="/roadmap">Release truth</a>
                </div>
              </div>

              <div class="artifact" aria-label="LessJS release artifact console">
                <div class="artifact-top">
                  <div class="artifact-title">
                    <strong>Release Artifact Console</strong>
                    <span>real surfaces from the framework contract</span>
                  </div>
                  <div class="artifact-tabs">
                    <span class="tab active">DSD</span>
                    <span class="tab">Graph</span>
                    <span class="tab">Build</span>
                    <span class="tab">Create</span>
                  </div>
                </div>
                <div class="artifact-grid">
                  <div class="artifact-pane">
                    <p class="panel-label">generated DSD output</p>
                    <pre><code>${escHtml(DSD_OUTPUT)}</code></pre>
                    <p class="panel-label">authoring source</p>
                    <pre><code>${escHtml(RUNTIME_SOURCE)}</code></pre>
                  </div>
                  <div class="artifact-pane">
                    <p class="panel-label">package graph</p>
                    <pre><code>${escHtml(PACKAGE_GRAPH)}</code></pre>
                    <p class="panel-label">gate result</p>
                    <pre><code>${escHtml(BUILD_REPORT)}</code></pre>
                    <div class="mini-report">
                      <div class="metric"><strong>18 packages</strong><span>published in graph order</span></div>
                      <div class="metric"><strong>0 cycles</strong><span>checked before publish</span></div>
                      <div class="metric"><strong>@lessjs/runtime</strong><span>authoring facade</span></div>
                      <div class="metric"><strong>@lessjs/protocols</strong><span>shared contracts</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="proof-strip">
              <div class="proof"><strong>DSD</strong><span>HTML includes declarative shadow roots before JavaScript runs.</span></div>
              <div class="proof"><strong>Islands</strong><span>load, idle, visible, and only remain explicit upgrade choices.</span></div>
              <div class="proof"><strong>SSG</strong><span>Static output is the production default; edge ISR is deferred.</span></div>
              <div class="proof"><strong>Hono API</strong><span>API routes use the Fetch-native Hono substrate.</span></div>
              <div class="proof"><strong>Protocols</strong><span>Build contracts do not live under adapter internals.</span></div>
              <div class="proof"><strong>Hub</strong><span>Package evidence stays separate from marketplace claims.</span></div>
            </div>
          </section>

          <section class="band">
            <div class="band-inner">
              <div class="section-head">
                <div>
                  <p class="section-kicker">build path</p>
                  <h2 class="section-title">From command to artifact.</h2>
                </div>
                <p class="section-copy">
                  LessJS documentation should start from the thing a user can
                  run, then show the generated files, rendered output, and the
                  gates that prove the package graph.
                </p>
              </div>
              <div class="path-grid">
                <div class="path-step"><b>1</b><h3>Create</h3><p>Scaffold a project from the unified JSR package set.</p></div>
                <div class="path-step"><b>2</b><h3>Author</h3><p>Write components from the runtime facade.</p></div>
                <div class="path-step"><b>3</b><h3>Route</h3><p>Use file routes, islands, content, i18n, and Hono APIs.</p></div>
                <div class="path-step"><b>4</b><h3>Build</h3><p>Emit DSD HTML, island chunks, sitemap, and reports.</p></div>
                <div class="path-step"><b>5</b><h3>Inspect</h3><p>Read package graph output and DSD reports.</p></div>
                <div class="path-step"><b>6</b><h3>Deploy</h3><p>Ship static output now; resume edge ISR in v0.24.</p></div>
              </div>
            </div>
          </section>

          <section class="band">
            <div class="band-inner">
              <div class="section-head">
                <div>
                  <p class="section-kicker">architecture truth</p>
                  <h2 class="section-title">Layers with owners.</h2>
                </div>
                <p class="section-copy">
                  v0.23.0 is a package architecture release. It removes
                  wrong-owner build contracts and makes facades explicit.
                </p>
              </div>
              <div class="architecture-grid">
                <div class="layer-map">
                  <div class="layer"><strong>tools and gates</strong><span>create, graph checker, publish workflow, smoke tests</span></div>
                  <div class="layer"><strong>product facades</strong><span>@lessjs/app for config, @lessjs/runtime for authoring</span></div>
                  <div class="layer"><strong>build adapters</strong><span>adapter-vite owns Vite and SSG implementation</span></div>
                  <div class="layer"><strong>features</strong><span>content, i18n, hub, ui, cem, compat-check</span></div>
                  <div class="layer"><strong>runtime kernel</strong><span>core owns DSD runtime, templates, navigation, logger</span></div>
                  <div class="layer"><strong>protocols</strong><span>shared build contracts and virtual ids</span></div>
                </div>
                <div class="owner-table">
                  <div class="owner-row"><code>@lessjs/protocols</code><span>shared build contracts</span></div>
                  <div class="owner-row"><code>@lessjs/runtime</code><span>component authoring facade</span></div>
                  <div class="owner-row"><code>@lessjs/app</code><span>configuration facade</span></div>
                  <div class="owner-row"><code>@lessjs/signals</code><span>alien-signals facade</span></div>
                  <div class="owner-row"><code>@lessjs/core</code><span>small runtime kernel</span></div>
                  <div class="owner-row"><code>@lessjs/create</code><span>generated project contract</span></div>
                </div>
              </div>
            </div>
          </section>

          <section class="band">
            <div class="band-inner">
              <div class="section-head">
                <div>
                  <p class="section-kicker">release truth</p>
                  <h2 class="section-title">Shipped, current, deferred.</h2>
                </div>
                <p class="section-copy">
                  The site should not sell deferred capability as shipped. The
                  current line is architecture integrity; edge full-stack work
                  resumes after this package graph stays clean.
                </p>
              </div>
              <div class="status-grid">
                <div class="status-card"><span class="chip success">Done</span><h3>v0.21 Reactive DSD</h3><p>Safe templates, DsdElement reactivity, streaming DSD.</p></div>
                <div class="status-card"><span class="chip success">Done</span><h3>v0.22 Architecture Integrity</h3><p>Consumer surface cleanup, adapter cleanup, release gates.</p></div>
                <div class="status-card"><span class="chip current">Current</span><h3>v0.23 Layered Architecture</h3><p>Protocols, runtime facade, app facade, graph gate.</p></div>
                <div class="status-card"><span class="chip">Deferred</span><h3>v0.24 Edge Full-Stack</h3><p>ISR handlers, KV adapters, deploy parity, showcase proof.</p></div>
              </div>
            </div>
          </section>

          <footer class="footer">
            <div class="band-inner">
              <p>LessJS v0.23.0: smaller core, explicit facades, checked package graph.</p>
              <a href="/changelog">Read changelog -></a>
            </div>
          </footer>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);
export default DocsHome;

export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
export const tagName = 'engine-architecture';

import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
  }

  .shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 44px var(--size-6) 72px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
    gap: var(--size-7);
    align-items: start;
    padding-bottom: var(--size-8);
    border-bottom: 1px solid var(--border);
  }

  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
    margin-bottom: var(--size-5);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: var(--size-7);
    padding: 0 var(--size-3);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--gray-1);
    color: var(--text-muted);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-7);
  }

  .chip.current {
    color: var(--brand);
    border-color: rgba(81, 72, 184, 0.28);
    background: rgba(81, 72, 184, 0.08);
  }

  .chip.pass {
    color: var(--brand-deep);
    border-color: rgba(19, 121, 91, 0.26);
    background: rgba(19, 121, 91, 0.08);
  }

  h1 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .lede {
    margin: var(--size-5) 0 0;
    color: var(--text-muted);
    font-size: var(--font-size-4);
    line-height: var(--font-lineheight-4);
    max-width: 650px;
  }

  .artifact {
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    overflow: hidden;
    background: var(--gray-1);
    box-shadow: 0 20px 54px rgba(20, 24, 36, 0.1);
  }

  .artifact-head {
    display: flex;
    justify-content: space-between;
    gap: var(--size-3);
    padding: 14px var(--size-4);
    border-bottom: 1px solid var(--border);
    background: var(--gray-1);
    font-size: var(--font-size-0);
    color: var(--text-muted);
  }

  pre {
    margin: 0;
    padding: var(--size-4);
    overflow-x: auto;
    background: var(--gray-1);
    color: var(--gray-11);
    font-size: var(--font-size-0);
    line-height: 1.65;
  }

  code {
    font-family: "JetBrains Mono", "SF Mono", "Consolas", monospace;
  }

  .section {
    padding: var(--size-10) 0 0;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: var(--size-6);
    margin-bottom: var(--size-5);
  }

  .kicker {
    margin: 0 0 var(--size-2);
    color: var(--brand);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: clamp(1.6rem, 4vw, 2.6rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .section-copy {
    max-width: 460px;
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-4);
  }

  .layer-map {
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--gray-1);
    overflow: hidden;
  }

  .layer {
    display: grid;
    grid-template-columns: 170px 1fr 180px;
    gap: var(--size-4);
    padding: 14px var(--size-4);
    border-bottom: 1px solid var(--border);
    align-items: start;
  }

  .layer:last-child {
    border-bottom: 0;
  }

  .layer strong {
    color: var(--text-primary);
    font-size: var(--font-size-1);
  }

  .layer span,
  .layer p {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-size-0);
    line-height: 1.55;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--size-3);
  }

  .card {
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--gray-1);
    padding: var(--size-4);
  }

  .card h3 {
    margin: 0 0 var(--size-2);
    color: var(--text-primary);
    font-size: var(--font-size-3);
  }

  .card p {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-size-1);
    line-height: 1.65;
  }

  .gate-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--size-3);
  }

  .gate {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: var(--size-3);
    align-items: start;
    padding: var(--size-4);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--gray-1);
  }

  .gate strong {
    color: var(--brand-deep);
    font-size: var(--font-size-1);
  }

  .gate span {
    color: var(--text-muted);
    font-size: var(--font-size-0);
    line-height: 1.55;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: var(--size-8);
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    min-height: var(--size-10);
    padding: 0 14px;
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--gray-1);
    color: var(--text-primary);
    text-decoration: none;
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-7);
  }

  @media (max-width: 900px) {
    .hero,
    .cards,
    .gate-grid {
      grid-template-columns: 1fr;
    }

    .layer {
      grid-template-columns: 1fr;
      gap: var(--size-2);
    }
  }

  @media (max-width: 560px) {
    .shell {
      padding: var(--size-8) var(--size-4) 56px;
    }

    .section-head,
    .gate {
      grid-template-columns: 1fr;
      display: grid;
    }
  }
`);

const GRAPH = `protocols
  -> content
  -> i18n
  -> adapter-vite

style-sheet -> core -> runtime -> ui
signals ----^

cem -> compat-check -> hub
content -> adapter-vite -> app`;

export class ArchitecturePage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, pageSheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return (
      <less-layout
        locale={this._getLocale('en')}
        locales={JSON.stringify(['en', 'zh'])}
        nav-items={JSON.stringify(navSections)}
        header-nav={JSON.stringify(headerNav)}
        current-path='/architecture/architecture'
      >
        <div class="shell">
          <section class="hero">
            <div>
              <div class="eyebrow">
                <span class="chip current">ADR-0050</span>
                <span class="chip current">v0.23.0</span>
                <span class="chip pass">graph gate passing</span>
              </div>
              <h1>{isZh ? '分层包架构' : 'Layered Package Architecture'}</h1>
              <p class="lede">
                LessJS is now organized around explicit package ownership:
                protocols own shared contracts, core stays the runtime kernel,
                runtime owns authoring imports, app owns configuration, and
                adapter-vite owns Vite implementation.
              </p>
            </div>
            <div class="artifact">
              <div class="artifact-head">
                <strong>package graph sketch</strong>
                <span>source imports declared per package</span>
              </div>
              <pre><code>{GRAPH}</code></pre>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="kicker">layers</p>
                <h2>{isZh ? '依赖方向是 API 的一部分。' : 'Dependency direction is part of the API.'}</h2>
              </div>
              <p class="section-copy">
                v0.23.0 makes package responsibility inspectable. Feature
                packages use protocols for shared build contracts instead of
                adapter internals, and ordinary users write components from the
                runtime facade.
              </p>
            </div>
            <div class="layer-map">
              <div class="layer"><strong>tools and gates</strong><span>create, graph checker, publish workflow, smoke tests</span><p>Prove generated users, release order, and docs truth.</p></div>
              <div class="layer"><strong>product facades</strong><span>@lessjs/core, @lessjs/app</span><p>Separate authoring imports from configuration assembly.</p></div>
              <div class="layer"><strong>build adapters</strong><span>@lessjs/adapter-vite</span><p>Own Vite plugin assembly, route scanning, SSG phases, and generated entries.</p></div>
              <div class="layer"><strong>feature packages</strong><span>content, i18n, hub, ui, cem, compat-check</span><p>Own product features and evidence surfaces without routing through core.</p></div>
              <div class="layer"><strong>runtime kernel</strong><span>@lessjs/core</span><p>Own DSD runtime, templates, renderDsd, islands, navigation, logger, and errors.</p></div>
              <div class="layer"><strong>protocols</strong><span>@lessjs/protocols</span><p>Own dependency-light shared build contracts and virtual ids.</p></div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="kicker">why it exists</p>
                <h2>{isZh ? '精简核心，诚实的 facade。' : 'Small core, honest facades.'}</h2>
              </div>
              <p class="section-copy">
                The framework can only grow if users, contributors, and release
                automation agree about which package owns each concept.
              </p>
            </div>
            <div class="cards">
              <div class="card">
                <h3>{isZh ? '为什么需要 protocols？' : 'Why protocols?'}</h3>
                <p>Content, i18n, and adapter-vite need shared build contracts. Those contracts are not Vite implementation and should not live under adapter-vite.</p>
              </div>
              <div class="card">
                <h3>{isZh ? '为什么需要 runtime？' : 'Why runtime?'}</h3>
                <p>Generated components need a single authoring import. Runtime provides that without turning core into an all-purpose DX barrel.</p>
              </div>
              <div class="card">
                <h3>{isZh ? '为什么需要 signals facade？' : 'Why signals facade?'}</h3>
                <p>LessJS uses alien-signals as the engine. The public LessJS contract is .value, subscribe(), and DSD integration semantics.</p>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="kicker">release gates</p>
                <h2>{isZh ? '架构由机械检查保证。' : 'The architecture is checked mechanically.'}</h2>
              </div>
              <p class="section-copy">
                The root import map can hide missing dependencies during local
                development. The graph gate checks package-local truth before
                publishing.
              </p>
            </div>
            <div class="gate-grid">
              <div class="gate"><strong>0 cycles</strong><span>Internal LessJS package dependencies must remain acyclic.</span></div>
              <div class="gate"><strong>18 packages</strong><span>Every package in packages/ must be present in the publish workflow.</span></div>
              <div class="gate"><strong>direct imports</strong><span>Each source-level @lessjs/* import must be declared in that package's deno.json.</span></div>
              <div class="gate"><strong>0.23.0</strong><span>Unified version releases keep JSR packages resolvable as one set.</span></div>
            </div>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/roadmap">Roadmap truth {'->'}</a>
            <a class="nav-link" href="/changelog">Changelog {'->'}</a>
            <a class="nav-link" href="/guide/getting-started">Start building {'->'}</a>
          </nav>
        </div>
      </less-layout>
    );
  }
}

customElements.define(tagName, ArchitecturePage);
export default ArchitecturePage;

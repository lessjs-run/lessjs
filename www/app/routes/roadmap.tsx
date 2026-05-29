export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// ADR-0037 anchors: DSD-first. Version: v0.21, v0.22, v0.23.
// Legacy smoke anchors: WC Package Protocol, Six-Phase Vision, Registry Hub, No webpack.

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { headerNav, navSections } from '@lessjs/content/nav';
import '@lessjs/ui/less-layout';
import '../islands/less-search.tsx';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    --road-ink: #14151d;
    --road-muted: #626676;
    --road-border: rgba(20, 24, 36, 0.12);
    --road-accent: #5148b8;
    --road-success: #13795b;
    --road-warning: #a05a00;
  }

  :host([data-theme="dark"]) {
    --road-ink: #f4f6fb;
    --road-muted: #a7adbd;
    --road-border: rgba(225, 231, 242, 0.16);
    --road-accent: #9b93ff;
    --road-success: #6bd7af;
    --road-warning: #f2ba66;
  }

  :host([data-theme="dark"]) .now,
  :host([data-theme="dark"]) .phase,
  :host([data-theme="dark"]) .truth {
    background: #11131a;
  }

  .shell {
    max-width: 1080px;
    margin: 0 auto;
    padding: 44px 24px 72px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 28px;
    align-items: start;
    padding-bottom: 30px;
    border-bottom: 1px solid var(--road-border);
  }

  h1 {
    margin: 0;
    color: var(--road-ink);
    font-size: clamp(2.6rem, 7vw, 5rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 690px;
    margin: 18px 0 0;
    color: var(--road-muted);
    font-size: 16px;
    line-height: 1.75;
  }

  .now {
    border: 1px solid var(--road-border);
    border-radius: 8px;
    background: #fff;
    padding: 16px;
  }

  .now span,
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(81, 72, 184, 0.28);
    border-radius: 6px;
    background: rgba(81, 72, 184, 0.08);
    color: var(--road-accent);
    font-size: 12px;
    font-weight: 750;
  }

  .now h2 {
    margin: 14px 0 8px;
    color: var(--road-ink);
    font-size: 18px;
  }

  .now p {
    margin: 0;
    color: var(--road-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .timeline {
    margin-top: 32px;
    display: grid;
    gap: 12px;
  }

  .phase {
    display: grid;
    grid-template-columns: 110px 1fr 140px;
    gap: 16px;
    align-items: start;
    border: 1px solid var(--road-border);
    border-radius: 8px;
    background: #fff;
    padding: 16px;
  }

  .version {
    color: var(--road-accent);
    font-size: 13px;
    font-weight: 800;
  }

  .phase h3 {
    margin: 0 0 8px;
    color: var(--road-ink);
    font-size: 16px;
  }

  .phase p {
    margin: 0;
    color: var(--road-muted);
    font-size: 13px;
    line-height: 1.65;
  }

  .status {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 750;
    border: 1px solid var(--road-border);
  }

  .done {
    color: var(--road-success);
    border-color: rgba(19, 121, 91, 0.26);
    background: rgba(19, 121, 91, 0.08);
  }

  .current {
    color: var(--road-accent);
    border-color: rgba(81, 72, 184, 0.28);
    background: rgba(81, 72, 184, 0.08);
  }

  .planned {
    color: var(--road-warning);
    border-color: rgba(160, 90, 0, 0.24);
    background: rgba(160, 90, 0, 0.08);
  }

  .truth-grid {
    margin-top: 34px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .truth {
    border: 1px solid var(--road-border);
    border-radius: 8px;
    background: #fff;
    padding: 16px;
  }

  .truth h2 {
    margin: 0 0 10px;
    color: var(--road-ink);
    font-size: 16px;
  }

  .truth p,
  .truth li {
    color: var(--road-muted);
    font-size: 13px;
    line-height: 1.65;
  }

  .truth p {
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  .nav-row {
    margin-top: 34px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--road-border);
    border-radius: 7px;
    background: #fff;
    color: var(--road-ink);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 820px) {
    .hero,
    .phase,
    .truth-grid {
      grid-template-columns: 1fr;
    }

    .status {
      justify-self: start;
    }
  }

  @media (max-width: 560px) {
    .shell {
      padding: 32px 16px 56px;
    }
  }
`);

export class RoadmapPage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/roadmap"
        full-width
      >
        <div class="shell"
          data-legacy-anchors="WC Package Protocol Six-Phase Vision No webpack Registry Hub"
        >
          <section class="hero">
            <div>
              <h1>Roadmap</h1>
              <p class="subtitle">
                LessJS roadmap labels are product truth, not aspiration. v0.23.0
                is the current architecture line: protocols, runtime facade,
                app facade, publish order, and package graph gates. Edge
                Full-Stack resumes in v0.24 after the graph stays clean.
              </p>
            </div>
            <aside class="now">
              <span>current line</span>
              <h2>v0.23.x Layered Package Architecture</h2>
              <p>Implemented in 0.23.0. All 18 packages are aligned to the same version.</p>
            </aside>
          </section>

          <div class="timeline">
            <div class="phase">
              <div class="version">v0.21.x</div>
              <div><h3>Reactive DSD</h3><p>DsdElement reactivity, safe templates, streaming DSD, and island strategy vocabulary.</p></div>
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.22.x</div>
              <div><h3>Architecture Integrity</h3><p>Consumer surface cleanup, adapter cleanup, signals facade hardening, and release gate repairs.</p></div>
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.23.x</div>
              <div><h3>Layered Package Architecture</h3><p>Protocols own shared contracts, runtime owns authoring imports, app owns configuration, and graph checks enforce package truth.</p></div>
              <span class="status current">Current</span>
            </div>
            <div class="phase">
              <div class="version">v0.24.x</div>
              <div><h3>Edge Full-Stack</h3><p>ISR production handlers, KV adapters, deployment parity, and www showcase proof.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.25.x</div>
              <div><h3>Ecosystem Hardening</h3><p>Hub trust policy, more real package evidence, compatibility growth, and package author guidance.</p></div>
              <span class="status planned">Planned</span>
            </div>
          </div>

          <div class="truth-grid">
            <div class="truth">
              <h2>Shipped</h2>
              <ul>
                <li>SSG + Declarative Shadow DOM</li>
                <li>Reactive DSD authoring</li>
                <li>Hono API route substrate</li>
                <li>JSR generated project flow</li>
              </ul>
            </div>
            <div class="truth">
              <h2>Current</h2>
              <ul>
                <li>@lessjs/protocols</li>
                <li>@lessjs/runtime</li>
                <li>package graph gate</li>
                <li>docs architecture truth</li>
              </ul>
            </div>
            <div class="truth">
              <h2>Deferred</h2>
              <ul>
                <li>ISR production handler</li>
                <li>CF Workers KV and Deno KV adapters</li>
                <li>v1.0 API freeze</li>
                <li>generic auth or ORM systems</li>
              </ul>
            </div>
          </div>

          <nav class="nav-row">
            <a class="nav-link" href="/engine/architecture/">Architecture -></a>
            <a class="nav-link" href="/changelog">Changelog -></a>
            <a class="nav-link" href="/guide/deployment">Deployment -></a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;

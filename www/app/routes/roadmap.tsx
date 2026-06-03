export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// ADR-0037 anchors: DSD-first. Version: v0.21, v0.22, v0.23.
// Legacy smoke anchors: WC Package Protocol, Six-Phase Vision, Registry Hub, No webpack.

import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '../islands/less-search.tsx';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
  }

  :host([data-theme="dark"]) .now,
  :host([data-theme="dark"]) .phase,
  :host([data-theme="dark"]) .truth {
    background: var(--gray-0);
  }

  .shell {
    max-width: 1080px;
    margin: 0 auto;
    padding: 44px var(--size-6) 72px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: var(--size-7);
    align-items: start;
    padding-bottom: 30px;
    border-bottom: 1px solid var(--gray-3);
  }

  h1 {
    margin: 0;
    color: var(--gray-10);
    font-size: clamp(2.6rem, 7vw, 5rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 690px;
    margin: 18px 0 0;
    color: var(--gray-6);
    font-size: var(--font-size-4);
    line-height: var(--font-lineheight-4);
  }

  .now {
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .now span,
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: var(--size-7);
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--indigo-5) 28%, transparent);
    border-radius: var(--radius-2);
    background: color-mix(in srgb, var(--indigo-5) 8%, transparent);
    color: var(--indigo-5);
    font-size: var(--font-size-0);
    font-weight: 750;
  }

  .now h2 {
    margin: 14px 0 var(--size-2);
    color: var(--gray-10);
    font-size: 18px;
  }

  .now p {
    margin: 0;
    color: var(--gray-6);
    font-size: var(--font-size-1);
    line-height: 1.6;
  }

  .timeline {
    margin-top: var(--size-8);
    display: grid;
    gap: var(--size-3);
  }

  .phase {
    display: grid;
    grid-template-columns: 110px 1fr 140px;
    gap: var(--size-4);
    align-items: start;
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .version {
    color: var(--indigo-5);
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-8);
  }

  .phase h3 {
    margin: 0 0 var(--size-2);
    color: var(--gray-10);
    font-size: var(--font-size-4);
  }

  .phase p {
    margin: 0;
    color: var(--gray-6);
    font-size: var(--font-size-1);
    line-height: 1.65;
  }

  .status {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    min-height: var(--size-7);
    padding: 0 10px;
    border-radius: var(--radius-2);
    font-size: var(--font-size-0);
    font-weight: 750;
    border: 1px solid var(--gray-3);
  }

  .done {
    color: var(--green-6);
    border-color: color-mix(in srgb, var(--green-6) 26%, transparent);
    background: color-mix(in srgb, var(--green-6) 8%, transparent);
  }

  .current {
    color: var(--indigo-5);
    border-color: color-mix(in srgb, var(--indigo-5) 28%, transparent);
    background: color-mix(in srgb, var(--indigo-5) 8%, transparent);
  }

  .planned {
    color: var(--orange-6);
    border-color: color-mix(in srgb, var(--orange-6) 24%, transparent);
    background: color-mix(in srgb, var(--orange-6) 8%, transparent);
  }

  .truth-grid {
    margin-top: 34px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--size-3);
  }

  .truth {
    border: 1px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
    padding: var(--size-4);
  }

  .truth h2 {
    margin: 0 0 10px;
    color: var(--gray-10);
    font-size: var(--font-size-4);
  }

  .truth p,
  .truth li {
    color: var(--gray-6);
    font-size: var(--font-size-1);
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
    min-height: var(--size-10);
    padding: 0 14px;
    border: 1px solid var(--gray-3);
    border-radius: 7px;
    background: var(--gray-0);
    color: var(--gray-10);
    text-decoration: none;
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-7);
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
      padding: var(--size-8) var(--size-4) 56px;
    }
  }
`);

export class RoadmapPage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      
        <div class="shell"
          data-legacy-anchors="WC Package Protocol Six-Phase Vision No webpack Registry Hub"
        >
          <section class="hero">
            <div>
              <h1>Roadmap</h1>
              <p class="subtitle">
                LessJS roadmap labels are product truth, not aspiration. The current
                line is v0.29.2 — structured renderer IR, single async render path,
                core simplification (33→26 files), and unified attribute serialization.
              </p>
            </div>
            <aside class="now">
              <span>current line</span>
              <h2>v0.29.2 Core Simplification</h2>
              <p>19 packages aligned. renderDsdTree is the only public rendering API.</p>
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
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.28.x</div>
              <div><h3>Cleanup Arc</h3><p>Hygiene convergence, deprecated purge, closure+MDX, AppShell protocol, consumer resolver patch, build pipeline cleanup.</p></div>
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.29.x</div>
              <div><h3>Renderer IR + Simplification</h3><p>Structured RenderNode IR, unified attribute serialization, single async render path, core 33→26 files, renderToString removed.</p></div>
              <span class="status current">Current</span>
            </div>
            <div class="phase">
              <div class="version">v0.30.x</div>
              <div><h3>UI Dual-Track + v1.0 Freeze</h3><p>Ocean/Island UI split, API freeze line, v1.0 release preparation.</p></div>
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
                <li>@lessjs/core</li>
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
            <a class="nav-link" href="/architecture/architecture">Architecture {'->'}</a>
            <a class="nav-link" href="/changelog">Changelog {'->'}</a>
            <a class="nav-link" href="/guide/deployment">Deployment {'->'}</a>
          </nav>
        </div>
      
    );
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;

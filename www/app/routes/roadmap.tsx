export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

// ADR-0037 anchors: DSD-first. Version: v0.33, v1.0.
// Legacy smoke anchors: WC Package Protocol, Six-Phase Vision, Registry Hub, No webpack.

import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '../islands/open-search.tsx';

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
      
      <div
        class="shell"
        data-legacy-anchors="WC Package Protocol Six-Phase Vision No webpack Registry Hub"
      >
          <section class="hero">
            <div>
              <h1>Roadmap</h1>
              <p class="subtitle">
                openElement roadmap labels are product truth, not aspiration. The current
                line is v0.33.0: AI-Readable API Foundation with structured page, island, and head intents.
                The next line is v0.34.0: AutoFlow2 Sidecar Kernel for machine-readable workflow evidence.
              </p>
            </div>
            <aside class="now">
              <span>current line</span>
              <h2>v0.33.0 AI-Readable API</h2>
              <p>Structured page, island, and head intents. One authoring path. Foundation for AutoFlow2.</p>
            </aside>
          </section>

          <div class="timeline">
            <div class="phase">
              <div class="version">v0.30.x</div>
              <div><h3>Architecture Contract Freeze</h3><p>One renderer model, one metadata boundary, openElement rename, and cleanup gates.</p></div>
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.31.0</div>
              <div><h3>JSX-first Application API</h3><p>definePage, defineIsland, defineElement, defineLayout, and the @openelement/app/vite split.</p></div>
              <span class="status done">Done</span>
            </div>
            <div class="phase">
              <div class="version">v0.32.0</div>
              <div><h3>App Lifecycle Contract</h3><p>Route params, load context, route metadata, redirect, not-found, error fallback, rendering intent, and streaming intent.</p></div>
              <span class="status current">Current</span>
            </div>
            <div class="phase">
              <div class="version">v0.33.0</div>
              <div><h3>AI-Readable API Foundation</h3><p>Object-form pages, structured head/route/render intent, explicit island metadata, and old API rejection proof.</p></div>
              <span class="status planned">Next</span>
            </div>
            <div class="phase">
              <div class="version">v0.34.0</div>
              <div><h3>AutoFlow2 Sidecar Kernel</h3><p>Workflow state, cells, evidence ledger, blockers, and allowed-action report without automatic edits.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.35.0</div>
              <div><h3>AutoFlow2 Harness Gate</h3><p>Low-noise workflow contradictions become local and CI blockers through model-backed checks.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.36.0</div>
              <div><h3>Rendering Runtime and Deployment</h3><p>Productized SSR, ISR, streaming DSD, cache adapters, and deployment recipes under AutoFlow evidence.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.37.0</div>
              <div><h3>Server/Data/UI Product Closure</h3><p>Server routes, mutations, data recipes, UI starters, Hub disposition, package inventory, and pruning evidence.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.38.0</div>
              <div><h3>Public Surface Reset</h3><p>Final package/product surface reset before the v1 release candidate.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v0.39.0</div>
              <div><h3>v1 Release Candidate</h3><p>Validate final APIs, docs, starters, deploy smoke, consumer smoke, and publish gates.</p></div>
              <span class="status planned">Planned</span>
            </div>
            <div class="phase">
              <div class="version">v1.0.0</div>
              <div><h3>Stable Engine + AutoFlow Default</h3><p>Freeze the proven API surface with workflow evidence as part of the default release gate.</p></div>
              <span class="status planned">Planned</span>
            </div>
          </div>

          <div class="truth-grid">
            <div class="truth">
              <h2>Shipped</h2>
              <ul>
                <li>JSX-first Application API</li>
                <li>Structured Renderer IR + single async path</li>
                <li>SSG + Declarative Shadow DOM</li>
                <li>Hono API routes + MDX support</li>
                <li>AppShell protocol + signal-driven islands</li>
              </ul>
            </div>
            <div class="truth">
              <h2>Current</h2>
              <ul>
                <li>v0.32.0 App Lifecycle Contract</li>
                <li>Route params, load, metadata, redirect, and not-found</li>
                <li>AutoWorkflow execution and v0.33 package</li>
                <li>19-package aligned monorepo</li>
              </ul>
            </div>
            <div class="truth">
              <h2>Deferred</h2>
              <ul>
                <li>AutoFlow2 sidecar and harness gate</li>
                <li>ISR / Edge SSR production handler</li>
                <li>CF Workers KV and Deno KV adapters</li>
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

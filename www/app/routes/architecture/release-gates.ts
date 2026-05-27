/**
 * Architecture: Release Gates - v0.23.
 *
 * The 8 mechanical gates that must pass before any LessJS release.
 */
export const meta = { section: 'Principles', label: 'Release Gates', order: 5 };
export const tagName = 'arch-release-gates';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { filterArchitectureNav } from '../../utils/nav-filter.ts';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; --ink:#14151d; --muted:#626676; --border:rgba(20,24,36,0.12); --accent:#5148b8; --success:#13795b; }
  .shell { max-width:900px; margin:0 auto; padding:44px 24px 72px; }
  h1 { margin:0; color:var(--ink); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  .lede { margin:18px 0 0; color:var(--muted); font-size:16px; line-height:1.75; }
  .section { padding:36px 0 0; }
  h2 { margin:0 0 12px; color:var(--ink); font-size:clamp(1.4rem,3vw,2rem); line-height:1.08; }
  p, li { color:var(--muted); font-size:14px; line-height:1.75; }
  ul { padding-left:20px; } li { margin-bottom:6px; }
  .chip { display:inline-flex; align-items:center; min-height:26px; margin-bottom:14px; padding:0 8px; border-radius:5px; font-size:11px; font-weight:750; color:var(--success); border:1px solid rgba(19,121,91,0.22); background:rgba(19,121,91,0.06); }
  .gates { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:16px; }
  .gate { border:1px solid var(--border); border-radius:8px; background:#fff; padding:14px; }
  .gate strong { display:block; margin-bottom:6px; color:var(--ink); font-size:13px; }
  .gate span { color:var(--muted); font-size:12px; line-height:1.55; }
  .gate em { display:inline-block; margin-top:6px; padding:2px 8px; border-radius:4px; background:#11131a; color:#eef1f7; font-size:11px; font-style:normal; font-family:"JetBrains Mono","SF Mono","Consolas",monospace; }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:34px; border-top:1px solid var(--border); padding-top:28px; }
  .nav-link { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; border:1px solid var(--border); border-radius:7px; background:#fff; color:var(--ink); text-decoration:none; font-size:13px; font-weight:700; }
  @media (max-width:680px) { .gates { grid-template-columns:1fr; } }
  @media (max-width:560px) { .shell { padding:32px 16px 56px; } }
`);

export class ReleaseGatesPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture/release-gates"
      >
        <div class="shell">
          <span class="chip">8 gates</span>
          <h1>Release Gates</h1>
          <p class="lede">
            Eight mechanical gates must pass before any LessJS version can be
            published. They prevent regressions in formatting, types, tests,
            build output, DSD conformance, Hub integrity, package graph, and
            documentation.
          </p>

          <section class="section">
            <h2>Gate checklist</h2>
            <div class="gates">
              <div class="gate"><strong>fmt:check</strong><span>All source files conform to deno fmt.</span><em>deno fmt --check</em></div>
              <div class="gate"><strong>lint</strong><span>No unused variables, no implicit any, no dead code.</span><em>deno lint</em></div>
              <div class="gate"><strong>typecheck</strong><span>All packages pass type checking without errors.</span><em>deno task typecheck</em></div>
              <div class="gate"><strong>test</strong><span>Unit and integration tests pass (905+ tests).</span><em>deno task test</em></div>
              <div class="gate"><strong>build</strong><span>www builds successfully with deno task build:docs.</span><em>deno task build:docs</em></div>
              <div class="gate"><strong>dsd:check-report</strong><span>DSD conformance report: 0 unknown DSD gates.</span><em>deno task dsd:check-report</em></div>
              <div class="gate"><strong>hub:validate</strong><span>Hub manifests are valid with correct hashes.</span><em>deno task hub:validate</em></div>
              <div class="gate"><strong>graph:check</strong><span>Package graph: 0 cycles, 0 undeclared imports.</span><em>deno task graph:check</em></div>
            </div>
          </section>

          <section class="section">
            <h2>CI enforcement</h2>
            <p>
              All 8 gates run in GitHub Actions on every push to dev and main.
              Publish is blocked if any gate fails. The graph gate runs as a
              separate job to isolate architecture violations from type errors.
            </p>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/architecture/package-graph">← Package Graph</a>
            <a class="nav-link" href="/architecture">Architecture overview →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('arch-release-gates', ReleaseGatesPage);
export default ReleaseGatesPage;

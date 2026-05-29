/**
 * LessJS Benchmark & Performance
 *
 * Zero-noise performance characteristics: SSG build time, DSD rendering,
 * cold start, bundle size. No cherry-picked micro-benchmarks.
 */
export const meta = { section: 'Reference', label: 'Performance', order: 100 };

import { headerNav, navSections } from '@lessjs/content/nav';
import { filterArchitectureNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const styles = new StyleSheet();
styles.replaceSync(pageStyles + `
  .metric { display:grid; grid-template-columns: 120px 1fr; gap:0.5rem 1rem; margin:1rem 0; }
  .metric .label { color:var(--text-muted); font-size:0.75rem; }
  .metric .value { color:var(--text-primary); font-weight:600; }
`);

export default class Benchmark extends DsdElement {
  static styles = [openPropsTokenSheet, styles];

  _renderEn() {
    return (
      <less-layout navItems={JSON.stringify(filterArchitectureNav(navSections))} headerNav={JSON.stringify(headerNav)} currentPath="/architecture/benchmark">
        <div class='container'>
          <h1>Performance & Benchmarks</h1>
          <p class='subtitle'>Zero-noise. What we actually measure.</p>

          <h2>Build Performance</h2>
          <div class='metric'><span class='label'>SSG build (www)</span><span class='value'>~3s (37 pages, 478 URLs)</span></div>
          <div class='metric'><span class='label'>Dev cold start</span><span class='value'>~100ms (deno task dev:fast)</span></div>
          <div class='metric'><span class='label'>Vite dev start</span><span class='value'>~2s (deno task dev)</span></div>
          <div class='metric'><span class='label'>Client bundle</span><span class='value'>~0 KB (islands only, 2 virtual modules)</span></div>

          <h2>Rendering</h2>
          <div class='metric'><span class='label'>DSD SSR</span><span class='value'>Zero JS parse cost (browser native)</span></div>
          <div class='metric'><span class='label'>Island hydrate</span><span class='value'>Per-component, strategy-gated</span></div>
          <div class='metric'><span class='label'>Route switch (SPA)</span><span class='value'>~0ms (no full page reload)</span></div>

          <h2>Bundle Size</h2>
          <p>LessJS ships zero runtime JS for DSD components. Islands load on-demand by strategy. No framework runtime in the critical path.</p>
        </div>
      </less-layout>
    );
  }

  _renderZh() { return this._renderEn(); }
  override render() { return this._renderEn(); }
}
customElements.define('benchmark-page', Benchmark);
export const tagName = 'benchmark-page';

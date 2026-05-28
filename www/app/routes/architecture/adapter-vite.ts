/**
 * Architecture: Adapter-Vite - v0.23.
 *
 * How @lessjs/adapter-vite owns Vite plugin assembly, SSG orchestration, and build phases.
 */
export const meta = { section: 'Principles', label: 'Adapter-Vite', order: 3 };
export const tagName = 'arch-adapter-vite';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { filterArchitectureNav } from '../../utils/nav-filter.ts';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; --ink:#14151d; --muted:#626676; --border:rgba(20,24,36,0.12); --accent:#5148b8; }
  .shell { max-width:900px; margin:0 auto; padding:44px 24px 72px; }
  h1 { margin:0; color:var(--ink); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  .lede { margin:18px 0 0; color:var(--muted); font-size:16px; line-height:1.75; }
  .section { padding:36px 0 0; }
  h2 { margin:0 0 12px; color:var(--ink); font-size:clamp(1.4rem,3vw,2rem); line-height:1.08; }
  p, li { color:var(--muted); font-size:14px; line-height:1.75; }
  ul { padding-left:20px; } li { margin-bottom:6px; }
  pre { margin:14px 0; padding:14px; border-radius:8px; background:#11131a; color:#eef1f7; overflow-x:auto; font-size:12px; line-height:1.6; border:1px solid rgba(255,255,255,0.08); }
  code { font-family:"JetBrains Mono","SF Mono","Consolas",monospace; }
  .chip { display:inline-flex; align-items:center; min-height:26px; margin-bottom:14px; padding:0 8px; border-radius:5px; font-size:11px; font-weight:750; color:var(--accent); border:1px solid rgba(81,72,184,0.22); background:rgba(81,72,184,0.06); }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:34px; border-top:1px solid var(--border); padding-top:28px; }
  .nav-link { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; border:1px solid var(--border); border-radius:7px; background:#fff; color:var(--ink); text-decoration:none; font-size:13px; font-weight:700; }
  @media (max-width:560px) { .shell { padding:32px 16px 56px; } }
`);

export class AdapterVitePage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture/adapter-vite"
      >
        <div class="shell">
          <span class="chip">v0.23.0</span>
          <h1>Adapter-Vite</h1>
          <p class="lede">
            @lessjs/adapter-vite owns the Vite plugin, SSG pipeline, route
            scanning, generated entries, package resolution, and build
            orchestration. After v0.23.0, shared contracts moved to protocols.
          </p>

          <section class="section">
            <h2>What adapter-vite owns</h2>
            <ul>
              <li><strong>Vite plugin</strong> — config resolution, alias injection, SSR module loading</li>
              <li><strong>Route scanner</strong> — static analysis of route files for tagName, meta, and exports</li>
              <li><strong>Entry renderer</strong> — code generation for SSR bundle entry and virtual modules</li>
              <li><strong>SSG build</strong> — Phase 1 (SSR bundle), Phase 2 (client islands), Phase 3 (static HTML)</li>
              <li><strong>Package resolver</strong> — Island package resolution for external component libraries</li>
            </ul>
          </section>

          <section class="section">
            <h2>What moved to protocols</h2>
            <pre><code>// Moved to @lessjs/protocols in v0.23.0
- build-types.ts     -> @lessjs/protocols/build-types
- virtual-ids.ts     -> @lessjs/protocols/virtual-ids</code></pre>
            <p>
              This separation means content, i18n, and hub no longer import
              from adapter-vite just for type definitions.
            </p>
          </section>

          <section class="section">
            <h2>SSG 3-Phase Pipeline</h2>
            <ul>
              <li><strong>Phase 1</strong>: Vite builds SSR bundle exporting renderRoute(), getStaticPaths(), routeInfo[]</li>
              <li><strong>Phase 2</strong>: Build client island chunks to dist/client/islands/</li>
              <li><strong>Phase 3</strong>: Enumerate paths, call renderRoute(), write static HTML files</li>
            </ul>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/architecture/runtime-kernel">← Runtime Kernel</a>
            <a class="nav-link" href="/architecture/package-graph">Package Graph →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('arch-adapter-vite', AdapterVitePage);
export default AdapterVitePage;

/**
 * Architecture: Protocols - v0.23.
 *
 * Why @lessjs/protocols exists, what it owns, and where it fits in the layer graph.
 */
export const meta = { section: 'Principles', label: 'Protocols', order: 1 };
export const tagName = 'arch-protocols';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { filterArchitectureNav } from '../../utils/nav-filter.ts';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; --ink:#14151d; --muted:#626676; --border:rgba(20,24,36,0.12); --accent:#5148b8; --success:#13795b; }
  .shell { max-width:900px; margin:0 auto; padding:44px 24px 72px; }
  h1 { margin:0; color:var(--ink); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  .lede { margin:18px 0 0; color:var(--muted); font-size:16px; line-height:1.75; }
  .section { padding:36px 0 0; }
  h2 { margin:0 0 12px; color:var(--ink); font-size:clamp(1.4rem,3vw,2rem); line-height:1.08; }
  p, li { color:var(--muted); font-size:14px; line-height:1.75; }
  ul { padding-left:20px; }
  li { margin-bottom:6px; }
  pre { margin:14px 0; padding:14px; border-radius:8px; background:#11131a; color:#eef1f7; overflow-x:auto; font-size:12px; line-height:1.6; border:1px solid rgba(255,255,255,0.08); }
  code { font-family:"JetBrains Mono","SF Mono","Consolas",monospace; }
  .chip { display:inline-flex; align-items:center; min-height:26px; margin-bottom:14px; padding:0 8px; border-radius:5px; font-size:11px; font-weight:750; color:var(--accent); border:1px solid rgba(81,72,184,0.22); background:rgba(81,72,184,0.06); }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:34px; border-top:1px solid var(--border); padding-top:28px; }
  .nav-link { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; border:1px solid var(--border); border-radius:7px; background:#fff; color:var(--ink); text-decoration:none; font-size:13px; font-weight:700; }
  @media (max-width:560px) { .shell { padding:32px 16px 56px; } }
`);

export class ProtocolsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture/protocols"
      >
        <div class="shell">
          <span class="chip">v0.23.0</span>
          <h1>Protocols</h1>
          <p class="lede">
            @lessjs/protocols is a zero-dependency shared contracts package.
            It owns build types, virtual IDs, and type-level interfaces that
            multiple feature packages need without routing through adapter-vite
            internals.
          </p>

          <section class="section">
            <h2>Problem it solves</h2>
            <p>
              Before v0.23.0, <code>build-types.ts</code> and <code>virtual-ids.ts</code>
              lived inside <code>@lessjs/adapter-vite</code>. Content, i18n, and
              hub all imported from adapter-vite just for type definitions. This
              created a misleading dependency: feature packages appeared to depend
              on the Vite build adapter when they only needed shared contracts.
            </p>
          </section>

          <section class="section">
            <h2>What protocols owns</h2>
            <ul>
              <li><strong>build-types</strong> — SSR route info, island metadata, manifest shapes</li>
              <li><strong>virtual-ids</strong> — standardized virtual module identifiers</li>
              <li><strong>package-graph types</strong> — dependency declarations for the graph checker</li>
            </ul>
            <pre><code>// Before v0.23.0
import type { RouteInfo } from '@lessjs/adapter-vite/build-types';

// After v0.23.0
import type { RouteInfo } from '@lessjs/protocols/build-types';</code></pre>
          </section>

          <section class="section">
            <h2>Design rules</h2>
            <ul>
              <li>Zero runtime dependencies — protocols is pure TypeScript types.</li>
              <li>Must not import from any @lessjs/* package.</li>
              <li>All exports are type-level or string constants.</li>
              <li>Consumer packages declare <code>@lessjs/protocols</code> as a dev dependency only.</li>
            </ul>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/architecture">← Architecture</a>
            <a class="nav-link" href="/architecture/runtime-kernel">Runtime Kernel →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('arch-protocols', ProtocolsPage);
export default ProtocolsPage;

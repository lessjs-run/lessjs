/**
 * Architecture: Runtime Kernel - v0.23.
 *
 * Why @lessjs/core is a small runtime kernel after v0.23.0 surgery.
 */
export const meta = { section: 'Principles', label: 'Runtime Kernel', order: 2 };
export const tagName = 'arch-runtime-kernel';

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
  .chip { display:inline-flex; align-items:center; min-height:26px; margin-bottom:14px; padding:0 8px; border-radius:5px; font-size:11px; font-weight:750; color:var(--success); border:1px solid rgba(19,121,91,0.22); background:rgba(19,121,91,0.06); }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:34px; border-top:1px solid var(--border); padding-top:28px; }
  .nav-link { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; border:1px solid var(--border); border-radius:7px; background:#fff; color:var(--ink); text-decoration:none; font-size:13px; font-weight:700; }
  @media (max-width:560px) { .shell { padding:32px 16px 56px; } }
`);

const CORE_EXPORTS = `// packages/core/deno.json — v0.23.0 exports
{
  "exports": {
    ".": "./src/index.ts",
    "./dsd-element": "./src/dsd-element.ts",
    "./render-dsd": "./src/render-dsd.ts",
    "./html": "./src/html.ts",
    "./island": "./src/island.ts",
    "./navigation": "./src/navigation.ts",
    "./logger": "./src/logger.ts",
    "./errors": "./src/errors.ts"
  }
}`;

export class RuntimeKernelPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture/runtime-kernel"
      >
        <div class="shell">
          <span class="chip">Smaller after v0.23</span>
          <h1>Runtime Kernel</h1>
          <p class="lede">
            @lessjs/core is no longer an all-purpose framework barrel. After
            v0.23.0 surgery, it is a focused runtime kernel: DSD element base
            class, template rendering, island registration, navigation, logging,
            and error types.
          </p>

          <section class="section">
            <h2>What was removed</h2>
            <ul>
              <li><strong>Signals</strong> — moved to <code>@lessjs/signals</code></li>
              <li><strong>StyleSheet</strong> — moved to <code>@lessjs/style-sheet</code></li>
              <li><strong>CEM parser</strong> — moved to <code>@lessjs/cem</code></li>
              <li><strong>Compatibility checks</strong> — moved to <code>@lessjs/compat-check</code></li>
              <li><strong>alien-signals</strong> — dependency removed entirely from core</li>
            </ul>
          </section>

          <section class="section">
            <h2>What remains (13 exports)</h2>
            <pre><code>${CORE_EXPORTS}</code></pre>
            <p>
              Core exports exactly the runtime surface needed to render DSD
              components, manage islands, handle navigation, and report errors.
              Everything else is a facade or a feature package.
            </p>
          </section>

          <section class="section">
            <h2>Why this matters</h2>
            <ul>
              <li>No single package becomes a monolith that blocks every change.</li>
              <li>New contributors can understand core in one reading session.</li>
              <li>Release automation can verify that core only imports what it declares.</li>
              <li>The runtime kernel surface is stable enough to document as a public contract.</li>
            </ul>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/architecture/protocols">← Protocols</a>
            <a class="nav-link" href="/architecture/adapter-vite">Adapter-Vite →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('arch-runtime-kernel', RuntimeKernelPage);
export default RuntimeKernelPage;

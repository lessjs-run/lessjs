/**
 * Architecture: Package Graph - v0.23.
 *
 * How the package graph gate mechanically enforces architecture integrity.
 */
export const meta = { section: 'Principles', label: 'Package Graph', order: 4 };
export const tagName = 'arch-package-graph';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from '@lessjs/content/nav';
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
  ul { padding-left:20px; } li { margin-bottom:6px; }
  pre { margin:14px 0; padding:14px; border-radius:8px; background:#11131a; color:#eef1f7; overflow-x:auto; font-size:12px; line-height:1.6; border:1px solid rgba(255,255,255,0.08); }
  code { font-family:"JetBrains Mono","SF Mono","Consolas",monospace; }
  .chip { display:inline-flex; align-items:center; min-height:26px; margin-bottom:14px; padding:0 8px; border-radius:5px; font-size:11px; font-weight:750; color:var(--success); border:1px solid rgba(19,121,91,0.22); background:rgba(19,121,91,0.06); }
  .metric { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .metric strong { color:var(--ink); }
  .metric span { color:var(--muted); }
  .report { border:1px solid var(--border); border-radius:8px; background:#fff; padding:16px; margin-top:16px; }
  .nav-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:34px; border-top:1px solid var(--border); padding-top:28px; }
  .nav-link { display:inline-flex; align-items:center; min-height:40px; padding:0 14px; border:1px solid var(--border); border-radius:7px; background:#fff; color:var(--ink); text-decoration:none; font-size:13px; font-weight:700; }
  @media (max-width:560px) { .shell { padding:32px 16px 56px; } }
`);

export class PackageGraphPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture/package-graph"
      >
        <div class="shell">
          <span class="chip">0 cycles</span>
          <h1>${isZh ? '包依赖图' : 'Package Graph'}</h1>
          <p class="lede">
            ${
      isZh
        ? '每次发布前运行的机械检查。验证 18 个 LessJS 包形成无环图，且每个 @lessjs/* 导入都在对应包的 deno.json 中声明。'
        : "A mechanical check that runs before every publish. It verifies that the 18 LessJS packages form an acyclic graph where every @lessjs/* import is declared in the importing package's deno.json."
    }
          </p>

          <section class="section">
            <h2>${isZh ? '为什么需要它' : 'Why it exists'}</h2>
            <p>
              ${
      isZh
        ? 'Deno 的根 import map 可能在本地开发时隐藏丢失的依赖声明。图门禁检查包级真实情况：每个包的 deno.json 必须声明源码中导入的所有 @lessjs/* 子路径。'
        : "Deno's root import map can hide missing dependency declarations during local development. The graph gate checks package-local truth: each package's deno.json must declare every @lessjs/* subpath it imports in source code."
    }
            </p>
          </section>

          <section class="section">
            <h2>${isZh ? '当前门禁结果' : 'Current gate result'}</h2>
            <div class="report">
              <div class="metric"><strong>18 packages</strong><span>all present in publish workflow</span></div>
              <div class="metric"><strong>0 cycles</strong><span>no circular @lessjs/* dependencies</span></div>
              <div class="metric"><strong>0 undeclared</strong><span>every source import matches deno.json</span></div>
              <div class="metric"><strong>0.23.0</strong><span>unified version across all packages</span></div>
            </div>
          </section>

          <section class="section">
            <h2>${isZh ? '如何运行' : 'How to run'}</h2>
            <pre><code>deno task graph:check</code></pre>
            <p>
              ${
      isZh
        ? '运行 <code>tools/check-package-graph.ts</code>，扫描每个包的源代码中的 <code>@lessjs/*</code> 导入，并与 deno.json 中的依赖声明进行交叉对比。'
        : "This runs <code>tools/check-package-graph.ts</code>, which scans every package's source for <code>@lessjs/*</code> imports and cross-references them against deno.json dependency declarations."
    }
            </p>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/architecture/adapter-vite">← Adapter-Vite</a>
            <a class="nav-link" href="/architecture/release-gates">Release Gates →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('arch-package-graph', PackageGraphPage);
export default PackageGraphPage;

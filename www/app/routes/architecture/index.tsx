/**
 * Architecture landing page - v0.23 artifact-first.
 *
 * Package layers, ownership table, dependency direction, and release gates
 * as a first-class public artifact.
 */
export const meta = { section: 'Principles', label: 'Architecture', order: 0 };
export const tagName = 'page-architecture';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from '@lessjs/content/nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { filterArchitectureNav } from '../../utils/nav-filter.ts';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    --ink: #14151d;
    --muted: #626676;
    --border: rgba(20,24,36,0.12);
    --soft: #f6f7f9;
    --accent: #5148b8;
    --success: #13795b;
    --warning: #a05a00;
  }

  .shell { max-width: 1120px; margin: 0 auto; padding: 44px 24px 72px; }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(380px, 1.05fr);
    gap: 28px;
    align-items: start;
    padding-bottom: 30px;
    border-bottom: 1px solid var(--border);
  }

  .eyebrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #fff;
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
  }

  .chip.current { color: var(--accent); border-color: rgba(81,72,184,0.28); background: rgba(81,72,184,0.08); }
  .chip.pass { color: var(--success); border-color: rgba(19,121,91,0.26); background: rgba(19,121,91,0.08); }

  h1 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
  }

  .lede {
    margin: 18px 0 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.75;
  }

  pre {
    margin: 0;
    padding: 16px;
    border-radius: 8px;
    background: #11131a;
    color: #eef1f7;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.65;
    border: 1px solid rgba(255,255,255,0.08);
  }

  code { font-family: "JetBrains Mono","SF Mono","Consolas",monospace; }

  .section { padding: 42px 0 0; }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  .kicker {
    margin: 0 0 8px;
    color: var(--accent);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h2 { margin: 0; color: var(--ink); font-size: clamp(1.6rem,4vw,2.6rem); line-height: 1.08; }

  .copy { max-width: 460px; margin: 0; color: var(--muted); font-size: 14px; line-height: 1.7; }

  .layer-map, .owner-table {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
  }

  .layer {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    align-items: start;
  }

  .layer:last-child { border-bottom: 0; }
  .layer strong { color: var(--ink); font-size: 13px; }
  .layer span, .layer p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.55; }

  .maps { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 14px; }

  .owner-row {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }

  .owner-row:last-child { border-bottom: 0; }
  .owner-row code { color: var(--accent); }

  .cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }

  .card {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fff;
    padding: 16px;
    text-decoration: none;
    color: inherit;
  }

  .card:hover { border-color: rgba(81,72,184,0.28); }
  .card h3 { margin: 0 0 8px; color: var(--ink); font-size: 15px; }
  .card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }

  .nav-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }

  .nav-link {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: #fff;
    color: var(--ink);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
  }

  @media (max-width: 900px) {
    .hero, .maps, .cards { grid-template-columns: 1fr; }
    .layer { grid-template-columns: 1fr; gap: 6px; }
  }

  @media (max-width: 560px) { .shell { padding: 32px 16px 56px; } }
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
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/architecture"
      >
        <div class="shell">
          <section class="hero">
            <div>
              <div class="eyebrow">
                <span class="chip current">ADR-0050</span>
                <span class="chip current">v0.23.0</span>
                <span class="chip pass">graph gate passing</span>
              </div>
              <h1>${isZh ? '分层包架构' : 'Layered Package Architecture'}</h1>
              <p class="lede">
                LessJS is organized around explicit package ownership:
                protocols own shared contracts, core stays the runtime kernel,
                runtime owns authoring imports, app owns configuration, and
                adapter-vite owns Vite implementation.
              </p>
            </div>
            <div>
              <pre><code>${GRAPH}</code></pre>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="kicker">${isZh ? '分层' : 'Layers'}</p>
                <h2>${
      isZh ? '依赖方向是 API 的一部分。' : 'Dependency direction is part of the API.'
    }</h2>
              </div>
              <p class="copy">
                v0.23.0 makes package responsibility inspectable. Feature
                packages use protocols for shared build contracts instead of
                adapter internals.
              </p>
            </div>
            <div class="maps">
              <div class="layer-map">
                <div class="layer"><strong>tools and gates</strong><span>create, graph checker, publish workflow, smoke tests</span></div>
                <div class="layer"><strong>product facades</strong><span>@lessjs/runtime, @lessjs/app</span></div>
                <div class="layer"><strong>build adapters</strong><span>@lessjs/adapter-vite</span></div>
                <div class="layer"><strong>feature packages</strong><span>content, i18n, hub, ui, cem, compat-check</span></div>
                <div class="layer"><strong>runtime kernel</strong><span>@lessjs/core</span></div>
                <div class="layer"><strong>protocols</strong><span>@lessjs/protocols</span></div>
              </div>
              <div class="owner-table">
                <div class="owner-row"><code>@lessjs/protocols</code><span>shared build contracts</span></div>
                <div class="owner-row"><code>@lessjs/runtime</code><span>component authoring facade</span></div>
                <div class="owner-row"><code>@lessjs/app</code><span>configuration facade</span></div>
                <div class="owner-row"><code>@lessjs/signals</code><span>alien-signals facade</span></div>
                <div class="owner-row"><code>@lessjs/core</code><span>small runtime kernel</span></div>
                <div class="owner-row"><code>@lessjs/create</code><span>generated project contract</span></div>
                <div class="owner-row"><code>@lessjs/adapter-vite</code><span>Vite and SSG orchestration</span></div>
                <div class="owner-row"><code>@lessjs/ui</code><span>Web Components</span></div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <div>
                <p class="kicker">${isZh ? '深入解析' : 'Deep Dive'}</p>
                <h2>${isZh ? '为什么每一层存在。' : 'Why each layer exists.'}</h2>
              </div>
              <p class="copy">
                The framework can only grow if users, contributors, and CI agree
                about which package owns each concept.
              </p>
            </div>
            <div class="cards">
              <a class="card" href="/architecture/protocols">
                <h3>Protocols</h3>
                <p>${
      isZh
        ? '共享构建合约不放在 adapter 内部。v0.23.0 已将其迁移到独立包。'
        : 'Shared build contracts do not live under adapter internals. v0.23.0 moved them to their own package.'
    }</p>
              </a>
              <a class="card" href="/architecture/runtime-kernel">
                <h3>${isZh ? '运行时内核' : 'Runtime Kernel'}</h3>
                <p>${
      isZh
        ? 'Core 是一个精简内核：DSD 运行时、模板、renderDsd、islands、导航、日志、错误。'
        : 'Core is a small kernel: DSD runtime, templates, renderDsd, islands, navigation, logger, errors.'
    }</p>
              </a>
              <a class="card" href="/architecture/adapter-vite">
                <h3>Adapter-Vite</h3>
                <p>${
      isZh
        ? '拥有 Vite 插件组装、路由扫描、SSG 阶段、生成入口和构建编排。'
        : 'Owns Vite plugin assembly, route scanning, SSG phases, generated entries, and build orchestration.'
    }</p>
              </a>
              <a class="card" href="/architecture/package-graph">
                <h3>${isZh ? '包图' : 'Package Graph'}</h3>
                <p>${
      isZh
        ? '0 循环、18 个包、每个 @lessjs/* 导入在 deno.json 中声明。发布前检查。'
        : '0 cycles, 18 packages, every @lessjs/* import declared in deno.json. Checked before publish.'
    }</p>
              </a>
              <a class="card" href="/architecture/release-gates">
                <h3>${isZh ? '发布门禁' : 'Release Gates'}</h3>
                <p>${
      isZh
        ? '8 道机械门禁。'
        : 'fmt, lint, typecheck, test, build, dsd check, hub validate, graph check: 8 mechanical gates.'
    }</p>
              </a>
              <a class="card" href="/engine/architecture">
                <span style="display:inline-flex;align-items:center;min-height:24px;margin-bottom:8px;padding:0 8px;border-radius:5px;font-size:11px;font-weight:750;color:var(--warning);border:1px solid rgba(160,90,0,0.22);background:rgba(160,90,0,0.06);">Legacy</span>
                <h3>Original Architecture Page</h3>
                <p>The Codex-rewritten architecture page with ADR-0050 context and gate detail.</p>
              </a>
            </div>
          </section>

          <nav class="nav-row">
            <a class="nav-link" href="/roadmap">Roadmap truth →</a>
            <a class="nav-link" href="/changelog">Changelog →</a>
            <a class="nav-link" href="/decisions">ADR index →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-architecture', ArchitecturePage);
export default ArchitecturePage;

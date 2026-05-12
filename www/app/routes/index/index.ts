/**
 * Homepage — v5 design
 *
 * @lessjs/app + @lessjs/ui components. less-code-block for syntax.
 * Mockup v5: dark hero, code comparison, feature cards, benchmark,
 * dark demo cards, quick start, footer CTA.
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '../islands/less-term.js';

export const tagName = 'docs-home';

const CODE_COMPONENT = `// app/routes/index.ts
import { html, LitElement } from 'lit';

export class Home extends LitElement {
  render() {
    return html\`<h1>hello world</h1>
  <my-counter></my-counter>\`;
  }
}
customElements.define('page-home', Home);
// ...just lit + custom elements`;

const CODE_DSD = `<page-home>
  <template shadowrootmode="open">
    <h1>hello world</h1>
    <my-counter>
      <template shadowrootmode="open">
        <!-- button -, span 0, button + -->
      </template>
    </my-counter>
  </template>
</page-home>
<!-- no js needed for first paint -->`;

const COUNTER_RAW = `<my-counter><template shadowrootmode="open"><button>−</button><span>0</span><button>+</button></template></my-counter>`;

export default class DocsHome extends LitElement {
  static override styles = css`
    :host { display: block; }
    less-layout { min-height: 100vh; }

    /* ── Hero ── */
    .hero { background: #09090b; color: #fff; width: 100vw; margin-left: calc(-50vw + 50%); }
    .hero-inner { max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem 2.5rem; }
    .hero-lockup { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
    .hero-lockup svg { width: 36px; height: 36px; flex-shrink: 0; }
    .hero-lockup span { font-size: 17px; font-weight: 500; color: #f4f4f5; letter-spacing: -0.01em; }
    .hero h1 { font-size: clamp(2.6rem, 6vw, 2.875rem); font-weight: 500; color: #fff; line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 10px; }
    .hero h1 em { font-style: normal; color: #636363; }
    .hero-desc { color: #a1a1aa; font-size: 14px; line-height: 1.7; max-width: 460px; margin: 0 0 20px; }
    .hero-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .hero-actions a { display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 6px; font-size: 13px; font-weight: 500; text-decoration: none; }
    .hero-pri { background: #fff; color: #09090b; }
    .hero-sec { border: 0.5px solid #333; color: #d4d4d8; }

    /* ── Code comparison ── */
    .code-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #09090b; border-radius: 8px; overflow: hidden; border: 0.5px solid #27272a; margin-bottom: 18px; }
    .code-pane { background: #09090b; padding: 14px 16px; }
    .code-bar { display: flex; align-items: center; gap: 5px; margin-bottom: 10px; }
    .code-bar i { width: 7px; height: 7px; border-radius: 50%; }
    .code-bar .r { background: #ef4444; }
    .code-bar .y { background: #eab308; }
    .code-bar .g { background: #22c55e; }
    .code-bar span { color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 5px; }
    .code-pane less-code-block { --code-bg: transparent; --code-border: none; }
    .code-pane pre { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; }
    .code-pane code { font-family: "JetBrains Mono","Fira Code","SF Mono",Consolas,monospace !important; font-size: 12px !important; line-height: 1.8 !important; color: #f4f4f5 !important; }

    /* ── Stats ── */
    .stats { display: flex; gap: 28px; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; }
    .stat strong { color: #fff; font-size: 18px; font-weight: 500; }
    .stat span { color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }

    /* ── Section titles ── */
    .sec { padding: 2.5rem 0 0; margin: 0 auto; max-width: 960px; }
    .sec-lbl { font-size: 11px; font-weight: 600; color: #888780; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 1.5rem 16px; }
    .sec-bd { padding: 0 1.5rem; }

    /* ── Feature cards ── */
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 2.5rem; }
    .card { border: 0.5px solid var(--less-border); border-radius: 10px; padding: 1.25rem; }
    .card:hover { border-color: var(--less-border-hover); }
    .card-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-bottom: 12px; }
    .card h3 { margin: 0 0 5px; font-size: 14px; font-weight: 600; color: var(--less-text-primary); }
    .card p { margin: 0; font-size: 12.5px; color: var(--less-text-secondary); line-height: 1.7; }

    /* ── Use cases ── */
    .uses { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 0.5px solid var(--less-border); border-bottom: 0.5px solid var(--less-border); margin-bottom: 2.5rem; }
    .use { padding: 1.5rem 1rem; border-right: 0.5px solid var(--less-border); text-align: center; }
    .use:last-child { border-right: 0; }
    .use h3 { margin: 0 0 3px; font-size: 13px; font-weight: 600; color: var(--less-text-primary); }
    .use p { margin: 0; font-size: 12px; color: var(--less-text-secondary); }

    /* ── Benchmark table ── */
    .bench { margin-bottom: 2.5rem; overflow-x: auto; }
    .bench table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .bench th { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--less-border); color: var(--less-text-secondary); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
    .bench td { padding: 11px 14px; border-bottom: 0.5px solid var(--less-bg-surface); color: var(--less-text-secondary); }
    .bench td:first-child { font-weight: 500; color: var(--less-text-primary); }
    .bench .win { color: #256e16; font-weight: 500; }
    .bench .lose { color: #a33; font-weight: 500; }
    .bench-foot { font-size: 11px; color: #888780; margin-top: 8px; line-height: 1.6; }

    /* ── Architecture SVG ── */
    .arch { margin-bottom: 2.5rem; }
    .arch svg { width: 100%; height: auto; display: block; }
    .arch text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10px; }

    /* ── Dark demo cards ── */
    .demo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 2.5rem; }
    .demo-card { background: #18181b; border-radius: 10px; padding: 1.25rem; }
    .demo-card h4 { margin: 0 0 12px; font-size: 12px; font-weight: 600; color: #d4d4d8; letter-spacing: 0.02em; }
    .demo-card pre { background: #101012 !important; border: 0.5px solid #27272a !important; border-radius: 6px; padding: 10px 12px !important; margin: 0 !important; font-size: 11px !important; line-height: 1.7 !important; color: #a1a1aa !important; overflow-x: auto; }
    .demo-card .note { font-size: 11px; color: #71717a; margin-top: 10px; line-height: 1.5; }
    .counter { display: flex; align-items: center; gap: 10px; }
    .counter button { width: 34px; height: 34px; border-radius: 6px; border: 0.5px solid #3f3f46; background: #27272a; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #f4f4f5; }
    .counter button:hover { background: #3f3f46; }
    .counter span { font-size: 20px; font-weight: 500; color: #f4f4f5; min-width: 24px; text-align: center; }

    /* ── Bundle size bars ── */
    .bundle { margin-bottom: 2.5rem; }
    .bar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .bar-lbl { width: 80px; font-size: 12px; font-weight: 500; color: var(--less-text-primary); text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 32px; border-radius: 6px; background: var(--less-bg-surface); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 12px; font-size: 12px; font-weight: 500; }
    .bar-fill.g { background: #E1F5EE; color: #0F6E56; width: 2%; min-width: 60px; }
    .bar-fill.r { background: #FCEBEB; color: #A32D2D; width: 100%; }
    .bundle-note { font-size: 11px; color: var(--less-text-tertiary); margin-top: 6px; padding-left: 94px; line-height: 1.6; }

    /* ── Terminal (less-term-demo island) ── */
    less-term-demo { display: block; margin-bottom: 2.5rem; }

    /* ── Quick start ── */
    .qs { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: center; margin-bottom: 2.5rem; }
    .qs-card { border: 0.5px solid var(--less-border); border-radius: 10px; padding: 1.25rem; background: var(--less-bg-surface); }
    .qs-step { font-size: 11px; font-weight: 600; color: #888780; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .qs-card code { font-family: "SF Mono", "Fira Code", "Consolas", monospace; font-size: 12.5px; color: var(--less-text-primary); line-height: 1.6; white-space: nowrap; }
    .qs-arrow { color: #d4d4d8; font-size: 16px; text-align: center; user-select: none; }

    /* ── CTA ── */
    .cta { text-align: center; padding: 2.5rem; width: 100vw; margin-left: calc(-50vw + 50%); border-top: 0.5px solid var(--less-border); }
    .cta-inner { max-width: 960px; margin: 0 auto; }
    .cta code { display: inline-block; background: var(--less-bg-surface); border: 0.5px solid var(--less-border); border-radius: 8px; padding: 10px 20px; font-family: "SF Mono", "Fira Code", "Consolas", monospace; font-size: 13px; color: var(--less-text-primary); margin-bottom: 10px; }
    .cta p { margin: 0; font-size: 12px; color: var(--less-text-secondary); }

    /* ── Counter web component ── */
    .live-counter { display: flex; align-items: center; gap: 10px; }
    .live-counter button { width: 34px; height: 34px; border-radius: 6px; border: 0.5px solid #3f3f46; background: #27272a; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #f4f4f5; }
    .live-counter button:hover { background: #3f3f46; }
    .live-counter .val { font-size: 22px; font-weight: 500; color: #f4f4f5; min-width: 30px; text-align: center; }

    @media (max-width: 760px) {
      .code-compare { grid-template-columns: 1fr; }
      .cards { grid-template-columns: 1fr; }
      .uses { grid-template-columns: repeat(2, 1fr); }
      .use:nth-child(2) { border-right: 0; }
      .demo { grid-template-columns: 1fr; }
      .qs { grid-template-columns: 1fr; }
      .qs-arrow { display: none; }
      .hero h1 { font-size: clamp(2rem, 8vw, 2.6rem); }
      .stats { gap: 16px; }
      .bench table { font-size: 11px; }
      .bench th, .bench td { padding: 8px 10px; }
    }
  `;

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  /* ── counterState helper: used in render to create interactive counter ── */
  private _counter(initial = 0) {
    return html`
      <div class="live-counter" @click=${this._onCounterClick}>
        <button data-delta="-1">−</button>
        <span class="val">${initial}</span>
        <button data-delta="1">+</button>
      </div>`;
  }

  private _onCounterClick(e: Event) {
    const btn = (e.target as HTMLElement).closest('[data-delta]') as HTMLElement | null;
    if (!btn) return;
    const delta = parseInt(btn.dataset.delta || '0');
    const val = btn.parentElement!.querySelector('.val') as HTMLElement;
    if (val) val.textContent = String(Number(val.textContent) + delta);
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" current-path="/" home>
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36"><g transform="translate(20,17)"><path d="M5 106L95 53 5 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="107" cy="53" r="5" fill="#fff"/></g></svg>
              <span>LessJS</span>
            </div>
            <h1>html <em>先于</em> javascript 存在。</h1>
            <p class="hero-desc">SSG 产出的 Declarative Shadow DOM。Island 架构只对交互组件下发 JS。默认交付物是静态文件。</p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">开始使用 →</a>
              <a class="hero-sec" href="/guide/positioning">理解定位</a>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>你的组件</span></div>
                <less-code-block><pre><code>${CODE_COMPONENT}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>SSG 输出 (DSD HTML)</span></div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><strong>v0.13</strong><span>最新版本</span></div>
              <div class="stat"><strong>268</strong><span>测试通过</span></div>
              <div class="stat"><strong>10</strong><span>个包</span></div>
              <div class="stat"><strong>1</strong><span>运行时依赖 (core)</span></div>
            </div>
          </div>
        </section>

        <div class="sec">
          <div class="sec-lbl">核心模型</div>
          <div class="sec-bd">
            <div class="cards">
              <div class="card"><div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div><h3>DSD 渲染</h3><p>Declarative Shadow DOM 是标准 HTML。浏览器原生解析，首屏无需 JS 框架参与。</p></div>
              <div class="card"><div class="card-icon" style="background:#E6F1FB;color:#185FA5;">I</div><h3>Island 升级</h3><p>只有交互组件下发 JS。四种加载策略。静态内容零 JS 开销。</p></div>
              <div class="card"><div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">S</div><h3>静态部署</h3><p>构建产物为纯 HTML。部署到任意 CDN、S3、Cloudflare Pages、GitHub Pages，无需运行服务器。</p></div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">适用场景</div>
          <div class="sec-bd">
            <div class="uses">
              <div class="use"><h3>文档站点</h3><p>本网站由 LessJS 构建</p></div>
              <div class="use"><h3>博客 &amp; 内容</h3><p>Markdown + frontmatter，自动 Sitemap</p></div>
              <div class="use"><h3>营销页面</h3><p>多语言 + i18n，自动导航</p></div>
              <div class="use"><h3>轻量 API</h3><p>Hono 路由，Deno / Workers 部署</p></div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">对比</div>
          <div class="sec-bd">
            <div class="bench">
              <table>
                <thead><tr><th style="width:140px;">指标</th><th style="width:100px;">LessJS</th><th>Next.js (App)</th><th>Astro</th></tr></thead>
                <tbody>
                  <tr><td>默认输出</td><td class="win">静态 HTML</td><td class="lose">需服务器</td><td class="win">静态 HTML</td></tr>
                  <tr><td>首屏 JS</td><td class="win">0 KB</td><td class="lose">~90 KB React</td><td class="win">0 KB</td></tr>
                  <tr><td>组件模型</td><td class="win">Web 标准</td><td>React</td><td>任意框架</td></tr>
                  <tr><td>服务端运行时</td><td class="win">Deno、Node、Edge</td><td>仅 Node</td><td>仅 Node</td></tr>
                  <tr><td>SSG 渲染</td><td class="win">Declarative Shadow DOM</td><td>HTML + JSON (RSC)</td><td>HTML (无 DSD)</td></tr>
                  <tr><td>交互模型</td><td class="win">Island 升级</td><td class="lose">整页 Hydration</td><td class="win">Island</td></tr>
                </tbody>
              </table>
              <div class="bench-foot">LessJS 理念上最接近 Astro，但使用 Lit + DSD 作为组件模型而非元框架模式。关键差异是原生 DSD —— 内容在 JS 运行前就是结构化 HTML。</div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">包架构</div>
          <div class="sec-bd">
            <div class="arch">
              <svg viewBox="0 0 600 74" fill="none">
                <rect x="230" y="2" width="140" height="22" rx="4" fill="#EEEDFE" stroke="#CECBF6" stroke-width="0.5"/>
                <text x="300" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">@lessjs/app (统一入口)</text>
                <path d="M300 24 L300 30 L150 30 L150 38" stroke="#bbb" stroke-width="0.5"/>
                <path d="M300 24 L300 30 L300 38" stroke="#bbb" stroke-width="0.5"/>
                <path d="M300 24 L300 30 L450 30 L450 38" stroke="#bbb" stroke-width="0.5"/>
                <rect x="90" y="39" width="120" height="22" rx="4" fill="#E6F1FB" stroke="#B5D4F4" stroke-width="0.5"/>
                <text x="150" y="54" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">adapter-vite</text>
                <rect x="230" y="39" width="140" height="22" rx="4" fill="#FAEEDA" stroke="#FAC775" stroke-width="0.5"/>
                <text x="300" y="54" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">content + i18n</text>
                <rect x="390" y="39" width="120" height="22" rx="4" fill="#FAECE7" stroke="#F5C4B3" stroke-width="0.5"/>
                <text x="450" y="54" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">adapter-lit / ui</text>
                <text x="300" y="70" text-anchor="middle" fill="#5F5E5A" font-size="10">@lessjs/core — 纯运行时，1 个依赖 (parse5)</text>
              </svg>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">实际效果</div>
          <div class="sec-bd">
            <div class="demo">
              <div class="demo-card">
                <h4>交互式 Counter — 点击按钮</h4>
                ${this._counter(0)}
                <div class="note">以原生 Custom Element 运行。零框架 JS 加载。</div>
              </div>
              <div class="demo-card">
                <h4>浏览器解析的内容</h4>
                <pre><code>${COUNTER_RAW}</code></pre>
                <div class="note">DSD 模板由浏览器原生解析 — 无 hydration 开销。</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal demo -->
        <div class="sec">
          <div class="sec-lbl">试试看 — 交互式终端</div>
          <div class="sec-bd">
            <less-term-demo></less-term-demo>
          </div>
        </div>

        <!-- Bundle size -->
        <div class="sec">
          <div class="sec-lbl">首屏 JS 对比</div>
          <div class="sec-bd">
            <div class="bundle">
              <div class="bar-row">
                <div class="bar-lbl">LessJS</div>
                <div class="bar-track"><div class="bar-fill g">0 kb</div></div>
              </div>
              <div class="bar-row">
                <div class="bar-lbl">Next.js</div>
                <div class="bar-track"><div class="bar-fill r">~90 kb react</div></div>
              </div>
              <div class="bundle-note">Island-only JS 意味着负载随组件复杂度增长，不随页面数量增长。50 页的站点和 1 页的站点 JS 大小相同。</div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">快速开始</div>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-card"><div class="qs-step">1. 创建</div><code>deno run -A jsr:@lessjs/create my-app</code></div>
              <div class="qs-arrow">→</div>
              <div class="qs-card"><div class="qs-step">2. 开发</div><code>cd my-app &amp;&amp; deno task dev</code></div>
              <div class="qs-arrow">→</div>
              <div class="qs-card"><div class="qs-step">3. 构建</div><code>deno task build  →  dist/</code></div>
            </div>
          </div>
        </div>

        <div class="cta">
          <div class="cta-inner">
            <code>deno run -A jsr:@lessjs/create my-app</code>
            <p>需要 Deno 2.7+ — macOS / Linux / Windows — MIT 许可</p>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout locale="${this.locale || 'en'}" .locales="${['en', 'zh']}" current-path="/en/" home>
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36"><g transform="translate(20,17)"><path d="M5 106L95 53 5 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="107" cy="53" r="5" fill="#fff"/></g></svg>
              <span>LessJS</span>
            </div>
            <h1>html <em>before</em> javascript.</h1>
            <p class="hero-desc">SSG-rendered declarative shadow dom. Island-only js. Hono api routes. Everything compiles to static html and ships to a cdn.</p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">get started →</a>
              <a class="hero-sec" href="/guide/positioning">why lessjs</a>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>your component</span></div>
                <less-code-block><pre><code>${CODE_COMPONENT}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>ssg output (dsd html)</span></div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><strong>v0.13</strong><span>latest release</span></div>
              <div class="stat"><strong>268</strong><span>tests passing</span></div>
              <div class="stat"><strong>10</strong><span>packages</span></div>
              <div class="stat"><strong>1</strong><span>runtime dep (core)</span></div>
            </div>
          </div>
        </section>

        <div class="sec">
          <div class="sec-lbl">core model</div>
          <div class="sec-bd">
            <div class="cards">
              <div class="card"><div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div><h3>dsd rendering</h3><p>Declarative shadow dom is standard html. Browsers parse it natively — no js framework needed for first paint.</p></div>
              <div class="card"><div class="card-icon" style="background:#E6F1FB;color:#185FA5;">I</div><h3>island upgrade</h3><p>Only interactive components ship js. Four loading strategies. Static content is zero-js.</p></div>
              <div class="card"><div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">S</div><h3>static deploy</h3><p>Build emits plain html. Deploy to any cdn, s3, cloudflare pages, github pages — no server to run.</p></div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">built for</div>
          <div class="sec-bd">
            <div class="uses">
              <div class="use"><h3>documentation sites</h3><p>this website runs on lessjs</p></div>
              <div class="use"><h3>blogs &amp; content</h3><p>markdown + frontmatter, auto sitemap</p></div>
              <div class="use"><h3>marketing pages</h3><p>multi-language with i18n, auto nav</p></div>
              <div class="use"><h3>lightweight apis</h3><p>hono routes on deno / workers</p></div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">how it compares</div>
          <div class="sec-bd">
            <div class="bench">
              <table>
                <thead><tr><th style="width:140px;">metric</th><th style="width:100px;">lessjs</th><th>next.js (app)</th><th>astro</th></tr></thead>
                <tbody>
                  <tr><td>default output</td><td class="win">static html</td><td class="lose">server required</td><td class="win">static html</td></tr>
                  <tr><td>js at first paint</td><td class="win">0 kb</td><td class="lose">~90 kb react</td><td class="win">0 kb</td></tr>
                  <tr><td>component model</td><td class="win">web standards</td><td>react</td><td>any framework</td></tr>
                  <tr><td>server runtime</td><td class="win">deno, node, edge</td><td>node only</td><td>node only</td></tr>
                  <tr><td>ssg rendering</td><td class="win">declarative shadow dom</td><td>html + json (rsc)</td><td>html (no dsd)</td></tr>
                  <tr><td>interactive model</td><td class="win">island upgrade</td><td class="lose">page hydration</td><td class="win">island</td></tr>
                </tbody>
              </table>
              <div class="bench-foot">lessjs is closest to astro in philosophy but uses lit + dsd for components. the key differentiator is native dsd — content is structured html before any js runs.</div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">package architecture</div>
          <div class="sec-bd">
            <div class="arch">
              <svg viewBox="0 0 600 74" fill="none">
                <rect x="230" y="2" width="140" height="22" rx="4" fill="#EEEDFE" stroke="#CECBF6" stroke-width="0.5"/>
                <text x="300" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">@lessjs/app (umbrella)</text>
                <path d="M300 24 L300 30 L150 30 L150 38" stroke="#bbb" stroke-width="0.5"/>
                <path d="M300 24 L300 30 L300 38" stroke="#bbb" stroke-width="0.5"/>
                <path d="M300 24 L300 30 L450 30 L450 38" stroke="#bbb" stroke-width="0.5"/>
                <rect x="90" y="39" width="120" height="22" rx="4" fill="#E6F1FB" stroke="#B5D4F4" stroke-width="0.5"/>
                <text x="150" y="54" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">adapter-vite</text>
                <rect x="230" y="39" width="140" height="22" rx="4" fill="#FAEEDA" stroke="#FAC775" stroke-width="0.5"/>
                <text x="300" y="54" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">content + i18n</text>
                <rect x="390" y="39" width="120" height="22" rx="4" fill="#FAECE7" stroke="#F5C4B3" stroke-width="0.5"/>
                <text x="450" y="54" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">adapter-lit / ui</text>
                <text x="300" y="70" text-anchor="middle" fill="#5F5E5A" font-size="10">@lessjs/core — pure runtime, 1 dep (parse5)</text>
              </svg>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">see it in action</div>
          <div class="sec-bd">
            <div class="demo">
              <div class="demo-card">
                <h4>interactive counter — click the buttons</h4>
                ${this._counter(0)}
                <div class="note">runs as native custom element. zero framework js loaded.</div>
              </div>
              <div class="demo-card">
                <h4>what the browser parses</h4>
                <pre><code>${COUNTER_RAW}</code></pre>
                <div class="note">dsd template parsed natively — no hydration cost.</div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">try it — interactive terminal</div>
          <div class="sec-bd">
            <less-term-demo></less-term-demo>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">js at first paint</div>
          <div class="sec-bd">
            <div class="bundle">
              <div class="bar-row">
                <div class="bar-lbl">LessJS</div>
                <div class="bar-track"><div class="bar-fill g">0 kb</div></div>
              </div>
              <div class="bar-row">
                <div class="bar-lbl">Next.js</div>
                <div class="bar-track"><div class="bar-fill r">~90 kb react</div></div>
              </div>
              <div class="bundle-note">island-only js means payload scales with component complexity, not page count. a 50-page site ships the same js as a 1-page site.</div>
            </div>
          </div>
        </div>

        <div class="sec">
          <div class="sec-lbl">quick start</div>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-card"><div class="qs-step">1. scaffold</div><code>deno run -A jsr:@lessjs/create my-app</code></div>
              <div class="qs-arrow">→</div>
              <div class="qs-card"><div class="qs-step">2. develop</div><code>cd my-app &amp;&amp; deno task dev</code></div>
              <div class="qs-arrow">→</div>
              <div class="qs-card"><div class="qs-step">3. build</div><code>deno task build  →  dist/</code></div>
            </div>
          </div>
        </div>

        <div class="cta">
          <div class="cta-inner">
            <code>deno run -A jsr:@lessjs/create my-app</code>
            <p>requires deno 2.7+ — macOS / linux / windows — mit license</p>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

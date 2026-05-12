/**
 * Homepage — redesigned v2
 *
 * Hero with code comparison (Lit → DSD HTML), feature cards,
 * use cases, architecture diagram, live demo, and CTA.
 * Uses <less-code-block> for syntax highlighting, no hardcoded colors.
 */
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export const tagName = 'docs-home';

const COMPONENT_CODE = `// app/routes/index.ts
import { html, LitElement } from 'lit';

export class Home extends LitElement {
  render() {
    return html\`<h1>hello world</h1>
  <my-counter></my-counter>\`;
  }
}
customElements.define('page-home', Home);
// ...just lit + custom elements`;

const DSD_CODE = `<page-home>
  <template shadowrootmode="open">
    <h1>hello world</h1>
    <my-counter>
      <template shadowrootmode="open">
        <!-- ssg rendered -->
      </template>
    </my-counter>
  </template>
</page-home>
<!-- no js needed for initial render -->`;

const COUNTER_HTML = `<my-counter><template shadowrootmode="open"><button>−</button><span>0</span><button>+</button></template></my-counter>`;

export default class DocsHome extends LitElement {
  static override styles = css`
    :host { display: block; }
    less-layout { min-height: 100vh; }

    /* ── Full-width hero ── */
    .hero { background: #09090b; color: #fff; width: 100vw; margin-left: calc(-50vw + 50%); }
    .hero-inner { max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem 2.5rem; }
    .hero h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 500; color: #fff; margin: 4px 0 0; line-height: 1.05; letter-spacing: -0.03em; }
    .hero h1 em { font-style: normal; color: #a1a1aa; }
    .hero-desc { color: #a1a1aa; font-size: 0.875rem; line-height: 1.7; max-width: 34rem; margin: 10px 0 18px; }
    .hero-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
    .hero-btns a { display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; text-decoration: none; }
    .hero-pri { background: #fff; color: #09090b; }
    .hero-sec { border: 0.5px solid #3f3f46; color: #d4d4d8; }

    /* ── Code comparison ── */
    .code-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #18181b; border-radius: 8px; overflow: hidden; border: 0.5px solid #27272a; margin-bottom: 16px; }
    .code-pane { background: #101012; padding: 14px 16px; }
    .code-bar { display: flex; align-items: center; gap: 5px; margin-bottom: 10px; }
    .code-dot { width: 7px; height: 7px; border-radius: 50%; }
    .code-dot.r { background: #ef4444; }
    .code-dot.y { background: #eab308; }
    .code-dot.g { background: #22c55e; }
    .code-bar span { color: #52525b; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 6px; }
    .code-pane less-code-block { --code-bg: transparent; --code-border: none; }
    .code-pane pre { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; }
    .code-pane code { font-size: 0.75rem !important; line-height: 1.7 !important; color: #a1a1aa !important; }

    /* ── Stats ── */
    .stats { display: flex; gap: 24px; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; }
    .stat strong { color: #fff; font-size: 1rem; font-weight: 500; }
    .stat span { color: #71717a; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; }

    /* ── Content sections ── */
    .content { max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem 0; }
    .sec-title { font-size: 0.8125rem; font-weight: 500; color: var(--less-text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 1rem; }

    /* ── Feature cards ── */
    .cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 2.5rem; }
    .card { border: 0.5px solid var(--less-border); border-radius: 6px; padding: 1.25rem; }
    .card-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 0.8125rem; font-weight: 500; }
    .card h3 { margin: 0 0 4px; font-size: 0.8125rem; font-weight: 500; color: var(--less-text-primary); }
    .card p { margin: 0; font-size: 0.75rem; color: var(--less-text-secondary); line-height: 1.7; }

    /* ── Use cases ── */
    .uses { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; border-top: 0.5px solid var(--less-border); border-bottom: 0.5px solid var(--less-border); margin-bottom: 2.5rem; }
    .use { padding: 1.5rem 1.25rem; border-right: 0.5px solid var(--less-border); text-align: center; }
    .use:last-child { border-right: 0; }
    .use h3 { margin: 0 0 2px; font-size: 0.8125rem; font-weight: 500; color: var(--less-text-primary); }
    .use p { margin: 0; font-size: 0.75rem; color: var(--less-text-secondary); }

    /* ── Arch diagram ── */
    .arch { margin-bottom: 2.5rem; }
    .arch svg { width: 100%; height: auto; display: block; }
    .arch text { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; font-size: 10px; }

    /* ── Demo ── */
    .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 2.5rem; }
    .demo-card { background: var(--less-bg-surface); border: 0.5px solid var(--less-border); border-radius: 6px; padding: 1rem; }
    .demo-card h4 { margin: 0 0 6px; font-size: 0.75rem; font-weight: 500; color: var(--less-text-primary); }
    .demo-card pre { background: var(--less-bg-base) !important; border: 0.5px solid var(--less-border) !important; border-radius: 4px; padding: 8px 10px !important; margin: 0 !important; font-size: 0.6875rem !important; line-height: 1.7 !important; overflow-x: auto; }

    /* ── CTA ── */
    .cta { text-align: center; padding: 2.5rem; background: var(--less-bg-surface); width: 100vw; margin-left: calc(-50vw + 50%); border-top: 0.5px solid var(--less-border); }
    .cta code { display: inline-block; background: var(--less-bg-base); border: 0.5px solid var(--less-border); border-radius: 6px; padding: 10px 16px; font-family: "SF Mono","Fira Code","Consolas",monospace; font-size: 0.8125rem; color: var(--less-text-primary); margin-bottom: 10px; }
    .cta p { margin: 0; font-size: 0.75rem; color: var(--less-text-secondary); }
    .cta-inner { max-width: 960px; margin: 0 auto; }

    /* ── Responsive ── */
    @media (max-width: 760px) {
      .code-compare { grid-template-columns: 1fr; }
      .cards { grid-template-columns: 1fr; }
      .uses { grid-template-columns: repeat(2,1fr); }
      .use:nth-child(2) { border-right: 0; }
      .demo-grid { grid-template-columns: 1fr; }
    }
  `;

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" current-path="/" home>
        <!-- Hero -->
        <section class="hero">
          <div class="hero-inner">
            <h1>html <em>先于</em> javascript 存在。</h1>
            <p class="hero-desc">SSG 产出的 Declarative Shadow DOM 让首屏内容在 JS 加载前就可见。Island 架构只对交互组件下发 JavaScript。默认交付物是静态文件。</p>
            <div class="hero-btns">
              <a class="hero-pri" href="/guide/getting-started">开始使用 →</a>
              <a class="hero-sec" href="/guide/positioning">理解定位</a>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar"><span class="code-dot r"></span><span class="code-dot y"></span><span class="code-dot g"></span><span>你的组件</span></div>
                <less-code-block><pre><code>${COMPONENT_CODE}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar"><span class="code-dot r"></span><span class="code-dot y"></span><span class="code-dot g"></span><span>SSG 输出 (静态 HTML)</span></div>
                <less-code-block><pre><code>${DSD_CODE}</code></pre></less-code-block>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><strong>v0.13</strong><span>最新版本</span></div>
              <div class="stat"><strong>268</strong><span>测试通过</span></div>
              <div class="stat"><strong>10</strong><span>个包</span></div>
              <div class="stat"><strong>0</strong><span>运行时依赖 (core)</span></div>
            </div>
          </div>
        </section>

        <main class="content">
          <!-- Core Model -->
          <h2 class="sec-title">核心模型</h2>
          <div class="cards">
            <div class="card">
              <div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div>
              <h3>DSD 渲染</h3>
              <p>Declarative Shadow DOM 是标准 HTML。浏览器原生解析，无需 JS 框架即可渲染首帧。</p>
            </div>
            <div class="card">
              <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">I</div>
              <h3>Island 升级</h3>
              <p>只有交互组件下发 JavaScript。四种策略：eager、lazy、idle、visible。静态内容零 JS。</p>
            </div>
            <div class="card">
              <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">S</div>
              <h3>静态部署</h3>
              <p>构建产物是一组 HTML 文件。部署到任意 CDN、S3、Cloudflare Pages、GitHub Pages，无需服务器。</p>
            </div>
          </div>

          <!-- Use Cases -->
          <h2 class="sec-title">适用场景</h2>
          <div class="uses">
            <div class="use">
              <h3>📄 文档站点</h3>
              <p>本网站由 LessJS 构建</p>
            </div>
            <div class="use">
              <h3>✍️ 博客</h3>
              <p>Markdown + frontmatter，自动 Sitemap</p>
            </div>
            <div class="use">
              <h3>🏢 内容站</h3>
              <p>多页面、导航、国际化</p>
            </div>
            <div class="use">
              <h3>⚡ 轻量 API</h3>
              <p>Hono 路由，Serverless 部署</p>
            </div>
          </div>

          <!-- Architecture -->
          <h2 class="sec-title">包架构</h2>
          <div class="arch">
            <svg viewBox="0 0 560 76" fill="none">
              <rect x="210" y="2" width="120" height="22" rx="4" fill="#EEEDFE" stroke="#CECBF6" stroke-width="0.5"/>
              <text x="270" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">@lessjs/app</text>
              <path d="M270 24 L270 30 L130 30 L130 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <path d="M270 24 L270 30 L270 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <path d="M270 24 L270 30 L410 30 L410 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <rect x="70" y="38" width="120" height="22" rx="4" fill="#E6F1FB" stroke="#B5D4F4" stroke-width="0.5"/>
              <text x="130" y="53" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">adapter-vite</text>
              <rect x="210" y="38" width="120" height="22" rx="4" fill="#FAEEDA" stroke="#FAC775" stroke-width="0.5"/>
              <text x="270" y="53" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">content + i18n</text>
              <rect x="350" y="38" width="120" height="22" rx="4" fill="#FAECE7" stroke="#F5C4B3" stroke-width="0.5"/>
              <text x="410" y="53" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">adapter-lit / ui</text>
              <path d="M130 60 L130 65 L270 65 L270 60" stroke="#d4d4d8" stroke-width="0.5"/>
              <text x="270" y="71" text-anchor="middle" fill="#5F5E5A" font-size="10">@lessjs/core（纯运行时）</text>
            </svg>
          </div>

          <!-- Demo -->
          <h2 class="sec-title">实际效果</h2>
          <div class="demo-grid">
            <div class="demo-card">
              <h4>交互式 Counter — 0KB JS 已加载</h4>
              <div style="display:flex;align-items:center;gap:10px;margin:8px 0;">
                <button disabled style="width:30px;height:30px;border-radius:6px;border:0.5px solid var(--less-border);background:var(--less-bg-base);font-size:14px;opacity:0.4;">−</button>
                <span style="font-size:1.125rem;font-weight:500;color:var(--less-text-primary);">0</span>
                <button disabled style="width:30px;height:30px;border-radius:6px;border:0.5px solid var(--less-border);background:var(--less-bg-base);font-size:14px;opacity:0.4;">+</button>
              </div>
              <p style="margin:0;font-size:0.6875rem;color:var(--less-text-tertiary);">HTML 已预渲染。JS 仅在交互时加载。</p>
            </div>
            <div class="demo-card">
              <h4>浏览器看到的 HTML</h4>
              <pre><code>${COUNTER_HTML}</code></pre>
              <p style="margin:6px 0 0;font-size:0.6875rem;color:var(--less-text-tertiary);">DSD 是浏览器原生能力——无 hydration 开销。</p>
            </div>
          </div>
        </main>

        <!-- CTA -->
        <div class="cta">
          <div class="cta-inner">
            <code>deno run -A jsr:@lessjs/create my-app</code>
            <p>需要 Deno 2.7+ · macOS / Linux / Windows · MIT 许可</p>
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
            <h1>html <em>before</em> javascript.</h1>
            <p class="hero-desc">SSG-rendered declarative shadow dom · island-only javascript · hono api routes · zero-runtime core — everything compiles to static html and ships to a cdn.</p>
            <div class="hero-btns">
              <a class="hero-pri" href="/guide/getting-started">get started →</a>
              <a class="hero-sec" href="/guide/positioning">why lessjs</a>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar"><span class="code-dot r"></span><span class="code-dot y"></span><span class="code-dot g"></span><span>your component</span></div>
                <less-code-block><pre><code>${COMPONENT_CODE}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar"><span class="code-dot r"></span><span class="code-dot y"></span><span class="code-dot g"></span><span>ssg output (static html)</span></div>
                <less-code-block><pre><code>${DSD_CODE}</code></pre></less-code-block>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><strong>v0.13</strong><span>latest release</span></div>
              <div class="stat"><strong>268</strong><span>tests passing</span></div>
              <div class="stat"><strong>10</strong><span>packages</span></div>
              <div class="stat"><strong>0</strong><span>runtime deps (core)</span></div>
            </div>
          </div>
        </section>

        <main class="content">
          <h2 class="sec-title">core model</h2>
          <div class="cards">
            <div class="card">
              <div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div>
              <h3>dsd rendering</h3>
              <p>Declarative shadow dom is standard html. No js framework needed to render the first frame. Browsers parse it natively.</p>
            </div>
            <div class="card">
              <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">I</div>
              <h3>island upgrade</h3>
              <p>Only interactive components ship javascript. Four strategies — eager, lazy, idle, visible. Zero js for static content.</p>
            </div>
            <div class="card">
              <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">S</div>
              <h3>static by default</h3>
              <p>Build produces a directory of plain html files. Deploy to any cdn, s3, cloudflare pages, or github pages — no server needed.</p>
            </div>
          </div>

          <h2 class="sec-title">built for</h2>
          <div class="uses">
            <div class="use"><h3>📄 documentation</h3><p>this site runs on lessjs</p></div>
            <div class="use"><h3>✍️ blogs</h3><p>markdown + frontmatter, auto sitemap</p></div>
            <div class="use"><h3>🏢 content sites</h3><p>multi-page with nav, i18n</p></div>
            <div class="use"><h3>⚡ lightweight apis</h3><p>hono routes, serverless deploy</p></div>
          </div>

          <h2 class="sec-title">package architecture</h2>
          <div class="arch">
            <svg viewBox="0 0 560 76" fill="none">
              <rect x="210" y="2" width="120" height="22" rx="4" fill="#EEEDFE" stroke="#CECBF6" stroke-width="0.5"/>
              <text x="270" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">@lessjs/app</text>
              <path d="M270 24 L270 30 L130 30 L130 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <path d="M270 24 L270 30 L270 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <path d="M270 24 L270 30 L410 30 L410 37" stroke="#d4d4d8" stroke-width="0.5"/>
              <rect x="70" y="38" width="120" height="22" rx="4" fill="#E6F1FB" stroke="#B5D4F4" stroke-width="0.5"/>
              <text x="130" y="53" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">adapter-vite</text>
              <rect x="210" y="38" width="120" height="22" rx="4" fill="#FAEEDA" stroke="#FAC775" stroke-width="0.5"/>
              <text x="270" y="53" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">content + i18n</text>
              <rect x="350" y="38" width="120" height="22" rx="4" fill="#FAECE7" stroke="#F5C4B3" stroke-width="0.5"/>
              <text x="410" y="53" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">adapter-lit / ui</text>
              <path d="M130 60 L130 65 L270 65 L270 60" stroke="#d4d4d8" stroke-width="0.5"/>
              <text x="270" y="71" text-anchor="middle" fill="#5F5E5A" font-size="10">@lessjs/core (pure runtime)</text>
            </svg>
          </div>

          <h2 class="sec-title">see it in action</h2>
          <div class="demo-grid">
            <div class="demo-card">
              <h4>interactive counter — 0kb js loaded</h4>
              <div style="display:flex;align-items:center;gap:10px;margin:8px 0;">
                <button disabled style="width:30px;height:30px;border-radius:6px;border:0.5px solid var(--less-border);background:var(--less-bg-base);font-size:14px;opacity:0.4;">−</button>
                <span style="font-size:1.125rem;font-weight:500;color:var(--less-text-primary);">0</span>
                <button disabled style="width:30px;height:30px;border-radius:6px;border:0.5px solid var(--less-border);background:var(--less-bg-base);font-size:14px;opacity:0.4;">+</button>
              </div>
              <p style="margin:0;font-size:0.6875rem;color:var(--less-text-tertiary);">html is pre-rendered. js loads only on interaction.</p>
            </div>
            <div class="demo-card">
              <h4>what the browser sees</h4>
              <pre><code>${COUNTER_HTML}</code></pre>
              <p style="margin:6px 0 0;font-size:0.6875rem;color:var(--less-text-tertiary);">dsd is native — no hydration cost.</p>
            </div>
          </div>
        </main>

        <div class="cta">
          <div class="cta-inner">
            <code>deno run -A jsr:@lessjs/create my-app</code>
            <p>requires deno 2.7+ · macos / linux / windows · mit license</p>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

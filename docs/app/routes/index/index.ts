import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import '@lessjs/ui/less-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    less-layout {
      min-height: 100vh;
    }

    .hero {
      background: #050505;
      color: #fff;
      border-bottom: 0.5px solid #222;
    }

    .hero-inner {
      max-width: 960px;
      margin: 0 auto;
      min-height: 54vh;
      padding: 3rem 1.5rem;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
      align-items: center;
      gap: 3rem;
    }

    .eyebrow {
      margin: 0 0 0.75rem;
      color: #9ca3af;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(3rem, 9vw, 6rem);
      font-weight: 520;
      line-height: 0.95;
      letter-spacing: 0;
    }

    .hero-copy {
      margin: 1.25rem 0 0;
      max-width: 34rem;
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.75;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }

    .hero-actions a {
      display: inline-flex;
      align-items: center;
      min-height: 2.5rem;
      padding: 0 1rem;
      border-radius: 4px;
      border: 0.5px solid #3f3f46;
      color: #fff;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .hero-actions a.primary {
      background: #fff;
      border-color: #fff;
      color: #050505;
    }

    .signal {
      border: 0.5px solid #27272a;
      border-radius: 6px;
      background: #0f0f10;
      overflow: hidden;
    }

    .signal-row {
      display: grid;
      grid-template-columns: 5rem 1fr;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 0.5px solid #27272a;
    }

    .signal-row:last-child {
      border-bottom: 0;
    }

    .signal-key {
      color: #a1a1aa;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .signal-value {
      color: #f4f4f5;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
    }

    .band {
      display: grid;
      grid-template-columns: 15rem minmax(0, 1fr);
      gap: 2rem;
      padding: 2rem 0;
      border-bottom: 0.5px solid var(--less-border);
    }

    .band:last-child {
      border-bottom: 0;
    }

    h2 {
      margin: 0;
      color: var(--less-text-primary);
      font-size: 1rem;
      font-weight: 560;
    }

    p {
      margin: 0 0 0.75rem;
      color: var(--less-text-secondary);
      font-size: 0.875rem;
      line-height: 1.75;
    }

    .link-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .doc-link {
      display: block;
      border: 0.5px solid var(--less-border);
      border-radius: 5px;
      padding: 1rem;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, background 0.15s;
    }

    .doc-link:hover {
      border-color: var(--less-border-hover);
      background: var(--less-bg-surface);
    }

    .doc-link strong {
      display: block;
      margin-bottom: 0.35rem;
      color: var(--less-text-primary);
      font-size: 0.875rem;
      font-weight: 560;
    }

    .doc-link span {
      display: block;
      color: var(--less-text-tertiary);
      font-size: 0.8125rem;
      line-height: 1.55;
    }

    code {
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      background: var(--less-code-bg);
      border: 0.5px solid var(--less-code-border);
      border-radius: 3px;
      padding: 0.125rem 0.375rem;
      font-size: 0.8125rem;
      color: var(--less-text-secondary);
    }

    @media (max-width: 760px) {
      .hero-inner,
      .band {
        grid-template-columns: 1fr;
      }

      .hero-inner {
        min-height: auto;
        gap: 2rem;
      }

      .link-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  override render() {
    return html`
      <less-layout home>
        <section class="hero">
          <div class="hero-inner">
            <div>
              <p class="eyebrow">Deno-first / Web Standards-first / Static-first</p>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <img
                  src="/assets/less-logo-inverted.svg"
                  alt="LessJS"
                  style="width:120px;height:auto;display:block;flex-shrink:0;"
                >
                <span style="font-size:clamp(3rem,9vw,6rem);font-weight:520;line-height:0.95;color:#fff;"
                >Less</span>
              </div>
              <p class="hero-copy">
                一个以 DSD-rendered Web Components 为首屏模型、以 Island Upgrade 为交互模型、以 Hono API
                为服务端模型、以 SSG 为默认交付模型的 Web 框架。
              </p>
              <div class="hero-actions">
                <a class="primary" href="/guide/positioning">理解定位</a>
                <a href="/guide/getting-started">开始使用</a>
              </div>
            </div>

            <div class="signal" aria-label="LessJS architecture summary">
              <div class="signal-row">
                <div class="signal-key">Render</div>
                <div class="signal-value">HTML first, Declarative Shadow DOM first.</div>
              </div>
              <div class="signal-row">
                <div class="signal-key">Client</div>
                <div class="signal-value">Only islands upgrade into live Custom Elements.</div>
              </div>
              <div class="signal-row">
                <div class="signal-key">Server</div>
                <div class="signal-value">Hono, Fetch API, route-level middleware, API routes.</div>
              </div>
              <div class="signal-row">
                <div class="signal-key">Output</div>
                <div class="signal-value">Static files first; dynamic capability is explicit.</div>
              </div>
            </div>
          </div>
        </section>

        <main class="content">
          <section class="band">
            <h2>What LessJS Is</h2>
            <div>
              <p>
                LessJS
                的核心不是重新发明组件框架，而是把浏览器已经拥有的能力组织成一条小而清晰的生产路径：
                路由映射页面组件，SSR 生成 DSD HTML，构建阶段抽取 island client entry， SSG
                产出可以直接部署的静态站点。
              </p>
              <p>
                这让它天然适合文档、博客、内容站、营销页和轻量 serverless
                应用。大型后台和高频数据应用可以做， 但必须等 actions、session、validation、revalidation
                等生产约定更成熟后再作为主打场景。
              </p>
            </div>
          </section>

          <section class="band">
            <h2>What LessJS Is Not</h2>
            <div>
              <p>
                它不是 React/Vue 风格的整页 hydration 框架，也不应该提前承诺 ISR、零 JS 全站交互、
                或生产级 compiler 消除 Lit。LessJS 更愿意把边界写清楚，把已有能力做稳。
              </p>
              <p>
                当前稳定重心是 <code>SSG + DSD + Hono API + package islands</code>。
                未来能力会围绕这些边界渐进增加，而不是把所有现代框架关键词一次性塞进文档。
              </p>
            </div>
          </section>

          <section class="band">
            <h2>Read Next</h2>
            <div class="link-grid">
              <a class="doc-link" href="/guide/positioning">
                <strong>Framework Positioning</strong>
                <span>先理解 LessJS 解决什么问题，以及它暂时不解决什么问题。</span>
              </a>
              <a class="doc-link" href="/guide/architecture">
                <strong>Architecture</strong>
                <span>查看构建管线、渲染模型、island 升级和生产边界。</span>
              </a>
              <a class="doc-link" href="/guide/getting-started">
                <strong>Getting Started</strong>
                <span>创建项目、启动开发服务器、构建并预览静态产物。</span>
              </a>
              <a class="doc-link" href="/roadmap">
                <strong>Roadmap</strong>
                <span>了解 v0.7 稳定基线、v0.8 功能完善、v0.9+ 全栈/ISR/Compiler 到 1.0 的路线。</span>
              </a>
            </div>
          </section>
        </main>
      </less-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

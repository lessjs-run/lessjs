import { css, html, LitElement } from 'lit';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static override styles = css`
    :host { display: block; }

    /* Hero — 紧凑，内容居中 */
    .hero {
      background: #000;
      border-bottom: 0.5px solid #222;
      padding: 4% 0;
      display: flex;
      align-items: center;
    }
    .hero-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .hero-brand { display: flex; flex-direction: column; gap: 0.5rem; }
    .hero-kiss {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 500;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .hero-desc {
      font-size: clamp(0.75rem, 1.5vw, 0.875rem);
      color: #aaa;
      line-height: 1.6;
      max-width: 24rem;
    }
    .hero-tech {
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      color: var(--kiss-text-muted);
      letter-spacing: 0.05em;
    }

    /* Content */
    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 3% 5%;
    }
    .section { margin-bottom: 4%; }
    .section-title {
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      font-weight: 500;
      color: var(--kiss-text-muted);
      letter-spacing: 0.1em;
      margin-bottom: 1.5%;
      text-transform: uppercase;
    }

    /* Stats */
    .stats {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
    }
    .stat {
      flex: 1;
      text-align: center;
      padding: 3% 2%;
    }
    .stat + .stat { border-left: 0.5px solid var(--kiss-border); }
    .stat-val {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      font-weight: 500;
      color: var(--kiss-text-primary);
      line-height: 1;
    }
    .stat-label {
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      color: var(--kiss-text-muted);
      margin-top: 0.25rem;
    }

    /* Code */
    .code-row {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
    }
    .code-panel {
      flex: 1;
      padding: 2%;
      background: var(--kiss-bg-surface);
    }
    .code-panel + .code-panel { border-left: 0.5px solid var(--kiss-border); }
    .code-panel .label {
      font-size: clamp(0.5rem, 0.9vw, 0.625rem);
      color: var(--kiss-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2%;
    }
    .code-panel pre {
      margin: 0;
      font-family: 'SF Mono','Fira Code',monospace;
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      line-height: 1.6;
      color: var(--kiss-text-secondary);
    }

    /* Features */
    .feat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(45%, 1fr));
      gap: 2%;
    }
    .feat {
      padding: 2% 0 2% 2%;
      border-left: 2px solid #000;
    }
    .feat h3 {
      font-size: clamp(0.875rem, 1.5vw, 1rem);
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 1%;
    }
    .feat p {
      font-size: clamp(0.75rem, 1.2vw, 0.875rem);
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.5;
    }

    /* Quick start */
    .qstart {
      display: flex;
      gap: 0;
      border: 0.5px solid var(--kiss-border);
      border-radius: 4px;
    }
    .qstep {
      flex: 1;
      padding: 2%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .qstep + .qstep { border-left: 0.5px solid var(--kiss-border); }
    .qstep .num {
      font-size: clamp(0.5rem, 0.8vw, 0.625rem);
      color: var(--kiss-text-muted);
    }
    .qstep code {
      font-family: monospace;
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      background: var(--kiss-code-bg);
      padding: 1% 2%;
      border-radius: 2px;
    }
    .qstep .desc {
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      color: var(--kiss-text-muted);
    }

    /* Comparison */
    .cmp {
      width: 100%;
      border-collapse: collapse;
      font-size: clamp(0.625rem, 1vw, 0.75rem);
      border: 0.5px solid var(--kiss-border);
    }
    .cmp th, .cmp td {
      padding: 2%;
      text-align: left;
      border-bottom: 0.5px solid #e5e5e5;
    }
    .cmp th {
      background: var(--kiss-bg-surface);
      color: var(--kiss-text-muted);
      font-weight: 500;
    }
    .cmp td { color: var(--kiss-text-tertiary); }
    .cmp td:first-child { color: var(--kiss-text-primary); font-weight: 500; }

    @media (max-width: 640px) {
      .hero { flex-direction: column; align-items: flex-start; }
      .code-row, .qstart { flex-direction: column; }
      .feat-grid { grid-template-columns: 1fr; }
      .stats { flex-wrap: wrap; }
      .stat { flex: 1 1 50%; }
    }
  `;

  override render() {
    return html`
      <kiss-layout home>
        <div class="hero">
          <div class="hero-inner">
            <div class="hero-brand">
              <div class="hero-kiss">KISS</div>
              <div class="hero-desc">
                一个基于 Web 标准构建的 Jamstack 框架。<br>
                DSD 首屏渲染，Island 按需升级。纯粹的 Web 平台。
              </div>
              <div class="hero-tech">HTTP Fetch API · Web Components · ESM</div>
            </div>
            <kiss-hero-ping api-url="https://kiss-demo-api.sisyphuszheng.deno.net/api"></kiss-hero-ping>
          </div>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">核心数据</div>
            <div class="stats">
              <div class="stat">
                <div class="stat-val">DSD</div>
                <div class="stat-label">首屏输出</div>
              </div>
              <div class="stat">
                <div class="stat-val">0KB</div>
                <div class="stat-label">框架 JS 基线</div>
              </div>
              <div class="stat">
                <div class="stat-val">4</div>
                <div class="stat-label">运行时支持</div>
              </div>
              <div class="stat">
                <div class="stat-val">100%</div>
                <div class="stat-label">Web 标准</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">工作原理</div>
            <div class="code-row">
              <div class="code-panel">
                <div class="label">服务端 (Hono)</div>
                <pre>import { Hono } from 'hono'
const app = new Hono()
app.get('/api', (c) => c.json({ ok: true }))</pre>
              </div>
              <div class="code-panel">
                <div class="label">客户端 (Lit)</div>
                <pre>import { LitElement, html } from 'lit'
class App extends LitElement {
  render() { return html${'`'}&lt;h1&gt;你好&lt;/h1&gt;${'`'} }
}</pre>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">为什么选择 KISS</div>
            <div class="feat-grid">
              <div class="feat">
                <h3>Web 标准优先</h3>
                <p>HTTP 使用 Fetch API，UI 使用 Web Components，模块使用 ESM。了解平台即了解 KISS。</p>
              </div>
              <div class="feat">
                <h3>群岛架构</h3>
                <p>内容先由 DSD 输出，交互组件再通过 Custom Element upgrade 接管。</p>
              </div>
              <div class="feat">
                <h3>类型安全 RPC</h3>
                <p>通过 Hono RPC 实现端到端类型安全 — 服务端与客户端直接共享类型，无需代码生成。</p>
              </div>
              <div class="feat">
                <h3>SSG + DSD</h3>
                <p>构建时静态生成配合声明式 Shadow DOM。HTML 先可见，JS 后升级。</p>
              </div>
              <div class="feat">
                <h3>多运行时</h3>
                <p>API 层贴近 Fetch 标准，可面向 Deno、Node.js、Bun 和 Cloudflare Workers。</p>
              </div>
              <div class="feat">
                <h3>渐进增强</h3>
                <p>语义化约束保证内容在无 JavaScript 时依然可读。</p>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">快速开始</div>
            <div class="qstart">
              <div class="qstep">
                <span class="num">步骤 1</span>
                <code>deno run -A jsr:@kissjs/create my-app</code>
                <span class="desc">创建项目脚手架</span>
              </div>
              <div class="qstep">
                <span class="num">步骤 2</span>
                <code>cd my-app && deno task dev</code>
                <span class="desc">启动开发服务器</span>
              </div>
              <div class="qstep">
                <span class="num">步骤 3</span>
                <code>deno task build<br>deno task build:client<br>deno task build:ssg</code>
                <span class="desc">三段式构建：SSR → Island → SSG</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">与其他框架对比</div>
            <table class="cmp">
              <tr>
                <th></th>
                <th>KISS</th>
                <th>Fresh</th>
                <th>Nuxt</th>
                <th>Next.js</th>
              </tr>
              <tr>
                <td>HTTP 层</td>
                <td>Fetch API</td>
                <td>Fetch API</td>
                <td>Nitro (定制)</td>
                <td>定制</td>
              </tr>
              <tr>
                <td>UI 层</td>
                <td>Web Components</td>
                <td>Preact/JSX</td>
                <td>Vue</td>
                <td>React</td>
              </tr>
              <tr>
                <td>静态页面</td>
                <td>0 KB 框架 JS</td>
                <td>0 KB 框架 JS</td>
                <td>~60 KB</td>
                <td>~70 KB</td>
              </tr>
              <tr>
                <td>声明式 Shadow DOM</td>
                <td>内置</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </table>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class GettingStartedPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .step {
        margin: 1.5rem 0 2rem;
      }

      .step h2 {
        margin-top: 0;
      }

      .note {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        padding: 0.75rem 1rem;
        margin: 1rem 0;
      }

      .note p {
        margin: 0;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/guide/getting-started">
        <div class="container">
          <h1>快速开始</h1>
          <p class="subtitle">
            从一个最小项目开始：创建应用、启动开发服务器、构建静态产物，再理解每个目录负责什么。
          </p>

          <div class="callout">
            <p>
              推荐使用 Deno 2.7+。LessJS 是 Deno-first 项目，依赖通过
              <span class="inline-code">deno.json</span> 管理，开发和构建命令都从 Deno task 进入。
            </p>
          </div>

          <section class="step">
            <h2>1. Create a Project</h2>
            <code-block><pre><code>deno run -A jsr:@lessjs/create my-app
cd my-app</code></pre></code-block>
            <p>
              生成的项目会包含页面路由、示例 island、Vite 配置和常用 Deno tasks。
            </p>
          </section>

          <section class="step">
            <h2>2. Start Dev Server</h2>
            <code-block><pre><code>deno task dev</code></pre></code-block>
            <p>
              开发模式通过 Vite 提供模块加载和刷新，通过生成的 Hono entry 提供 SSR/API 行为。
              默认打开 <span class="inline-code">http://localhost:5173</span>。
            </p>
          </section>

          <section class="step">
            <h2>3. Build Static Output</h2>
            <code-block><pre><code>deno task build</code></pre></code-block>
            <p>
              构建命令会依次生成 SSR bundle、client island entry 和 SSG HTML。
              最终产物在 <span class="inline-code">dist/</span>，可以部署到任意静态托管平台。
            </p>
          </section>

          <section class="step">
            <h2>4. Preview Production Build</h2>
            <code-block><pre><code>deno task preview</code></pre></code-block>
            <p>
              预览命令用于检查最终静态产物，而不是开发服务器行为。部署前至少跑一次。
            </p>
          </section>

          <h2>Project Shape</h2>
          <code-block><pre><code>my-app/
|-- app/
|   |-- routes/
|   |   |-- index.ts          # page route for /
|   |   |-- about.ts          # page route for /about
|   |   └-- api/
|   |       └-- status.ts     # API route
|   |-- islands/
|   |   └-- counter.ts        # client-upgraded Custom Element
|   └-- _renderer.ts          # optional layout wrapper
|-- deno.json                 # tasks and imports
└-- vite.config.ts            # LessJS plugin config</code></pre></code-block>

          <h2>Write a Page</h2>
          <p>
            页面是一个 Web Component。SSR 会把它渲染成 Declarative Shadow DOM，
            所以内容在 JavaScript 运行前就已经可见。
          </p>
          <code-block><pre><code>import { html, LitElement } from 'lit';

export class HomePage extends LitElement {
  override render() {
    return html&#96;&lt;main&gt;Hello LessJS&lt;/main&gt;&#96;;
  }
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';</code></pre></code-block>

          <h2>Add Interaction</h2>
          <p>
            把需要客户端行为的组件放进 <span class="inline-code">app/islands</span>。
            页面 HTML 先输出，浏览器加载 island entry 后再升级组件。
          </p>
          <code-block><pre><code>&lt;counter-island count="1"&gt;&lt;/counter-island&gt;</code></pre></code-block>

          <div class="note">
            <p>
              下一步建议先读 <a href="/guide/architecture">Architecture</a>，
              再读 <a href="/guide/routing">Routing</a>、<a href="/guide/ssg">Rendering & SSG</a>
              和 <a href="/guide/islands">Island Upgrade</a>。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/positioning" class="nav-link">&larr; Framework Positioning</a>
            <a href="/guide/design-philosophy" class="nav-link">Design Philosophy &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';

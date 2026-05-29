// deno-fmt-ignore-file
export const meta = { section: 'Quick Start', label: 'Getting Started', order: 20 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .step {
        margin: 1.5rem 0 2rem;
      }

      .step h2 {
        margin-top: 0;
      }

      .note {
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        padding: 0.75rem 1rem;
        margin: 1rem 0;
      }

      .note p {
        margin: 0;
      }
    `);

export class GettingStartedPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout locale="${this._getLocale('zh')}" locales='${JSON.stringify(['en', 'zh'])}' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${JSON.stringify(headerNav)}' current-path="/guide/getting-started">
        <div class="container">
          <h1>快速开始</h1>
          <p class="subtitle">
            从一个最小项目开始：创建应用、启动开发服务器、构建静态产物，再理解每个目录负责什么。
          </p>

          <less-callout type="info" label="推荐">
            推荐使用 Deno 2.7+。LessJS 是 Deno-first 项目，依赖通过
            <span class="inline-code">deno.json</span> 管理，开发和构建命令都从 Deno task 进入。
          </less-callout>

          <section class="step">
            <h2>1. 创建项目</h2>
            <less-code-block><pre><code>deno run -A jsr:@lessjs/create my-app
cd my-app</code></pre></less-code-block>
            <p>
              生成的项目会包含页面路由、示例 island、Vite 配置和常用 Deno tasks。
            </p>
          </section>

          <section class="step">
            <h2>2. 启动开发服务器</h2>
            <less-code-block><pre><code>deno task dev</code></pre></less-code-block>
            <p>
              开发模式通过 Vite 提供模块加载和刷新，通过生成的 Hono entry 提供 SSR/API 行为。 默认打开
              <span class="inline-code">http://localhost:5173</span>。
            </p>
          </section>

          <section class="step">
            <h2>3. 构建静态产物</h2>
            <less-code-block><pre><code>deno task build</code></pre></less-code-block>
            <p>
              构建命令会依次生成 SSR bundle、client island entry 和 SSG HTML。 最终产物在 <span
                class="inline-code">dist/</span>，可以部署到任意静态托管平台。
            </p>
          </section>

          <section class="step">
            <h2>4. 预览生产构建</h2>
            <less-code-block><pre><code>deno task preview</code></pre></less-code-block>
            <p>
              预览命令用于检查最终静态产物，而不是开发服务器行为。部署前至少跑一次。
            </p>
          </section>

          <h2>项目结构</h2>
          <less-code-block><pre><code>my-app/
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
└-- vite.config.ts            # LessJS plugin config</code></pre></less-code-block>

          <h2>编写页面</h2>
          <p>
            页面是一个 Web Component。SSR 会把它渲染成 Declarative Shadow DOM， 所以内容在 JavaScript
            运行前就已经可见。
          </p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class HomePage extends DsdElement {
  override render(): string {
    return '&lt;main&gt;Hello LessJS&lt;/main&gt;';
  }
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';</code></pre></less-code-block>

          <h2>添加交互</h2>
          <p>
            使用 JSX 和 Signal 编写响应式组件。Signal 变化时组件自动重新渲染。
          </p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';
import { signal } from '@lessjs/runtime';

export class CounterIsland extends DsdElement {
  count = signal(0);

  render() {
    return (
      &lt;button onClick={() =&gt; this.count.value++}&gt;
        点击次数: {this.count}
      &lt;/button&gt;
    );
  }
}

customElements.define('counter-island', CounterIsland);
export default CounterIsland;
export const tagName = 'counter-island';</code></pre></less-code-block>
          <p>
            把需要客户端行为的组件放进 <span class="inline-code">app/islands</span>。 页面 HTML
            先输出，浏览器加载 island entry 后再升级组件。
          </p>
          <less-code-block><pre><code>&lt;counter-island count="1"&gt;&lt;/counter-island&gt;</code></pre></less-code-block>

          <div class="note">
            <p>
              下一步建议先读 <a href="/engine/architecture">架构</a>， 再读 <a href="/guide/routing">路由</a>、<a href="/guide/ssg">渲染与 SSG</a>
              和 <a href="/engine/islands">Island Upgrade</a>。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/positioning" class="nav-link">&larr; 框架定位</a>
            <a href="/engine/architecture" class="nav-link">设计哲学 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout locale="${this._getLocale('en')}" locales='${JSON.stringify(['en', 'zh'])}' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${JSON.stringify(headerNav)}' current-path="/en/guide/getting-started">
        <div class="container">
          <h1>Getting Started</h1>
          <p class="subtitle">
            Start from a minimal project: create an app, start the dev server, build static output,
            and understand what each directory is responsible for.
          </p>

          <less-callout type="info" label="Recommended">
            Deno 2.7+ recommended. LessJS is a Deno-first project - dependencies are managed
            through <span class="inline-code">deno.json</span>, and all dev/build commands
            use Deno tasks.
          </less-callout>

          <section class="step">
            <h2>1. Create a Project</h2>
            <less-code-block><pre><code>deno run -A jsr:@lessjs/create my-app
cd my-app</code></pre></less-code-block>
            <p>
              The scaffolded project includes page routes, a sample island, Vite config,
              and common Deno tasks.
            </p>
          </section>

          <section class="step">
            <h2>2. Start the Dev Server</h2>
            <less-code-block><pre><code>deno task dev</code></pre></less-code-block>
            <p>
              Dev mode provides module loading and hot reload through Vite, with SSR/API behavior
              via the generated Hono entry. Open <span class="inline-code">http://localhost:5173</span>
              by default.
            </p>
          </section>

          <section class="step">
            <h2>3. Build Static Output</h2>
            <less-code-block><pre><code>deno task build</code></pre></less-code-block>
            <p>
              The build command produces the SSR bundle, client island entry, and SSG HTML sequentially.
              The final output lands in <span class="inline-code">dist/</span> and can be deployed
              to any static hosting platform.
            </p>
          </section>

          <section class="step">
            <h2>4. Preview the Production Build</h2>
            <less-code-block><pre><code>deno task preview</code></pre></less-code-block>
            <p>
              The preview command checks the final static output, not the dev server behavior.
              Run it at least once before deployment.
            </p>
          </section>

          <h2>Project Structure</h2>
          <less-code-block><pre><code>my-app/
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
└-- vite.config.ts            # LessJS plugin config</code></pre></less-code-block>

          <h2>Writing a Page</h2>
          <p>
            A page is a Web Component. SSR renders it into Declarative Shadow DOM, so content
            is visible before JavaScript runs.
          </p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class HomePage extends DsdElement {
  override render(): string {
    return '&lt;main&gt;Hello LessJS&lt;/main&gt;';
  }
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';</code></pre></less-code-block>

          <h2>Adding Interactivity</h2>
          <p>
            Place components that need client-side behavior in <span class="inline-code">app/islands</span>.
            The page HTML is rendered first; the browser upgrades the components after loading
            the island entry.
          </p>
          <less-code-block><pre><code>&lt;counter-island count="1"&gt;&lt;/counter-island&gt;</code></pre></less-code-block>

          <div class="note">
            <p>
              Next steps: <a href="/engine/architecture">Architecture</a>,
              <a href="/guide/routing">Routing</a>,
              <a href="/guide/ssg">Rendering &amp; SSG</a>, and
              <a href="/engine/islands">Island Upgrade</a>.
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/positioning" class="nav-link">&larr; Framework Positioning</a>
            <a href="/engine/architecture" class="nav-link">Design Philosophy &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';

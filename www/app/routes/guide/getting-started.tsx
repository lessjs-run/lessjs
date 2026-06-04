export const meta = { section: 'Quick Start', label: 'Getting Started', order: 1 };
// v0.30.1
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { docsPageStyles } from '@openelement/ui/docs-page-styles';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-callout';
import { OPENELEMENT_VERSION } from '../../data/version.ts';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  .step { margin: var(--size-6) 0 var(--size-8); }
  .step h2 { margin-top: 0; }
  .note { background: var(--gray-1); border: 0.5px solid var(--gray-3); border-radius: var(--radius-1); padding: var(--size-3) var(--size-4); margin: var(--size-4) 0; }
  .nav-row { margin-top: var(--size-8); padding-top: var(--size-4); border-top: 0.5px solid var(--gray-3); display: flex; justify-content: flex-end; }
  .nav-link { color: var(--indigo-5); text-decoration: none; font-weight: var(--font-weight-5); font-size: var(--font-size-2); }
  .nav-link:hover { text-decoration: underline; }
  .note p { margin: 0; }
`);

export class GettingStartedPage extends DsdElement {
  static override styles = [openPropsTokenSheet, docsPageStyles, routeSheet];

  override render() {
    const locale = this._getLocale('en');
    return (
      <div class='content-grid'>
        <div class='container'>
          {locale === 'zh' ? <GettingStartedZh /> : <GettingStartedEn />}
        </div>
      </div>
    );
  }
}

function GettingStartedEn() {
  return (
    <>
      <h1>Getting Started</h1>
      <p class='subtitle'>
        Create a minimal DSD-first app, start the dev server, build static
        output, and see where the v0.30.1 openElement contract lives.
      </p>

      <open-callout type='info' label='Recommended'>
        Deno 2.7+ recommended. openElement <strong>{OPENELEMENT_VERSION}</strong>
        {' '}uses Deno tasks, `deno.json` imports, JSX/VNode rendering, and the
        `openElement()` Vite facade.
      </open-callout>

      <section class='step'>
        <h2>1. Create a Project</h2>
        <open-code-block><pre><code>{'deno run -A jsr:@openelement/create my-app\ncd my-app'}</code></pre></open-code-block>
        <p>
          The scaffold includes page routes, a sample island, Vite config, and
          the common Deno tasks needed for development and builds.
        </p>
      </section>

      <section class='step'>
        <h2>2. Start the Dev Server</h2>
        <open-code-block><pre><code>deno task dev</code></pre></open-code-block>
        <p>
          Dev mode provides module loading and hot reload through Vite, with
          SSR/API behavior from the generated Hono entry.
        </p>
      </section>

      <section class='step'>
        <h2>3. Build Static Output</h2>
        <open-code-block><pre><code>deno task build</code></pre></open-code-block>
        <p>
          The build command scans routes and islands, generates SSR wiring,
          renders DSD HTML, emits client island chunks, and writes the final
          static output to <span class='inline-code'>dist/</span>.
        </p>
      </section>

      <section class='step'>
        <h2>4. Preview the Production Build</h2>
        <open-code-block><pre><code>deno task preview</code></pre></open-code-block>
        <p>
          Preview checks the final static output, not the dev server. Run it
          before deployment.
        </p>
      </section>

      <h2>Project Structure</h2>
      <open-code-block><pre><code>{`my-app/
|-- app/
|   |-- routes/
|   |   |-- index.tsx
|   |   |-- about.tsx
|   |   \`-- api/
|   |       \`-- status.ts
|   |-- islands/
|   |   \`-- counter.tsx
|   \`-- components/
|-- deno.json
\`-- vite.config.ts`}</code></pre></open-code-block>

      <h2>Writing a Page</h2>
      <p>
        A page is a custom element. SSR renders it into Declarative Shadow DOM,
        so content is visible before JavaScript runs.
      </p>
      <open-code-block><pre><code>{`import { DsdElement, type VNode } from '@openelement/core';

export class HomePage extends DsdElement {
  override render(): VNode {
    return <main>Hello openElement</main>;
  }
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';`}</code></pre></open-code-block>

      <h2>Adding Interactivity</h2>
      <p>
        Put browser-upgraded components under <span class='inline-code'>app/islands</span>.
        Interactive dynamic UI should return VNodes and use JSX event handlers.
      </p>
      <open-code-block><pre><code>{`import { DsdElement, type VNode } from '@openelement/core';
import { signal } from '@openelement/signals';

export class CounterIsland extends DsdElement {
  count = signal(0);

  override render(): VNode {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count.value}
      </button>
    );
  }
}`}</code></pre></open-code-block>

      <div class='note'>
        <p>
          Next steps: <a href='/guide/core-concepts'>Core Concepts</a>,{' '}
          <a href='/guide/routing-and-data'>Routing &amp; Data</a>,{' '}
          <a href='/guide/islands-and-ssr'>Islands &amp; SSR</a>, and{' '}
          <a href='/guide/deployment'>Deployment</a>.
        </p>
      </div>

      <div class='nav-row'>
        <a href='/guide/core-concepts' class='nav-link'>Core Concepts &rarr;</a>
      </div>
    </>
  );
}

function GettingStartedZh() {
  return (
    <>
      <h1>快速开始</h1>
      <p class='subtitle'>
        从一个最小 DSD-first 应用开始：创建项目、启动开发服务、构建静态输出，
        并理解 v0.30.1 的 openElement 契约。
      </p>

      <open-callout type='info' label='推荐'>
        推荐 Deno 2.7+。openElement <strong>{OPENELEMENT_VERSION}</strong>
        {' '}使用 Deno tasks、`deno.json` imports、JSX/VNode 渲染，以及
        `openElement()` Vite facade。
      </open-callout>

      <section class='step'>
        <h2>1. 创建项目</h2>
        <open-code-block><pre><code>{'deno run -A jsr:@openelement/create my-app\ncd my-app'}</code></pre></open-code-block>
        <p>脚手架会生成页面路由、示例 island、Vite 配置和常用 Deno tasks。</p>
      </section>

      <section class='step'>
        <h2>2. 启动开发服务</h2>
        <open-code-block><pre><code>deno task dev</code></pre></open-code-block>
        <p>开发模式由 Vite 提供模块加载和热更新，由生成的 Hono entry 提供 SSR/API 行为。</p>
      </section>

      <section class='step'>
        <h2>3. 构建静态输出</h2>
        <open-code-block><pre><code>deno task build</code></pre></open-code-block>
        <p>
          构建会扫描 routes 和 islands，生成 SSR wiring，输出 DSD HTML 和
          client island chunks，最终结果位于 <span class='inline-code'>dist/</span>。
        </p>
      </section>

      <section class='step'>
        <h2>4. 预览生产构建</h2>
        <open-code-block><pre><code>deno task preview</code></pre></open-code-block>
        <p>部署前至少运行一次 preview，检查最终静态输出。</p>
      </section>

      <h2>核心写法</h2>
      <p>
        页面和 island 都是 custom elements。交互 UI 返回 VNodes，用 JSX
        event handlers；不要回到 method-name string event attributes 或动态 HTML 字符串。
      </p>

      <div class='nav-row'>
        <a href='/zh/guide/core-concepts' class='nav-link'>核心概念 &rarr;</a>
      </div>
    </>
  );
}

customElements.define('page-getting-started', GettingStartedPage);
export default GettingStartedPage;
export const tagName = 'page-getting-started';

---
title: '快速开始'
section: 'Quick Start'
label: 'Getting Started'
order: 1
---

<less-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/guide/getting-started">
        <div class="content-grid">

          <h1>快速开始</h1>
          <p class="subtitle">
            LessJS is a <strong>DSD-first</strong> Web Components framework.
            从一个最小项目开始：创建应用、启动开发服务器、构建静态产物，再理解每个目录负责什么。
          </p>

          <less-callout type="info" label="推荐">
            推荐使用 Deno 2.7+。LessJS <strong>v0.29.2</strong> 是 Deno-first 项目，依赖通过
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
| |-- routes/
| | |-- index.ts # page route for /
| | |-- about.ts # page route for /about
| | └-- api/
| | └-- status.ts # API route
| |-- islands/
| | └-- counter.ts # client-upgraded Custom Element
| └-- _renderer.ts # optional layout wrapper
|-- deno.json # tasks and imports
└-- vite.config.ts # LessJS plugin config</code></pre></less-code-block>

    <h2>编写页面</h2>
    <p>
      页面是一个 Web Component。SSR 会把它渲染成 Declarative Shadow DOM， 所以内容在 JavaScript
      运行前就已经可见。
    </p>
    <less-code-block><pre><code>import  from '@lessjs/core';

export class HomePage extends DsdElement
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';</code></pre></less-code-block>

    <h2>添加交互</h2>
    <p>
      使用 JSX 和 Signal 编写响应式组件。Signal 变化时组件自动重新渲染。
    </p>
    <less-code-block><pre><code>import  from '@lessjs/core';

import from '@lessjs/core';

export class CounterIsland extends DsdElement &gt;
点击次数:
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
              下一步建议先读 <a href="/guide/core-concepts">核心概念</a>，
              再读 <a href="/guide/routing-and-data">路由与数据</a>、
              <a href="/guide/islands-and-ssr">Islands 与 SSR</a>
              和 <a href="/guide/deployment">部署</a>。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/core-concepts" class="nav-link">核心概念 &rarr;</a>
          </div>
        </div>

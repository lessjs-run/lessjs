export const meta = { section: 'Principles', label: 'Architecture', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterEngineNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ArchitecturePage extends DsdElement {
  declare locale?: string;

  static override styles = [pageStyles];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterEngineNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/engine/architecture">
        <div class="container">
          <h1>Architecture</h1>
          <p class="subtitle">
            LessJS 架构基于三支柱模型：全栈框架 + 通用 WC 渲染引擎 + Registry Hub。
            这页描述当前模型，也明确哪些边界还在硬化中。
          </p>

          <h2>三支柱模型</h2>
          <p>
            LessJS <strong>不是 SSG 框架</strong>。SSG 只是渲染引擎的当前使用模式。
            <span class="inline-code">renderDSD()</span> 是渲染时机无关的--build-time (SSG)、
            cache-expiry-time (ISR)、request-time (SSR) 用同一套引擎。
          </p>

          <table>
            <thead>
              <tr>
                <th>支柱</th>
                <th>职责</th>
                <th>当前完成度</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. 全栈框架</td>
                <td>路由 + API Route + Serverless 部署 + Hono 运行时</td>
                <td>50% - 缺 ISR/request context/deployment parity</td>
              </tr>
              <tr>
                <td>2. WC 渲染引擎</td>
                <td>DSD 渲染 + 多框架适配器 + 兼容性分类</td>
                <td>82% - v0.20 DsdElement 已完成，缺 client:* 策略和 Signals</td>
              </tr>
              <tr>
                <td>3. Registry Hub</td>
                <td>包发现 + 验证 + 预览 + 一键安装</td>
                <td>55% - 缺包规模、公开服务和治理</td>
              </tr>
            </tbody>
          </table>

          <h2>System Shape</h2>
          <p>
            一个 LessJS 应用由 <span class="inline-code">app/routes</span>、
            <span class="inline-code">app/islands</span>、可选 API routes、可选 middleware
            和构建 metadata 组成。构建器扫描这些约定，生成 Hono entry、client island entry
            和最终静态 HTML。
          </p>

          <less-code-block><pre><code>app/
  routes/
    index.ts              # page component for /
    guide/[slug].ts       # dynamic page route
    api/status.ts         # API route
    _middleware.ts        # route-tree middleware
  islands/
    counter.ts            # client-upgraded component
  _renderer.ts            # optional layout wrapper</code></pre></less-code-block>

          <h2>Build Pipeline</h2>
          <p>
            用户命令保持简单：<span class="inline-code">deno task build</span>。
            内部仍分成三个阶段，因为每一段都有不同的失败模式和可验证产物。
          </p>

          <less-code-block><pre><code>Phase 1: SSR bundle
  - scan routes, API routes, middleware and islands
  - generate virtual Hono entry
  - store build metadata in ctx (LessBuildContext)

Phase 2: client islands
  - read metadata
  - generate virtual:less-client-entry
  - build island chunks into dist/client

Phase 3: SSG
  - load generated Hono app through Vite SSR
  - render route HTML with Declarative Shadow DOM
  - inject island entry, PWA assets and static post-processing</code></pre></less-code-block>

          <h2>Rendering Model</h2>
          <p>
            LessJS 不是把浏览器里的组件树完整搬到客户端再 hydrate。SSR 阶段会实例化页面组件，
            获取它的模板和样式，并把结果写入 Declarative Shadow DOM。
          </p>

          <less-code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Content is visible before JavaScript runs.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></less-code-block>

          <p>
            当前渲染器的风险在于 safe/unsafe HTML 边界必须更清晰。未来的 DSD Renderer 2
            应该保留 Lit 的转义语义、隔离 unsafe HTML、覆盖 CSP nonce/meta 注入，并用测试锁住这些安全契约。
          </p>

          <h2>Island 升级</h2>
          <p>
            Island 是已经在 HTML 中出现的 Custom Element。客户端 entry 加载模块后，
            浏览器通过 <span class="inline-code">customElements.define()</span>
            升级它，事件监听、本地状态和 API 调用才开始工作。
          </p>

          <p>
            当前实现已经支持本地 islands 和 package islands，但构建 metadata 还需要继续收紧：
            页面级 island manifest、加载策略、嵌套路由中的本地 island 路径和 package island
            策略都已经实现（见 island manifest 和升级策略配置）。
          </p>

          <h2>服务端运行时</h2>
          <p>
            SSR 和 API 入口都由 Hono 组织。LessJS 选择 Hono 不是为了制造一个专有服务端模型，
            而是为了贴近 Fetch API、Web Request/Response 和多运行时部署。
          </p>

          <table>
            <thead>
              <tr>
                <th>层</th>
                <th>当前职责</th>
                <th>下一步</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Routes</td>
                <td>页面组件、动态参数、布局 renderer。</td>
                <td>更好的 route manifest 和失败诊断。</td>
              </tr>
              <tr>
                <td>Middleware</td>
                <td>Hono middleware 按路由树挂载。</td>
                <td>修复根 middleware 范围，补齐静态构建安全处理。</td>
              </tr>
              <tr>
                <td>API</td>
                <td>Hono handlers，面向 serverless runtime。</td>
                <td>typed actions、env/secrets、adapter 文档。</td>
              </tr>
              <tr>
                <td>SSG</td>
                <td>默认产出静态 HTML 和 client assets。</td>
                <td>CSP/PWA/postprocess 与 Hono entry 保持一致。</td>
              </tr>
            </tbody>
          </table>

          <h2>包边界</h2>
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>职责</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">@lessjs/core</span></td>
                <td>纯运行时：DSD SSR、Island 升级、Navigation API、结构化日志。零 Vite/Node 依赖。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/adapter-vite</span></td>
                <td>Vite 构建编排：路由扫描、SSG 三阶段管线、Island Transform、HMR。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/app</span></td>
                <td>统一入口：lessjs() 组合 core + content + i18n，推荐项目使用。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/adapter-lit</span></td>
                <td>Lit SSR 适配，DSD 基类已迁移到 <span class="inline-code">DsdElement</span>。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/content</span></td>
                <td>内容插件：Blog + Nav + Sitemap，SSG 内容管线。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/i18n</span></td>
                <td>国际化：locale 展开、路径辅助、语言切换。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/ui</span></td>
                <td>10 个 Web Component，Ocean 组件以 DsdElement 为基类，保留少量 Island 示例。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/signals</span></td>
                <td>TC39 Signals polyfill + islandEffect。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/rpc</span></td>
                <td>RpcController：类型安全 fetch 封装，自动重试/取消。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/create</span></td>
                <td>项目脚手架 CLI，<span class="inline-code">deno run -A jsr:@lessjs/create</span>。</td>
              </tr>
            </tbody>
          </table>

          <h2>信任边界</h2>
          <p>
            当前最重要的架构工作不是增加功能，而是把已经承诺的能力做可信：
            DSD report gate 必须继续阻止未知错误类，Hydration 策略必须贯穿 dev/build，
            API route 与 request context 必须在生产部署中有一致语义。
          </p>

          <div class="nav-row">
            <a href="/engine/comparison" class="nav-link">Comparison &rarr;</a>
            <a href="/guide/routing" class="nav-link">路由 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterEngineNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/engine/architecture">
        <div class="container">
          <h1>Architecture</h1>
          <p class="subtitle">
            LessJS architecture is based on the three-pillar model: Full-Stack Framework + Universal WC
            Rendering Engine + Registry Hub. This page describes the current model and identifies
            boundaries that are still being hardened.
          </p>

          <h2>Three-Pillar Model</h2>
          <p>
            LessJS is <strong>not an SSG framework</strong>. SSG is one mode of the rendering engine.
            <span class="inline-code">renderDSD()</span> is rendering-timing-agnostic - build-time (SSG),
            cache-expiry-time (ISR), request-time (SSR), same engine.
          </p>

          <table>
            <thead>
              <tr>
                <th>Pillar</th>
                <th>Responsibility</th>
                <th>Current Completion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. Full-Stack Framework</td>
                <td>Routing + API Routes + Serverless deployment + Hono runtime</td>
                <td>50% - missing ISR/request context/deployment parity</td>
              </tr>
              <tr>
                <td>2. WC Rendering Engine</td>
                <td>DSD rendering + multi-framework adapters + compatibility classification</td>
                <td>82% - v0.20 DsdElement shipped; missing client:* strategies and Signals</td>
              </tr>
              <tr>
                <td>3. Registry Hub</td>
                <td>Package discovery + validation + preview + one-click install</td>
                <td>55% - missing package scale, public service, and governance</td>
              </tr>
            </tbody>
          </table>

          <h2>System Shape</h2>
          <p>
            A LessJS application consists of <span class="inline-code">app/routes</span>,
            <span class="inline-code">app/islands</span>, optional API routes, optional middleware,
            and build metadata. The builder scans these conventions to generate a Hono entry,
            client island entry, and final static HTML.
          </p>

          <less-code-block><pre><code>app/
  routes/
    index.ts              # page component for /
    guide/[slug].ts       # dynamic page route
    api/status.ts         # API route
    _middleware.ts        # route-tree middleware
  islands/
    counter.ts            # client-upgraded component
  _renderer.ts            # optional layout wrapper</code></pre></less-code-block>

          <h2>Build Pipeline</h2>
          <p>
            The user command stays simple: <span class="inline-code">deno task build</span>.
            Internally it's divided into three phases, because each has different failure modes
            and verifiable artifacts.
          </p>

          <less-code-block><pre><code>Phase 1: SSR bundle
  - scan routes, API routes, middleware and islands
  - generate virtual Hono entry
  - store build metadata in ctx (LessBuildContext)

Phase 2: client islands
  - read metadata
  - generate virtual:less-client-entry
  - build island chunks into dist/client

Phase 3: SSG
  - load generated Hono app through Vite SSR
  - render route HTML with Declarative Shadow DOM
  - inject island entry, PWA assets and static post-processing</code></pre></less-code-block>

          <h2>Rendering Model</h2>
          <p>
            LessJS does not move the browser's full component tree to the client and then hydrate.
            The SSR phase instantiates page components, retrieves their template and styles,
            and writes the result into Declarative Shadow DOM.
          </p>

          <less-code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Content is visible before JavaScript runs.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></less-code-block>

          <p>
            The current renderer's risk is that the safe/unsafe HTML boundary must be clearer.
            A future DSD Renderer 2 should preserve Lit's escape semantics, isolate unsafe HTML,
            cover CSP nonce/meta injection, and lock down these security contracts with tests.
          </p>

          <h2>Island Upgrade</h2>
          <p>
            An island is a Custom Element that already exists in the HTML. After the client entry
            loads its module, the browser upgrades it via <span class="inline-code">customElements.define()</span>,
            and event listeners, local state, and API calls begin to work.
          </p>

          <p>
            The current implementation supports both local islands and package islands. The remaining
            architectural work is protocol clarity: package islands must become a reliable SSR input,
            page-level island manifests must be treated as validation artifacts, and loading strategies
            must survive every build phase.
          </p>

          <p>
            Registry and one-command install work belongs above this boundary, not inside it. The
            renderer kernel should expose what was rendered, what needs upgrade, what failed, and which
            adapter handled it; the registry layer can then index those facts.
          </p>

          <h2>Server Runtime</h2>
          <p>
            Both SSR and API entry points are organized by Hono. LessJS chose Hono not to create
            a proprietary server model, but to align with the Fetch API, Web Request/Response,
            and multi-runtime deployment.
          </p>

          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Current Responsibility</th>
                <th>Next Steps</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Routes</td>
                <td>Page components, dynamic params, layout renderers.</td>
                <td>Better route manifests and failure diagnostics.</td>
              </tr>
              <tr>
                <td>Middleware</td>
                <td>Hono middleware mounted on the route tree.</td>
                <td>Fix root middleware scope, complete static build security handling.</td>
              </tr>
              <tr>
                <td>API</td>
                <td>Hono handlers targeting serverless runtimes.</td>
                <td>Typed actions, env/secrets, adapter documentation.</td>
              </tr>
              <tr>
                <td>SSG</td>
                <td>Default static HTML and client assets output.</td>
                <td>Align CSP/PWA/postprocess with Hono entry.</td>
              </tr>
            </tbody>
          </table>

          <h2>Package Boundaries</h2>
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Responsibility</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">@lessjs/core</span></td>
                <td>Pure runtime: DSD SSR, Island upgrade, Navigation API, structured logging. Zero Vite/Node deps.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/adapter-vite</span></td>
                <td>Vite build orchestration: route scanning, SSG 3-phase pipeline, Island transform, HMR.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/app</span></td>
                <td>Unified entry: lessjs() combines core + content + i18n. Recommended for all projects.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/adapter-lit</span></td>
                <td>Lit SSR adapter; the DSD base has moved to <span class="inline-code">DsdElement</span>.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/content</span></td>
                <td>Content plugin: Blog + Nav + Sitemap, SSG content pipeline.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/i18n</span></td>
                <td>i18n: locale expansion, path helpers, language switching.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/ui</span></td>
                <td>10 Web Components. Ocean components use DsdElement; a small island example remains.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/signals</span></td>
                <td>TC39 Signals polyfill + islandEffect.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/rpc</span></td>
                <td>RpcController: type-safe fetch wrapper with auto-retry and cancellation.</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/create</span></td>
                <td>CLI scaffold, <span class="inline-code">deno run -A jsr:@lessjs/create</span>.</td>
              </tr>
            </tbody>
          </table>

          <h2>Trust Boundaries</h2>
          <p>
            The most important architectural work right now is not adding features, but making
            already-promised capabilities trustworthy: the DSD report gate must continue blocking
            unknown error classes, hydration strategies must survive dev and build, and API routes
            plus request context need consistent production semantics.
          </p>

          <div class="nav-row">
            <a href="/engine/comparison" class="nav-link">Comparison &rarr;</a>
            <a href="/guide/routing" class="nav-link">Routing &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-architecture', ArchitecturePage);
export default ArchitecturePage;
export const tagName = 'page-architecture';

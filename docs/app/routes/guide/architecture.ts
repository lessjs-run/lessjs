import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ArchitecturePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/architecture">
        <div class="container">
          <h1>架构设计</h1>
          <p class="subtitle">
            KISS 是 Web Standards-first、static-first 的全栈框架内核。
          </p>

          <h2>一句话定义</h2>
          <p>
            KISS 用 <strong>DSD-rendered Web Components</strong> 输出首屏 HTML，
            用 <strong>Island Upgrade</strong> 接管交互，
            用 <strong>Hono + Fetch API</strong> 提供 Serverless 后端，
            用 <strong>SSG</strong> 作为默认交付形态。
          </p>
          <p>
            这不是 React/Vue 式 hydration 框架。当前模型更准确地说是：
            <span class="inline-code">DSD first render + Custom Element upgrade</span>。
          </p>

          <h2>K·I·S·S 约束</h2>
          <table>
            <thead>
              <tr>
                <th>字母</th>
                <th>约束</th>
                <th>工程含义</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong></td>
                <td>Knowledge</td>
                <td>路由、组件、islands 在构建时被扫描并写入 manifest。</td>
              </tr>
              <tr>
                <td><strong>I</strong></td>
                <td>Isolated</td>
                <td>客户端 JS 只属于需要交互的 island，且通过 Shadow DOM 隔离。</td>
              </tr>
              <tr>
                <td><strong>S</strong></td>
                <td>Semantic</td>
                <td>页面先输出可读 HTML + DSD；JS 失败时内容仍可见。</td>
              </tr>
              <tr>
                <td><strong>S</strong></td>
                <td>Static</td>
                <td>默认产物是静态文件；动态能力通过 Serverless API 或未来 ISR 扩展。</td>
              </tr>
            </tbody>
          </table>

          <h2>当前构建管线</h2>
          <code-block><pre><code>Phase 1: vite build
  - scan routes / islands / package islands
  - generate virtual Hono entry
  - write .kiss/build-metadata.json

Phase 2: build:client
  - read .kiss/build-metadata.json
  - generate client island entry
  - build dist/client/islands/*.js

Phase 3: build:ssg
  - create Vite SSR server
  - load generated Hono app
  - render routes to DSD HTML
  - inject client entry and optional PWA assets</code></pre></code-block>

          <h2>渲染模型</h2>
          <p>
            当前 core 的 DSD renderer 会实例化自定义元素类，设置 route params，
            调用 <span class="inline-code">render()</span>，再把结果包进
            <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span>。
          </p>
          <code-block><pre><code>&lt;my-page&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Static content first&lt;/main&gt;
  &lt;/template&gt;
&lt;/my-page&gt;</code></pre></code-block>
          <p>
            这个模型的好处是首屏不依赖 JavaScript。风险是：
            <span class="inline-code">render(): string</span> 本质上是 unsafe HTML，
            框架必须提供清晰的 safe/unsafe 契约。Lit adapter 也必须保持 Lit 的转义语义。
            因此 v0.6 的优先级是 DSD Renderer 2，而不是提前扩大未来应用层功能。
          </p>

          <h2>Island Upgrade</h2>
          <p>
            Island 不是整页 hydration。浏览器先解析 DSD；之后客户端 entry
            通过 <span class="inline-code">customElements.define()</span> 加载 island 模块，
            元素升级后绑定事件、恢复本地状态或调用 API。
          </p>
          <p>
            当前实现仍偏 alpha：client entry 主要基于全局 island 列表生成。
            v0.7.0 的目标是页面级 island manifest，让每页只加载当前页面实际出现的交互组件。
          </p>

          <h2>Serverless Fullstack</h2>
          <p>
            API Routes 目前通过 Hono sub-app 挂载到 generated Hono entry。
            这已经是好的后端选型，但还不等于完整 fullstack 闭环。
            v0.8.0 需要补齐 deployment adapters、FormData actions、typed RPC、env/secrets。
          </p>

          <h2>产品节奏</h2>
          <p>
            KISS 近期最适合博客、文档、内容站、营销页和轻量 serverless 应用。
            CRM/admin 是中期目标，需要 forms/actions、auth/session、validation、
            data table 和 revalidation 约定成熟后再作为官方主打场景。
          </p>

          <h2>SSG 与 ISR</h2>
          <p>
            SSG 是当前稳定模式。ISR 是未来能力，必须建立在 serverless/edge adapter、
            cache、lock、revalidate、失败回退这些机制之上。没有这些机制前，
            文档不应宣称 KISS 已具备 ISR。
          </p>

          <h2>边界</h2>
          <table>
            <thead>
              <tr>
                <th>当前可依赖</th>
                <th>当前不应过度承诺</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SSG、DSD 输出、Hono API、package islands、PWA 基础生成</td>
                <td>传统 hydration、ISR、页面级 island 按需加载、零 JS 全站、生产级 compiler</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">&larr; 设计哲学</a>
            <a href="/guide/routing" class="nav-link">路由 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-architecture', ArchitecturePage);
export default ArchitecturePage;
export const tagName = 'page-architecture';

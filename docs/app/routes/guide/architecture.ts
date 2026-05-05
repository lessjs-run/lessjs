import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class ArchitecturePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout currentPath="/guide/architecture">
        <div class="container">
          <h1>架构</h1>
          <p class="subtitle">
            LessJS 的架构核心是把路由、渲染、island、API 和静态产物连接成一条可观察的构建链。
            这页描述当前模型，也明确哪些边界还在硬化中。
          </p>

          <h2>System Shape</h2>
          <p>
            一个 LessJS 应用由 <span class="inline-code">app/routes</span>、
            <span class="inline-code">app/islands</span>、可选 API routes、可选 middleware
            和构建 metadata 组成。构建器扫描这些约定，生成 Hono entry、client island entry
            和最终静态 HTML。
          </p>

          <code-block><pre><code>app/
  routes/
    index.ts              # page component for /
    guide/[slug].ts       # dynamic page route
    api/status.ts         # API route
    _middleware.ts        # route-tree middleware
  islands/
    counter.ts            # client-upgraded component
  _renderer.ts            # optional layout wrapper</code></pre></code-block>

          <h2>Build Pipeline</h2>
          <p>
            用户命令保持简单：<span class="inline-code">deno task build</span>。
            内部仍分成三个阶段，因为每一段都有不同的失败模式和可验证产物。
          </p>

          <code-block><pre><code>Phase 1: SSR bundle
  - scan routes, API routes, middleware and islands
  - generate virtual Hono entry
  - emit .kiss/build-metadata.json

Phase 2: client islands
  - read metadata
  - generate .kiss-client-entry.ts
  - build island chunks into dist/client

Phase 3: SSG
  - load generated Hono app through Vite SSR
  - render route HTML with Declarative Shadow DOM
  - inject island entry, PWA assets and static post-processing</code></pre></code-block>

          <h2>Rendering Model</h2>
          <p>
            LessJS 不是把浏览器里的组件树完整搬到客户端再 hydrate。SSR 阶段会实例化页面组件，
            获取它的模板和样式，并把结果写入 Declarative Shadow DOM。
          </p>

          <code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Content is visible before JavaScript runs.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></code-block>

          <p>
            当前渲染器的风险在于 safe/unsafe HTML 边界必须更清晰。未来的 DSD Renderer 2
            应该保留 Lit 的转义语义、隔离 unsafe HTML、覆盖 CSP nonce/meta 注入，并用测试锁住这些安全契约。
          </p>

          <h2>Island Upgrade</h2>
          <p>
            Island 是已经在 HTML 中出现的 Custom Element。客户端 entry 加载模块后，
            浏览器通过 <span class="inline-code">customElements.define()</span>
            升级它，事件监听、本地状态和 API 调用才开始工作。
          </p>

          <p>
            当前实现已经支持本地 islands 和 package islands，但构建 metadata 还需要继续收紧：
            页面级 island manifest、加载策略、嵌套路由中的本地 island 路径和 package island
            策略都应该成为 v0.7 前的重点。
          </p>

          <h2>Server Runtime</h2>
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

          <h2>Package Boundaries</h2>
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
                <td>路由扫描、entry 生成、DSD SSR、SSG、CLI。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/ui</span></td>
                <td>文档站和示例可复用的 Web Components。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/rpc</span></td>
                <td>类型安全 API/RPC 能力的实验和沉淀。</td>
              </tr>
              <tr>
                <td><span class="inline-code">@lessjs/adapter-lit</span></td>
                <td>Lit 适配边界，未来为 compiler/多 adapter 留出空间。</td>
              </tr>
            </tbody>
          </table>

          <h2>Trust Boundaries</h2>
          <p>
            当前最重要的架构工作不是增加功能，而是把已经承诺的能力做可信：
            middleware 范围必须准确，SSG 和 Hono entry 的 CSP 行为必须一致，嵌套 island
            路径必须稳定，加载策略不能在构建时丢失。
          </p>

          <div class="nav-row">
            <a href="/guide/design-philosophy" class="nav-link">&larr; Design Philosophy</a>
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

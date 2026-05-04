import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class SSGGuidePage extends LitElement {
  static override styles = [pageStyles, css``];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/ssg">
        <div class="container">
          <h1>静态站点生成（SSG）</h1>
          <p class="subtitle">
            KISS 当前稳定交付形态是 SSG：构建时把路由渲染为带 DSD 的静态 HTML。
          </p>

          <h2>三阶段构建</h2>
          <p>
            KISS 不在一个 Vite hook 里隐式完成所有工作，而是把构建拆成三个可验证阶段。
          </p>
          <code-block><pre><code>deno task build          # Phase 1: SSR bundle + .kiss/build-metadata.json
deno task build:client   # Phase 2: client island entry/chunks
deno task build:ssg      # Phase 3: static HTML + post-processing</code></pre></code-block>

          <h2>Phase 1：SSR bundle</h2>
          <ol>
            <li>扫描 <span class="inline-code">app/routes/</span>。</li>
            <li>扫描 <span class="inline-code">app/islands/</span> 与 package islands。</li>
            <li>生成 virtual Hono entry。</li>
            <li>写出 <span class="inline-code">.kiss/build-metadata.json</span>。</li>
          </ol>

          <h2>Phase 2：Island client build</h2>
          <p>
            客户端构建读取 Phase 1 的元数据，生成 island entry 并交给 Vite 输出
            <span class="inline-code">dist/client/islands/*.js</span>。
          </p>
          <p>
            当前仍以全局 island entry 为主。页面级 island manifest 是 v0.7.0 目标。
          </p>

          <h2>Phase 3：DSD HTML 输出</h2>
          <p>
            SSG 阶段创建 Vite SSR server，加载 generated Hono app，
            对页面路由发起请求并写出静态 HTML。页面组件通过 DSD renderer 输出：
          </p>
          <code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;...&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></code-block>

          <h2>DSD 语义</h2>
          <table>
            <thead>
              <tr>
                <th>能力</th>
                <th>当前状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>首屏内容</td>
                <td>HTML 中已经包含 DSD，JavaScript 失败时内容仍可见。</td>
              </tr>
              <tr>
                <td>组件样式</td>
                <td>静态样式可注入 shadow root。Lit styles 通过 adapter 提取。</td>
              </tr>
              <tr>
                <td>交互接管</td>
                <td>客户端 custom element upgrade 后绑定事件和状态。</td>
              </tr>
              <tr>
                <td>嵌套 DSD</td>
                <td>尚未完整实现；v0.6.0 需要补齐。</td>
              </tr>
              <tr>
                <td>安全转义</td>
                <td>外层属性已转义；组件 render 内容需要明确 safe/unsafe 契约。</td>
              </tr>
            </tbody>
          </table>

          <h2>不是 ISR</h2>
          <p>
            当前 KISS 的稳定模式是 SSG。ISR 需要 route-level revalidate、cache lock、
            serverless/edge adapter、失败回退和 CDN 策略。它属于 v0.9.0 目标，
            不是当前已完成能力。
          </p>

          <h2>部署</h2>
          <p>
            <span class="inline-code">dist/</span> 是纯静态产物，可部署到 GitHub Pages、
            Cloudflare Pages、Netlify、Vercel 静态输出、S3/CloudFront 等平台。
            API Routes 需要单独通过 Serverless adapter 或平台配置部署。
          </p>

          <div class="nav-row">
            <a href="/guide/api-design" class="nav-link">&larr; API 设计</a>
            <a href="/guide/configuration" class="nav-link">配置 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-ssg-guide', SSGGuidePage);
export default SSGGuidePage;
export const tagName = 'page-ssg-guide';

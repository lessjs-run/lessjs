export const meta = { section: 'Core Model', label: 'Rendering & SSG', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class SSGGuidePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/ssg">
        <div class="container">
          <h1>渲染与 SSG</h1>
          <p class="subtitle">
            LessJS 的默认生产产物是静态 HTML。构建阶段会把页面渲染成带 Declarative Shadow DOM
            的文档，并注入必要的 client island entry。
          </p>

          <h2>默认输出</h2>
          <p>
            对用户来说，生产构建只有一个入口：
          </p>
          <less-code-block><pre><code>deno task build</code></pre></less-code-block>
          <p>
            结果写入 <span class="inline-code">dist/</span>。如果应用没有动态 API 依赖，
            这个目录可以直接部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel static output
            或 S3/CloudFront。
          </p>

          <h2>渲染内容</h2>
          <p>
            页面组件会在构建时执行 SSR，输出 Web Component host 和 shadow root template。
            内容在 JavaScript 下载前就已经存在于 HTML 中。
          </p>
          <less-code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Readable content first.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></less-code-block>

          <h2>三个内部阶段</h2>
          <table>
            <thead>
              <tr>
                <th>阶段</th>
                <th>输入</th>
                <th>输出</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SSR bundle</td>
                <td>routes、renderers、middleware、API handlers、islands</td>
                <td>生成的 Hono entry 和 <span class="inline-code">.less/build-metadata.json</span></td>
              </tr>
              <tr>
                <td>Client islands</td>
                <td>build metadata</td>
                <td>island entry 和浏览器 chunks，输出到 <span class="inline-code">dist/client</span></td>
              </tr>
              <tr>
                <td>SSG</td>
                <td>生成的 Hono app</td>
                <td>静态 HTML、复制的资源和后处理的文档 head</td>
              </tr>
            </tbody>
          </table>

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
                <td>首屏</td>
                <td>渲染的 HTML 在客户端 JavaScript 运行前即可见。</td>
              </tr>
              <tr>
                <td>组件样式</td>
                <td>样式可以通过 Lit adapter 路径写入 shadow root。</td>
              </tr>
              <tr>
                <td>交互</td>
                <td>Custom Elements 在 island 模块加载后升级。</td>
              </tr>
              <tr>
                <td>嵌套 DSD</td>
                <td>v0.6.0：完全实现递归渲染和 slot 投射。</td>
              </tr>
              <tr>
                <td>安全 HTML</td>
                <td>v0.6.0：SafeHtml/UnsafeHtml 品牌类型，正确的转义语义。</td>
              </tr>
            </tbody>
          </table>

          <h2>安全后处理</h2>
          <p>
            SSG 输出必须保留生成的 Hono entry 中的安全行为。CSP metadata、nonce、
            PWA head 标签和 island 脚本应通过一条共享的后处理路径注入，
            以确保静态部署不会静默丢失 SSR 模式中已有的保护。
          </p>

          <h2>暂不支持 ISR</h2>
          <p>
            LessJS 当前稳定交付是 SSG。ISR 需要 route-level revalidate、cache lock、adapter contracts、
            failure fallback 和 CDN semantics。它属于 roadmap，而不是当前可依赖的生产能力。
          </p>

          <div class="nav-row">
            <a href="/guide/routing" class="nav-link">&larr; 路由</a>
            <a href="/guide/dsd" class="nav-link">DSD 渲染架构 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-ssg-guide', SSGGuidePage);
export default SSGGuidePage;
export const tagName = 'page-ssg-guide';

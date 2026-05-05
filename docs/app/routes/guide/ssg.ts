import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class SSGGuidePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout currentPath="/guide/ssg">
        <div class="container">
          <h1>渲染与 SSG</h1>
          <p class="subtitle">
            LessJS 的默认生产产物是静态 HTML。构建阶段会把页面渲染成带 Declarative Shadow DOM
            的文档，并注入必要的 client island entry。
          </p>

          <h2>Default Output</h2>
          <p>
            对用户来说，生产构建只有一个入口：
          </p>
          <code-block><pre><code>deno task build</code></pre></code-block>
          <p>
            结果写入 <span class="inline-code">dist/</span>。如果应用没有动态 API 依赖，
            这个目录可以直接部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel static output
            或 S3/CloudFront。
          </p>

          <h2>What Gets Rendered</h2>
          <p>
            页面组件会在构建时执行 SSR，输出 Web Component host 和 shadow root template。
            内容在 JavaScript 下载前就已经存在于 HTML 中。
          </p>
          <code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Readable content first.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></code-block>

          <h2>Three Internal Phases</h2>
          <table>
            <thead>
              <tr>
                <th>Phase</th>
                <th>Input</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SSR bundle</td>
                <td>routes, renderers, middleware, API handlers, islands</td>
                <td>generated Hono entry and <span class="inline-code">.kiss/build-metadata.json</span></td>
              </tr>
              <tr>
                <td>Client islands</td>
                <td>build metadata</td>
                <td>island entry and browser chunks under <span class="inline-code">dist/client</span></td>
              </tr>
              <tr>
                <td>SSG</td>
                <td>generated Hono app</td>
                <td>static HTML, copied assets and post-processed document head</td>
              </tr>
            </tbody>
          </table>

          <h2>DSD Semantics</h2>
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Current state</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>First screen</td>
                <td>Rendered HTML is visible before client JavaScript runs.</td>
              </tr>
              <tr>
                <td>Component styles</td>
                <td>Styles can be emitted into shadow roots through the Lit adapter path.</td>
              </tr>
              <tr>
                <td>Interaction</td>
                <td>Custom Elements upgrade after the island module is loaded.</td>
              </tr>
              <tr>
                <td>Nested DSD</td>
                <td>Still an implementation-hardening item for Renderer 2.</td>
              </tr>
              <tr>
                <td>Safe HTML</td>
                <td>Outer attributes are escaped; component render output still needs clearer safe/unsafe contracts.</td>
              </tr>
            </tbody>
          </table>

          <h2>Security Post-Processing</h2>
          <p>
            SSG output must preserve security behavior from the generated Hono entry. CSP metadata, nonces,
            PWA head tags and island scripts should be injected through one shared post-processing path,
            so static deployment does not silently lose protections that exist in SSR mode.
          </p>

          <h2>Not ISR Yet</h2>
          <p>
            LessJS 当前稳定交付是 SSG。ISR 需要 route-level revalidate、cache lock、adapter contracts、
            failure fallback 和 CDN semantics。它属于 roadmap，而不是当前可依赖的生产能力。
          </p>

          <div class="nav-row">
            <a href="/guide/routing" class="nav-link">&larr; Routing</a>
            <a href="/guide/islands" class="nav-link">Island Upgrade &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-ssg-guide', SSGGuidePage);
export default SSGGuidePage;
export const tagName = 'page-ssg-guide';

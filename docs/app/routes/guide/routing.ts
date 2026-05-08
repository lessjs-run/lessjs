export const meta = { section: 'Core Model', label: 'Routing', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class RoutingGuidePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/routing">
        <div class="container">
          <h1>路由</h1>
          <p class="subtitle">
            LessJS 使用文件系统路由。一个页面文件对应一个 URL；特殊文件用于 layout wrapping、
            middleware 和 API handlers。
          </p>

          <h2>Page Routes</h2>
          <p>
            <span class="inline-code">app/routes</span> 下的页面组件会被扫描成页面路由。
            页面模块必须默认导出 Custom Element class，并导出
            <span class="inline-code">tagName</span>。
          </p>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Route</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/index.ts</span></td>
                <td><span class="inline-code">/</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/about.ts</span></td>
                <td><span class="inline-code">/about</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/docs/index.ts</span></td>
                <td><span class="inline-code">/docs</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/docs/install.ts</span></td>
                <td><span class="inline-code">/docs/install</span></td>
              </tr>
            </tbody>
          </table>

          <h2>Dynamic Segments</h2>
          <p>
            方括号会转换成 Hono route params。SSR 时这些 params 会作为同名 property
            写入页面组件。
          </p>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Route</th>
                <th>Property</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/posts/[slug].ts</span></td>
                <td><span class="inline-code">/posts/:slug</span></td>
                <td><span class="inline-code">slug</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td>
                <td><span class="inline-code">/users/:id/posts</span></td>
                <td><span class="inline-code">id</span></td>
              </tr>
            </tbody>
          </table>

          <code-block><pre><code>export class PostPage extends LitElement {
  slug = '';

  override render() {
    return html&#96;&lt;article&gt;Post: \${this.slug}&lt;/article&gt;&#96;;
  }
}</code></pre></code-block>

          <h2>Special Files</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">_renderer.ts</span></td>
                <td>Wraps SSR output for a route subtree. Use it for layout shells or document-level composition.</td>
              </tr>
              <tr>
                <td><span class="inline-code">_middleware.ts</span></td>
                <td>Mounts Hono middleware for a route subtree. Use it for headers, auth, CSP nonce and request guards.</td>
              </tr>
              <tr>
                <td><span class="inline-code">api/*.ts</span></td>
                <td>Defines Hono API handlers under the same file-system route tree.</td>
              </tr>
            </tbody>
          </table>

          <h2>Route Module Contract</h2>
          <code-block><pre><code>import { html, LitElement } from 'lit';

export class AboutPage extends LitElement {
  override render() {
    return html&#96;&lt;main&gt;About&lt;/main&gt;&#96;;
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></code-block>

          <h2>Current Boundary</h2>
          <p>
            路由扫描已经可以稳定处理页面、动态片段、renderer、middleware 和 API routes。
            v0.5.3 已修复根级 <span class="inline-code">_middleware.ts</span> 的挂载范围——
            现在会正确生成 <span class="inline-code">app.use('/*', ...)</span> 覆盖整个路由树。
          </p>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/guide/ssg" class="nav-link">Rendering & SSG &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-routing-guide', RoutingGuidePage);
export default RoutingGuidePage;
export const tagName = 'page-routing-guide';

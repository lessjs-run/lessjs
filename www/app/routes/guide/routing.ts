export const meta = { section: 'Core', label: 'Routing', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class RoutingGuidePage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${filterFrameworkNav(navSections)}" .headerNav="${headerNav}" current-path="/guide/routing">
        <div class="container">
          <h1>路由</h1>
          <p class="subtitle">
            LessJS 使用文件系统路由。一个页面文件对应一个 URL；特殊文件用于 layout wrapping、
            middleware 和 API handlers。
          </p>

          <h2>页面路由</h2>
          <p>
            <span class="inline-code">app/routes</span> 下的页面组件会被扫描成页面路由。
            页面模块必须默认导出 Custom Element class，并导出
            <span class="inline-code">tagName</span>。
          </p>
          <table>
            <thead><tr><th>文件</th><th>路由</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/index.ts</span></td><td><span class="inline-code">/</span></td></tr>
              <tr><td><span class="inline-code">app/routes/about.ts</span></td><td><span class="inline-code">/about</span></td></tr>
              <tr><td><span class="inline-code">app/routes/docs/index.ts</span></td><td><span class="inline-code">/docs</span></td></tr>
              <tr><td><span class="inline-code">app/routes/docs/install.ts</span></td><td><span class="inline-code">/docs/install</span></td></tr>
            </tbody>
          </table>

          <h2>动态片段</h2>
          <p>方括号会转换成 Hono route params。SSR 时这些 params 会作为同名 property 写入页面组件。</p>
          <table>
            <thead><tr><th>文件</th><th>路由</th><th>属性</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/posts/[slug].ts</span></td><td><span class="inline-code">/posts/:slug</span></td><td><span class="inline-code">slug</span></td></tr>
              <tr><td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td><td><span class="inline-code">/users/:id/posts</span></td><td><span class="inline-code">id</span></td></tr>
            </tbody>
          </table>

          <less-code-block><pre><code>export class PostPage extends LitElement {
  slug = '';
  override render() {
    return html&#96;&lt;article&gt;Post: \${this.slug}&lt;/article&gt;&#96;;
  }
}</code></pre></less-code-block>

          <h2>特殊文件</h2>
          <table>
            <thead><tr><th>文件</th><th>用途</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">_renderer.ts</span></td><td>为路由子树包裹 SSR 输出。用于布局外壳或文档级组合。</td></tr>
              <tr><td><span class="inline-code">_middleware.ts</span></td><td>为路由子树挂载 Hono middleware。用于 headers、auth、CSP nonce 和请求守卫。</td></tr>
              <tr><td><span class="inline-code">api/*.ts</span></td><td>在同一文件系统路由树下定义 Hono API handlers。</td></tr>
            </tbody>
          </table>

          <h2>路由模块契约</h2>
          <less-code-block><pre><code>import { html, LitElement } from 'lit';

export class AboutPage extends LitElement {
  override render() {
    return html&#96;&lt;main&gt;About&lt;/main&gt;&#96;;
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></less-code-block>

          <h2>当前边界</h2>
          <p>路由扫描已经可以稳定处理页面、动态片段、renderer、middleware 和 API routes。v0.5.3 已修复根级 <span class="inline-code">_middleware.ts</span> 的挂载范围——现在会正确生成 <span class="inline-code">app.use('/*', ...)</span> 覆盖整个路由树。</p>

          <div class="nav-row">
            <a href="/engine/architecture" class="nav-link">&larr; 架构</a>
            <a href="/guide/ssg" class="nav-link">渲染与 SSG &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout locale="${this.locale || 'en'}" .locales="${['en', 'zh']}" .navItems="${filterFrameworkNav(navSections)}" .headerNav="${headerNav}" current-path="/en/guide/routing">
        <div class="container">
          <h1>Routing</h1>
          <p class="subtitle">
            LessJS uses filesystem routing. One page file maps to one URL; special files provide
            layout wrapping, middleware, and API handlers.
          </p>

          <h2>Page Routes</h2>
          <p>
            Page components under <span class="inline-code">app/routes</span> are scanned into page routes.
            Each page module must export a Custom Element class as default and export a
            <span class="inline-code">tagName</span>.
          </p>
          <table>
            <thead><tr><th>File</th><th>Route</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/index.ts</span></td><td><span class="inline-code">/</span></td></tr>
              <tr><td><span class="inline-code">app/routes/about.ts</span></td><td><span class="inline-code">/about</span></td></tr>
              <tr><td><span class="inline-code">app/routes/docs/index.ts</span></td><td><span class="inline-code">/docs</span></td></tr>
              <tr><td><span class="inline-code">app/routes/docs/install.ts</span></td><td><span class="inline-code">/docs/install</span></td></tr>
            </tbody>
          </table>

          <h2>Dynamic Segments</h2>
          <p>Bracket notation maps to Hono route params. During SSR, these params are set as component properties.</p>
          <table>
            <thead><tr><th>File</th><th>Route</th><th>Property</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">app/routes/posts/[slug].ts</span></td><td><span class="inline-code">/posts/:slug</span></td><td><span class="inline-code">slug</span></td></tr>
              <tr><td><span class="inline-code">app/routes/users/[id]/posts.ts</span></td><td><span class="inline-code">/users/:id/posts</span></td><td><span class="inline-code">id</span></td></tr>
            </tbody>
          </table>

          <less-code-block><pre><code>export class PostPage extends LitElement {
  slug = '';
  override render() {
    return html&#96;&lt;article&gt;Post: \${this.slug}&lt;/article&gt;&#96;;
  }
}</code></pre></less-code-block>

          <h2>Special Files</h2>
          <table>
            <thead><tr><th>File</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><span class="inline-code">_renderer.ts</span></td><td>Wraps SSR output for route subtrees. Used for layout shells and document-level composition.</td></tr>
              <tr><td><span class="inline-code">_middleware.ts</span></td><td>Mounts Hono middleware for route subtrees. Useful for headers, auth, CSP nonce, request guards.</td></tr>
              <tr><td><span class="inline-code">api/*.ts</span></td><td>Defines Hono API handlers within the same filesystem route tree.</td></tr>
            </tbody>
          </table>

          <h2>Route Module Contract</h2>
          <less-code-block><pre><code>import { html, LitElement } from 'lit';

export class AboutPage extends LitElement {
  override render() {
    return html&#96;&lt;main&gt;About&lt;/main&gt;&#96;;
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></less-code-block>

          <h2>Current Boundaries</h2>
          <p>Route scanning handles pages, dynamic segments, renderers, middleware, and API routes stably. v0.5.3 fixed root-level <span class="inline-code">_middleware.ts</span> mounting scope — it now correctly generates <span class="inline-code">app.use('/*', ...)</span> covering the entire route tree.</p>

          <div class="nav-row">
            <a href="/engine/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/guide/ssg" class="nav-link">Rendering &amp; SSG &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-routing-guide', RoutingGuidePage);
export default RoutingGuidePage;
export const tagName = 'page-routing-guide';

export const meta = { section: 'Production', label: 'Configuration', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ConfigurationPage extends LitElement {
  declare locale?: string;

  static override styles = [pageStyles];
  override render() { return (this.locale||'zh')==='en'?this._renderEn():this._renderZh(); }

  private _renderZh() { return html`<less-layout locale="${this.locale||'zh'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/guide/configuration"><div class="container">
    <h1>配置</h1>
    <p class="subtitle">LessJS 通过 Vite 插件配置。路由、island、静态输出、head 注入、PWA 和 middleware 是各自独立的关注点。</p>
    <h2>Minimal Configuration</h2>
    <less-code-block><pre><code>import { defineConfig } from 'vite';
import { lessjs } from '@lessjs/app';
export default defineConfig({ plugins: [lessjs()] });</code></pre></less-code-block>
    <p>使用 <span class="inline-code">lessjs()</span> 是推荐方式——它组合了核心插件、内容管线和 i18n，一个调用包含所有功能。如果你只需要核心路由和 island 功能，也可以单独使用 <span class="inline-code">less()</span> from <span class="inline-code">@lessjs/adapter-vite</span>。</p>
    <h2>Main Options</h2>
    <table><thead><tr><th>Option</th><th>Default</th><th>Purpose</th></tr></thead><tbody>
      <tr><td>routesDir</td><td>'app/routes'</td><td>Page routes, API routes, renderer and route-tree middleware.</td></tr>
      <tr><td>islandsDir</td><td>'app/islands'</td><td>Custom Elements for local client-side upgrade.</td></tr>
      <tr><td>componentsDir</td><td>'app/components'</td><td>Shared server-rendered components.</td></tr>
      <tr><td>packageIslands</td><td>[]</td><td>Packages that export an islands metadata array.</td></tr>
    </tbody></table>
    <h2>Document Metadata, Head Injection, Package Islands, Middleware, PWA</h2>
    <less-code-block><pre><code>lessjs({
  html: { lang: 'en', title: 'My App' },
  inject: {
    stylesheets: ['https://cdn.example.com/theme.css'],
    headFragments: ['&lt;meta name="theme-color" content="#050505"&gt;'],
  },
  packageIslands: ['@lessjs/ui'],
  middleware: { logger: true, cors: true, csp: { policy: "default-src 'self'" } },
  pwa: { name: 'My App', shortName: 'LessJS', themeColor: '#050505' },
  content: { blog: { contentDir: 'posts' }, nav: { routesDir: 'app/routes' } },
  i18n: { locales: ['en', 'zh'], defaultLocale: 'en' },
});</code></pre></less-code-block>
    <div class="nav-row"><a href="/guide/api-design" class="nav-link">&larr; API Design</a><a href="/guide/security-middleware" class="nav-link">Security &amp; Middleware &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/guide/configuration"><div class="container">
    <h1>Configuration</h1>
    <p class="subtitle">LessJS is configured through Vite plugins. Routes, islands, static output, head injection, PWA, and middleware are independent concerns.</p>
    <p>All options are the same as the Chinese version. Refer to the code examples below:</p>
    <h2>Minimal Configuration</h2>
    <less-code-block><pre><code>import { defineConfig } from 'vite';
import { lessjs } from '@lessjs/app';
export default defineConfig({ plugins: [lessjs()] });</code></pre></less-code-block>
    <p>Use <span class="inline-code">lessjs()</span> as the recommended entry — it combines the core plugin, content pipeline, and i18n in a single call. If you only need core routing and island functionality, you can use <span class="inline-code">less()</span> from <span class="inline-code">@lessjs/adapter-vite</span> directly.</p>
    <h2>Options Reference</h2>
    <table><thead><tr><th>Option</th><th>Default</th><th>Purpose</th></tr></thead><tbody>
      <tr><td>routesDir</td><td>'app/routes'</td><td>Page routes, API routes, renderer and route-tree middleware.</td></tr>
      <tr><td>islandsDir</td><td>'app/islands'</td><td>Custom Elements for local client-side upgrade.</td></tr>
      <tr><td>componentsDir</td><td>'app/components'</td><td>Shared server-rendered components.</td></tr>
      <tr><td>packageIslands</td><td>[]</td><td>Packages exporting an islands metadata array. This is not yet a full registry protocol.</td></tr>
    </tbody></table>
    <p>
      Future <code>less add</code> support should update this option only after a package manifest passes
      validation. Until then, third-party packages should be added explicitly and reviewed like any other
      dependency.
    </p>
    <p>See <a href="/guide/api">API Reference</a> for the complete options table, or check the <a href="/guide/security-middleware">Security &amp; Middleware</a> guide for CSP and middleware configuration.</p>
    <div class="nav-row"><a href="/guide/api-design" class="nav-link">&larr; API Design</a><a href="/guide/security-middleware" class="nav-link">Security &amp; Middleware &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-configuration', ConfigurationPage);
export default ConfigurationPage;
export const tagName = 'page-configuration';

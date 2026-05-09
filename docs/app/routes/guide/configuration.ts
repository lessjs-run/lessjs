export const meta = { section: 'Production', label: 'Configuration', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ConfigurationPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/configuration">
        <div class="container">
          <h1>配置</h1>
          <p class="subtitle">
            LessJS 通过 Vite 插件配置。保持配置显式：
            路由、island、静态输出、head 注入、PWA 和 middleware 是各自独立的关注点。
          </p>

          <h2>Minimal Configuration</h2>
          <less-code-block><pre><code>// vite.config.ts
import { defineConfig } from 'vite';
import { less } from '@lessjs/core';

export default defineConfig({
  plugins: [less()],
});</code></pre></less-code-block>

          <h2>Main Options</h2>
          <table>
            <thead>
              <tr>
                <th>Option</th>
                <th>Default</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">routesDir</span></td>
                <td><span class="inline-code">'app/routes'</span></td>
                <td>Page routes, API routes, renderer and route-tree middleware.</td>
              </tr>
              <tr>
                <td><span class="inline-code">islandsDir</span></td>
                <td><span class="inline-code">'app/islands'</span></td>
                <td>Custom Elements for local client-side upgrade.</td>
              </tr>
              <tr>
                <td><span class="inline-code">componentsDir</span></td>
                <td><span class="inline-code">'app/components'</span></td>
                <td>Shared server-rendered components.</td>
              </tr>
              <tr>
                <td><span class="inline-code">packageIslands</span></td>
                <td><span class="inline-code">[]</span></td>
                <td>Packages that export an <span class="inline-code">islands</span> metadata array.</td>
              </tr>
              <tr>
                <td><span class="inline-code">build.outDir</span></td>
                <td><span class="inline-code">'dist'</span></td>
                <td>Static output directory.</td>
              </tr>
            </tbody>
          </table>

          <h2>Document Metadata</h2>
          <less-code-block><pre><code>less({
  html: {
    lang: 'en',
    title: 'My LessJS App',
  },
});</code></pre></less-code-block>

          <h2>Head Injection</h2>
          <p>
            使用 <span class="inline-code">inject</span> 注入外部样式表、模块脚本和小的 head 片段。
            URL 在写入生成的文档前会经过验证。
          </p>
          <less-code-block><pre><code>less({
  inject: {
    stylesheets: [
      'https://cdn.example.com/theme.css',
    ],
    scripts: [
      'https://cdn.example.com/widget.js',
    ],
    headFragments: [
      '&lt;meta name="theme-color" content="#050505"&gt;',
    ],
  },
});</code></pre></less-code-block>

          <h2>Package Islands</h2>
          <p>
            Package islands 是在构建时发现的可复用 Web Components。
            <span class="inline-code">@lessjs/ui</span> 就是通过这种方式为文档站提供交互组件的。
          </p>
          <less-code-block><pre><code>less({
  packageIslands: ['@lessjs/ui'],
});</code></pre></less-code-block>

          <h2>Island Strategy</h2>
          <p>
            框架选项声明默认升级策略。当前实现仍需加强，
            以确保此元数据一致地传递到客户端构建。
          </p>
          <less-code-block><pre><code>less({
  island: {
    upgradeStrategy: 'idle',
  },
});</code></pre></less-code-block>

          <h2>Middleware</h2>
          <less-code-block><pre><code>less({
  middleware: {
    logger: true,
    requestId: true,
    cors: true,
    corsOrigin: 'https://example.com',
    securityHeaders: true,
    csp: {
      policy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      nonce: false,
      reportOnly: false,
    },
  },
});</code></pre></less-code-block>

          <h2>PWA</h2>
          <p>
            PWA 支持在 SSG 期间生成 manifest 和 service worker 资源。
            把它当作增强，而不是静态 HTML 正确性的替代。
          </p>
          <less-code-block><pre><code>less({
  pwa: {
    name: 'My LessJS App',
    shortName: 'LessJS',
    themeColor: '#050505',
    backgroundColor: '#ffffff',
  },
});</code></pre></less-code-block>

          <h2>Full Example</h2>
          <less-code-block><pre><code>export default defineConfig({
  base: '/',
  plugins: [
    less({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      packageIslands: ['@lessjs/ui'],
      html: {
        lang: 'en',
        title: 'My LessJS App',
      },
      build: {
        outDir: 'dist',
      },
    }),
  ],
});</code></pre></less-code-block>

          <div class="nav-row">
            <a href="/guide/api-design" class="nav-link">&larr; API 设计</a>
            <a href="/guide/security-middleware" class="nav-link">安全与中间件 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-configuration', ConfigurationPage);
export default ConfigurationPage;
export const tagName = 'page-configuration';

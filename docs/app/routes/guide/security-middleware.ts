export const meta = { section: 'Production', label: 'Security & Middleware', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class SecurityMiddlewarePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .chain {
        padding: 1rem;
        background: var(--less-bg-surface);
        border-left: 2px solid var(--less-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--less-text-secondary);
        white-space: pre-wrap;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/security-middleware">
        <div class="container">
          <h1>安全与 Middleware</h1>
          <p class="subtitle">
            Middleware 是 LessJS 把路由树结构与生产安全连接起来的地方：
            请求头、CSP、auth guards、CORS 和 API 级别的保护都在这里。
          </p>

          <h2>心智模型</h2>
          <p>
            LessJS middleware 是基于文件系统路由 scope 挂载的 Hono middleware。
            一个 middleware 文件影响它的路由子树；嵌套 middleware 从外到内依次组合。
          </p>
          <div class="chain">request
  -> root middleware
  -> nested middleware
  -> page or API handler
  -> response post-processing</div>

          <h2>Route-Tree Middleware</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Intended scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/_middleware.ts</span></td>
                <td>所有页面和 API routes。</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/admin/_middleware.ts</span></td>
                <td><span class="inline-code">/admin/*</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/_middleware.ts</span></td>
                <td><span class="inline-code">/api/*</span></td>
              </tr>
            </tbody>
          </table>

          <less-code-block><pre><code>// app/routes/admin/_middleware.ts
import type { Context, Next } from 'hono';

export default async function adminOnly(c: Context, next: Next) {
  const session = c.req.header('x-session');
  if (!session) return c.text('Unauthorized', 401);
  await next();
}</code></pre></less-code-block>

          <h2>CSP</h2>
          <p>
            CSP 是框架级别的信任边界，因为 LessJS 会输出 HTML、DSD templates 和 island scripts。
            如果 SSR 响应启用了 CSP，SSG 输出必须在静态后处理阶段收到等效的 meta policy。
          </p>
          <less-code-block><pre><code>// vite.config.ts
less({
  middleware: {
    csp: {
      policy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      nonce: false,
      reportOnly: false,
    },
  },
});</code></pre></less-code-block>

          <h2>CORS</h2>
          <p>
            API routes 需要审慎配置 CORS。内容页面通常不需要跨域访问；API routes 通常需要。
          </p>
          <less-code-block><pre><code>less({
  middleware: {
    corsOrigin: 'https://example.com',
  },
});</code></pre></less-code-block>

          <h2>Security Headers</h2>
          <p>
            常见的生产安全头应该在一处启用，并通过 SSR 和 SSG 两条路径测试。
          </p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options</span> or equivalent CSP frame policy</li>
            <li><span class="inline-code">Referrer-Policy</span></li>
            <li><span class="inline-code">Permissions-Policy</span></li>
            <li><span class="inline-code">Content-Security-Policy</span> or SSG meta equivalent</li>
          </ul>

          <h2>当前边界</h2>
          <p>
            两个安全问题需要在修复前保持可见：根 middleware 必须覆盖整个路由树，
            SSG 后处理静态 HTML 时不能丢失 CSP。这些是 P1 可靠性问题，
            因为它们影响生产安全保护，而不仅是开发体验。
          </p>

          <div class="nav-row">
            <a href="/guide/configuration" class="nav-link">&larr; 配置</a>
            <a href="/guide/error-handling" class="nav-link">Error Handling &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage);
export default SecurityMiddlewarePage;
export const tagName = 'page-security-middleware';

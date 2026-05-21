export const meta = { section: 'Production', label: 'Security & Middleware', order: 20 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class SecurityMiddlewarePage extends DsdElement {
  static override styles = [
    pageStyles,
    css`
      .chain {
        padding: 1rem;
        background: var(--less-bg-surface);
        border-left: 2px solid var(--less-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
        font-family: "SF Mono", monospace;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--less-text-secondary);
        white-space: pre-wrap;
      }
    `,
  ];
  override render() {
    return (this.getAttribute('locale') || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this.getAttribute('locale') || 'zh'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/security-middleware"><div class="container">
    <h1>安全与 Middleware</h1>
    <p class="subtitle">Middleware 是 LessJS 把路由树结构与生产安全连接起来的地方：请求头、CSP、auth guards、CORS 和 API 级别的保护都在这里。</p>
    <h2>心智模型</h2>
    <p>LessJS middleware 是基于文件系统路由 scope 挂载的 Hono middleware。一个 middleware 文件影响它的路由子树；嵌套 middleware 从外到内依次组合。</p>
    <h2>Route-Tree Middleware</h2>
    <table><thead><tr><th>File</th><th>Intended scope</th></tr></thead><tbody>
      <tr><td>app/routes/_middleware.ts</td><td>所有页面和 API routes。</td></tr>
      <tr><td>app/routes/admin/_middleware.ts</td><td>/admin/*</td></tr>
      <tr><td>app/routes/api/_middleware.ts</td><td>/api/*</td></tr>
    </tbody></table>
    <h2>CSP, CORS, Security Headers</h2>
    <p>CSP 是框架级别的信任边界。如果 SSR 响应启用了 CSP，SSG 输出必须在静态后处理阶段收到等效的 meta policy。</p>
    <h2>当前边界</h2>
    <p>两个安全问题需要在修复前保持可见：根 middleware 必须覆盖整个路由树，SSG 后处理静态 HTML 时不能丢失 CSP。</p>
    <div class="nav-row"><a href="/guide/configuration" class="nav-link">&larr; 配置</a><a href="/guide/error-handling" class="nav-link">Error Handling &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this.getAttribute('locale') || 'en'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/security-middleware"><div class="container">
    <h1>Security &amp; Middleware</h1>
    <p class="subtitle">Middleware is where LessJS connects the route tree structure with production security: headers, CSP, auth guards, CORS, and API-level protections.</p>
    <h2>Mental Model</h2>
    <p>LessJS middleware is Hono middleware mounted by filesystem route scope. One middleware file affects its route subtree; nested middleware compose from outer to inner.</p>
    <div class="chain">request
  -> root middleware
  -> nested middleware
  -> page or API handler
  -> response post-processing</div>
    <h2>Route-Tree Middleware</h2>
    <table><thead><tr><th>File</th><th>Intended scope</th></tr></thead><tbody>
      <tr><td>app/routes/_middleware.ts</td><td>All pages and API routes.</td></tr>
      <tr><td>app/routes/admin/_middleware.ts</td><td>/admin/*</td></tr>
      <tr><td>app/routes/api/_middleware.ts</td><td>/api/*</td></tr>
    </tbody></table>
    <h2>CSP</h2>
    <p>CSP is a framework-level trust boundary because LessJS outputs HTML, DSD templates, and island scripts. If SSR responses have CSP enabled, the SSG output must receive equivalent meta policies during static post-processing.</p>
    <h2>Current Boundaries</h2>
    <p>Two security issues need visibility until fixed: root middleware must cover the entire route tree, and SSG post-processing must not lose CSP when generating static HTML.</p>
    <div class="nav-row"><a href="/guide/configuration" class="nav-link">&larr; Configuration</a><a href="/guide/error-handling" class="nav-link">Error Handling &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage);
export default SecurityMiddlewarePage;
export const tagName = 'page-security-middleware';

export const meta = { section: 'Production', label: 'Error Handling', order: 30 };
import { navSections, headerNav } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ErrorHandlingPage extends LitElement {
  static override styles = [pageStyles, css`.error-hierarchy { padding: 1rem; background: var(--less-bg-surface); border-left: 2px solid var(--less-border-hover); border-radius: 0 4px 4px 0; margin: 1rem 0; font-family: "SF Mono", monospace; font-size: 0.8125rem; line-height: 1.8; color: var(--less-text-secondary); }`];
  override render() { return (this.locale||'zh')==='en'?this._renderEn():this._renderZh(); }

  private _renderZh() { return html`<less-layout locale="${this.locale||'zh'}" .locales="${['en','zh']}" .navItems="${filterFrameworkNav(navSections)}" .headerNav="${headerNav}" current-path="/guide/error-handling"><div class="container">
    <h1>错误处理</h1>
    <p class="subtitle">LessJS 区分框架错误、构建时渲染错误、API 错误和浏览器 island 故障。目标是在不泄露生产环境内部信息的前提下实现清晰诊断。</p>
    <h2>Error Hierarchy</h2>
    <div class="error-hierarchy">LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |-- ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500 |-- IslandUpgradeError 500</div>
    <h2>Operational vs Programming</h2>
    <p>LessJS 区分操作错误（not found, validation, rate limit — 返回结构化状态）和编程错误（render failure, broken import — 构建时失败或开发诊断）。</p>
    <h2>Structured Logging</h2>
    <p>LessJS 使用 createLogger(scope) 提供带 scope 的分级日志，包括 DEBUG、INFO、WARN、ERROR 级别。</p>
    <div class="nav-row"><a href="/guide/security-middleware" class="nav-link">&larr; 安全与 Middleware</a><a href="/guide/testing" class="nav-link">Testing &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${filterFrameworkNav(navSections)}" .headerNav="${headerNav}" current-path="/en/guide/error-handling"><div class="container">
    <h1>Error Handling</h1>
    <p class="subtitle">LessJS distinguishes between framework errors, build-time render errors, API errors, and browser island failures. The goal is clear diagnostics without leaking internal information in production.</p>
    <h2>Error Hierarchy</h2>
    <div class="error-hierarchy">LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |-- ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500 |-- IslandUpgradeError 500</div>
    <h2>Operational vs Programming</h2>
    <p>LessJS distinguishes operational errors (not found, validation, rate limit — return structured status) from programming errors (render failure, broken import — fail build or show dev diagnostics).</p>
    <h2>Structured Logging</h2>
    <p>LessJS uses <span class="inline-code">createLogger(scope)</span> for scoped log levels (DEBUG, INFO, WARN, ERROR). Each message carries a prefix identifying its source — e.g. <span class="inline-code">[LessJS/SSG]</span>.</p>
    <div class="nav-row"><a href="/guide/security-middleware" class="nav-link">&larr; Security &amp; Middleware</a><a href="/guide/testing" class="nav-link">Testing &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';

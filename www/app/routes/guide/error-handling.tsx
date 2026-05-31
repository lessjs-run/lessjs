export const meta = { section: 'Production', label: 'Error Handling', order: 30 };
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      .error-hierarchy {
        padding: var(--size-4);
        background: var(--bg-surface);
        border-left: 2px solid var(--border-hover);
        border-radius: 0 var(--radius-1) var(--radius-1) 0;
        margin: var(--size-4) 0;
        font-family: var(--font-mono);
        font-size: var(--font-size-1);
        line-height: var(--font-lineheight-4);
        color: var(--text-secondary);
      }
    `,
);

export class ErrorHandlingPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');


    return (
      
        <div class='container'>
          <h1>错误处理</h1>
          <p class='subtitle'>
            LessJS 区分框架错误、构建时渲染错误、API 错误和浏览器 island
            故障。目标是在不泄露生产环境内部信息的前提下实现清晰诊断。
          </p>
          <h2>Error Hierarchy</h2>
          <div class='error-hierarchy'>
            LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |--
            ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500
            |-- IslandUpgradeError 500
          </div>
          <h2>Operational vs Programming</h2>
          <p>
            LessJS 区分操作错误（not found, validation, rate limit -
            返回结构化状态）和编程错误（render failure, broken import - 构建时失败或开发诊断）。
          </p>
          <h2>Structured Logging</h2>
          <p>
            LessJS 使用 createLogger(scope) 提供带 scope 的分级日志，包括 DEBUG、INFO、WARN、ERROR
            级别。
          </p>
          <div class='nav-row'>
            <a href='/guide/security-middleware' class='nav-link'>← 安全与 Middleware</a>
            <a href='/guide/testing' class='nav-link'>Testing →</a>
          </div>
        </div>
      
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');


    return (
      
        <div class='container'>
          <h1>Error Handling</h1>
          <p class='subtitle'>
            LessJS distinguishes between framework errors, build-time render errors, API errors, and
            browser island failures. The goal is clear diagnostics without leaking internal
            information in production.
          </p>
          <h2>Error Hierarchy</h2>
          <div class='error-hierarchy'>
            LessError |-- NotFoundError 404 |-- UnauthorizedError 401 |-- ForbiddenError 403 |--
            ValidationError 422 |-- ConflictError 409 |-- RateLimitError 429 |-- SsrRenderError 500
            |-- IslandUpgradeError 500
          </div>
          <h2>Operational vs Programming</h2>
          <p>
            LessJS distinguishes operational errors (not found, validation, rate limit - return
            structured status) from programming errors (render failure, broken import - fail build
            or show dev diagnostics).
          </p>
          <h2>Structured Logging</h2>
          <p>
            LessJS uses <span class='inline-code'>createLogger(scope)</span>{' '}
            for scoped log levels (DEBUG, INFO, WARN, ERROR). Each message carries a prefix
            identifying its source - e.g. <span class='inline-code'>[LessJS/SSG]</span>.
          </p>
          <div class='nav-row'>
            <a href='/guide/security-middleware' class='nav-link'>← Security &amp; Middleware</a>
            <a href='/guide/testing' class='nav-link'>Testing →</a>
          </div>
        </div>
      
    );
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';

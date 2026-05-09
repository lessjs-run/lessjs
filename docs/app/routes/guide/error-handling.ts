export const meta = { section: 'Production', label: 'Error Handling', order: 30 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ErrorHandlingPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .error-hierarchy {
        padding: 1rem;
        background: var(--less-bg-surface);
        border-left: 2px solid var(--less-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--less-text-secondary);
      }
      .log-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.875rem;
      }
      .log-table th,
      .log-table td {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--less-border-hover);
        text-align: left;
      }
      .log-table th {
        background: var(--less-bg-surface);
        font-weight: 600;
        white-space: nowrap;
      }
      .log-table code {
        font-size: 0.8125rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/error-handling">
        <div class="container">
          <h1>错误处理</h1>
          <p class="subtitle">
            LessJS 区分框架错误、构建时渲染错误、API 错误和浏览器 island 故障。
            目标是在不泄露生产环境内部信息的前提下实现清晰诊断。
          </p>

          <h2>Error Hierarchy</h2>
          <div class="error-hierarchy">LessError
|-- NotFoundError          404
|-- UnauthorizedError      401
|-- ForbiddenError         403
|-- ValidationError        422
|-- ConflictError          409
|-- RateLimitError         429
|-- SsrRenderError         500, non-operational
└-- IslandUpgradeError     500, non-operational</div>

          <h2>Operational vs Programming Errors</h2>
          <table>
            <thead>
              <tr>
                <th>Kind</th>
                <th>Examples</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Operational</td>
                <td>not found, unauthorized, validation, rate limit</td>
                <td>Return structured status and safe message.</td>
              </tr>
              <tr>
                <td>Programming</td>
                <td>render failure, invalid route module, broken island import</td>
                <td>Fail build or show dev diagnostics; hide internals in production output.</td>
              </tr>
            </tbody>
          </table>

          <h2>Use Framework Errors</h2>
          <less-code-block><pre><code>import { NotFoundError, ValidationError } from '@lessjs/core';

app.get('/api/posts/:id', async (c) => {
  const post = await findPost(c.req.param('id'));
  if (!post) throw new NotFoundError('Post', c.req.param('id'));
  return c.json(post);
});

app.post('/api/posts', async (c) => {
  const body = await c.req.json();
  if (!body.title) {
    throw new ValidationError('Invalid post', [
      { field: 'title', message: 'Title is required' },
    ]);
  }
  return c.json(body, 201);
});</code></pre></less-code-block>

          <h2>SSR / SSG Errors</h2>
          <p>
            LessJS 渲染错误发生在 dev SSR 或静态生成阶段。开发时，
            <span class="inline-code">renderSsrError()</span> 可以显示消息和调用栈。
            生产输出中的错误应该是安全且通用的。
          </p>
          <p>
            Renderer 2 应进一步改进：失败时应该输出路由名、tag name、模块路径
            和原始原因，让构建日志指向出问题的组件，而不是一个空壳。
          </p>

          <h2>Island Errors</h2>
          <p>
            Island 故障发生在浏览器端，此时静态 HTML 已经可见。
            优先优雅降级：保持内容可读，记录失败的 island，避免全局崩溃。
          </p>

          <h2>API Error Shape</h2>
          <p>
            <span class="inline-code">LessError#toJSON()</span> 返回一个精简的结构化 payload。
            API routes 在添加全局错误 middleware 时可以直接使用这个 shape。
          </p>
          <less-code-block><pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid post"
  }
}</code></pre></less-code-block>

          <h2>Structured Logging & Classification</h2>
          <p>
            LessJS 使用 <span class="inline-code">createLogger(scope)</span> 在所有模块中提供
            带 scope 的分级日志。每条日志消息都带有一个标识来源的前缀——例如
            <span class="inline-code">[LessJS/SSG]</span> 或
            <span class="inline-code">[LessJS/Blog]</span>。
          </p>

          <h3>Log Levels</h3>
          <table class="log-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Method</th>
                <th>When to Use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>DEBUG</code></td>
                <td><code>log.debug()</code></td>
                <td>Internal diagnostics — skipped registrations, property assignment fallbacks. Stripped by DCE when <code>DEBUG=false</code>.</td>
              </tr>
              <tr>
                <td><code>INFO</code></td>
                <td><code>log.info()</code></td>
                <td>Build progress — route scan results, phase completions, adapter installations.</td>
              </tr>
              <tr>
                <td><code>WARN</code></td>
                <td><code>log.warn()</code></td>
                <td>Recoverable issues — budget overruns, malformed manifests, failed stat reads, property parse errors.</td>
              </tr>
              <tr>
                <td><code>ERROR</code></td>
                <td><code>log.error()</code></td>
                <td>Framework errors — render failures, style extraction failures. Includes <code>LessError</code> code and status.</td>
              </tr>
              <tr>
                <td><code>SILENT</code></td>
                <td>—</td>
                <td>Suppress all output. Set via log level configuration.</td>
              </tr>
            </tbody>
          </table>

          <h3>Logger Scopes</h3>
          <table class="log-table">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Prefix</th>
                <th>Modules</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>core</code></td>
                <td><code>[LessJS]</code></td>
                <td>index.ts, island.ts, route-scanner.ts, ssg-postprocess.ts</td>
              </tr>
              <tr>
                <td><code>ssg</code></td>
                <td><code>[LessJS/SSG]</code></td>
                <td>build.ts, build-client.ts, build-ssg.ts, build-manifest.ts</td>
              </tr>
              <tr>
                <td><code>blog</code></td>
                <td><code>[LessJS/Blog]</code></td>
                <td>blog/index.ts, routes.ts</td>
              </tr>
              <tr>
                <td><code>signal</code></td>
                <td><code>[LessJS/Signal]</code></td>
                <td>signals/index.ts (effect errors, channel warnings)</td>
              </tr>
            </tbody>
          </table>

          <h3>Usage Pattern</h3>
          <less-code-block><pre><code>import { createLogger } from '@lessjs/core/logger';

const log = createLogger('ssg');

// Structured warnings — prefix auto-included
log.warn('Client build failed:', err.message);

// Info for build progress
log.info('Routes: 5 page(s), 2 API route(s), 8 island(s)');

// Debug for diagnostics (stripped in production builds)
log.debug('customElements.define("my-counter") skipped: already defined');</code></pre></less-code-block>

          <h3>Error-Log Mapping</h3>
          <p>
            <code>LessError</code> 子类映射到特定的 log level：
          </p>
          <table class="log-table">
            <thead>
              <tr>
                <th>Error Class</th>
                <th>Log Level</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>NotFoundError</code></td>
                <td><code>WARN</code></td>
                <td>API route — client requested missing resource</td>
              </tr>
              <tr>
                <td><code>ValidationError</code></td>
                <td><code>WARN</code></td>
                <td>API route — invalid input from client</td>
              </tr>
              <tr>
                <td><code>SsrRenderError</code></td>
                <td><code>ERROR</code></td>
                <td>Build — component render() threw during SSG</td>
              </tr>
              <tr>
                <td><code>IslandUpgradeError</code></td>
                <td><code>ERROR</code></td>
                <td>Browser — island module failed to load or register</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/security-middleware" class="nav-link">&larr; 安全与 Middleware</a>
            <a href="/guide/testing" class="nav-link">Testing &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';

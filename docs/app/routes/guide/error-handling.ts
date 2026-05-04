import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ErrorHandlingPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .error-hierarchy {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border-left: 2px solid var(--kiss-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--kiss-text-secondary);
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/error-handling">
        <div class="container">
          <h1>Error Handling</h1>
          <p class="subtitle">
            KISS separates framework errors, build-time rendering errors, API errors and browser island failures.
            The goal is clear diagnosis without leaking internals in production.
          </p>

          <h2>Error Hierarchy</h2>
          <div class="error-hierarchy">KissError
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
          <code-block><pre><code>import { NotFoundError, ValidationError } from '@kissjs/core';

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
});</code></pre></code-block>

          <h2>SSR / SSG Errors</h2>
          <p>
            KISS rendering errors happen during dev SSR or static generation. In development,
            <span class="inline-code">renderSsrError()</span> can show message and stack.
            In production output, errors should be safe and generic.
          </p>
          <p>
            Renderer 2 should improve this further: failures should name the route, tag name, module path
            and original cause, so build logs point to the broken component instead of an empty shell.
          </p>

          <h2>Island Errors</h2>
          <p>
            Island failures happen in the browser after static HTML is already visible.
            Prefer graceful degradation: keep content readable, log the failed island, and avoid global crashes.
          </p>

          <h2>API Error Shape</h2>
          <p>
            <span class="inline-code">KissError#toJSON()</span> returns a small structured payload.
            API routes can use that shape directly when adding global error middleware.
          </p>
          <code-block><pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid post"
  }
}</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/security-middleware" class="nav-link">&larr; Security & Middleware</a>
            <a href="/guide/testing" class="nav-link">Testing &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';

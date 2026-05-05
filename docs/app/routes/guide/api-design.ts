import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class ApiDesignPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .principle {
        padding: 1rem 1.25rem;
        background: var(--less-bg-surface);
        border-left: 2px solid var(--less-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/guide/api-design">
        <div class="container">
          <h1>API 设计</h1>
          <p class="subtitle">
            API routes should feel like the Web: Request in, Response out, validation close to the
            boundary, typed clients where they reduce mistakes, and no hidden monolithic server.
          </p>

          <h2>Principles</h2>
          <div class="principle">
            <p>
              <strong>Use platform primitives.</strong>
              Prefer Fetch, Request, Response, FormData and URLSearchParams over framework-specific
              transport.
            </p>
            <p>
              <strong>Keep validation at the edge.</strong>
              Parse and validate request bodies before application logic sees them.
            </p>
            <p>
              <strong>Make runtime explicit.</strong>
              Static pages can call APIs, but those APIs still need a serverless or edge deployment
              target.
            </p>
          </div>

          <h2>Route Shape</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>URL</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/api/posts.ts</span></td>
                <td><span class="inline-code">/api/posts</span></td>
                <td>Collection handlers.</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/posts/[id].ts</span></td>
                <td><span class="inline-code">/api/posts/:id</span></td>
                <td>Resource handlers.</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/search.ts</span></td>
                <td><span class="inline-code">/api/search?q=kiss</span></td>
                <td>Query-driven endpoints.</td>
              </tr>
            </tbody>
          </table>

          <h2>Response Shape</h2>
          <p>
            Keep successful responses boring and predictable. Use HTTP status codes for status, JSON
            bodies for data, and framework errors for structured failures.
          </p>
          <code-block
          ><pre><code>return c.json({ posts }, 200);
            return c.json({ id, ...created }, 201);
            return c.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, 404);</code></pre></code-block>

            <h2>Validation</h2>
            <p>
              LessJS does not force a validation library. Zod with
              <span class="inline-code">@hono/zod-validator</span> is a practical default when you want
              typed input.
            </p>
            <code-block
            ><pre><code>import { zValidator } from '@hono/zod-validator';
              import { z } from 'zod';

              const schema = z.object({
                title: z.string().min(1),
                body: z.string().optional(),
              });

              app.post('/', zValidator('json', schema), (c) => {
                const data = c.req.valid('json');
                return c.json({ ok: true, data }, 201);
              });</code></pre></code-block>

              <h2>Typed RPC</h2>
              <p>
                <span class="inline-code">@lessjs/rpc</span> is where type-safe client/server calling
                conventions can mature. Treat it as an opt-in layer over Hono rather than a replacement for
                plain API routes.
              </p>

              <h2>Actions</h2>
              <p>
                Future FormData actions should start from native forms, redirects and structured validation
                errors. They should enhance static pages without turning LessJS into a SPA runtime.
              </p>

              <div class="nav-row">
                <a href="/guide/api-routes" class="nav-link">&larr; API Routes</a>
                <a href="/guide/configuration" class="nav-link">Configuration &rarr;</a>
              </div>
            </div>
          </less-layout>
        `;
      }
    }

    customElements.define('page-api-design', ApiDesignPage);
    export default ApiDesignPage;
    export const tagName = 'page-api-design';

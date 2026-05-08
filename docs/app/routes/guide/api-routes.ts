import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class ApiRoutesPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout currentPath="/guide/api-routes">
        <div class="container">
          <h1>API 路由</h1>
          <p class="subtitle">
            LessJS 的服务端层是 Hono。API routes 使用标准 Request/Response 语义，
            适合部署到 serverless 或 edge runtime。
          </p>

          <h2>Create an API Route</h2>
          <p>
            API routes 放在 <span class="inline-code">app/routes/api</span>。
            模块默认导出一个 Hono app。
          </p>
          <code-block><pre><code>// app/routes/api/posts.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello LessJS' },
  ]);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  return c.json({ id: 2, ...body }, 201);
});

export default app;
export type AppType = typeof app;</code></pre></code-block>

          <h2>Route Mapping</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/api/status.ts</span></td>
                <td><span class="inline-code">/api/status</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/posts.ts</span></td>
                <td><span class="inline-code">/api/posts</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/users/[id].ts</span></td>
                <td><span class="inline-code">/api/users/:id</span></td>
              </tr>
            </tbody>
          </table>

          <h2>Validation</h2>
          <p>
            Hono middleware works normally inside API routes. Validation, auth, rate limits and response shaping
            should live close to the handler that owns the behavior.
          </p>
          <code-block><pre><code>import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const schema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
});

app.post('/', zValidator('json', schema), (c) => {
  const data = c.req.valid('json');
  return c.json({ id: crypto.randomUUID(), ...data }, 201);
});

export default app;</code></pre></code-block>

          <h2>Calling APIs from Islands</h2>
          <p>
            Islands can call API routes with <span class="inline-code">fetch</span> or Hono client helpers.
            Keep fetch state local unless multiple islands truly need a shared protocol.
          </p>
          <code-block><pre><code>async function loadPosts() {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error('Failed to load posts');
  return await res.json();
}</code></pre></code-block>

          <h2>Static Build Boundary</h2>
          <p>
            SSG output is static files. API routes are part of the generated Hono app, but a purely static host
            will not run them. Deploy API routes through a serverless adapter or platform function when the app
            needs runtime behavior.
          </p>

          <div class="callout">
            <p>
              Near-term LessJS fullstack work should focus on explicit adapters, FormData actions,
              typed RPC and env/secrets. Until those are stable, API routes are powerful but intentionally simple.
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/rpc" class="nav-link">&larr; RPC 远程调用</a>
            <a href="/guide/api-design" class="nav-link">API Design &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-api-routes', ApiRoutesPage);
export default ApiRoutesPage;
export const tagName = 'page-api-routes';

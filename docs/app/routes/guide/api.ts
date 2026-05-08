export const meta = { section: 'Core Model', label: 'API Routes', order: 60 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class ApiPage extends LitElement {
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
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/api">
        <div class="container">
          <h1>API 路由</h1>
          <p class="subtitle">
            LessJS 的服务端层是 Hono。API routes 使用标准 Request/Response 语义，
            适合部署到 serverless 或 edge runtime。
          </p>

          <h2>设计原则</h2>
          <div class="principle">
            <p>
              <strong>使用平台原语。</strong>
              优先使用 Fetch、Request、Response、FormData 和 URLSearchParams，而非框架专有传输。
            </p>
            <p>
              <strong>验证在边界完成。</strong>
              在业务逻辑看到数据之前，完成请求体的解析和校验。
            </p>
            <p>
              <strong>运行时显式声明。</strong>
              静态页面可以调用 API，但 API 本身需要 serverless 或 edge 部署目标。
            </p>
          </div>

          <h2>创建 API 路由</h2>
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

          <h2>路由映射</h2>
          <table>
            <thead>
              <tr>
                <th>文件</th>
                <th>URL</th>
                <th>用途</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/api/status.ts</span></td>
                <td><span class="inline-code">/api/status</span></td>
                <td>健康检查等简单端点</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/posts.ts</span></td>
                <td><span class="inline-code">/api/posts</span></td>
                <td>集合处理器（列表 + 创建）</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/posts/[id].ts</span></td>
                <td><span class="inline-code">/api/posts/:id</span></td>
                <td>资源处理器（读取 + 更新 + 删除）</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/search.ts</span></td>
                <td><span class="inline-code">/api/search?q=kiss</span></td>
                <td>查询驱动端点</td>
              </tr>
            </tbody>
          </table>

          <h2>请求校验</h2>
          <p>
            LessJS 不强制校验库。Zod 配合 <span class="inline-code">@hono/zod-validator</span>
            是实用的默认选择：
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

          <h2>响应格式</h2>
          <p>
            成功响应保持简单和可预测。用 HTTP 状态码表示状态，JSON 体承载数据，
            结构化错误用于可操作的失败：
          </p>
          <code-block><pre><code>return c.json({ posts }, 200);
return c.json({ id, ...created }, 201);
return c.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, 404);</code></pre></code-block>

          <h2>从 Island 调用 API</h2>
          <p>
            Island 可以用 <span class="inline-code">fetch</span> 或 Hono client helpers 调用 API routes。
            保持 fetch 状态局部化，除非多个 island 确实需要共享协议。
          </p>
          <code-block><pre><code>async function loadPosts() {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error('Failed to load posts');
  return await res.json();
}</code></pre></code-block>

          <h2>类型安全 RPC</h2>
          <p>
            <span class="inline-code">@lessjs/rpc</span> 提供类型安全的客户端/服务端调用约定。
            把它看作 Hono 之上的可选层，而不是替代普通 API routes。
            详见 <a href="/guide/rpc">RPC 远程调用</a>。
          </p>

          <h2>静态构建边界</h2>
          <p>
            SSG 输出是静态文件。API routes 是生成的 Hono app 的一部分，
            但纯静态托管不会运行它们。当应用需要运行时行为时，
            通过 serverless adapter 或平台函数部署 API routes。
          </p>

          <div class="callout">
            <p>
              LessJS 的 fullstack 工作近期应聚焦于显式适配器、FormData actions、
              类型安全 RPC 和环境变量管理。在这些稳定之前，API routes 功能强大但刻意保持简单。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/rpc" class="nav-link">&larr; RPC 远程调用</a>
            <a href="/guide/configuration" class="nav-link">Configuration &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-api', ApiPage);
export default ApiPage;
export const tagName = 'page-api';

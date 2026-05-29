export const meta = { section: 'Core', label: 'API Routes', order: 60 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      .principle {
        padding: var(--size-4) var(--size-5);
        background: var(--bg-surface);
        border-left: 2px solid var(--border-hover);
        border-radius: 0 var(--radius-1) var(--radius-1) 0;
        margin: var(--size-4) 0;
      }
    `,
);

export class ApiPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');
    const nav = JSON.stringify(navSections);
    const hNav = JSON.stringify(headerNav);
    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
        navItems={nav}
        headerNav={hNav}
        currentPath='/guide/api'
      >
        <div class='container'>
          <h1>API Routes</h1>
          <p class='subtitle'>
            LessJS 的服务端层是 Hono。API routes 使用标准 Request/Response 语义，适合部署到
            serverless 或 edge runtime。
          </p>
          <h2>Design Principles</h2>
          <div class='principle'>
            <p>
              <strong>使用平台原语。</strong>优先使用 Fetch、Request、Response 而非框架专有传输。
            </p>
            <p>
              <strong>验证在边界完成。</strong>在业务逻辑看到数据之前，完成请求体的解析和校验。
            </p>
            <p>
              <strong>运行时显式声明。</strong>静态页面可以调用 API，但 API 本身需要 serverless 或
              edge 部署目标。
            </p>
          </div>
          <h2>Create API Routes</h2>
          <p>API routes 放在 app/routes/api。模块默认导出一个 Hono app。</p>
          <h2>Type-Safe RPC</h2>
          <p>
            @lessjs/rpc 提供类型安全的客户端/服务端调用约定。详见{' '}
            <a href='/api/reference'>RPC 远程调用</a>。
          </p>
          <h2>Static Build Boundary</h2>
          <p>
            SSG 输出是静态文件。API routes 是生成的 Hono app
            的一部分，但纯静态托管不会运行它们。当应用需要运行时行为时，通过 serverless adapter
            或平台函数部署 API routes。
          </p>
          <div class='nav-row'>
            <a href='/api/reference' class='nav-link'>← RPC 远程调用</a>
            <a href='/guide/configuration' class='nav-link'>Configuration →</a>
          </div>
        </div>
      </less-layout>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');
    const nav = JSON.stringify(navSections);
    const hNav = JSON.stringify(headerNav);
    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
        navItems={nav}
        headerNav={hNav}
        currentPath='/en/guide/api'
      >
        <div class='container'>
          <h1>API Routes</h1>
          <p class='subtitle'>
            LessJS's server layer is Hono. API routes use standard Request/Response semantics and
            are suitable for serverless or edge runtime deployment.
          </p>
          <h2>Design Principles</h2>
          <div class='principle'>
            <p>
              <strong>Use platform primitives.</strong>{' '}
              Prefer Fetch, Request, Response over framework-specific transports.
            </p>
            <p>
              <strong>Validate at boundaries.</strong>{' '}
              Parse and validate request bodies before business logic sees the data.
            </p>
            <p>
              <strong>Declare runtime explicitly.</strong>{' '}
              Static pages can call APIs, but the APIs need a serverless or edge deployment target.
            </p>
          </div>
          <h2>Create API Routes</h2>
          <p>
            Place API routes in{' '}
            <span class='inline-code'>app/routes/api</span>. Default-export a Hono app for complex
            APIs, or a plain function <span class='inline-code'>(ctx) =&gt; Response</span>{' '}
            for simple endpoints. The context has <span class='inline-code'>request</span>,{' '}
            <span class='inline-code'>params</span>, <span class='inline-code'>env</span>, and{' '}
            <span class='inline-code'>platform</span>.
          </p>
          <less-code-block>
            <pre><code>{'// app/routes/api/posts.ts'}
import {'{'} Hono {'}'} from 'hono';
const app = new Hono();
app.get('/', (c) =&gt; c.json([{'{'} id: 1, title: 'Hello' {'}'}]));
app.post('/', async (c) =&gt; {'{'} const body = await c.req.json(); return c.json({'{'} id: 2, ...body {'}'}, 201); {'}'});
export default app;</code></pre>
          </less-code-block>
          <less-code-block>
            <pre><code>{'// app/routes/api/health.ts — simple endpoint, no Hono needed'}
import type {'{'} LessApiContext {'}'} from '@lessjs/core/api';

export default function GET(ctx: LessApiContext) {'{'}
  return Response.json({'{'} ok: true, mode: ctx.env.MODE ?? 'production' {'}'});
{'}'}</code></pre>
          </less-code-block>
          <h2>Request Validation</h2>
          <p>
            LessJS does not mandate a validation library. Zod with{' '}
            <span class='inline-code'>@hono/zod-validator</span> is a practical default.
          </p>
          <h2>Type-Safe RPC</h2>
          <p>
            <span class='inline-code'>@lessjs/rpc</span>{' '}
            provides type-safe client/server calling conventions. See{' '}
            <a href='/api/reference'>RPC Guide</a>.
          </p>
          <h2>Static Build Boundary</h2>
          <p>
            SSG output is static files. API routes are part of the generated Hono app, but static
            hosting won't execute them. Deploy API routes via serverless adapters or platform
            functions when runtime behavior is needed.
          </p>
          <div class='nav-row'>
            <a href='/api/reference' class='nav-link'>← RPC</a>
            <a href='/guide/configuration' class='nav-link'>Configuration →</a>
          </div>
        </div>
      </less-layout>
    );
  }
}

customElements.define('page-api', ApiPage);
export default ApiPage;
export const tagName = 'page-api';

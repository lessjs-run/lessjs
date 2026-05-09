export const meta = { section: 'Core Model', label: 'RPC', order: 70 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class RpcGuidePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .mermaid {
        background: var(--less-code-bg);
        border: 0.5px solid var(--less-code-border);
        border-radius: 3px;
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        font-size: 0.75rem;
        line-height: 1.6;
        color: var(--less-text-secondary);
        overflow-x: auto;
        white-space: pre;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      }
      .flow-item {
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
        border-left: 2px solid var(--less-border-hover);
        background: var(--less-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .flow-item .flow-tag {
        font-size: 0.6875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--less-text-muted);
        margin-bottom: 0.25rem;
      }
      .flow-item h3 {
        margin: 0 0 0.5rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/rpc">
        <div class="container">
          <h1>RPC 远程调用</h1>
          <p class="subtitle">
            @lessjs/rpc 是零依赖的 fetch 抽象层，用原生 Web API（fetch、AbortController）
            管理 Island 的远程调用。框架无关，可以和 Lit、原生 HTMLElement 或任何
            Web Component 库一起使用。
          </p>

          <h2>设计理念</h2>
          <p>
            LessJS 的 Island 是独立的 Custom Element，每个 Island 管理自己的状态和副作用。
            RPC 调用是最常见的副作用之一：<span class="inline-code">fetch()</span> 看似简单，
            但在组件生命周期中正确处理加载状态、错误、重试和取消需要大量模板代码。
          </p>
          <p>
            <span class="inline-code">@lessjs/rpc</span> 的设计遵循三个原则：
          </p>
          <ul>
            <li><strong>零依赖</strong>：只用 fetch 和 AbortController，不引入任何框架。</li>
            <li><strong>框架无关</strong>：RpcController 实现了 ReactiveController 接口，
              可以和 Lit、原生 Custom Element 或任何实现
              <span class="inline-code">addController/removeController/requestUpdate</span> 的宿主一起使用。</li>
            <li><strong>安全默认</strong>：请求在组件断开时自动取消，重试只针对瞬态错误（5xx / 网络错误），4xx 不重试。</li>
          </ul>

          <h2>配置和使用</h2>

          <h3>基本用法</h3>
          <less-code-block><pre><code>import { LitElement, html } from 'lit';
import { RpcController, RpcError } from '@lessjs/rpc';

class PostList extends LitElement {
  // 将组件自身传入，RpcController 自动注册为 ReactiveController
  private rpc = new RpcController(this);

  private _posts: Array&lt;{ id: number; title: string }&gt; = [];

  override connectedCallback() {
    super.connectedCallback();
    this._loadPosts();
  }

  private async _loadPosts() {
    try {
      this._posts = await this.rpc.call(() =>
        fetch('/api/posts').then(r => r.json())
      );
      this.requestUpdate();
    } catch (err) {
      if (err instanceof RpcError) {
        console.error('RPC failed:', err.code, err.message);
      }
    }
  }

  override render() {
    if (this.rpc.loading) return html\`&lt;p&gt;Loading...&lt;/p&gt;\`;
    if (this.rpc.error) return html\`&lt;p&gt;Error: \${this.rpc.error.message}&lt;/p&gt;\`;

    return html\`
      &lt;ul&gt;
        \${this._posts.map(p =&gt; html\`&lt;li&gt;\${p.title}&lt;/li&gt;\`)}
      &lt;/ul&gt;
    \`;
  }
}

customElements.define('post-list', PostList);</code></pre></less-code-block>

          <h3>重试配置</h3>
          <less-code-block><pre><code>// 自动重试瞬态错误（5xx / 网络错误），最多 2 次
private rpc = new RpcController(this, {
  maxRetries: 2,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000), // 指数退避
});</code></pre></less-code-block>

          <h3>请求取消</h3>
          <less-code-block><pre><code>// 取消进行中的请求（如导航离开页面时）
this.rpc.abort();

// 也可以获取 AbortSignal 传给 fetch
const signal = this.rpc.signal;</code></pre></less-code-block>

          <h2>Island 通信模式</h2>

          <div class="mermaid">sequenceDiagram
    participant P as Page (DSD)
    participant I as Island
    participant R as RpcController
    participant A as API Route

    P->>I: HTML 包含 Island 标签
    I->>I: connectedCallback()
    I->>R: rpc.call(fn)
    R->>R: 创建 AbortController
    R->>A: fetch('/api/data', { signal })
    A-->>R: Response
    R->>I: 返回数据
    I->>I: requestUpdate()

    Note over I,R: 组件断开时
    I->>R: disconnectedCallback()
    R->>R: abort() 取消请求</code></pre>

          <h3>模式 1：Island 直接调用 API Route</h3>
          <p>
            最简单的模式。Island 通过 <span class="inline-code">fetch</span> 调用
            LessJS API Route（Hono handler），RpcController 管理加载和错误状态。
          </p>
          <less-code-block><pre><code>// app/routes/api/posts.ts — API Route
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello LessJS' },
    { id: 2, title: 'DSD Deep Dive' },
  ]);
});

export default app;</code></pre></less-code-block>

          <less-code-block><pre><code>// app/islands/post-list.ts — Island 消费者
import { LitElement, html } from 'lit';
import { RpcController, RpcError } from '@lessjs/rpc';
import { island } from '@lessjs/core';

class PostListIsland extends LitElement {
  private rpc = new RpcController(this, { maxRetries: 1 });
  private _posts: Array&lt;{ id: number; title: string }&gt; = [];

  override connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  private async _load() {
    try {
      this._posts = await this.rpc.call(signal =>
        fetch('/api/posts', { signal }).then(r => {
          if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
          return r.json();
        })
      );
    } catch (err) {
      if (err instanceof RpcError && err.code !== 'ABORTED') {
        console.error('Failed to load posts:', err.message);
      }
    }
  }

  override render() {
    if (this.rpc.loading) return html\`&lt;p&gt;Loading...&lt;/p&gt;\`;
    if (this.rpc.error) return html\`&lt;p role="alert"&gt;Error: \${this.rpc.error.message}&lt;/p&gt;\`;

    return html\`
      &lt;ul&gt;\${this._posts.map(p =&gt; html\`&lt;li&gt;\${p.title}&lt;/li&gt;\`)}&lt;/ul&gt;
    \`;
  }
}

export default island('post-list', PostListIsland, {
  strategy: 'lazy',
  dsd: false,
});</code></pre></less-code-block>

          <h3>模式 2：Island 通过 Hono Client 调用</h3>
          <p>
            当 API Route 和 Island 共享类型时，可以使用 Hono RPC Client
            获得端到端类型安全。
          </p>
          <less-code-block><pre><code>// app/routes/api/posts.ts — 导出类型
import { Hono } from 'hono';

const app = new Hono()
  .get('/', (c) => c.json({ posts: [] }))
  .post('/', async (c) => c.json({ id: 1 }, 201));

export default app;
export type AppType = typeof app;</code></pre></less-code-block>

          <less-code-block><pre><code>// app/islands/typed-posts.ts — 类型安全调用
import { hc } from 'hono/client';
import { LitElement, html } from 'lit';
import { RpcController } from '@lessjs/rpc';
import { island } from '@lessjs/core';
import type { AppType } from '../routes/api/posts.ts';

const client = hc&lt;AppType&gt;('/');

class TypedPosts extends LitElement {
  private rpc = new RpcController(this);

  private async _load() {
    const data = await this.rpc.call(signal =>
      client.api.posts.$get({}, { signal })
    );
    // data.posts 是完全类型化的
    console.log(data.posts);
  }

  override render() {
    if (this.rpc.loading) return html\`&lt;p&gt;Loading...&lt;/p&gt;\`;
    return html\`&lt;div&gt;...&lt;/div&gt;\`;
  }
}

export default island('typed-posts', TypedPosts, { dsd: false });</code></pre></less-code-block>

          <h3>模式 3：Island 间间接通信</h3>
          <p>
            LessJS 的 Island 是独立的 Custom Element，不共享状态树。
            如果两个 Island 需要通信，推荐使用浏览器原生 API：
          </p>
          <table>
            <thead>
              <tr>
                <th>通信方式</th>
                <th>适用场景</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Custom Events</td>
                <td>父子或兄弟 Island 之间的事件通知</td>
              </tr>
              <tr>
                <td>BroadcastChannel</td>
                <td>同源跨标签页通信</td>
              </tr>
              <tr>
                <td>共享 API Route</td>
                <td>通过读写同一 API 端点间接共享数据</td>
              </tr>
              <tr>
                <td>URL 参数</td>
                <td>通过 URL search params 传递状态</td>
              </tr>
            </tbody>
          </table>

          <less-code-block><pre><code>// Island A：发出自定义事件
class FilterBar extends LitElement {
  private _onFilter(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { filter: value },
      bubbles: true,
      composed: true, // 穿透 Shadow DOM
    }));
  }
}

// Island B：监听自定义事件
class FilteredList extends LitElement {
  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('filter-change', (e: Event) => {
      const { filter } = (e as CustomEvent).detail;
      this._applyFilter(filter);
    });
  }
}</code></pre></less-code-block>

          <h2>RpcError 结构</h2>
          <p>
            <span class="inline-code">RpcError</span> 与 <span class="inline-code">@lessjs/core</span>
            的 <span class="inline-code">LessError</span> 结构对齐，提供结构化的错误信息：
          </p>
          <less-code-block><pre><code>class RpcError extends Error {
  readonly status: number;    // HTTP 状态码（网络错误为 0）
  readonly code: string;     // 机器可读错误码（如 'RPC_ERROR', 'ABORTED'）
  readonly details?: Array&lt;{ field: string; message: string }&gt;; // 字段级验证

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
      }
    };
  }
}</code></pre></less-code-block>

          <h2>安全性考虑</h2>

          <div class="flow-item">
            <div class="flow-tag">安全 01</div>
            <h3>请求自动取消</h3>
            <p>
              组件断开连接（<span class="inline-code">disconnectedCallback</span>）时，
              RpcController 自动调用 <span class="inline-code">abort()</span> 取消进行中的请求。
              这避免了组件卸载后仍然执行回调的竞态问题。
            </p>
          </div>

          <div class="flow-item">
            <div class="flow-tag">安全 02</div>
            <h3>重试只针对瞬态错误</h3>
            <p>
              4xx 客户端错误（如 401 未授权、404 未找到、422 验证失败）不会触发重试。
              只有 5xx 服务端错误和 0（网络错误）才会自动重试。这避免了向已拒绝的请求
              发送重复流量。
            </p>
          </div>

          <div class="flow-item">
            <div class="flow-tag">安全 03</div>
            <h3>CORS 和 CSP</h3>
            <p>
              Island 的 fetch 请求受浏览器同源策略约束。跨域 API 需要正确的 CORS 配置。
              LessJS middleware 默认启用 CORS（可在 <span class="inline-code">deno.json</span> 配置中关闭或限制来源）。
              如果启用了 CSP，<span class="inline-code">connect-src</span> 指令需要包含 API 端点。
            </p>
          </div>

          <div class="flow-item">
            <div class="flow-tag">安全 04</div>
            <h3>不要在 data-ssr-props 中传递敏感数据</h3>
            <p>
              <span class="inline-code">data-ssr-props</span> 是 HTML 属性，会出现在 HTML 源码中。
              敏感数据（token、密钥、个人信息）不应该通过这个机制传递。
              使用 API Route 在客户端按需获取。
            </p>
          </div>

          <h2>完整示例：带 CRUD 的 Island</h2>

          <less-code-block><pre><code>import { LitElement, html } from 'lit';
import { RpcController, RpcError } from '@lessjs/rpc';
import { island } from '@lessjs/core';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

class TodoApp extends LitElement {
  private rpc = new RpcController(this, {
    maxRetries: 1,
    retryDelay: (attempt) => 1000 * (attempt + 1),
  });

  static properties = {
    _todos: { state: true },
    _input: { state: true },
  };

  private _todos: Todo[] = [];
  private _input = '';

  override connectedCallback() {
    super.connectedCallback();
    this._loadTodos();
  }

  private async _loadTodos() {
    try {
      this._todos = await this.rpc.call(signal =>
        fetch('/api/todos', { signal }).then(r => {
          if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
          return r.json();
        })
      );
    } catch (err) {
      if (err instanceof RpcError && err.code !== 'ABORTED') {
        console.error('Load failed:', err.message);
      }
    }
  }

  private async _addTodo() {
    const title = this._input.trim();
    if (!title) return;

    try {
      const todo = await this.rpc.call(signal =>
        fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
          signal,
        }).then(r => {
          if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
          return r.json();
        })
      );
      this._todos = [...this._todos, todo];
      this._input = '';
    } catch (err) {
      if (err instanceof RpcError && err.code !== 'ABORTED') {
        console.error('Add failed:', err.message);
      }
    }
  }

  override render() {
    return html\`
      &lt;div&gt;
        &lt;input
          .value=\${this._input}
          @input=\${(e: Event) =&gt; this._input = (e.target as HTMLInputElement).value}
          @keydown=\${(e: KeyboardEvent) =&gt; e.key === 'Enter' && this._addTodo()}
          placeholder="What needs to be done?"
        /&gt;
        &lt;button @click=\${this._addTodo} ?disabled=\${this.rpc.loading}&gt;Add&lt;/button&gt;
      &lt;/div&gt;
      \${this.rpc.error ? html\`&lt;p role="alert"&gt;\${this.rpc.error.message}&lt;/p&gt;\` : ''}
      &lt;ul&gt;
        \${this._todos.map(t =&gt; html\`&lt;li&gt;\${t.title}&lt;/li&gt;\`)}
      &lt;/ul&gt;
    \`;
  }
}

export default island('todo-app', TodoApp, {
  strategy: 'eager',
  dsd: false,
});</code></pre></less-code-block>

          <div class="callout">
            <p>
              @lessjs/rpc 当前是实验性包。类型安全的 RPC（类似 tRPC 的端到端类型推导）
              是 roadmap 项目。当前推荐配合 Hono Client 使用获得类型安全。
              详见 <a href="/guide/api-routes">API Routes</a> 和
              <a href="/roadmap">Roadmap</a>。
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/islands-deep" class="nav-link">&larr; Island 深度指南</a>
            <a href="/guide/api-routes" class="nav-link">API Routes &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-rpc-guide', RpcGuidePage);
export default RpcGuidePage;
export const tagName = 'page-rpc-guide';

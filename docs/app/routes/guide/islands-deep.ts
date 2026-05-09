export const meta = { section: 'Core Model', label: 'Island Deep Dive', order: 50 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class IslandsDeepGuidePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .layer-card {
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
        border-left: 2px solid var(--less-border-hover);
        background: var(--less-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .layer-card .layer-tag {
        font-size: 0.6875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--less-text-muted);
        margin-bottom: 0.25rem;
      }
      .layer-card h3 {
        margin: 0 0 0.5rem;
      }
      .strategy-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .strategy-item {
        padding: 1rem 1.25rem;
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        background: var(--less-bg-surface);
      }
      .strategy-item .strat-name {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--less-text-primary);
        margin-bottom: 0.25rem;
      }
      .strategy-item .strat-name code {
        font-size: 0.75rem;
        background: var(--less-code-bg);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
      }
      @media (max-width: 720px) {
        .strategy-grid {
          grid-template-columns: 1fr;
        }
      }
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
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/islands-deep">
        <div class="container">
          <h1>Island 深度指南</h1>
          <p class="subtitle">
            Island 是 LessJS 中唯一允许的客户端 JavaScript 单元。
            本页深入讲解 Island 的三层架构、升级策略、声明式事件绑定和数据传递机制。
          </p>

          <h2>Island 架构原理</h2>
          <p>
            LessJS 的 Island 是对 Custom Element Upgrade 机制的诚实利用。浏览器解析 HTML 时看到
            <span class="inline-code">&lt;my-counter&gt;</span>，稍后加载模块调用
            <span class="inline-code">customElements.define()</span>，已有元素被升级——这就是 Island 的全部原理。
            关于 DSD 渲染模型和为什么选择 DSD-first，参见
            <a href="/guide/dsd">DSD 渲染架构</a>。
          </p>

          <h2>三层 Island 架构</h2>

          <div class="mermaid">graph LR
    subgraph "SSG 输出"
      L1["&lt;my-nav&gt;&lt;template shadowrootmode=open&gt;...&lt;/template&gt;&lt;/my-nav&gt;"]
      L2["&lt;theme-toggle&gt;&lt;template shadowrootmode=open&gt;...&lt;/template&gt;&lt;/theme-toggle&gt;"]
      L3["&lt;live-chart data-ssr-props=...&gt;&lt;/live-chart&gt;"]
    end

    L1 ---|"Layer 1"| JS0["无 JS"]
    L2 ---|"Layer 2"| JS1["事件绑定"]
    L3 ---|"Layer 3"| JS2["完整框架"]

    style L1 fill:#e8f5e9,stroke:#4caf50
    style L2 fill:#fff3e0,stroke:#ff9800
    style L3 fill:#fce4ec,stroke:#f44336</div>

          <div class="layer-card">
            <div class="layer-tag">Layer 1 — dsd-static</div>
            <h3>无 JS，纯 DSD</h3>
            <p>
              导航栏、文章内容、页脚等纯展示组件。SSG 输出完整 DSD HTML，
              客户端不加载任何 JavaScript。组件即使永远不会被
              <span class="inline-code">customElements.define()</span> 升级，
              内容也始终可见且样式完整。
            </p>
            <less-code-block><pre><code>&lt;!-- SSG 输出：无需 JS 即可渲染 --&gt;
&lt;page-nav&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;nav { display: flex; }&lt;/style&gt;
    &lt;nav&gt;&lt;a href="/"&gt;Home&lt;/a&gt;&lt;a href="/guide"&gt;Guide&lt;/a&gt;&lt;/nav&gt;
  &lt;/template&gt;
&lt;/page-nav&gt;</code></pre></less-code-block>
          </div>

          <div class="layer-card">
            <div class="layer-tag">Layer 2 — dsd-interactive</div>
            <h3>DSD + 事件绑定</h3>
            <p>
              需要交互但状态简单的组件。SSR 输出完整 DSD（首屏可见），客户端加载模块后
              检测已有 shadow root，跳过 render()，只绑定声明的事件处理器。
            </p>
            <less-code-block><pre><code>import { html, nothing } from 'lit';
import { WithDsdHydration } from '@lessjs/adapter-lit/dsd-hydration';

class ExpandableSection extends WithDsdHydration(LitElement) {
  static hydrateEvents = [
    { selector: 'button.expand-btn', event: 'click', method: '_toggle' },
  ];

  private _open = false;

  override render() {
    if (this._dsdHydrated) return nothing;
    return html\`
      &lt;button class="expand-btn" @click=\${this._toggle}&gt;
        \${this._open ? '收起' : '展开'}
      &lt;/button&gt;
      &lt;div class="content"&gt;...&lt;/div&gt;
    \`;
  }

  private _toggle() {
    this._open = !this._open;
    const content = this.shadowRoot!.querySelector('.content')!;
    content.classList.toggle('open', this._open);
  }
}

customElements.define('expandable-section', ExpandableSection);</code></pre></less-code-block>
          </div>

          <div class="layer-card">
            <div class="layer-tag">Layer 3 — pure-island</div>
            <h3>框架完全拥有 Shadow Root</h3>
            <p>
              需要完整框架响应性的组件：本地状态、定时器、轮询、WebSocket。
              SSR 只输出标签和 <span class="inline-code">data-ssr-props</span>，
              不输出 DSD 模板。客户端框架创建 shadow root 并完全控制渲染。
            </p>
            <less-code-block><pre><code>&lt;!-- SSG 输出：只有标签和 props --&gt;
&lt;live-chart data-ssr-props="{&amp;quot;endpoint&amp;quot;:&amp;quot;/api/metrics&amp;quot;}"&gt;&lt;/live-chart&gt;

&lt;!-- 客户端升级后框架创建 shadow root --&gt;</code></pre></less-code-block>
          </div>

          <h2>升级策略</h2>
          <p>
            Island 的 <span class="inline-code">strategy</span> 控制客户端模块何时加载并注册。
            策略在 <span class="inline-code">island()</span> 调用时声明，构建器通过
            island manifest 传递到客户端 entry。
          </p>

          <div class="strategy-grid">
            <div class="strategy-item">
              <div class="strat-name"><code>eager</code></div>
              <p>
                模块加载后立即调用 <span class="inline-code">customElements.define()</span>。
                适用于首屏交互组件（导航、主题切换）。
              </p>
            </div>
            <div class="strategy-item">
              <div class="strat-name"><code>lazy</code> / <code>idle</code></div>
              <p>
                延迟到 <span class="inline-code">requestIdleCallback</span> 注册。
                默认策略，适用于非紧急交互组件。降级链：
                requestIdleCallback → requestAnimationFrame → setTimeout(50ms)。
              </p>
            </div>
            <div class="strategy-item">
              <div class="strat-name"><code>visible</code></div>
              <p>
                使用 <span class="inline-code">IntersectionObserver</span> 延迟到元素进入视口前
                200px 注册。适用于折叠内容、评论区等不在首屏的组件。
              </p>
            </div>
          </div>

          <less-code-block><pre><code>import { island } from '@lessjs/core';

// 立即注册
island('theme-toggle', ThemeToggle, { strategy: 'eager' });

// 空闲时注册（默认）
island('expand-section', ExpandSection, { strategy: 'lazy' });

// 可见时注册
island('comment-list', CommentList, { strategy: 'visible' });

// Pure Island + 可见策略
island('live-chart', LiveChart, { strategy: 'visible', dsd: false });</code></pre></less-code-block>

          <h2>Speculative Loading（预加载优化）</h2>
          <p>
            LessJS 在 SSG 后处理阶段生成 per-page island manifest
            (<span class="inline-code">island-manifests/page-{hash}.json</span>)，
            列出每个页面上实际出现的 island 及其 chunk URL 和策略。
            这使得运行时可以：
          </p>
          <ul>
            <li>只加载当前页面实际用到的 island chunk</li>
            <li>根据策略预加载（eager → 立即，visible → viewport 前预取）</li>
            <li>避免加载未使用的 island 模块</li>
          </ul>

          <less-code-block><pre><code>// island-manifests/page-abc123.json
{
  "route": "/guide/islands-deep",
  "islands": [
    {
      "tagName": "theme-toggle",
      "chunkUrl": "/client/theme-toggle-Bx3k.js",
      "strategy": "eager",
      "layer": "dsd-interactive"
    },
    {
      "tagName": "less-code-block",
      "chunkUrl": "/client/less-code-block-Km9w.js",
      "strategy": "lazy",
      "layer": "dsd-static"
    }
  ],
  "builtAt": "2025-05-08T00:00:00.000Z"
}</code></pre></less-code-block>

          <h2>less:bind 声明式事件绑定</h2>
          <p>
            Layer 2 组件使用 <span class="inline-code">hydrateEvents</span> 声明式绑定事件。
            这是 less:bind 机制的一部分：DSD 已经渲染了 DOM，框架模板绑定（如 Lit 的
            <span class="inline-code">@click</span>）不会执行，因为
            <span class="inline-code">render()</span> 返回 <span class="inline-code">nothing</span>。
            <span class="inline-code">hydrateEvents</span> 告诉适配器哪些 DOM 事件需要手动绑定。
          </p>

          <less-code-block><pre><code>import { html, nothing } from 'lit';
import { WithDsdHydration } from '@lessjs/adapter-lit/dsd-hydration';
import type { HydrateEventDescriptor } from '@lessjs/core/render-dsd';

class TabPanel extends WithDsdHydration(LitElement) {
  // 声明式事件绑定描述符
  static hydrateEvents: HydrateEventDescriptor[] = [
    { selector: 'button.tab', event: 'click', method: '_onTabClick' },
    { selector: 'input.search', event: 'input', method: '_onSearch' },
    { selector: '.panel', event: 'keydown', method: '_onKeydown' },
  ];

  override render() {
    // DSD 已存在 → 跳过重复渲染
    if (this._dsdHydrated) return nothing;

    return html\`
      &lt;div class="tabs"&gt;
        &lt;button class="tab" @click=\${this._onTabClick}&gt;Tab 1&lt;/button&gt;
        &lt;button class="tab" @click=\${this._onTabClick}&gt;Tab 2&lt;/button&gt;
      &lt;/div&gt;
      &lt;input class="search" @input=\${this._onSearch} placeholder="Search..." /&gt;
      &lt;div class="panel" @keydown=\${this._onKeydown}&gt;...&lt;/div&gt;
    \`;
  }

  private _onTabClick() { /* ... */ }
  private _onSearch() { /* ... */ }
  private _onKeydown() { /* ... */ }
}</code></pre></less-code-block>

          <p>
            事件监听器通过 <span class="inline-code">AbortController</span> 管理，
            组件断开连接时自动清理，不会造成内存泄漏。
          </p>

          <h2>data-ssr-props 机制</h2>
          <p>
            SSR 渲染时，组件的属性值会被序列化为 JSON 并写入
            <span class="inline-code">data-ssr-props</span> 属性。客户端升级时，
            <span class="inline-code">less:bind</span> 自动解析并恢复这些属性值，
            确保 SSR 和客户端状态一致。
          </p>

          <less-code-block><pre><code>&lt;!-- SSR 输出 --&gt;
&lt;live-counter
  count="5"
  data-ssr-props="{&amp;quot;count&amp;quot;:5,&amp;quot;step&amp;quot;:2}"
&gt;&lt;/live-counter&gt;

&lt;!-- 客户端升级流程 --&gt;
&lt;!-- 1. customElements.define('live-counter', LiveCounter) --&gt;
&lt;!-- 2. connectedCallback 检测 data-ssr-props --&gt;
&lt;!-- 3. lessBind(this) 解析 JSON 并设置属性 --&gt;
&lt;!-- 4. this.count = 5, this.step = 2 --&gt;</code></pre></less-code-block>

          <less-code-block><pre><code>// 手动使用 less:bind
import { lessBind, getSSRProps } from '@lessjs/core/island';

class MyComponent extends LitElement {
  override connectedCallback() {
    super.connectedCallback();
    // 自动绑定由 island() 处理，也可手动调用
    if (this.hasAttribute('data-ssr-props')) {
      lessBind(this);
    }

    // 或只读取 props
    const props = getSSRProps(this);
    if (props?.initialData) {
      this.data = props.initialData;
    }
  }
}</code></pre></less-code-block>

          <h2>完整示例：三层 Island 协作</h2>

          <less-code-block><pre><code>// app/islands/dark-toggle.ts — Layer 2
import { html, nothing } from 'lit';
import { WithDsdHydration } from '@lessjs/adapter-lit/dsd-hydration';
import { island } from '@lessjs/core';

class DarkToggle extends WithDsdHydration(LitElement) {
  static hydrateEvents = [
    { selector: 'button', event: 'click', method: '_toggle' },
  ];

  private _dark = false;

  override render() {
    if (this._dsdHydrated) return nothing;
    return html\`
      &lt;button @click=\${this._toggle}&gt;
        \${this._dark ? '🌙' : '☀️'}
      &lt;/button&gt;
    \`;
  }

  private _toggle() {
    this._dark = !this._dark;
    document.documentElement.classList.toggle('dark', this._dark);
  }
}

export default island('dark-toggle', DarkToggle, { strategy: 'eager' });</code></pre></less-code-block>

          <less-code-block><pre><code>// app/islands/word-counter.ts — Layer 3 (Pure Island)
import { html, LitElement } from 'lit';
import { island } from '@lessjs/core';

class WordCounter extends LitElement {
  static properties = {
    text: { type: String },
    _count: { state: true },
  };

  declare text: string;
  private _count = 0;

  override connectedCallback() {
    super.connectedCallback();
    this._count = this.text?.split(/\s+/).filter(Boolean).length ?? 0;
  }

  override render() {
    return html\`&lt;span&gt;\${this._count} words&lt;/span&gt;\`;
  }
}

export default island('word-counter', WordCounter, {
  strategy: 'lazy',
  dsd: false,
});</code></pre></less-code-block>

          <less-code-block><pre><code>// app/routes/blog/[slug].ts — 页面中使用
import { html, LitElement } from 'lit';

class BlogPostPage extends LitElement {
  override render() {
    return html\`
      &lt;article&gt;
        &lt;h1&gt;Blog Post Title&lt;/h1&gt;
        &lt;p&gt;Content...&lt;/p&gt;
      &lt;/article&gt;
      &lt;!-- Layer 1: 无 JS，纯展示 --&gt;
      &lt;aside&gt;Related posts...&lt;/aside&gt;
      &lt;!-- Layer 2: DSD + 事件绑定 --&gt;
      &lt;dark-toggle&gt;&lt;/dark-toggle&gt;
      &lt;!-- Layer 3: Pure Island --&gt;
      &lt;word-counter text="Some blog content here"&gt;&lt;/word-counter&gt;
    \`;
  }
}

customElements.define('page-blog-post', BlogPostPage);
export default BlogPostPage;
export const tagName = 'page-blog-post';</code></pre></less-code-block>

          <h2>最佳实践</h2>

          <h3>1. 从 Layer 1 开始</h3>
          <p>
            所有组件默认都是 Layer 1 (dsd-static)。只有当你确认需要交互时，
            才升级到 Layer 2 或 Layer 3。大部分展示性组件永远不需要离开 Layer 1。
          </p>

          <h3>2. 用 CSS 优先于 JavaScript</h3>
          <p>
            hover 状态、focus 样式、响应式布局、简单展开/折叠——这些 CSS 和原生 HTML
            就能解决，不需要 Island。参考 <a href="/guide/islands">Island Upgrade</a> 中的决策表。
          </p>

          <h3>3. 保持 Island 小且独立</h3>
          <p>
            每个 Island 应该只负责一块独立的交互。不要创建"超级 Island"
            来管理多个不相关的 UI 区域。多个小 Island 比一个大 Island 更容易理解和优化。
          </p>

          <h3>4. visible 策略优先于 lazy</h3>
          <p>
            对于不在首屏的组件，<span class="inline-code">visible</span> 策略比
            <span class="inline-code">lazy</span> 更精确：只在用户即将看到组件时才加载，
            而不是在浏览器空闲时（可能太早，浪费带宽）。
          </p>

          <h3>5. 注意 data-ssr-props 大小</h3>
          <p>
            <span class="inline-code">data-ssr-props</span> 的 JSON 会被 HTML 转义后嵌入属性。
            大型数据集（如完整 API 响应）应该通过 fetch 在客户端获取，
            而不是序列化到 HTML 中。只传递初始化所需的最小数据。
          </p>

          <h3>6. WithDsdHydration 的 render() 必须检查 _dsdHydrated</h3>
          <p>
            忘记检查 <span class="inline-code">this._dsdHydrated</span> 会导致 DSD DOM
            被重复渲染。这是 Layer 2 组件最常见的 bug：
          </p>
          <less-code-block><pre><code>// 正确
override render() {
  if (this._dsdHydrated) return nothing;
  return html\`...content...\`;
}

// 错误：会导致重复 DOM
override render() {
  return html\`...content...\`;
}</code></pre></less-code-block>

          <div class="nav-row">
            <a href="/guide/dsd" class="nav-link">&larr; DSD 渲染架构</a>
            <a href="/guide/rpc" class="nav-link">RPC 远程调用 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-islands-deep-guide', IslandsDeepGuidePage);
export default IslandsDeepGuidePage;
export const tagName = 'page-islands-deep-guide';

import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class DsdGuidePage extends LitElement {
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
      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .comparison-item {
        padding: 1rem 1.25rem;
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
      }
      .comparison-item.less {
        background: var(--less-bg-surface);
      }
      @media (max-width: 720px) {
        .comparison {
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
      <less-layout currentPath="/guide/dsd">
        <div class="container">
          <h1>DSD 渲染架构</h1>
          <p class="subtitle">
            Declarative Shadow DOM 是 LessJS 渲染模型的核心。浏览器原生解析 HTML，
            内容在 JavaScript 运行前就已经可见——这不是渐进增强的噱头，而是架构基线。
          </p>

          <h2>什么是 DSD</h2>
          <p>
            Declarative Shadow DOM (DSD) 是 WHATWG HTML 标准的一部分，允许在 HTML 中
            声明式地创建 Shadow DOM。浏览器在解析 HTML 时自动创建 shadow root 并填充内容，
            无需任何 JavaScript 执行。
          </p>
          <code-block><pre><code>&lt;my-component&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;内容在 JS 加载前就已经可见&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-component&gt;</code></pre></code-block>

          <h2>为什么选择 DSD</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>传统 SSR Hydration</h3>
              <ul>
                <li>服务端渲染完整 DOM，客户端需要恢复整棵组件树。</li>
                <li>Hydration 不匹配会导致闪烁、重复渲染或交互丢失。</li>
                <li>框架通常依赖专有标记（注释节点、data 属性）做水合。</li>
              </ul>
            </div>
            <div class="comparison-item less">
              <h3>DSD-first</h3>
              <ul>
                <li>浏览器原生解析 shadow root，零 JS 开销。</li>
                <li>Custom Element upgrade 是幂等操作：重复定义不会破坏已有 DOM。</li>
                <li>输出是纯净 HTML，无框架标记、无注释节点。</li>
              </ul>
            </div>
          </div>

          <h2>三层组件模型</h2>
          <p>
            LessJS 将组件分为三个层级，每一层对应不同的交互需求和客户端 JS 开销。
            层级越高，客户端 JavaScript 参与越多。
          </p>

          <div class="mermaid">graph TD
    L1["Layer 1: dsd-static"] --> L2["Layer 2: dsd-interactive"]
    L2 --> L3["Layer 3: pure-island"]

    L1 ---|"无 JS"| JS0["零客户端 JS"]
    L2 ---|"DSD + 事件绑定"| JS1["仅事件监听器"]
    L3 ---|"框架完全拥有"| JS2["完整框架运行时"]

    style L1 fill:#e8f5e9,stroke:#4caf50
    style L2 fill:#fff3e0,stroke:#ff9800
    style L3 fill:#fce4ec,stroke:#f44336</div>

          <div class="layer-card">
            <div class="layer-tag">Layer 1</div>
            <h3>dsd-static</h3>
            <p>
              纯静态 DSD，无水合。页面组件、导航栏、文章内容等纯展示性组件属于这一层。
              SSR 输出完整的 <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span>，
              客户端不需要加载任何 JavaScript。组件即使不被 <span class="inline-code">customElements.define()</span>
              升级，内容也始终可见。
            </p>
          </div>

          <div class="layer-card">
            <div class="layer-tag">Layer 2</div>
            <h3>dsd-interactive</h3>
            <p>
              DSD + 事件绑定水合。需要用户交互但状态简单的组件属于这一层（如展开/折叠、
              主题切换、Tab 切换）。SSR 仍然输出完整 DSD，客户端加载模块后：
            </p>
            <ul>
              <li>检测已有 shadow root（<span class="inline-code">_dsdHydrated</span> 标志）</li>
              <li>跳过 render()，避免重复 DOM</li>
              <li>通过 <span class="inline-code">hydrateEvents</span> 声明式绑定事件</li>
            </ul>
          </div>

          <div class="layer-card">
            <div class="layer-tag">Layer 3</div>
            <h3>pure-island</h3>
            <p>
              无 DSD，框架完全拥有 shadow root。需要完整框架响应性（本地状态、
              定时器、WebSocket、复杂表单）的组件属于这一层。SSR 只输出
              <span class="inline-code">&lt;my-island data-ssr-props="..."&gt;&lt;/my-island&gt;</span>，
              客户端框架创建 shadow root 并完全控制渲染。
            </p>
          </div>

          <h2>Slot 投影机制</h2>
          <p>
            LessJS 的 DSD 渲染器支持 Slot 投影。当组件的 light DOM 中包含子元素时，
            SSR 会将它们放置在 <span class="inline-code">&lt;/template&gt;</span> 之后，
            浏览器自动投影到 shadow DOM 中对应的 <span class="inline-code">&lt;slot&gt;</span> 位置。
          </p>
          <code-block><pre><code>&lt;!-- SSR 输出 --&gt;
&lt;less-layout current-path="/guide/dsd"&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;...&lt;/style&gt;
    &lt;nav&gt;...&lt;/nav&gt;
    &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;
  &lt;/template&gt;
  &lt;!-- light DOM 子元素被投影到 slot --&gt;
  &lt;div class="container"&gt;
    &lt;h1&gt;DSD 渲染架构&lt;/h1&gt;
  &lt;/div&gt;
&lt;/less-layout&gt;</code></pre></code-block>

          <h2>WHATWG DSD 属性</h2>
          <p>
            LessJS 支持 WHATWG HTML Living Standard 定义的 DSD 模板属性，
            通过 <span class="inline-code">DsdOptions</span> 配置或组件静态属性自动推断。
          </p>
          <table>
            <thead>
              <tr>
                <th>属性</th>
                <th>配置项</th>
                <th>作用</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">shadowrootdelegatesfocus</span></td>
                <td><span class="inline-code">delegatesFocus: true</span></td>
                <td>自动将焦点委托给 shadow DOM 内第一个可聚焦元素</td>
              </tr>
              <tr>
                <td><span class="inline-code">shadowrootserializable</span></td>
                <td><span class="inline-code">serializable: true</span></td>
                <td>启用 <span class="inline-code">getInnerHTML()</span> 序列化</td>
              </tr>
              <tr>
                <td><span class="inline-code">shadowrootslotassignment="manual"</span></td>
                <td><span class="inline-code">slotAssignment: 'manual'</span></td>
                <td>手动控制 slot 分配，用于精确的 slot 投影</td>
              </tr>
              <tr>
                <td><span class="inline-code">shadowrootcustomelementregistry</span></td>
                <td><span class="inline-code">customElementRegistry: 'name'</span></td>
                <td>使用作用域自定义元素注册表</td>
              </tr>
            </tbody>
          </table>

          <code-block><pre><code>// 通过组件静态属性声明
class SearchBox extends LitElement {
  static delegatesFocus = true;
  static serializable = true;
  // LessJS 自动推断 DSD 属性
}

// 或通过 renderDSD 参数指定
const html = await renderDSD(
  'search-box', SearchBox,
  { placeholder: 'Search...' },
  undefined,
  { delegatesFocus: true, serializable: true }
);
// → &lt;search-box placeholder="Search..."&gt;
//     &lt;template shadowrootmode="open" shadowrootdelegatesfocus shadowrootserializable&gt;
//       ...
//     &lt;/template&gt;
//   &lt;/search-box&gt;</code></pre></code-block>

          <h2>DSD-first 原则</h2>
          <p>
            DSD-first 意味着浏览器原生解析是第一渲染路径，JavaScript 是升级路径。
            这带来三个核心优势：
          </p>
          <ul>
            <li><strong>零闪烁</strong>：内容在 HTML 解析阶段就已渲染，不存在 hydration 闪烁。</li>
            <li><strong>渐进增强</strong>：即使 JavaScript 加载失败或被禁用，内容仍然可见。</li>
            <li><strong>SEO 友好</strong>：搜索引擎爬虫无需执行 JavaScript 即可获取完整内容。</li>
          </ul>

          <h2>代码示例：DSD Interactive 组件</h2>
          <code-block><pre><code>import { html, nothing } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';

class ThemeToggle extends DsdLitElement {
  // 声明式事件绑定：DSD 升级后自动附加
  static hydrateEvents = [
    { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
  ];

  private _dark = false;

  override render() {
    // DSD 已存在时跳过重复渲染
    if (this._dsdHydrated) return nothing;
    return html\`
      &lt;button class="toggle" @click=\${this._handleToggle}&gt;
        \${this._dark ? '🌙' : '☀️'}
      &lt;/button&gt;
    \`;
  }

  private _handleToggle() {
    this._dark = !this._dark;
    document.documentElement.classList.toggle('dark', this._dark);
  }
}

customElements.define('theme-toggle', ThemeToggle);</code></pre></code-block>

          <h2>代码示例：Pure Island 组件</h2>
          <code-block><pre><code>import { html, LitElement } from 'lit';
import { island } from '@lessjs/core';

class LiveCounter extends LitElement {
  static properties = {
    count: { type: Number },
  };

  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  override render() {
    return html\`
      &lt;button @click=\${() =&gt; this.count--}&gt;-&lt;/button&gt;
      &lt;span&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${() =&gt; this.count++}&gt;+&lt;/button&gt;
    \`;
  }
}

// dsd: false → Pure Island (Layer 3)
// 框架完全拥有 shadow root，获得完整响应性
export default island('live-counter', LiveCounter, {
  strategy: 'eager',
  dsd: false,
});</code></pre></code-block>

          <h2>与其他框架对比</h2>
          <table>
            <thead>
              <tr>
                <th>特性</th>
                <th>LessJS DSD</th>
                <th>React Server Components</th>
                <th>Astro Islands</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>首屏渲染</td>
                <td>浏览器原生 DSD 解析</td>
                <td>服务端流式 HTML</td>
                <td>静态 HTML</td>
              </tr>
              <tr>
                <td>Hydration 模型</td>
                <td>Island Upgrade（幂等）</td>
                <td>选择性水合（React 专有）</td>
                <td>Partial Hydration（框架适配器）</td>
              </tr>
              <tr>
                <td>组件封装</td>
                <td>Shadow DOM（标准）</td>
                <td>无封装（React 树）</td>
                <td>可选 Shadow DOM</td>
              </tr>
              <tr>
                <td>框架绑定</td>
                <td>框架无关（Custom Element）</td>
                <td>强绑定 React</td>
                <td>多框架支持</td>
              </tr>
              <tr>
                <td>SSR 产物</td>
                <td>纯净 HTML（无框架标记）</td>
                <td>含 React 水合标记</td>
                <td>纯净 HTML</td>
              </tr>
              <tr>
                <td>JS 禁用降级</td>
                <td>内容仍可见（DSD）</td>
                <td>部分可见（RSC）</td>
                <td>内容仍可见</td>
              </tr>
            </tbody>
          </table>

          <div class="callout">
            <p>
              LessJS 选择 DSD 不是因为它最新，而是因为它把渲染的第一责任交给了浏览器，
              而不是 JavaScript 框架。当浏览器能做的事越来越多，框架应该退到更小的位置。
            </p>
          </div>

          <h2>常见问题</h2>

          <h3>DSD 在哪些浏览器中支持？</h3>
          <p>
            Chrome 90+、Edge 90+、Safari 16.4+、Firefox 123+ 已原生支持 DSD。
            对于旧版浏览器，LessJS 的 client entry 中 <span class="inline-code">customElements.define()</span>
            会在升级时创建 shadow root 并填充内容，功能等价。
          </p>

          <h3>为什么不用 @lit-labs/ssr？</h3>
          <p>
            @lit-labs/ssr 的输出包含 <span class="inline-code">&lt;!--lit-part--&gt;</span> 标记注释，
            这是为 Lit 客户端水合管线设计的。LessJS 需要纯净的 DSD HTML，
            不依赖任何框架专有标记。<span class="inline-code">@lessjs/adapter-lit</span>
            通过安全插值将 TemplateResult 直接转为字符串，保持 Lit 的转义语义。
          </p>

          <h3>Layer 2 和 Layer 3 怎么选？</h3>
          <p>
            如果组件只需要绑定几个事件处理器，用 Layer 2。如果组件有复杂的本地状态、
            定时器、WebSocket 连接或需要完整响应式更新，用 Layer 3。
            当犹豫时，从 Layer 1 开始，按需升级。
          </p>

          <div class="nav-row">
            <a href="/guide/ssg" class="nav-link">&larr; Rendering & SSG</a>
            <a href="/guide/islands-deep" class="nav-link">Island 深度指南 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-dsd-guide', DsdGuidePage);
export default DsdGuidePage;
export const tagName = 'page-dsd-guide';

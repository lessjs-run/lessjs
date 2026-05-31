export const meta = { section: 'Principles', label: 'Island Deep Dive', order: 50 };
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .layer-card { padding: var(--size-5) var(--size-6); margin: var(--size-4) 0; border-left: 2px solid var(--border-hover); background: var(--bg-surface); border-radius: 0 3px 3px 0; }
      .layer-card .layer-tag { font-size: 0.6875rem; font-weight: var(--font-weight-5); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; }
      .layer-card h3 { margin: 0 0 var(--size-2); }
      .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-4); margin: var(--size-4) 0 var(--size-6); }
      .strategy-item { padding: var(--size-4) var(--size-5); border: 0.5px solid var(--border); border-radius: var(--radius-1); background: var(--bg-surface); }
      .strategy-item .strat-name { font-weight: var(--font-weight-5); font-size: var(--font-size-2); color: var(--text-primary); margin-bottom: 0.25rem; }
      .strategy-item .strat-name code { font-size: var(--font-size-0); background: var(--bg-code); padding: 0.125rem 0.375rem; border-radius: 3px; }
      @media (max-width: 720px) { .strategy-grid { grid-template-columns: 1fr; } }
    `);

export class IslandsDeepGuidePage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
      >
        <div class='container'>
          <h1>Island 深度指南</h1>
          <p class='subtitle'>
            Island 是 LessJS 中唯一允许的客户端 JavaScript 单元。本页深入讲解 Island
            的三层架构、升级策略、声明式事件绑定和数据传递机制。
          </p>
          <h2>Island 架构原理</h2>
          <p>
            LessJS 的 Island 是对 Custom Element Upgrade 机制的诚实利用。浏览器解析 HTML 时看到{' '}
            <span class='inline-code'>&lt;my-counter&gt;</span>，稍后加载模块调用{' '}
            <span class='inline-code'>customElements.define()</span>，已有元素被升级--这就是 Island
            的全部原理。关于 DSD 渲染模型和为什么选择 DSD-first，参见{' '}
            <a href={`/${loc}/architecture/dsd`}>DSD 渲染架构</a>。
          </p>
          <h2>三层 Island 架构</h2>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 1 - dsd-static</div>
            <h3>无 JS，纯 DSD</h3>
            <p>
              导航栏、文章内容、页脚等纯展示组件。SSG 输出完整 DSD HTML，客户端不加载任何
              JavaScript。组件即使永远不会被 customElements.define()
              升级，内容也始终可见且样式完整。
            </p>
          </div>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 2 - dsd-interactive</div>
            <h3>DSD + 事件绑定</h3>
            <p>
              需要交互但状态简单的组件。SSR 输出完整 DSD（首屏可见），客户端加载模块后检测已有
              shadow root，跳过 render()，只绑定声明的事件处理器。
            </p>
          </div>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 3 - pure-island</div>
            <h3>框架完全拥有 Shadow Root</h3>
            <p>
              需要完整框架响应性的组件：本地状态、定时器、轮询、WebSocket。SSR 只输出标签和
              data-ssr-props，不输出 DSD 模板。客户端框架创建 shadow root 并完全控制渲染。
            </p>
          </div>
          <h2>升级策略</h2>
          <p>
            Island 的 strategy 控制客户端模块何时加载并注册。策略在 defineIsland()
            调用时声明，构建器通过 island manifest 传递到客户端 entry。
          </p>
          <div class='strategy-grid'>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:load</code>
              </div>
              <p>客户端入口加载后立即导入模块。适用于首屏交互组件（导航、主题切换）。</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:idle</code>
              </div>
              <p>延迟到 requestIdleCallback 注册。默认策略，适用于非紧急交互组件。</p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>visible</code>
              </div>
              <p>
                使用 IntersectionObserver 延迟到元素进入视口前 200px
                注册。适用于折叠内容、评论区等不在首屏的组件。
              </p>
            </div>
          </div>
          <h2>Speculative Loading</h2>
          <p>
            LessJS 在 SSG 后处理阶段生成 per-page island manifest，列出每个页面上实际出现的 island
            及其 chunk URL 和策略。运行时只加载当前页面用到的 island chunk。
          </p>
          <h2>bindEvents() 声明式事件绑定</h2>
          <p>
            Layer 2 组件使用 bindEvents() 声明式绑定事件。DSD 已经渲染了 DOM，render() 返回
            nothing。bindEvents() 告诉适配器哪些 DOM 事件需要手动绑定。事件监听器通过
            AbortController 管理，组件断开时自动清理。
          </p>
          <h2>data-ssr-props 机制</h2>
          <p>
            SSR 渲染时，组件的属性值被序列化为 JSON 并写入 data-ssr-props
            属性。客户端升级时，bindEvents() 自动解析并恢复这些属性值，确保 SSR 和客户端状态一致。
          </p>
          <h2>最佳实践</h2>
          <p>
            1. 从 Layer 1 开始。大部分展示性组件永远不需要离开 Layer 1。
            <br />2. 用 CSS 优先于 JavaScript。hover、focus、响应式布局等 CSS 就能解决。
            <br />3. 保持 Island 小且独立。多个小 Island 比一个大 Island 更容易理解和优化。
            <br />4. client:visible 策略优先于 client:idle。对于不在首屏的组件更精确。
            <br />5. 注意 data-ssr-props 大小。大型数据集应通过 fetch 在客户端获取。
            <br />6. DSD hydration 检测：在客户端 hydrate 时自动检测已有 shadow root，避免 DOM 重复渲染。
          </p>
          <div class='nav-row'>
            <a href={`/${loc}/architecture/dsd`} class='nav-link'>← DSD 渲染架构</a>
            <a href={`/${loc}/api/reference`} class='nav-link'>RPC 远程调用 →</a>
          </div>
        </div>
      </less-layout>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      <less-layout
        locale={loc}
        locales={JSON.stringify(['en', 'zh'])}
      >
        <div class='container'>
          <h1>Island Deep Dive</h1>
          <p class='subtitle'>
            Islands are the only allowed client-side JavaScript units in LessJS. This page covers
            the three-layer architecture, upgrade strategies, declarative event binding, and data
            passing mechanisms.
          </p>
          <h2>Island Architecture</h2>
          <p>
            LessJS islands are a straightforward exploitation of the Custom Element Upgrade
            mechanism. The browser sees <span class='inline-code'>&lt;my-counter&gt;</span>{' '}
            during HTML parsing; later the module loads and calls{' '}
            <span class='inline-code'>customElements.define()</span>, upgrading the existing
            element. See <a href={`/${loc}/architecture/dsd`}>DSD Architecture</a>{' '}
            for the rendering model.
          </p>
          <h2>Three-Layer Island Architecture</h2>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 1 - dsd-static</div>
            <h3>No JS, Pure DSD</h3>
            <p>
              Purely presentational components: nav, article content, footer. SSG outputs full DSD
              HTML; the client loads zero JavaScript. Content remains visible and styled even if
              customElements.define() is never called.
            </p>
          </div>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 2 - dsd-interactive</div>
            <h3>DSD + Event Binding</h3>
            <p>
              Components needing simple interactivity. SSR outputs full DSD (visible on first
              paint); after the client module loads, it detects the existing shadow root, skips
              render(), and binds only the declared event handlers.
            </p>
          </div>
          <div class='layer-card'>
            <div class='layer-tag'>Layer 3 - pure-island</div>
            <h3>Framework Owns Shadow Root</h3>
            <p>
              Components needing full framework reactivity: local state, timers, polling, WebSocket.
              SSR outputs only the tag and data-ssr-props - no DSD template. The client framework
              creates the shadow root and controls rendering entirely.
            </p>
          </div>
          <h2>Upgrade Strategies</h2>
          <div class='strategy-grid'>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:load</code>
              </div>
              <p>
                Imports immediately after the client entry loads. For first-paint interactive
                components such as nav and theme controls.
              </p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:idle</code>
              </div>
              <p>
                Defers to requestIdleCallback. Default strategy for non-urgent interactive
                components.
              </p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:visible</code>
              </div>
              <p>
                Uses IntersectionObserver to import when the element is 200px before the viewport.
                For below-the-fold components like collapsible sections and comments.
              </p>
            </div>
            <div class='strategy-item'>
              <div class='strat-name'>
                <code>client:only</code>
              </div>
              <p>
                Excludes the component from SSR and lets the browser own rendering. For browser-only
                components that cannot produce reliable DSD.
              </p>
            </div>
          </div>
          <h2>Speculative Loading</h2>
          <p>
            During SSG post-processing, LessJS generates a per-page island manifest listing every
            island present on each page, with chunk URLs and strategies. The runtime only loads
            islands actually used on the current page.
          </p>
          <h2>bindEvents() Declarative Event Binding</h2>
          <p>
            Layer 2 components use bindEvents() for declarative event binding. Since DSD has
            already rendered the DOM, render() returns nothing. bindEvents() tells the adapter
            which DOM events to wire up manually. Listeners are managed via AbortController and
            cleaned up on disconnect.
          </p>
          <h2>data-ssr-props Mechanism</h2>
          <p>
            During SSR, component property values are serialized to JSON and written to the
            data-ssr-props attribute. On client upgrade, bindEvents() automatically parses and restores
            these values, ensuring SSR and client state stay in sync.
          </p>
          <h2>Best Practices</h2>
          <p>
            1. Start with Layer 1. Most presentational components never need to leave Layer 1.
            <br />2. Prefer CSS over JavaScript. Hover, focus, responsive layouts can be done with
            CSS alone.
            <br />3. Keep islands small and independent. Multiple small islands are easier to
            understand and optimize than one large one.
            <br />4. Prefer client:visible over client:idle for below-the-fold components.
            <br />5. Keep data-ssr-props small. Large datasets should be fetched client-side.
            <br />            6. DSD hydration detection: automatically detects existing shadow root on client
            hydrate to avoid re-rendering DSD DOM.
          </p>
          <div class='nav-row'>
            <a href={`/${loc}/architecture/dsd`} class='nav-link'>← DSD Architecture</a>
            <a href={`/${loc}/api/reference`} class='nav-link'>RPC →</a>
          </div>
        </div>
      </less-layout>
    );
  }
}

customElements.define('page-islands-deep-guide', IslandsDeepGuidePage);
export default IslandsDeepGuidePage;
export const tagName = 'page-islands-deep-guide';

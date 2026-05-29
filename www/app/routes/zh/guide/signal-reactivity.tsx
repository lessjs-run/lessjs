// deno-fmt-ignore-file
export const meta = { section: 'Guide', label: 'Signal 响应式', order: 9 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterDocsNav } from '../../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export const tagName = 'zh-signal-reactivity-page';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.875rem;
      }
      th, td {
        padding: 0.5rem 0.75rem;
        border-bottom: 0.5px solid var(--border);
        text-align: left;
        vertical-align: top;
      }
      th {
        background: var(--bg-surface);
        color: var(--text-muted);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `);

export default class ZhSignalReactivityPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return `
      <less-layout
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterDocsNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/zh/guide/signal-reactivity"
      >
        <div class="container">
          <h1>Signal 响应式</h1>
          <p class="subtitle">
            LessJS 使用 alien-signals（1.6KB）作为响应式引擎——与 Vue 3.6 核心和 XState 相同的
            push-pull 混合架构。提供 <code>signal()</code>、<code>computed()</code> 和
            <code>effect()</code> 三个核心原语。
          </p>

          <less-callout type="info" label="引擎">
            v0.22.1 起，alien-signals 是唯一的信号引擎。TC39 polyfill 已移除。
            alien-signals 是硬依赖——没有回退方案。
          </less-callout>

          <h2>signal()</h2>
          <p>创建可读可写的响应式值容器：</p>
          <less-code-block><pre><code>import { signal } from '@lessjs/runtime';

const count = signal(0);
console.log(count.value); // 0
count.value = 5;
console.log(count.value); // 5</code></pre></less-code-block>

          <h2>computed()</h2>
          <p>从已有信号派生新值。依赖变化时自动重新计算，只有值真正改变时才通知订阅者：</p>
          <less-code-block><pre><code>import { signal, computed } from '@lessjs/runtime';

const firstName = signal('张');
const lastName = signal('三');
const fullName = computed(() =&gt; &#96;&#36;{firstName.value} &#36;{lastName.value}&#96;);
console.log(fullName.value); // "张 三"</code></pre></less-code-block>

          <h2>effect()</h2>
          <p>当依赖信号变化时自动执行副作用。函数内读取的所有信号都会被自动追踪：</p>
          <less-code-block><pre><code>import { signal, effect } from '@lessjs/runtime';

const count = signal(0);

const dispose = effect(() =&gt; {
  console.log(&#96;count = &#36;{count.value}&#96;);
});

count.value = 1;  // 日志: "count = 1"
count.value = 2;  // 日志: "count = 2"

dispose(); // 停止追踪</code></pre></less-code-block>

          <h2>组件内使用信号</h2>
          <p>在 <code>DsdElement</code> 组件中，信号驱动自动重新渲染：</p>
          <less-code-block><pre><code>import { DsdElement, signal } from '@lessjs/runtime';

class Counter extends DsdElement {
  count = signal(0);

  render() {
    return (
      &lt;button onClick={() =&gt; this.count.value++}&gt;
        点击次数: {this.count}
      &lt;/button&gt;
    );
  }
}

customElements.define('my-counter', Counter);</code></pre></less-code-block>

          <h2>auto-tracking 机制</h2>
          <p>alien-signals 使用三级 push-pull 架构：</p>

          <h3>第一阶段 — Track</h3>
          <p><code>effect(fn)</code> 执行 <code>fn</code> 时进入追踪作用域。函数内每个 <code>.value</code> 读取都会自动注册为依赖。</p>

          <h3>第二阶段 — Push</h3>
          <p>当任何被追踪的信号值改变时，alien-signals 将 effect 标记为脏数据，并推送通知。</p>

          <h3>第三阶段 — Pull</h3>
          <p>Effect 重新执行 <code>fn</code>。执行过程中收集新依赖，清理旧依赖（动态依赖追踪）。</p>

          <p>这意味着 <strong>无需手动管理订阅</strong>——<code>render()</code> 方法自然地读取信号值，alien-signals 自动处理依赖图。</p>

          <h2>DsdElement 的 effect() 渲染管道</h2>
          <p>当 <code>DsdElement.render()</code> 返回 VNode 时，<code>_renderIntoShadowRoot()</code> 创建 alien-signals effect：</p>

          <less-code-block><pre><code>// DsdElement._renderIntoShadowRoot() 内部逻辑（简化）：
this._vnodeEffectDispose = effect(() =&gt; {
  const updated = this.render();
  // 中止旧的 AbortController（清理事件监听器）
  this._templateAbortController.abort();
  this._templateAbortController = new AbortController();
  // 清除旧 DOM
  while (this.shadowRoot.firstChild) {
    this.shadowRoot.removeChild(this.shadowRoot.firstChild);
  }
  // 创建新 DOM
  this.shadowRoot.appendChild(
    renderToDom(updated, this._templateAbortController.signal),
  );
});</code></pre></less-code-block>

          <p>完整流程：</p>
          <ol>
            <li>调用 <code>this.render()</code> → 自动追踪所有信号读取</li>
            <li>中止上一个 <code>AbortController</code> → 移除旧事件监听器</li>
            <li>创建新 <code>AbortController</code> 用于新事件监听器</li>
            <li>清除旧 DOM</li>
            <li>通过 <code>renderToDom()</code> 创建并挂载新 DOM</li>
          </ol>

          <h2>信号自动解包</h2>
          <p>JSX 表达式 <code>{}</code> 中信号自动解包，大多数情况无需显式 <code>.value</code>：</p>

          <table>
            <thead>
              <tr>
                <th>场景</th>
                <th>行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>{this.count}</code></td>
                <td>✅ 通过 <code>valueOf()</code> 自动解包</td>
              </tr>
              <tr>
                <td><code>{this.count + 1}</code></td>
                <td>✅ 运算符触发 <code>valueOf()</code></td>
              </tr>
              <tr>
                <td><code>&#96;&#36;{this.count}&#96;</code></td>
                <td>✅ 模板字面量触发 <code>Symbol.toPrimitive('string')</code></td>
              </tr>
              <tr>
                <td><code>JSON.stringify(this.count)</code></td>
                <td>❌ 不解包 — 用 <code>this.count.value</code></td>
              </tr>
              <tr>
                <td><code>Array.isArray(this.items)</code></td>
                <td>❌ 不解包 — 用 <code>Array.isArray(this.items.value)</code></td>
              </tr>
              <tr>
                <td><code>typeof this.count</code></td>
                <td>返回 <code>"object"</code> — 用 <code>typeof this.count.value</code></td>
              </tr>
            </tbody>
          </table>

          <h2>unwrap()</h2>
          <p>在自动解包不足的场景下使用 <code>unwrap()</code> 显式提取值：</p>
          <less-code-block><pre><code>import { unwrap } from '@lessjs/runtime';

// ✅ 正确：显式解包
Array.isArray(unwrap(this.items)); // true

// ❌ 错误：信号本身不是数组
Array.isArray(this.items); // false</code></pre></less-code-block>

          <h2>effect() 生命周期</h2>

          <h3>创建</h3>
          <p>在 <code>_renderIntoShadowRoot()</code> 中设置：<code>this._vnodeEffectDispose = effect(() => { ... })</code></p>

          <h3>销毁 — 手动（重新渲染）</h3>
          <p>调用 <code>update()</code> 或 <code>requestUpdate()</code> 时，<code>_renderIntoShadowRoot()</code> 先调用 <code>_disposeSignalSubscriptions()</code>，清掉旧 effect 再创建新的。</p>

          <h3>销毁 — 自动（断连）</h3>
          <p>元素从 DOM 中移除时，<code>disconnectedCallback()</code> 调用 <code>_disposeSignalSubscriptions()</code> → 所有 effect 被清理，无内存泄漏。</p>

          <h3>SSR 安全</h3>
          <p>effect <strong>永远不会在 SSR 中创建</strong>。<code>_renderIntoShadowRoot()</code> 仅从 <code>_hydrateOrRender()</code> 调用，而 <code>_hydrateOrRender()</code> 仅从 <code>connectedCallback()</code> 调用——后者只在浏览器环境触发。SSR 直接使用 <code>renderToString()</code>。</p>

          <h2>Effect 批处理</h2>
          <p>alien-signals 将同一微任务内的多个信号变更合并为一次 effect 执行：</p>
          <less-code-block><pre><code>// 两次变更被合并 — 只触发一次重新渲染
this.firstName.value = 'Hello';
this.lastName.value = 'World';
// → effect 只执行一次，两个值同时生效</code></pre></less-code-block>

          <h2>Effect 错误处理</h2>
          <p>alien-signals effect 包装器包含清理安全的错误处理：</p>
          <ul>
            <li><strong>清理错误被吞掉</strong>：旧 effect 清理抛错不会阻止新 effect 启动</li>
            <li><strong>Effect 错误会传播</strong>：<code>render()</code> 或 <code>renderToDom()</code> 在 effect 中抛错会传播到 alien-signals。Effect 不会被销毁——后续信号变化会重试</li>
            <li><strong>Dispose 吞掉清理错误</strong>：销毁 effect 时，清理函数和 alien-signals dispose 都会执行，各自吞掉错误</li>
          </ul>

          <h2>完整 DOM 重新渲染 vs 细粒度 Patch</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>完整重渲染（VNode + effect）</th>
                <th>细粒度 Patch（TemplateResult）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>信号追踪</td>
                <td>自动（alien-signals push-pull）</td>
                <td>手动（collect + subscribe）</td>
              </tr>
              <tr>
                <td>订阅模型</td>
                <td>隐式（函数内读取）</td>
                <td>显式（ReactiveHost.subscribeTo）</td>
              </tr>
              <tr>
                <td>更新策略</td>
                <td>完整 DOM 重渲染</td>
                <td>细粒度文本 patch</td>
              </tr>
              <tr>
                <td>DOM 保留</td>
                <td>❌ 每次清空</td>
                <td>✅ 仅文本节点变更</td>
              </tr>
              <tr>
                <td>依赖清理</td>
                <td>自动（动态依赖追踪）</td>
                <td>手动（unsubscribe 数组）</td>
              </tr>
              <tr>
                <td>错误处理</td>
                <td>吞掉清理错误，下次重试</td>
                <td>patch 内错误 → 保留原 DOM</td>
              </tr>
            </tbody>
          </table>

          <h2>性能考量</h2>
          <table>
            <thead>
              <tr>
                <th>场景</th>
                <th>每次更新开销</th>
                <th>建议</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>小组件（&lt; 50 DOM 节点）</td>
                <td>&lt; 1ms</td>
                <td>✅ 随意使用 VNode + effect</td>
              </tr>
              <tr>
                <td>中等组件（50–200 DOM 节点）</td>
                <td>1–5ms</td>
                <td>✅ 大多数场景可用</td>
              </tr>
              <tr>
                <td>大组件（200–1000 DOM 节点）</td>
                <td>5–20ms</td>
                <td>⚠️ 先做性能分析</td>
              </tr>
              <tr>
                <td>超大型（&gt; 1000 DOM 节点）</td>
                <td>20ms+</td>
                <td>❌ 考虑拆分组件</td>
              </tr>
              <tr>
                <td>高频更新（&gt; 10次/秒）</td>
                <td>累积开销</td>
                <td>❌ 考虑手动 DOM 更新</td>
              </tr>
            </tbody>
          </table>

          <h2>优化策略</h2>
          <ol>
            <li><strong>拆分组件</strong>：大组件拆分为多个小组件，每个有独立的 shadow DOM 和 effect 作用域</li>
            <li><strong>防抖快速更新</strong>：搜索即输场景用 <code>setTimeout</code> 防抖信号写入</li>
            <li><strong>使用派生信号</strong>：<code>computed()</code> 在值未实际变化时避免重新渲染</li>
            <li><strong>避免热路径中的信号读取</strong>：不影响 DOM 的信号不要放在 <code>render()</code> 中读取</li>
          </ol>

          <div class="nav-row">
            <a href="/zh/guide/static-props" class="nav-link">&larr; Static Props</a>
            <a href="/zh/guide/migration-v0.24" class="nav-link">v0.24 迁移指南 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ZhSignalReactivityPage);

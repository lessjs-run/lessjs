// deno-fmt-ignore-file
export const meta = { section: 'Guide', label: 'JSX 组件', order: 7 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export const tagName = 'zh-jsx-components-page';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .card {
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      }
      .card h3 {
        margin-top: 0;
      }
      .note {
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        padding: 0.75rem 1rem;
        margin: 1rem 0;
      }
      .note p {
        margin: 0;
      }
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

export default class ZhJsxComponentsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return `
      <less-layout
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterFrameworkNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/zh/guide/jsx-components"
      >
        <div class="container">
          <h1>JSX 组件</h1>
          <p class="subtitle">
            LessJS v0.24.1 使用 JSX 语法编写响应式 Web Components。组件继承
            <code>DsdElement</code>，使用 <code>signal()</code> 管理状态，
            支持 SSR（服务端渲染）和 CSR（客户端渲染）。
          </p>

          <less-callout type="info" label="前置条件">
            使用 JSX 需要构建工具配置 <code>jsx: "automatic"</code> 和
            <code>jsxImportSource: "@lessjs/core"</code>。
            LessJS 的 Vite 插件已预配置这些选项。
          </less-callout>

          <h2>基本组件</h2>
          <p>一个 LessJS JSX 组件是一个继承 <code>DsdElement</code> 的类，必须实现 <code>render()</code> 方法：</p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

class HelloWorld extends DsdElement {
  render() {
    return &lt;h1&gt;Hello LessJS&lt;/h1&gt;;
  }
}

customElements.define('hello-world', HelloWorld);</code></pre></less-code-block>

          <h2>响应式组件</h2>
          <p>使用 <code>signal()</code> 创建响应式状态。信号变化时组件自动重新渲染：</p>
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

          <h2>计算属性</h2>
          <p>使用 <code>computed()</code> 创建派生状态。计算值会随依赖自动更新：</p>
          <less-code-block><pre><code>import { DsdElement, signal, computed } from '@lessjs/runtime';

class Counter extends DsdElement {
  count = signal(0);
  double = computed(() =&gt; this.count.value * 2);

  render() {
    return (
      &lt;div&gt;
        &lt;span&gt;计数: {this.count}&lt;/span&gt;
        &lt;span&gt;双倍: {this.double}&lt;/span&gt;
      &lt;/div&gt;
    );
  }
}</code></pre></less-code-block>

          <h2>JSX 标签规则</h2>
          <table>
            <thead>
              <tr>
                <th>JSX 写法</th>
                <th>含义</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>&lt;div&gt;</code></td>
                <td>HTML 元素</td>
                <td>小写标签名 → 标准 HTML/SVG 元素</td>
              </tr>
              <tr>
                <td><code>&lt;MyCard&gt;</code></td>
                <td>组件类</td>
                <td>大写/PascalCase → 必须有 <code>render()</code> 方法的类</td>
              </tr>
              <tr>
                <td><code>&lt;&gt;...&lt;/&gt;</code></td>
                <td>Fragment</td>
                <td>不产生额外 DOM 节点的分组</td>
              </tr>
            </tbody>
          </table>

          <h2>Props 映射</h2>
          <table>
            <thead>
              <tr>
                <th>JSX</th>
                <th>DOM</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>className="foo"</code></td>
                <td><code>class="foo"</code></td>
                <td>React 兼容写法</td>
              </tr>
              <tr>
                <td><code>htmlFor="bar"</code></td>
                <td><code>for="bar"</code></td>
                <td>label 的 for 属性</td>
              </tr>
              <tr>
                <td><code>onClick={fn}</code></td>
                <td><code>addEventListener('click', fn)</code></td>
                <td>所有 <code>on*</code> 属性都视为事件处理器</td>
              </tr>
              <tr>
                <td><code>style={{color:'red'}}</code></td>
                <td><code>element.style.color = 'red'</code></td>
                <td>CSR 直接赋值; SSR 序列化为内联样式</td>
              </tr>
              <tr>
                <td><code>ref={el => ...}</code></td>
                <td>DOM 元素回调</td>
                <td>CSR 在元素创建后调用</td>
              </tr>
              <tr>
                <td><code>disabled</code></td>
                <td><code>setAttribute('disabled', '')</code></td>
                <td>布尔 <code>true</code> 设置属性</td>
              </tr>
              <tr>
                <td><code>disabled={false}</code></td>
                <td><code>removeAttribute('disabled')</code></td>
                <td>布尔 <code>false</code> 移除属性</td>
              </tr>
            </tbody>
          </table>

          <h2>Children 处理</h2>
          <table>
            <thead>
              <tr>
                <th>JSX</th>
                <th>CSR 行为</th>
                <th>SSR 行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>{"hello"}</code></td>
                <td><code>document.createTextNode()</code></td>
                <td>HTML 转义文本</td>
              </tr>
              <tr>
                <td><code>{42}</code></td>
                <td><code>document.createTextNode('42')</code></td>
                <td>HTML 转义文本</td>
              </tr>
              <tr>
                <td><code>{signal}</code></td>
                <td>自动解包 <code>.value</code></td>
                <td>渲染当前值</td>
              </tr>
              <tr>
                <td><code>{vnode}</code></td>
                <td>嵌套渲染为 DOM</td>
                <td>嵌套渲染为 HTML</td>
              </tr>
              <tr>
                <td><code>{[a, b]}</code></td>
                <td>扁平化渲染</td>
                <td>扁平化渲染</td>
              </tr>
            </tbody>
          </table>

          <h2>事件处理</h2>
          <p>所有 <code>on*</code> JSX 属性自动绑定为原生 DOM 事件处理器。事件监听器通过 <code>AbortSignal</code> 管理，组件断开连接时自动清理：</p>
          <less-code-block><pre><code>class FormElement extends DsdElement {
  name = signal('');

  render() {
    return (
      &lt;form onSubmit={(e) =&gt; {
        e.preventDefault();
        console.log('提交:', this.name.value);
      }}&gt;
        &lt;input
          value={this.name}
          onInput={(e) =&gt; this.name.value = e.target.value}
        /&gt;
        &lt;button type="submit"&gt;提交&lt;/button&gt;
      &lt;/form&gt;
    );
  }
}</code></pre></less-code-block>

          <h2>SVG 支持</h2>
          <p>SVG 元素命名空间自动检测，通过 <code>createElementNS</code> 创建：</p>
          <less-code-block><pre><code>class IconElement extends DsdElement {
  render() {
    return (
      &lt;svg width="24" height="24" viewBox="0 0 24 24"&gt;
        &lt;circle cx="12" cy="12" r="10" fill="currentColor" /&gt;
      &lt;/svg&gt;
    );
  }
}</code></pre></less-code-block>

          <h2>Fragment</h2>
          <p><code>&lt;&gt;...&lt;/&gt;</code> 语法用于分组子元素，不产生额外的 DOM 包装节点：</p>
          <less-code-block><pre><code>render() {
  return (
    &lt;&gt;
      &lt;header&gt;标题&lt;/header&gt;
      &lt;main&gt;内容&lt;/main&gt;
    &lt;/&gt;
  );
}</code></pre></less-code-block>
          <p>CSR 中 Fragment 渲染为 <code>DocumentFragment</code>；SSR 中渲染为拼接的 HTML。</p>

          <h2>VNode 接口</h2>
          <p>VNode 是纯数据结构，不含虚拟 DOM diff 或运行时树：</p>
          <less-code-block><pre><code>interface VNode {
  tag: string | Function | symbol;   // HTML 标签、组件类或 Fragment
  props: Record&lt;string, unknown&gt;;    // 属性、事件处理器、ref
  children: (VNode | string)[];       // 子 VNode 或文本
  key?: string | number;              // 协调提示（预留）
  ref?: (el: Element) =&gt; void;        // DOM ref 回调
}</code></pre></less-code-block>

          <h2>SSR: renderToString()</h2>
          <p><code>renderToString(vnode)</code> 将 VNode 树转换为 HTML 字符串：</p>
          <ul>
            <li>事件处理器（<code>onClick</code> 等）被跳过</li>
            <li><code>ref</code> 回调被跳过</li>
            <li>文本内容进行 HTML 转义</li>
            <li>自闭合元素（<code>&lt;br&gt;</code>、<code>&lt;img&gt;</code> 等）正确处理</li>
            <li><code>className</code> → <code>class</code>，<code>htmlFor</code> → <code>for</code></li>
            <li><code>style</code> 对象序列化为内联 CSS 字符串</li>
          </ul>

          <h2>CSR: renderToDOM()</h2>
          <p><code>renderToDOM(vnode, signal?)</code> 将 VNode 树转换为真实 DOM 节点：</p>
          <ul>
            <li>事件处理器通过 <code>addEventListener(type, fn, { signal })</code> 绑定</li>
            <li><code>ref</code> 回调接收创建的 DOM 元素</li>
            <li><code>style</code> 对象赋值到 <code>element.style</code></li>
            <li>AbortSignal 确保元素断连时自动清理</li>
          </ul>

          <h2>与 TemplateResult 对比</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>VNode (v0.24.1)</th>
                <th>TemplateResult (已移除)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>创建方式</td>
                <td>构建时 JSX 转换</td>
                <td><code>html`...`</code> 标签模板</td>
              </tr>
              <tr>
                <td>类型检查</td>
                <td>TypeScript JSX IntrinsicElements</td>
                <td>无</td>
              </tr>
              <tr>
                <td>工具支持</td>
                <td>IDE 自动补全、语法高亮</td>
                <td>基础字符串高亮</td>
              </tr>
              <tr>
                <td>事件绑定</td>
                <td><code>onClick={fn}</code></td>
                <td><code>@click=${fn}</code></td>
              </tr>
              <tr>
                <td>信号追踪</td>
                <td><code>effect()</code> 自动追踪</td>
                <td><code>_subscribeTemplateSignals()</code></td>
              </tr>
              <tr>
                <td>SSR</td>
                <td><code>renderToString()</code></td>
                <td><code>renderTemplateToString()</code></td>
              </tr>
              <tr>
                <td>CSR</td>
                <td><code>renderToDOM()</code></td>
                <td><code>_patchBindings()</code></td>
              </tr>
              <tr>
                <td>接口</td>
                <td>5 字段冻结 VNode</td>
                <td>TemplateResult + values + markers</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/zh/guide/getting-started" class="nav-link">&larr; 快速开始</a>
            <a href="/zh/guide/static-props" class="nav-link">Static Props &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ZhJsxComponentsPage);

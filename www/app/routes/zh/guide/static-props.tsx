// deno-fmt-ignore-file
export const meta = { section: 'Guide', label: 'Static Props', order: 8 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export const tagName = 'zh-static-props-page';

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

export default class ZhStaticPropsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return `
      <less-layout
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterFrameworkNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/zh/guide/static-props"
      >
        <div class="container">
          <h1>Static Props</h1>
          <p class="subtitle">
            <code>static props</code> 是 ES2022 类字段，用于在 <code>DsdElement</code> 子类上
            声明响应式属性。它替代了 v0.24.1 中移除的 <code>@prop()</code> 装饰器（ADR-0057），
            提供相同的响应式语义，无需装饰器语法。
          </p>

          <less-callout type="info" label="设计决策">
            <code>static props</code> 使用标准 ES2022 类字段语法，无需 stage-3 装饰器提案。
            每个声明的属性自动成为信号驱动的响应式访问器，与 HTML 属性同步。
          </less-callout>

          <h2>基本用法</h2>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

class MyCounter extends DsdElement {
  static props = {
    count: Number,
    label: { type: String, default: '计数器', reflect: true },
  };

  render() {
    return &lt;div&gt;{this.label}: {this.count}&lt;/div&gt;;
  }
}

customElements.define('my-counter', MyCounter);</code></pre></less-code-block>

          <h2>PropDecl 形式</h2>

          <h3>简写形式</h3>
          <p>只传构造函数，使用类型默认值：</p>
          <less-code-block><pre><code>static props = {
  name: String,    // type: String,  default: '',      reflect: false
  count: Number,   // type: Number,  default: 0,        reflect: false
  active: Boolean, // type: Boolean, default: false,    reflect: false
  items: Array,    // type: Array,   default: [],       reflect: false
  config: Object,  // type: Object,  default: {},       reflect: false
};</code></pre></less-code-block>

          <h3>完整形式</h3>
          <p>对象声明可以控制 <code>default</code> 和 <code>reflect</code>：</p>
          <less-code-block><pre><code>static props = {
  count: {
    type: Number,
    default: 5,
    reflect: true,    // 属性写入 → HTML 属性
  },
  label: {
    type: String,
    default: 'Hello',
    reflect: false,
  },
  active: {
    type: Boolean,
    default: false,
    reflect: true,    // 属性存在性开关
  },
};</code></pre></less-code-block>

          <table>
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>type</code></td>
                <td>构造函数</td>
                <td><strong>必填</strong></td>
                <td>属性↔属性类型转换</td>
              </tr>
              <tr>
                <td><code>default</code></td>
                <td>对应类型实例</td>
                <td>类型零值</td>
                <td>无属性或自身属性时的初始值</td>
              </tr>
              <tr>
                <td><code>reflect</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td><code>true</code> 时属性写入会同步到 HTML 属性</td>
              </tr>
            </tbody>
          </table>

          <h2>支持的类型</h2>
          <table>
            <thead>
              <tr>
                <th>构造函数</th>
                <th>TS 属性类型</th>
                <th>HTML 属性 → 属性</th>
                <th>属性 → HTML 属性</th>
                <th>默认值</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>String</code></td>
                <td><code>string</code></td>
                <td><code>getAttribute()</code> 原值</td>
                <td><code>setAttribute(n, str)</code></td>
                <td><code>''</code></td>
              </tr>
              <tr>
                <td><code>Number</code></td>
                <td><code>number</code></td>
                <td><code>Number(attrVal)</code></td>
                <td><code>String(val)</code></td>
                <td><code>0</code></td>
              </tr>
              <tr>
                <td><code>Boolean</code></td>
                <td><code>boolean</code></td>
                <td><code>hasAttribute()</code> → <code>true</code></td>
                <td><code>setAttribute(n, '')</code> / <code>removeAttribute(n)</code></td>
                <td><code>false</code></td>
              </tr>
              <tr>
                <td><code>Array</code></td>
                <td><code>unknown[]</code></td>
                <td>不可序列化</td>
                <td>不可序列化</td>
                <td><code>[]</code></td>
              </tr>
              <tr>
                <td><code>Object</code></td>
                <td><code>Record&lt;string, unknown&gt;</code></td>
                <td>不可序列化</td>
                <td>不可序列化</td>
                <td><code>{}</code></td>
              </tr>
            </tbody>
          </table>

          <less-callout type="warning" label="注意">
            <code>Array</code> 和 <code>Object</code> 类型不可通过 HTML 属性序列化。
            它们适用于仅运行时使用的属性，通过 JS 属性或 SSR <code>injectProps()</code> 设置。
          </less-callout>

          <h2>TypeScript 工具类型</h2>

          <h3>PropType&lt;D&gt;</h3>
          <p>将 <code>PropDecl</code> 映射为运行时 TypeScript 类型：</p>
          <less-code-block><pre><code>import type { PropType } from '@lessjs/runtime';

type CountType = PropType&lt;NumberConstructor&gt;;          // number
type LabelType = PropType&lt;StringConstructor&gt;;          // string
type ActiveType = PropType&lt;BooleanConstructor&gt;;        // boolean</code></pre></less-code-block>

          <h3>PropsFrom&lt;P&gt;</h3>
          <p>将整个 <code>static props</code> 记录映射为带类型的属性：</p>
          <less-code-block><pre><code>import type { PropsFrom } from '@lessjs/runtime';

class MyCard extends DsdElement {
  static props = {
    title: String,
    count: Number,
    visible: Boolean,
  };

  // TypeScript 推断类型：
  declare title: string;
  declare count: number;
  declare visible: boolean;
}</code></pre></less-code-block>

          <h2>observedAttributes 自动生成</h2>
          <p>声明 <code>static props</code> 后，属性名会自动添加到 <code>observedAttributes</code>：</p>
          <less-code-block><pre><code>class MyCounter extends DsdElement {
  static props = { count: Number, label: String };
}

// 等效于:
// MyCounter.observedAttributes = ['count', 'label'];

// 如果类已有 observedAttributes，新属性名会被合并</code></pre></less-code-block>

          <h2>生命周期</h2>

          <h3>initializeStaticProps()</h3>
          <p>在 <code>connectedCallback()</code> 中调用。对每个声明的属性：</p>
          <ol>
            <li>读取类的 <code>static props</code> 记录</li>
            <li>创建 <code>PropSignal</code>（每属性的信号，含 <code>value</code>、<code>subscribe</code>、<code>valueOf</code>）</li>
            <li>通过 <code>Object.defineProperty</code> 在实例上安装 get/set 访问器</li>
            <li>若 <code>reflect: true</code>，订阅信号变化并回写 HTML 属性</li>
            <li>在 <code>observedAttributes</code> 中注册小写属性名</li>
          </ol>

          <h3>syncStaticPropsFromAttributes()</h3>
          <p>在 <code>initializeStaticProps()</code> 后立即调用。读取元素上已有的 HTML 属性，设置信号初始值。</p>

          <h3>disposeStaticProps()</h3>
          <p>在 <code>disconnectedCallback()</code> 中调用。清理所有信号订阅。</p>

          <h2>完整示例</h2>
          <less-code-block><pre><code>import { DsdElement, signal, computed } from '@lessjs/runtime';

class CounterElement extends DsdElement {
  static props = {
    initial: { type: Number, default: 0, reflect: true },
    step: { type: Number, default: 1 },
    label: { type: String, default: '计数' },
  };

  // 内部状态（不作为 prop — 无 HTML 属性）
  #count = signal(this.initial);

  get doubleCount() {
    return computed(() =&gt; this.#count.value * 2);
  }

  render() {
    return (
      &lt;div class="counter"&gt;
        &lt;span class="label"&gt;{this.label}: &lt;/span&gt;
        &lt;span class="value"&gt;{this.#count}&lt;/span&gt;
        &lt;span class="double"&gt;(×2 = {this.doubleCount})&lt;/span&gt;
        &lt;button onClick={() =&gt; this.#count.value += this.step}&gt;
          +{this.step}
        &lt;/button&gt;
        &lt;button onClick={() =&gt; this.#count.value -= this.step}&gt;
          -{this.step}
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('my-counter', CounterElement);</code></pre></less-code-block>

          <h2>信号自动解包</h2>
          <p>通过 <code>static props</code> 声明的属性返回 <code>PropSignal</code> 对象。JSX 表达式 <code>{}</code> 中自动解包：</p>
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
                <td>通过 <code>valueOf()</code> 自动解包 → number</td>
              </tr>
              <tr>
                <td><code>{this.count + 1}</code></td>
                <td>通过 <code>valueOf()</code> 自动解包</td>
              </tr>
              <tr>
                <td><code>&#96;&#36;{'{'}this.count{'}'}&#96;</code></td>
                <td>通过 <code>Symbol.toPrimitive('string')</code></td>
              </tr>
              <tr>
                <td><code>JSON.stringify(this.count)</code></td>
                <td>❌ 不解包 — 使用 <code>this.count.value</code></td>
              </tr>
              <tr>
                <td><code>typeof this.count</code></td>
                <td>返回 <code>"object"</code> — 使用 <code>typeof this.count.value</code></td>
              </tr>
            </tbody>
          </table>

          <h2>从 @prop() 迁移</h2>
          <table>
            <thead>
              <tr>
                <th>之前 (v0.23)</th>
                <th>之后 (v0.24.1)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>@prop({ type: String }) name</code></td>
                <td><code>static props = { name: String }</code></td>
              </tr>
              <tr>
                <td><code>@prop({ type: Number }) count</code></td>
                <td><code>static props = { count: Number }</code></td>
              </tr>
              <tr>
                <td><code>@prop({ type: Boolean }) active</code></td>
                <td><code>static props = { active: Boolean }</code></td>
              </tr>
              <tr>
                <td><code>@prop({ type: Number, reflect: true, default: 5 }) x</code></td>
                <td><code>static props = { x: { type: Number, default: 5, reflect: true } }</code></td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/zh/guide/jsx-components" class="nav-link">&larr; JSX 组件</a>
            <a href="/zh/guide/signal-reactivity" class="nav-link">Signal 响应式 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ZhStaticPropsPage);

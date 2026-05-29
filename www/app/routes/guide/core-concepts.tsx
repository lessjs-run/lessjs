export const meta = { section: 'Core', label: 'Core Concepts', order: 2 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { pageStyles } from '../../components/page-styles.js';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class CoreConceptsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(navSections)}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/core-concepts">
        <div class="container">
          <h1>核心概念</h1>
          <p class="subtitle">
            理解 LessJS 的三个核心构建块：组件模型 (DsdElement + JSX)、属性声明 (static props) 和响应式系统 (Signals)。
          </p>

          <h2>组件模型：DsdElement + JSX</h2>
          <p>
            LessJS 组件是原生 Web Components，继承自 <code>DsdElement</code>。JSX 提供带类型安全的模板语法，编译为 VNode 树，SSR 时输出 Declarative Shadow DOM。
          </p>
          <less-code-block><pre><code>import { DsdElement, signal } from '@lessjs/runtime';

export class GreetingCard extends DsdElement {
  #name = signal('LessJS');

  override render() {
    return (
      &lt;div class="card"&gt;
        &lt;h2&gt;Hello, {this.#name}!&lt;/h2&gt;
        &lt;p&gt;Welcome to the framework.&lt;/p&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('greeting-card', GreetingCard);</code></pre></less-code-block>
          <p>关键点：</p>
          <ul>
            <li>组件继承 <code>DsdElement</code>，覆写 <code>render()</code> 方法</li>
            <li>JSX 中 <code>{...}</code> 内的 Signal 自动展开，不需要 <code>.value</code></li>
            <li>事件绑定使用标准 camelCase：<code>onClick</code>、<code>onInput</code>、<code>onSubmit</code></li>
          </ul>

          <less-callout type="info" label="为什么用 JSX？">
            JSX 提供完整的 TypeScript 类型检查、IDE 自动补全、语法高亮和 AI 工具兼容性。
            它替代了旧的 <code>html\`...\`</code> tagged template DSL，编译为 VNode 对象，无需运行时模板解析器。
          </less-callout>

          <h3>条件渲染</h3>
          <less-code-block><pre><code>// 三元表达式
{isLoggedIn ? &lt;Dashboard /&gt; : &lt;Login /&gt;}

// 逻辑与
{error && &lt;ErrorBanner message={error} /&gt;}

// 空值合并
{username ?? 'Anonymous'}</code></pre></less-code-block>

          <h3>列表渲染</h3>
          <less-code-block><pre><code>const todos = signal([
  { id: 1, text: 'Learn LessJS', done: false },
  { id: 2, text: 'Build an app', done: false },
]);

return (
  &lt;ul&gt;
    {todos.value.map(todo => (
      &lt;li key={todo.id}&gt;
        &lt;input type="checkbox" checked={todo.done} /&gt;
        {todo.text}
      &lt;/li&gt;
    ))}
  &lt;/ul&gt;
);</code></pre></less-code-block>

          <h2>属性声明：static props</h2>
          <p>
            使用 <code>static props</code> 声明组件属性，自动注册为 <code>observedAttributes</code>。
            属性名自动转换为 kebab-case 作为 HTML 属性名。
          </p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class ProductCard extends DsdElement {
  static props = {
    title: String,
    price: Number,
    inStock: Boolean,
  };

  override render() {
    return (
      &lt;div class="product-card"&gt;
        &lt;h3&gt;{this.title}&lt;/h3&gt;
        &lt;p&gt;${this.price.toFixed(2)}&lt;/p&gt;
        {this.inStock
          ? &lt;span class="in-stock"&gt;有货&lt;/span&gt;
          : &lt;span class="out-of-stock"&gt;缺货&lt;/span&gt;
        }
      &lt;/div&gt;
    );
  }
}

customElements.define('product-card', ProductCard);</code></pre></less-code-block>
          <p>使用方法：</p>
          <less-code-block><pre><code>&lt;product-card title="Widget" price="19.99" in-stock&gt;&lt;/product-card&gt;
&lt;product-card title="Gadget" price="29.99"&gt;&lt;/product-card&gt;</code></pre></less-code-block>

          <table>
            <thead><tr><th>类型</th><th>属性值</th><th>HTML 属性规则</th></tr></thead>
            <tbody>
              <tr><td><code>String</code></td><td>原始属性字符串</td><td>直接传递</td></tr>
              <tr><td><code>Number</code></td><td>通过 <code>Number()</code> 解析</td><td>属性字符串存在即解析</td></tr>
              <tr><td><code>Boolean</code></td><td>属性存在即为 <code>true</code></td><td>符合 HTML 布尔属性约定</td></tr>
            </tbody>
          </table>

          <h2>响应式系统：Signals</h2>
          <p>
            受 SolidJS 和 Preact Signals 启发的细粒度响应式系统。Signal 变化时，只有精确读到该 Signal 的 DOM 节点会更新。
          </p>

          <h3>signal() — 可变的响应式值</h3>
          <less-code-block><pre><code>import { signal } from '@lessjs/runtime';

const count = signal(0);

// 读取
console.log(count.value);  // 0

// 写入
count.value = 1;
count.value++;</code></pre></less-code-block>

          <less-callout type="warning" label="JSX 外部使用 .value">
            在 JSX <code>{...}</code> 之外读写 Signal 时，必须使用 <code>.value</code>。
            JSX 内的自动展开是通过 <code>Symbol.toPrimitive</code> 和 <code>valueOf()</code> 实现的。
          </less-callout>

          <h3>computed() — 派生状态</h3>
          <p>从其他 Signal 派生只读值，自动追踪依赖并惰性求值：</p>
          <less-code-block><pre><code>import { signal, computed } from '@lessjs/runtime';

const firstName = signal('Jane');
const lastName = signal('Doe');
const fullName = computed(() => firstName.value + ' ' + lastName.value);

console.log(fullName.value);  // 'Jane Doe'
firstName.value = 'John';
console.log(fullName.value);  // 'John Doe'（自动更新）</code></pre></less-code-block>

          <h3>effect() — 副作用</h3>
          <p>Signal 变化时自动执行回调，用于 DOM 操作、日志、同步外部状态等：</p>
          <less-code-block><pre><code>import { signal, effect } from '@lessjs/runtime';

const theme = signal('light');
const dispose = effect(() => {
  document.documentElement.setAttribute('data-theme', theme.value);
});

theme.value = 'dark';  // effect 自动执行
dispose();  // 停止追踪</code></pre></less-code-block>

          <h2>完整示例：计数器</h2>
          <p>结合 DsdElement、static props 和 Signals 的完整组件：</p>
          <less-code-block><pre><code>import { DsdElement, signal, computed } from '@lessjs/runtime';

export class Counter extends DsdElement {
  static props = {
    step: Number,
    label: String,
  };

  #count = signal(0);
  #step = computed(() => this.step ?? 1);
  #isEven = computed(() => this.#count.value % 2 === 0);

  override render() {
    return (
      &lt;div class="counter"&gt;
        &lt;h3&gt;{this.label ?? '计数器'}&lt;/h3&gt;
        &lt;p class="count" data-even={this.#isEven}&gt;
          {this.#count}
        &lt;/p&gt;
        &lt;div class="controls"&gt;
          &lt;button onClick={() => this.#count.value -= this.#step.value}&gt;
            -{this.#step}
          &lt;/button&gt;
          &lt;button onClick={() => this.#count.value += this.#step.value}&gt;
            +{this.#step}
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;button class="reset" onClick={() => this.#count.value = 0}&gt;
          重置
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('my-counter', Counter);</code></pre></less-code-block>
          <p>使用方式：</p>
          <less-code-block><pre><code>&lt;my-counter step="2" label="步进计数器"&gt;&lt;/my-counter&gt;</code></pre></less-code-block>

          <h2>最佳实践</h2>
          <ul>
            <li><strong>保持 Signal 细粒度</strong> — 多个小 Signal 优于一个大状态对象，减少重渲染范围</li>
            <li><strong>用 computed 处理派生数据</strong> — 避免重复计算，computed 自动缓存</li>
            <li><strong>不可变更新</strong> — 修改数组或对象时赋新引用（<code>.map()</code>、展开语法）才触发响应</li>
            <li><strong>避免在 render() 中创建 effect</strong> — effect 放在 <code>connectedCallback()</code> 或构造函数</li>
            <li><strong>清理自定义 effect</strong> — 在 <code>disconnectedCallback()</code> 中 dispose</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; 快速开始</a>
            <a href="/guide/routing-and-data" class="nav-link">路由与数据 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(navSections)}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/core-concepts">
        <div class="container">
          <h1>Core Concepts</h1>
          <p class="subtitle">
            Understand the three core building blocks of LessJS: the Component Model (DsdElement + JSX),
            Property Declaration (static props), and the Reactivity System (Signals).
          </p>

          <h2>Component Model: DsdElement + JSX</h2>
          <p>
            LessJS components are native Web Components extending <code>DsdElement</code>. JSX provides
            type-safe templates that compile to VNode trees, outputting Declarative Shadow DOM during SSR.
          </p>
          <less-code-block><pre><code>import { DsdElement, signal } from '@lessjs/runtime';

export class GreetingCard extends DsdElement {
  #name = signal('LessJS');

  override render() {
    return (
      &lt;div class="card"&gt;
        &lt;h2&gt;Hello, {this.#name}!&lt;/h2&gt;
        &lt;p&gt;Welcome to the framework.&lt;/p&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('greeting-card', GreetingCard);</code></pre></less-code-block>
          <p>Key points:</p>
          <ul>
            <li>Components extend <code>DsdElement</code> and override <code>render()</code></li>
            <li>Signals auto-unwrap inside JSX <code>{...}</code> — no <code>.value</code> needed</li>
            <li>Events use standard camelCase: <code>onClick</code>, <code>onInput</code>, <code>onSubmit</code></li>
          </ul>

          <less-callout type="info" label="Why JSX?">
            JSX provides full TypeScript type-checking, IDE autocompletion, syntax highlighting, and AI
            tool compatibility. It replaces the old <code>html\`...\`</code> tagged template DSL and
            compiles to VNode objects — no runtime template parser needed.
          </less-callout>

          <h3>Conditional Rendering</h3>
          <less-code-block><pre><code>// Ternary
{isLoggedIn ? &lt;Dashboard /&gt; : &lt;Login /&gt;}

// Logical AND
{error && &lt;ErrorBanner message={error} /&gt;}

// Null coalescing
{username ?? 'Anonymous'}</code></pre></less-code-block>

          <h3>List Rendering</h3>
          <less-code-block><pre><code>const todos = signal([
  { id: 1, text: 'Learn LessJS', done: false },
  { id: 2, text: 'Build an app', done: false },
]);

return (
  &lt;ul&gt;
    {todos.value.map(todo => (
      &lt;li key={todo.id}&gt;
        &lt;input type="checkbox" checked={todo.done} /&gt;
        {todo.text}
      &lt;/li&gt;
    ))}
  &lt;/ul&gt;
);</code></pre></less-code-block>

          <h2>Property Declaration: static props</h2>
          <p>
            Declare component properties using <code>static props</code>. Keys are auto-registered as
            <code>observedAttributes</code> and converted to kebab-case for HTML attributes.
          </p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class ProductCard extends DsdElement {
  static props = {
    title: String,
    price: Number,
    inStock: Boolean,
  };

  override render() {
    return (
      &lt;div class="product-card"&gt;
        &lt;h3&gt;{this.title}&lt;/h3&gt;
        &lt;p&gt;${this.price.toFixed(2)}&lt;/p&gt;
        {this.inStock
          ? &lt;span class="in-stock"&gt;In Stock&lt;/span&gt;
          : &lt;span class="out-of-stock"&gt;Out of Stock&lt;/span&gt;
        }
      &lt;/div&gt;
    );
  }
}

customElements.define('product-card', ProductCard);</code></pre></less-code-block>
          <p>Usage:</p>
          <less-code-block><pre><code>&lt;product-card title="Widget" price="19.99" in-stock&gt;&lt;/product-card&gt;
&lt;product-card title="Gadget" price="29.99"&gt;&lt;/product-card&gt;</code></pre></less-code-block>

          <table>
            <thead><tr><th>Type</th><th>Property Value</th><th>HTML Attribute Rule</th></tr></thead>
            <tbody>
              <tr><td><code>String</code></td><td>Raw attribute string</td><td>Passed directly</td></tr>
              <tr><td><code>Number</code></td><td>Parsed via <code>Number()</code></td><td>Attribute presence triggers parse</td></tr>
              <tr><td><code>Boolean</code></td><td><code>true</code> if attribute present</td><td>Follows HTML boolean attribute convention</td></tr>
            </tbody>
          </table>

          <h2>Reactivity System: Signals</h2>
          <p>
            Fine-grained reactivity inspired by SolidJS and Preact Signals. When a signal changes, only
            the exact DOM nodes that read that signal are updated.
          </p>

          <h3>signal() — Mutable Reactive Values</h3>
          <less-code-block><pre><code>import { signal } from '@lessjs/runtime';

const count = signal(0);

// Read
console.log(count.value);  // 0

// Write
count.value = 1;
count.value++;</code></pre></less-code-block>

          <less-callout type="warning" label="Use .value Outside JSX">
            When reading or writing a signal outside JSX <code>{...}</code>, you must use <code>.value</code>.
            Auto-unwrap inside JSX is provided by <code>Symbol.toPrimitive</code> and <code>valueOf()</code>.
          </less-callout>

          <h3>computed() — Derived State</h3>
          <p>Derived read-only values that auto-track dependencies and evaluate lazily:</p>
          <less-code-block><pre><code>import { signal, computed } from '@lessjs/runtime';

const firstName = signal('Jane');
const lastName = signal('Doe');
const fullName = computed(() => firstName.value + ' ' + lastName.value);

console.log(fullName.value);  // 'Jane Doe'
firstName.value = 'John';
console.log(fullName.value);  // 'John Doe' (auto-updated)</code></pre></less-code-block>

          <h3>effect() — Side Effects</h3>
          <p>Run a callback automatically when tracked signals change. Use for DOM manipulation, logging, external sync:</p>
          <less-code-block><pre><code>import { signal, effect } from '@lessjs/runtime';

const theme = signal('light');
const dispose = effect(() => {
  document.documentElement.setAttribute('data-theme', theme.value);
});

theme.value = 'dark';  // effect runs automatically
dispose();  // stop tracking</code></pre></less-code-block>

          <h2>Complete Example: Counter</h2>
          <p>A component combining DsdElement, static props, and Signals:</p>
          <less-code-block><pre><code>import { DsdElement, signal, computed } from '@lessjs/runtime';

export class Counter extends DsdElement {
  static props = {
    step: Number,
    label: String,
  };

  #count = signal(0);
  #step = computed(() => this.step ?? 1);
  #isEven = computed(() => this.#count.value % 2 === 0);

  override render() {
    return (
      &lt;div class="counter"&gt;
        &lt;h3&gt;{this.label ?? 'Counter'}&lt;/h3&gt;
        &lt;p class="count" data-even={this.#isEven}&gt;
          {this.#count}
        &lt;/p&gt;
        &lt;div class="controls"&gt;
          &lt;button onClick={() => this.#count.value -= this.#step.value}&gt;
            -{this.#step}
          &lt;/button&gt;
          &lt;button onClick={() => this.#count.value += this.#step.value}&gt;
            +{this.#step}
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;button class="reset" onClick={() => this.#count.value = 0}&gt;
          Reset
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
}

customElements.define('my-counter', Counter);</code></pre></less-code-block>
          <p>Usage:</p>
          <less-code-block><pre><code>&lt;my-counter step="2" label="Stepped Counter"&gt;&lt;/my-counter&gt;</code></pre></less-code-block>

          <h2>Best Practices</h2>
          <ul>
            <li><strong>Keep signals granular</strong> — many small signals over one large state object. Minimizes re-render scope.</li>
            <li><strong>Use computed for derived data</strong> — avoid duplication. Computed values are memoized.</li>
            <li><strong>Immutable updates</strong> — assign new references (<code>.map()</code>, spread syntax) to trigger reactivity.</li>
            <li><strong>Avoid effects in render()</strong> — place effects in <code>connectedCallback()</code> or constructor.</li>
            <li><strong>Dispose custom effects</strong> — call dispose in <code>disconnectedCallback()</code>.</li>
          </ul>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/guide/routing-and-data" class="nav-link">Routing &amp; Data &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-core-concepts', CoreConceptsPage);
export default CoreConceptsPage;
export const tagName = 'page-core-concepts';

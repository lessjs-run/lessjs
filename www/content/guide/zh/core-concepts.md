---
title: '核心概念'
section: 'Core'
label: 'Core Concepts'
order: 2
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/guide/core-concepts">

          <h1>核心概念</h1>
          <p class="subtitle">
            理解 LessJS 的三个核心构建块：组件模型 (DsdElement + JSX)、属性声明 (static props) 和响应式系统 (Signals)。
          </p>

          <h2>组件模型：DsdElement + JSX</h2>
          <p>
            LessJS 组件是原生 Web Components，继承自 <code>DsdElement</code>。JSX 提供带类型安全的模板语法，编译为 VNode 树，SSR 时输出 Declarative Shadow DOM。
          </p>
          <open-code-block><pre><code>import  from '@openelement/core';

export class GreetingCard extends DsdElement !&lt;/h2&gt;
&lt;p&gt;Welcome to the framework.&lt;/p&gt;
&lt;/div&gt;
);
}
}

customElements.define('greeting-card', GreetingCard);</code></pre></open-code-block>

<p>关键点：</p>
<ul>
<li>组件继承 <code>DsdElement</code>，覆写 <code>render()</code> 方法</li>
<li>JSX 中 <code></code> 内的 Signal 自动展开，不需要 <code>.value</code></li>
<li>事件绑定使用标准 camelCase：<code>onClick</code>、<code>onInput</code>、<code>onSubmit</code></li>
</ul>

          <open-callout type="info" label="为什么用 JSX？">
            JSX 提供完整的 TypeScript 类型检查、IDE 自动补全、语法高亮和 AI 工具兼容性。
            它替代了旧的 <code>html\`...\`</code> tagged template DSL，编译为 VNode 对象，无需运行时模板解析器。
          </open-callout>

          <h3>条件渲染</h3>
          <open-code-block><pre><code>// 三元表达式

// 逻辑与
/&gt;}

// 空值合并
</code></pre></open-code-block>

    <h3>列表渲染</h3>
    <open-code-block><pre><code>const todos = signal([

,
,
]);

return (
&lt;ul&gt;
&gt;
&lt;input type="checkbox" checked= /&gt;

      &lt;/li&gt;
    ))}

&lt;/ul&gt;
);</code></pre></open-code-block>

    <h2>属性声明：static props</h2>
    <p>
      使用 <code>static props</code> 声明组件属性，自动注册为 <code>observedAttributes</code>。
      属性名自动转换为 kebab-case 作为 HTML 属性名。
    </p>
    <open-code-block><pre><code>import  from '@openelement/core';

export class ProductCard extends DsdElement ;

override render() &lt;/h3&gt;
&lt;p&gt;$&lt;/p&gt;

      &lt;/div&gt;
    );

}
}

customElements.define('product-card', ProductCard);</code></pre></open-code-block>

<p>使用方法：</p>
<open-code-block><pre><code>&lt;product-card title="Widget" price="19.99" in-stock&gt;&lt;/product-card&gt;
&lt;product-card title="Gadget" price="29.99"&gt;&lt;/product-card&gt;</code></pre></open-code-block>

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
          <open-code-block><pre><code>import  from '@openelement/core';

const count = signal(0);

// 读取
console.log(count.value); // 0

// 写入
count.value = 1;
count.value++;</code></pre></open-code-block>

          <open-callout type="warning" label="JSX 外部使用 .value">
            在 JSX <code></code> 之外读写 Signal 时，必须使用 <code>.value</code>。
            JSX 内的自动展开是通过 <code>Symbol.toPrimitive</code> 和 <code>valueOf()</code> 实现的。
          </open-callout>

          <h3>computed() — 派生状态</h3>
          <p>从其他 Signal 派生只读值，自动追踪依赖并惰性求值：</p>
          <open-code-block><pre><code>import  from '@openelement/core';

const firstName = signal('Jane');
const lastName = signal('Doe');
const fullName = computed(() => firstName.value + ' ' + lastName.value);

console.log(fullName.value); // 'Jane Doe'
firstName.value = 'John';
console.log(fullName.value); // 'John Doe'（自动更新）</code></pre></open-code-block>

    <h3>effect() — 副作用</h3>
    <p>Signal 变化时自动执行回调，用于 DOM 操作、日志、同步外部状态等：</p>
    <open-code-block><pre><code>import  from '@openelement/core';

const theme = signal('light');
const dispose = effect(() => );

theme.value = 'dark'; // effect 自动执行
dispose(); // 停止追踪</code></pre></open-code-block>

    <h2>完整示例：计数器</h2>
    <p>结合 DsdElement、static props 和 Signals 的完整组件：</p>
    <open-code-block><pre><code>import  from '@openelement/core';

export class Counter extends DsdElement ;

#count = signal(0);
#step = computed(() => this.step ?? 1);
#isEven = computed(() => this.#count.value % 2 === 0);

override render() &lt;/h3&gt;
&lt;p class="count" data-even=&gt;

        &lt;/p&gt;
        &lt;div class="controls"&gt;
          &lt;button onClick=&gt;
            -
          &lt;/button&gt;
          &lt;button onClick=&gt;
            +
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;button class="reset" onClick=&gt;
          重置
        &lt;/button&gt;
      &lt;/div&gt;
    );

}
}

customElements.define('my-counter', Counter);</code></pre></open-code-block>

<p>使用方式：</p>
<open-code-block><pre><code>&lt;my-counter step="2" label="步进计数器"&gt;&lt;/my-counter&gt;</code></pre></open-code-block>

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

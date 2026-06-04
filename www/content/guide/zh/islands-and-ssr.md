---
title: 'Islands 与 SSR'
section: 'Core'
label: 'Islands & SSR'
order: 4
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/guide/islands-and-ssr">

          <h1>Islands 与 SSR</h1>
          <p class="subtitle">
            LessJS 的 Ocean/Island 模型：服务端通过 DSD 预渲染内容，客户端按需升级交互组件。
          </p>

          <h2>Ocean/Island 模式</h2>
          <p>
            "海洋"是纯静态内容（布局、文本、导航），"岛屿"是需要客户端交互的组件。
            这种架构的核心思想：大部分页面不需要 JavaScript，只有少数交互点需要。
          </p>
          <div class="comparison" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--size-4);margin:var(--size-4) 0 var(--size-6)">
            <div style="padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2)">
              <h3>传统 SPA</h3>
              <ul>
                <li>JavaScript 加载前页面空白</li>
                <li>整页 hydration 消耗资源</li>
                <li>内容和交互绑定</li>
              </ul>
            </div>
            <div style="padding:var(--size-4);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface);border-left:3px solid var(--brand)">
              <h3>LessJS Islands</h3>
              <ul>
                <li>内容通过 SSG + DSD 预渲染</li>
                <li>只有需要的组件加载 JS</li>
                <li>内容与交互解耦</li>
              </ul>
            </div>
          </div>

          <h2>DSD 渲染</h2>
          <p>
            Declarative Shadow DOM 让服务端渲染的 Web Components 在 HTML 解析阶段就有 shadow root。
            用户看到内容的那一刻，不需要任何 JavaScript。
          </p>
          <open-code-block><pre><code>&lt;my-card&gt;

&lt;template shadowrootmode="open"&gt;
&lt;style&gt;:host &lt;/style&gt;
&lt;p&gt;内容在 JavaScript 加载前即可见。&lt;/p&gt;
&lt;/template&gt;
&lt;/my-card&gt;</code></pre></open-code-block>

          <h2>三层组件模型</h2>
          <table>
            <thead><tr><th>层级</th><th>类型</th><th>客户端 JS</th><th>适用场景</th></tr></thead>
            <tbody>
              <tr><td>Layer 1</td><td>DSD Static</td><td>无</td><td>布局、导航、文章内容</td></tr>
              <tr><td>Layer 2</td><td>DSD Interactive</td><td>仅事件绑定</td><td>主题切换、折叠面板、tabs</td></tr>
              <tr><td>Layer 3</td><td>Pure Island</td><td>完整客户端逻辑</td><td>图表、复杂表单、WebSocket</td></tr>
            </tbody>
          </table>

          <h2>Hydration 策略</h2>
          <p>
            通过 <code>defineIsland()</code> API 声明 island，支持四种 hydration 策略：
          </p>
          <open-code-block><pre><code>import  from '@openelement/core';

export class MyChart extends DsdElement

// 立即加载（适合首屏交互元素）
defineIsland(MyChart, );

// 浏览器空闲时加载（适合非关键 UI）
defineIsland(MyChart, );

// 进入视口时加载（适合懒加载内容）
defineIsland(MyChart, );

// 纯客户端渲染（无 DSD，无 SSR）
defineIsland(MyChart, );</code></pre></open-code-block>

          <table>
            <thead><tr><th>策略</th><th>触发条件</th><th>推荐用途</th></tr></thead>
            <tbody>
              <tr><td><code>load</code></td><td>模块加载时</td><td>首屏交互：导航菜单、搜索框</td></tr>
              <tr><td><code>idle</code></td><td>requestIdleCallback</td><td>非关键 UI：页脚组件</td></tr>
              <tr><td><code>visible</code></td><td>IntersectionObserver</td><td>懒加载：图片画廊、评论区</td></tr>
              <tr><td><code>only</code></td><td>纯客户端</td><td>浏览器专用：图表库、地图</td></tr>
            </tbody>
          </table>

          <h2>创建 Island</h2>
          <p>将需要客户端行为的组件放在 <code>app/islands/</code> 目录：</p>
          <open-code-block><pre><code>// app/islands/counter.ts

import from '@openelement/core';

export class Counter extends DsdElement &gt;-&lt;/button&gt;
&lt;span&gt;&lt;/span&gt;
&lt;button onClick=&gt;+&lt;/button&gt;
&lt;/div&gt;
);
}
}

customElements.define('my-counter', Counter);</code></pre></open-code-block>

<p>在页面中使用：</p>
<open-code-block><pre><code>&lt;my-counter&gt;&lt;/my-counter&gt;</code></pre></open-code-block>
<p>
构建器会自动扫描 <code>app/islands/</code>，生成 client entry，并注入到静态 HTML 中。
页面 HTML 先渲染，浏览器加载 island entry 后再升级组件。
</p>

          <h2>SSR vs CSR 行为对比</h2>
          <table>
            <thead><tr><th>方面</th><th>SSR（服务端渲染）</th><th>CSR（客户端渲染）</th></tr></thead>
            <tbody>
              <tr><td>渲染输出</td><td>DSD HTML 字符串</td><td>shadow root 中的真实 DOM</td></tr>
              <tr><td>Signal 订阅</td><td>渲染期间收集、序列化</td><td>活跃状态，变化时更新 DOM</td></tr>
              <tr><td>事件处理</td><td>序列化等待 hydration</td><td>通过 addEventListener 直接绑定</td></tr>
              <tr><td>effect()</td><td>执行一次，捕获输出</td><td>持续执行</td></tr>
              <tr><td>ref</td><td>静默跳过</td><td>回调被调用</td></tr>
            </tbody>
          </table>

          <open-callout type="info" label="Upgrade, Not Hydration">
            LessJS 使用 Island Upgrade 而非传统 hydration。浏览器解析 HTML 时 DSD 已经填充内容，
            客户端 entry 调用 <code>customElements.define()</code> 升级已有元素为真正的 Custom Element。
          </open-callout>

          <div class="nav-row">
            <a href="/guide/routing-and-data" class="nav-link">&larr; 路由与数据</a>
            <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
          </div>

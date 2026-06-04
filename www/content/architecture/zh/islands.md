---
title: 'Island Upgrade'
section: 'Principles'
label: 'Island Upgrade'
order: 40
---

<open-layout
        locale="$"
        locales='$'
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/islands"
      >

    <h1>Island Upgrade</h1>
    <p class="subtitle">
      LessJS 的 island 是 DSD HTML 之后的 Custom Element upgrade。它不是整页
      hydration，也不是把应用状态完整恢复到客户端。
    </p>
    <h2>为什么需要 Island</h2>
    <div class="comparison">
      <div class="comparison-item">
        <h3>传统 SPA 的代价</h3>
        <ul>
          <li>内容和交互都依赖客户端 JavaScript。</li>
          <li>首屏、SEO 和 no-JS fallback 需要额外处理。</li>
          <li>组件模型通常绑定专有 runtime。</li>
        </ul>
      </div>
      <div class="comparison-item less">
        <h3>LessJS Island Model</h3>
        <ul>
          <li>内容先由 SSG + DSD 输出。</li>
          <li>只有真正需要交互的组件才加载客户端模块。</li>
          <li>升级后再绑定事件、本地状态和浏览器 API。</li>
        </ul>
      </div>
    </div>
    <h2>Upgrade, Not Hydration</h2>
    <p>
      浏览器解析 HTML 时，Declarative Shadow DOM 已经把组件内容和样式放进 shadow root。客户端 entry
      加载后调用 <span class="inline-code"
      >customElements.define()</span>，浏览器把已有元素升级为真正的 Custom
      Element。这个过程更准确地叫 <strong>Island Upgrade</strong>。
    </p>
    <h2>何时创建 Island</h2>
    <table>
      <thead>
        <tr>
          <th>场景</th>
          <th>推荐方式</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>可读内容、导航、布局</td>
          <td>HTML + DSD</td>
        </tr>
        <tr>
          <td>Hover、focus、响应式状态、简单展开</td>
          <td>CSS 和原生 HTML 元素</td>
        </tr>
        <tr>
          <td>剪贴板、localStorage、IntersectionObserver</td>
          <td>使用浏览器 API 的小型 island</td>
        </tr>
        <tr>
          <td>本地状态、事件编排、API 轮询、乐观 UI</td>
          <td>Island Upgrade</td>
        </tr>
      </tbody>
    </table>
    <h2>创建本地 Island</h2>
    <p>
      本地 island 放在 <span class="inline-code">app/islands</span>。构建器会扫描它，生成 client
      entry，并在静态 HTML 中注入 entry script。
    </p>
    <open-code-block><pre><code>// app/islands/my-counter.ts

import from '@openelement/runtime';

export const tagName = 'my-counter';

const sheet = new StyleSheet();
sheet.replaceSync(':host ');

export default class MyCounter extends DsdElement &gt;-&lt;/button&gt;
&lt;span&gt;\$&lt;/span&gt;
&lt;button @click=\$&gt;+&lt;/button&gt;
\

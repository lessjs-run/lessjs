import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class IslandsGuidePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .comparison-item {
        padding: 1rem 1.25rem;
        border: 0.5px solid var(--kiss-border);
        border-radius: 3px;
      }
      .comparison-item ul {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.875rem;
        color: var(--kiss-text-secondary);
      }
      .comparison-item li {
        margin-bottom: 0.25rem;
      }
      .comparison-item.kiss {
        background: var(--kiss-bg-surface);
      }
      .decision-tree {
        padding: 1rem;
        background: var(--kiss-bg-surface);
        border-left: 3px solid var(--kiss-border-hover);
        border-radius: 0 3px 3px 0;
        margin: 0.75rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--kiss-text-secondary);
        font-family: "SF Mono", "Fira Code", monospace;
        white-space: pre-wrap;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/islands">
        <div class="container">
          <h1>Islands</h1>
          <p class="subtitle">
            KISS 的 island 是 DSD 后的 Custom Element upgrade，不是整页 hydration。
          </p>

          <h2>为什么需要 Islands？</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>传统 SPA</h3>
              <ul>
                <li>页面内容和交互都依赖客户端 JavaScript。</li>
                <li>首屏、SEO、无 JS fallback 都需要额外处理。</li>
                <li>组件模型通常绑定某个框架 runtime。</li>
              </ul>
            </div>
            <div class="comparison-item kiss">
              <h3>KISS Islands</h3>
              <ul>
                <li>内容先由 SSG + DSD 输出。</li>
                <li>只有需要交互的 Web Component 加载客户端 JS。</li>
                <li>升级后绑定事件、状态和平台 API。</li>
              </ul>
            </div>
          </div>

          <h2>术语：Upgrade，不是传统 Hydration</h2>
          <p>
            浏览器解析 HTML 时，DSD 已经创建 Shadow DOM。客户端脚本加载后，
            <span class="inline-code">customElements.define()</span> 让元素升级，
            组件接管事件和状态。这个过程更准确地叫
            <strong>Island Upgrade</strong>。
          </p>
          <p>
            历史文档中出现的 hydration 多数指旧 Lit SSR 路线。v0.5 之后，
            用户文档统一使用 upgrade，只有 changelog 会保留历史语境。
          </p>

          <h2>渐进增强层级</h2>
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>技术</th>
                <th>适用场景</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>L0</td>
                <td>HTML + DSD</td>
                <td>内容、导航、文档、博客、营销页。</td>
              </tr>
              <tr>
                <td>L1</td>
                <td>CSS</td>
                <td>hover、focus、details/summary、响应式和基础动画。</td>
              </tr>
              <tr>
                <td>L2</td>
                <td>Web APIs</td>
                <td>Clipboard、IntersectionObserver、localStorage、BroadcastChannel。</td>
              </tr>
              <tr>
                <td>L3</td>
                <td>Island Upgrade</td>
                <td>计数器、表单增强、复制按钮、主题切换、API 消费组件。</td>
              </tr>
            </tbody>
          </table>

          <h2>Island 决策树</h2>
          <div class="decision-tree">需要交互？
├─ 仅内容或导航？       → HTML + DSD
├─ 仅视觉状态？         → CSS
├─ 浏览器已有能力？     → Web API
└─ 需要组件状态/事件？  → Island Upgrade

示例：
  - 文档导航高亮：aria-current + CSS
  - 代码复制按钮：Island + Clipboard API
  - 主题切换：Island + localStorage + BroadcastChannel
  - API 状态卡片：Island + fetch + AbortController</div>

          <h2>当前工作方式</h2>
          <p>
            构建阶段会扫描 <span class="inline-code">app/islands/</span>
            和配置的 package islands，生成客户端入口。SSG 阶段输出 DSD HTML，
            最后把客户端入口注入到静态 HTML 中。
          </p>
          <p>
            当前实现仍是全局 island entry 为主。v0.7.0 的目标是页面级 island manifest，
            让每个页面只加载实际出现的 islands。v0.6 会先收紧 DSD renderer 的安全契约、
            nested DSD 和错误定位，再推进这些真实可测的 upgrade 策略。
          </p>

          <h2>创建 Island</h2>
          <code-block><pre><code>// app/islands/my-counter.ts
import { css, html, LitElement } from 'lit';

export const tagName = 'my-counter';

export default class MyCounter extends LitElement {
  static override styles = css\`
    :host { display: inline-flex; gap: 0.5rem; align-items: center; }
  \`;

  static override properties = { count: { type: Number } };
  count = 0;

  override render() {
    return html\`
      &lt;button @click=\${() => this.count--}&gt;-&lt;/button&gt;
      &lt;span&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${() => this.count++}&gt;+&lt;/button&gt;
    \`;
  }
}

customElements.define(tagName, MyCounter);</code></pre></code-block>

          <h2>Package Islands</h2>
          <p>
            可复用组件包可以导出 <span class="inline-code">islands</span> 数组。
            KISS 会在构建时读取这些元数据，用于 SSR 注册和客户端入口生成。
          </p>
          <code-block><pre><code>// package index.ts
import type { PackageIslandMeta } from '@kissjs/core';

export const islands: PackageIslandMeta[] = [
  {
    tagName: 'kiss-theme-toggle',
    modulePath: '@kissjs/ui/kiss-theme-toggle',
    strategy: 'eager',
  },
];</code></pre></code-block>

          <h2>策略字段</h2>
          <table>
            <thead>
              <tr>
                <th>字段</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>tagName</code></td>
                <td>自定义元素标签名，必须包含连字符。</td>
              </tr>
              <tr>
                <td><code>modulePath</code></td>
                <td>客户端和 SSR 入口可 import 的模块路径。</td>
              </tr>
              <tr>
                <td><code>strategy</code></td>
                <td>
                  未来真实可测的 upgrade 策略。当前实现以全局 client entry 为主；
                  v0.7.0 会把 eager / idle / visible 从路线图推进到浏览器测试覆盖。
                </td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/routing" class="nav-link">&larr; 路由</a>
            <a href="/guide/api-routes" class="nav-link">API Routes &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-islands-guide', IslandsGuidePage);
export default IslandsGuidePage;
export const tagName = 'page-islands-guide';

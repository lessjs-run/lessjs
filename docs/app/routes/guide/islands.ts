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
        border-radius: 4px;
      }

      .comparison-item.kiss {
        background: var(--kiss-bg-surface);
      }

      @media (max-width: 720px) {
        .comparison {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/islands">
        <div class="container">
          <h1>Island Upgrade</h1>
          <p class="subtitle">
            KISS 的 island 是 DSD HTML 之后的 Custom Element upgrade。它不是整页 hydration，
            也不是把应用状态完整恢复到客户端。
          </p>

          <h2>Why Islands Exist</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>Traditional SPA Cost</h3>
              <ul>
                <li>内容和交互都依赖客户端 JavaScript。</li>
                <li>首屏、SEO 和无 JS fallback 需要额外处理。</li>
                <li>组件模型通常绑定某个专有 runtime。</li>
              </ul>
            </div>
            <div class="comparison-item kiss">
              <h3>KISS Island Model</h3>
              <ul>
                <li>内容先由 SSG + DSD 输出。</li>
                <li>只有真正需要交互的组件加载客户端模块。</li>
                <li>升级后再绑定事件、本地状态和浏览器 API。</li>
              </ul>
            </div>
          </div>

          <h2>Upgrade, Not Hydration</h2>
          <p>
            浏览器解析 HTML 时，Declarative Shadow DOM 已经把组件内容和样式放进 shadow root。
            客户端入口加载后调用 <span class="inline-code">customElements.define()</span>，
            浏览器把已有元素升级为真正的 Custom Element。这个过程更准确地叫
            <strong>Island Upgrade</strong>。
          </p>

          <h2>When To Create an Island</h2>
          <table>
            <thead>
              <tr>
                <th>Need</th>
                <th>Preferred layer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Readable content, navigation, layout</td>
                <td>HTML + DSD</td>
              </tr>
              <tr>
                <td>Hover, focus, responsive state, simple disclosure</td>
                <td>CSS and native HTML elements</td>
              </tr>
              <tr>
                <td>Clipboard, localStorage, IntersectionObserver, BroadcastChannel</td>
                <td>Small island using browser APIs</td>
              </tr>
              <tr>
                <td>Local state, event orchestration, API polling, optimistic UI</td>
                <td>Island Upgrade</td>
              </tr>
            </tbody>
          </table>

          <h2>Create a Local Island</h2>
          <p>
            本地 island 放在 <span class="inline-code">app/islands</span>。构建器会扫描它， 生成 client
            entry，并在静态 HTML 中注入入口脚本。
          </p>
          <code-block
          ><pre><code>// app/islands/my-counter.ts
            import { css, html, LitElement } from 'lit';

            export const tagName = 'my-counter';

            export default class MyCounter extends LitElement {
              static override styles = css&#96;
                :host { display: inline-flex; gap: 0.5rem; align-items: center; }
              &#96;;

              count = 0;

              override render() {
                return html&#96;
                  &lt;button @click=\\${() => this.count--}&gt;-&lt;/button&gt;
                  &lt;span&gt;\\${this.count}&lt;/span&gt;
                  &lt;button @click=\\${() => this.count++}&gt;+&lt;/button&gt;
                &#96;;
              }
            }

            customElements.define(tagName, MyCounter);</code></pre></code-block>

            <h2>Use an Island in a Page</h2>
            <code-block><pre><code>&lt;my-counter&gt;&lt;/my-counter&gt;</code></pre></code-block>
            <p>
              首屏 HTML 中会出现 host 和 shadow root。浏览器加载
              <span class="inline-code">my-counter</span> 模块后，按钮事件才会开始工作。
            </p>

            <h2>Package Islands</h2>
            <p>
              可复用包可以导出 island metadata，KISS 在构建时读取这些信息，用于 SSR 注册和客户端入口生成。
            </p>
            <code-block
            ><pre><code>import type { PackageIslandMeta } from '@kissjs/core';

            export const islands: PackageIslandMeta[] = [
              {
                tagName: 'kiss-theme-toggle',
                modulePath: '@kissjs/ui/kiss-theme-toggle',
                strategy: 'eager',
              },
            ];</code></pre></code-block>

            <h2>Current Boundary</h2>
            <p>
              当前实现仍以全局 island entry 为主。下一阶段需要把
              <span class="inline-code">strategy</span> 从 metadata 真正带进 client build， 并引入页面级
              island manifest，让每个页面只加载实际出现的 island。
            </p>

            <div class="nav-row">
              <a href="/guide/ssg" class="nav-link">&larr; Rendering & SSG</a>
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

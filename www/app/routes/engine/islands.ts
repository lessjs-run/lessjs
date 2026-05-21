export const meta = { section: 'Principles', label: 'Island Upgrade', order: 40 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterEngineNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }
      .comparison-item {
        padding: 1rem 1.25rem;
        border: 1px solid var(--border);
        border-radius: 8px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .comparison-item:hover {
        border-color: var(--border-hover);
      }
      .comparison-item.less {
        background: var(--bg-surface);
        border-left: 3px solid var(--brand, #534AB7);
      }
      @media (max-width: 720px) {
        .comparison {
          grid-template-columns: 1fr;
        }
      }
    `);

export class IslandsGuidePage extends DsdElement {
  declare locale?: string;

  static override styles = [routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="${this._getLocale('zh')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterEngineNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/engine/islands"
      >
        <div class="container">
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
          <less-code-block
          ><pre><code>// app/islands/my-counter.ts
            import { css, html, LitElement } from 'lit';
            export const tagName = 'my-counter';
            export default class MyCounter extends DsdElement {
              static override styles = css&#96;:host { display: inline-flex; gap: 0.5rem; align-items: center; }&#96;;
              count = 0;
              override render() {
                return html&#96;
                  &lt;button @click=\\${() => this.count--}&gt;-&lt;/button&gt;
                  &lt;span&gt;\\${this.count}&lt;/span&gt;
                  &lt;button @click=\\${() => this.count++}&gt;+&lt;/button&gt;
                &#96;;
              }
            }
            customElements.define(tagName, MyCounter);</code></pre></less-code-block>
          <h2>Package Islands</h2>
          <p>
            可复用包可以导出 island metadata，LessJS 在构建时读取这些信息，用于 SSR 注册和 client entry
            生成。
          </p>
          <h2>当前边界</h2>
          <p>
            当前实现仍以全局 island entry 为主。下一阶段需要把 strategy 从 metadata 真正带进 client
            build，并引入页面级 island manifest，让每个页面只加载实际出现的 island。
          </p>
          <div class="nav-row">
            <a href="/engine/dsd" class="nav-link">&larr; DSD 渲染架构</a>
            <a href="/engine/islands-deep" class="nav-link">Island 深度指南 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterEngineNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/en/engine/islands"
      >
        <div class="container">
          <h1>Island Upgrade</h1>
          <p class="subtitle">
            LessJS islands are Custom Element upgrades that follow DSD HTML. This is not full-page
            hydration — it does not restore the entire application state on the client.
          </p>
          <h2>Why Islands</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>Cost of Traditional SPA</h3>
              <ul>
                <li>Content and interactivity both depend on client JavaScript.</li>
                <li>First paint, SEO, and no-JS fallback require extra handling.</li>
                <li>Component model is typically bound to a proprietary runtime.</li>
              </ul>
            </div>
            <div class="comparison-item less">
              <h3>LessJS Island Model</h3>
              <ul>
                <li>Content is first rendered by SSG + DSD.</li>
                <li>Only components that truly need interactivity load client modules.</li>
                <li>Events, local state, and browser APIs bind after upgrade.</li>
              </ul>
            </div>
          </div>
          <h2>Upgrade, Not Hydration</h2>
          <p>
            When the browser parses HTML, DSD has already placed component content and styles into the
            shadow root. After the client entry loads, it calls <span class="inline-code"
            >customElements.define()</span> and the browser upgrades existing elements into real Custom
            Elements. This process is more accurately called <strong>Island Upgrade</strong>.
          </p>
          <h2>When to Create an Island</h2>
          <table>
            <thead>
              <tr>
                <th>Need</th>
                <th>Preferred Layer</th>
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
                <td>Clipboard, localStorage, IntersectionObserver</td>
                <td>Small island using browser APIs</td>
              </tr>
              <tr>
                <td>Local state, event orchestration, API polling, optimistic UI</td>
                <td>Island Upgrade</td>
              </tr>
            </tbody>
          </table>
          <h2>Creating a Local Island</h2>
          <p>
            Place local islands in <span class="inline-code">app/islands</span>. The builder scans them,
            generates a client entry, and injects it into the static HTML.
          </p>
          <h2>Package Islands</h2>
          <p>
            Reusable packages can export island metadata. LessJS reads this at build time for SSR
            registration and client entry generation.
          </p>
          <p>
            Today that metadata is intentionally minimal. Future package islands should be driven by a
            CEM-compatible manifest that declares tag, module, export, strategy, SSR renderability, DSD
            constraints, hydration events, diagnostics, and fallback behavior. That protocol is required
            before <code>less add</code>, automatic registration, or registry hub claims are stable.
          </p>
          <h2>Current Boundaries</h2>
          <p>
            The current implementation should be treated as framework-supported package island scanning,
            not a general-purpose component marketplace. If a package cannot explain its SSR and hydration
            behavior, LessJS should render it as static host markup or a pure island instead of guessing.
          </p>
          <div class="nav-row">
            <a href="/engine/dsd" class="nav-link">&larr; DSD Architecture</a>
            <a href="/engine/islands-deep" class="nav-link">Island Deep Guide &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-islands-guide', IslandsGuidePage);
export default IslandsGuidePage;
export const tagName = 'page-islands-guide';

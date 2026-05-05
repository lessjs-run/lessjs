/**
 * LessJS Compiler — .kiss file compiler architecture decision
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class KissCompilerPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
      }
      h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 1.5rem 0 0.5rem;
        color: var(--less-text-primary);
      }
      h3 {
        font-size: 0.875rem;
        font-weight: 500;
        margin: 1rem 0 0.25rem;
        color: var(--less-text-secondary);
      }
      p {
        font-size: 0.8125rem;
        line-height: 1.7;
        color: var(--less-text-secondary);
        margin: 0 0 0.75rem;
      }
      .code-block {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--less-text-secondary);
        white-space: pre;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        margin: 0.75rem 0;
      }
      th, td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 0.5px solid var(--less-border);
      }
      th {
        font-weight: 500;
        color: var(--less-text-primary);
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/guide/kiss-compiler">
        <div class="container">
          <p class="adr-meta">ADR 0002 · 2026-04-30 · Draft · v0.10.0 alpha target</p>
          <h1>.kiss Compiler — Optional Zero-Framework Authoring</h1>

          <h2>Context</h2>
          <p>
            LessJS 的 docs 站和 UI 包现在仍使用 <code>lit</code> 编写组件，但 core 的长期合同应该是
            DSD-first renderer + framework adapters，而不是把 Lit 写进框架本体。Lit 是成熟、可靠的
            Web Components 工具库；问题不在于它“不好”，而在于 LessJS 不应该把它变成唯一道路。
          </p>
          <p>
            当前需要面对的是：Lit-authored islands 的运行时代价、adapter 的 SSR/style extraction 复杂度、
            旧 Lit SSR 语境遗留的 hydration 术语漂移，以及 tagged template literals 在 Deno fmt 上的
            上游兼容问题。
          </p>

          <h2>Proposal</h2>
          <p>
            引入可选的 <code>.kiss</code> 文件格式。编译器在 build time 将它转换成 vanilla Custom
            Elements，让这类组件做到 0 KB framework runtime。Lit 继续作为 adapter 存在，不作为 v0.5-v0.9
            的阻塞项，也不在 v0.x 被草率移除。
          </p>

          <h3>.kiss file format</h3>
          <div class="code-block">
            &lt;!-- my-counter.kiss --&gt; &lt;template&gt; &lt;button
            @click="decrement"&gt;−&lt;/button&gt; &lt;span&gt;{count}&lt;/span&gt; &lt;button
            @click="increment"&gt;+&lt;/button&gt; &lt;/template&gt; &lt;script&gt; count = 0 increment()
            { this.count++ } decrement() { this.count-- } &lt;/script&gt; &lt;style&gt; :host { display:
            inline-flex; gap: 0.5rem; align-items: center; } &lt;/style&gt;
          </div>

          <h3>What the compiler eliminates</h3>
          <table>
            <tr>
              <th>Layer</th>
              <th>Before (Lit adapter)</th>
              <th>After (.kiss compiler)</th>
            </tr>
            <tr>
              <td>Runtime</td>
              <td>Lit runtime for Lit-authored islands</td>
              <td>0 KB framework runtime for compiled Custom Elements</td>
            </tr>
            <tr>
              <td>SSR</td>
              <td>adapter-mediated rendering</td>
              <td>LessJS DSD renderer / template strings</td>
            </tr>
            <tr>
              <td>Upgrade</td>
              <td>Custom Element upgrade</td>
              <td>Custom Element upgrade</td>
            </tr>
            <tr>
              <td>Build</td>
              <td>esbuild + Lit semantics</td>
              <td>standard TS/JS output</td>
            </tr>
            <tr>
              <td>Tests</td>
              <td>adapter tests required</td>
              <td>compiler fixture tests required</td>
            </tr>
          </table>

          <h2>SSG integration</h2>
          <p>
            The route scanner already maps <code>app/routes/*.ts</code> to URL paths. Extend it to also
            scan .kiss files. Page .kiss files render directly (template is the page). Island .kiss files
            get lazy chunk treatment.
          </p>

          <h2>Backward compatibility</h2>
          <p>
            可能的配置形态是 <code>compiler: 'lit' | 'kiss' | 'auto'</code>。其中
            <code>auto</code> 表示 <code>.kiss</code> 文件走编译器，<code>.ts</code> 组件继续走现有
            adapter。v0.10.0 只应把它作为 alpha 能力引入；v1.0 是否默认启用仍是开放决策。
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/pwa" class="nav-link">PWA Support &rarr;</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-kiss-compiler', KissCompilerPage);
export default KissCompilerPage;
export const tagName = 'page-kiss-compiler';

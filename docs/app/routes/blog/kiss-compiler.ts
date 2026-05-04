/**
 * Blog Post — .kiss Compiler Vision
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class BlogKissCompilerPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-meta {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
      }
      h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 1.5rem 0 0.5rem;
        color: var(--kiss-text-primary);
      }
      p {
        font-size: 0.875rem;
        line-height: 1.7;
        margin: 0 0 0.75rem;
      }
      .code-block {
        background: var(--kiss-bg-surface);
        /* 0.5px: reduced to match kiss-ui spec */
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--kiss-text-secondary);
        white-space: pre;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog/kiss-compiler">
        <div class="container">
          <p class="blog-meta">2026-04-30 · SisyphusZheng</p>
          <h1>.kiss Compiler — 可选零框架运行时组件</h1>

          <p>
            KISS 框架从第一天起就选择了 Lit 作为组件基础。这个选择是对的——Lit 是 Web Components 生态中
            最成熟的库，让我们快速验证了 K·I·S·S 架构的可行性。但经过后续架构审查，我们也更清楚地看到：
            core 的长期合同不能绑定到某个组件库。Lit 应该保留为 adapter，而不是成为用户必须接受的唯一组件模型。
          </p>

          <h2>今天的代价</h2>
          <p>
            依赖 Lit 编写的 island 会携带 Lit 运行时；SSR/style extraction 需要 adapter 维护；旧 Lit SSR
            路线留下的 hydration 术语又容易和现在的 DSD + Custom Element upgrade 模型混淆。Deno fmt
            在处理复杂 Lit 模板字面量时也曾触发上游 panic。结论不是“消灭 Lit”，而是把 Lit 放回正确的位置：
            一个好 adapter，而不是 KISS 的定义本身。
          </p>

          <h2>.kiss 文件格式</h2>
          <p>一个组件一个文件。没有 class 声明，没有 decorator，没有 import：</p>
          <div class="code-block">
            &lt;!-- my-counter.kiss --&gt; &lt;template&gt; &lt;button
            @click="decrement"&gt;−&lt;/button&gt; &lt;span&gt;{count}&lt;/span&gt; &lt;button
            @click="increment"&gt;+&lt;/button&gt; &lt;/template&gt; &lt;script&gt; count = 0 increment()
            { this.count++ } decrement() { this.count-- } &lt;/script&gt; &lt;style&gt; :host { display:
            inline-flex; gap: 0.5rem; align-items: center; } &lt;/style&gt;
          </div>

          <h2>编译器产出</h2>
          <p>零依赖的原生 Custom Element：</p>
          <div class="code-block">
            class MyCounter extends HTMLElement { #count = 0; #root = this.attachShadow({ mode: 'open' });
            get count() { return this.#count; } set count(v) { this.#count = v; this.#update(); }
            connectedCallback() { this.#root.append(tpl.content.cloneNode(true));
            this.#root.querySelector('button:first-child').onclick = () => this.count--;
            this.#root.querySelector('button:last-child').onclick = () => this.count++; } }
          </div>

          <h2>消除清单</h2>
          <p>
            — Lit-authored islands 的框架运行时代价 → 编译产物 0 KB framework runtime<br>
            — adapter-mediated SSR → KISS DSD renderer / template strings<br>
            — hydration 术语漂移 → 明确的 Custom Element upgrade<br>
            — decorator / tagged template 生态复杂度 → 标准 JS 输出<br>
            — 复杂的类型层次 → 简单的 getter/setter
          </p>

          <h2>路线</h2>
          <p>
            这项工作不应该阻塞 v0.5-v0.9。当前路线是：先修可信度、安全、DSD renderer、Island Upgrade、
            Serverless Fullstack 与 SSG/ISR，再在 v0.10.0 引入 <code>.kiss</code> compiler alpha。
            Lit 兼容模式在 v0.x 生命周期中保留。
          </p>
          <p>
            详细技术设计见 <code>docs/decisions/0002-kiss-compiler-eliminate-lit.md</code>。
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/blog" class="nav-link">&larr; 返回博客</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-blog-kiss-compiler', BlogKissCompilerPage);
export default BlogKissCompilerPage;
export const tagName = 'page-blog-kiss-compiler';

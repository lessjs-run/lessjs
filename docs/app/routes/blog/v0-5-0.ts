/**
 * Blog: KISS v0.5-alpha-0 — Architecture Simplification
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export const tagName = 'blog-v050-a0';

export default class BlogV050 extends LitElement {
  static override styles = [
    pageStyles,
    css`
      h2 { margin-top: 2rem; }
      .truth {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1.25rem;
        margin: 1.5rem 0;
      }
      .truth-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--kiss-text-primary);
      }
      code {
        background: var(--kiss-code-bg);
        padding: 0.125rem 0.375rem;
        border: 0.5px solid var(--kiss-border);
        border-radius: 3px;
        font-size: 0.8125rem;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog/v0-5-0">
        <div class="container">
          <p class="breadcrumb"><a href="/blog">← Blog</a></p>
          <h1>KISS v0.5-alpha-0 — 架构精简：砍掉不必要的，留住核心</h1>
          <p class="subtitle">零框架运行时 Core · 原生 RPC · OpenProps + Lit · 单 deno.json</p>
          <p class="date">2026-05-02</p>

          <p>v0.5-alpha-0 不做新功能。它做减法。</p>

          <p>从 v0.3.2 到 v0.4.0，我们加了 SSG、Islands、DSD、PWA、Serverless API——90 commits，3904 行新增。到 v0.5-alpha-0，问题变成了：这些东西能不能不这么复杂？</p>

          <h2>删了什么</h2>

          <div class="truth">
            <div class="truth-title">一、KissElement — 废弃</div>
            <p>KissElement 是一个"零框架运行时"的 Custom Element base class，用 <code>this.root.innerHTML = String(this.render())</code> 更新 DOM。这个设计有四个问题：</p>
            <ul>
              <li>状态丢失：input focus、scroll pos、CSS 动画全部重置</li>
              <li>不安全：innerHTML 不转义</li>
              <li>不组合：全量替换破坏子组件 DOM 引用</li>
              <li>性能差：比 lit-html 细粒度 diff 差一个数量级</li>
            </ul>
            <p>要解决这些问题需要重写一个 lit-html 级别的模板引擎——不值得维护。任何想"零框架运行时但又有声明式模板"的方案，最后都会变成重写 Lit。</p>
          </div>

          <div class="truth">
            <div class="truth-title">二、@kissjs/core 的运行时导出 — 归零</div>
            <p>之前 core 做了太多事：Vite 插件 + KissElement + LitElement re-export + 路由扫描 + DSD 渲染。</p>
            <p>现在 core 只做一件事：构建/SSR 基础设施。不再导出：</p>
            <ul>
              <li>✗ KissElement</li>
              <li>✗ signal / effect（@preact/signals-core）</li>
              <li>✗ LitElement / html / css（交给 @kissjs/ui）</li>
            </ul>
            <p>结果：<code>@kissjs/core</code> 的运行时依赖从两个（lit + signals）变成零。</p>
          </div>

          <div class="truth">
            <div class="truth-title">三、@kissjs/rpc 的 Lit 耦合 — 解除</div>
            <p>RPC 控制器本质上是 fetch + AbortController 的包装。它曾经因为用了 Lit 的 ReactiveController 接口而声明了 peer dep。</p>
            <p>v0.5-alpha-0 改为 structural typing——RPC 自己声明兼容的接口，任何有 <code>addController</code>/<code>requestUpdate</code> 的对象都可以用。Lit、原生 HTMLElement、或其他框架都行。</p>
          </div>

          <div class="truth">
            <div class="truth-title">四、双 deno.json — 合并</div>
            <p>之前根目录和 docs/ 各有一个 deno.json，依赖分散在两处维护。</p>
            <p>现在合并到单根 deno.json，加上 <code>vendor: true</code>，<code>deno install</code> 一站式管理所有依赖。</p>
          </div>

          <h2>留了什么</h2>

          <div class="truth">
            <div class="truth-title">Lit 保留在 @kissjs/ui</div>
            <p>Lit 是 Web Component 最成熟的工具库。kiss-ui 的九个组件已经用 Lit 写好、无 bug、正在跑。15KB gzip 不可见成本（被所有组件共享）。</p>
            <p>Lit 现在是 <code>@kissjs/ui</code> 的实现细节。用户写 <code>&lt;kiss-button variant="primary"&gt;</code> 不需要知道里面有 Lit。需要自定义组件的用户可以自己写 <code>class extends HTMLElement</code>，和 kiss-ui 组件同页面共存。</p>
          </div>

          <div class="truth">
            <div class="truth-title">DSD 渲染器 — core / adapter 分层不变</div>
            <p>core 负责 DSD-first 渲染与 SSG 管线；Lit 组件通过 <code>@kissjs/adapter-lit</code> 接入。后续 Trust Release 必须补齐 adapter 测试与插值转义，不能把 adapter 风险伪装成 core 的能力。</p>
          </div>

          <div class="truth">
            <div class="truth-title">OpenProps 设计系统</div>
            <p>所有颜色和阴影 token 从硬编码 hex 改为 OpenProps CSS 变量。CSS 自定义属性天然穿透 Shadow DOM，零构建步骤。</p>
          </div>

          <h2>新架构一览</h2>

          <pre><code>@kissjs/core    — 纯构建/SSR 工具           [零框架运行时]
@kissjs/rpc     — fetch + AbortController   [零框架运行时]
@kissjs/ui      — OpenProps + Lit 组件库     [仅 UI 层]
create-kiss     — 脚手架                    [CLI 工具]</code></pre>

          <p>Vite 8.0.10，Deno 2.6，单根 deno.json。CI 全绿。</p>

          <div class="nav-row">
            <a href="/blog/v0-4-0" class="nav-link">&larr; v0.4.0</a>
            <a href="/roadmap" class="nav-link">路线图 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

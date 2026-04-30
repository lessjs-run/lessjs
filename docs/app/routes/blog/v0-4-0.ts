/**
 * Blog: KISS v0.4.0 — Serverless Milestone
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export const tagName = 'blog-v040';

export default class BlogV040 extends LitElement {
  static styles = [
    pageStyles,
    css`
      .cmp {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        border: 0.5px solid var(--kiss-border);
        margin: 1.5rem 0;
      }
      .cmp th, .cmp td {
        padding: 0.625rem 0.75rem;
        text-align: left;
        border-bottom: 0.5px solid var(--kiss-border);
      }
      .cmp th {
        background: var(--kiss-bg-surface);
        color: var(--kiss-text-muted);
        font-weight: 500;
      }
      .cmp td { color: var(--kiss-text-secondary); }
      .cmp td:first-child { color: var(--kiss-text-primary); font-weight: 500; }
      .cmp td.yes { color: #2ecc40; }
      .cmp td.no { color: var(--kiss-text-muted); }
      h2 { margin-top: 2rem; }
      .truth { background: var(--kiss-bg-surface); border: 0.5px solid var(--kiss-border); border-radius: 4px; padding: 1rem 1.25rem; margin: 1rem 0; }
      .truth strong { color: var(--kiss-text-primary); }
      .truth p { color: var(--kiss-text-secondary); font-size: 0.875rem; margin: 0.5rem 0 0; }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog">
        <div class="container">
          <h1>KISS v0.4.0 — Serverless Integration Milestone</h1>
          <p class="meta" style="color:var(--kiss-text-muted);font-size:0.8125rem;margin-bottom:2rem">2026-04-30 · 版本发布</p>

          <p>今天发布了 v0.4.0。这个版本不是一个量变——它标志着 KISS 从"能跑起来"变成了"真正能用"。Serverless API 集成、PWA、全中文首页、一致的主题系统，全部到位。</p>

          <h2>v0.3.x → v0.4.0 变更清单</h2>

          <table class="cmp">
            <tr><th>类别</th><th>v0.3.x</th><th>v0.4.0</th></tr>
            <tr><td>Serverless API</td><td>文档只有描述</td><td>实际部署 + Deno Deploy 集成</td></tr>
            <tr><td>Theme</td><td>硬编码颜色</td><td>全站 --kiss-* CSS 变量</td></tr>
            <tr><td>Service Worker</td><td>Precache 首页（永远旧）</td><td>networkFirst（实时更新）</td></tr>
            <tr><td>Border 风格</td><td>1px 混杂</td><td>全站统一 0.5px</td></tr>
            <tr><td>首页内容</td><td>英文</td><td>全中文，响应式</td></tr>
            <tr><td>Ping 组件</td><td>无</td><td>kiss-hero-ping（@kissjs/ui）</td></tr>
            <tr><td>代码质量</td><td>lint/type 有残留</td><td>0 lint + 0 type errors</td></tr>
          </table>

          <h2>与其他框架的直观对比</h2>

          <table class="cmp">
            <tr><th>维度</th><th>KISS</th><th>Fresh</th><th>Nuxt</th><th>Next.js</th></tr>
            <tr><td>HTTP 层</td><td>Fetch API</td><td>Fetch API</td><td>Nitro</td><td>定制</td></tr>
            <tr><td>UI 层</td><td>Web Components</td><td>Preact/JSX</td><td>Vue</td><td>React</td></tr>
            <tr><td>静态页面 JS</td><td>~0.4 KB</td><td>~1 KB</td><td>~60 KB</td><td>~70 KB</td></tr>
            <tr><td>单交互组件</td><td>~2-6 KB</td><td>~12 KB</td><td>整包</td><td>整包</td></tr>
            <tr><td>Islands 架构</td><td class="yes">原生</td><td class="yes">原生</td><td class="no">无</td><td class="no">无</td></tr>
            <tr><td>DSD (Declarative Shadow DOM)</td><td class="yes">内置</td><td class="no">—</td><td class="no">—</td><td class="no">—</td></tr>
            <tr><td>SSG 原生</td><td class="yes">是</td><td class="yes">是</td><td class="yes">是</td><td class="yes">是</td></tr>
            <tr><td>多运行时</td><td>Deno/Node/Bun/CF</td><td>Deno</td><td>Node</td><td>Node</td></tr>
            <tr><td>类型安全 RPC</td><td class="yes">Hono RPC</td><td class="no">—</td><td class="no">—</td><td class="no">—</td></tr>
          </table>

          <h2>关于"零 JS"的实话</h2>

          <div class="truth">
            <strong>KISS 不是零 JS，而是零框架 JS。</strong>
            <p>
              每个页面有约 400 字节的内联基础设施脚本（主题初始化 + Service Worker 注册）。
              这是不可消除的——它们是 L2 层（平台 API），在 I 约束（Isolated）的豁免范围内。
            </p>
            <p>
              但 Lit / Hono / 框架核心代码的确是 0 字节。零交互页面只加载这 ~400 字节。
              对比之下 Fresh 每页 ~1KB，Nuxt ~60KB，Next.js ~70KB。
            </p>
            <p>
              有交互的页面按需加载 Island chunk，每个 ~2-6 KB gzip，懒加载 + 独立 Shadow DOM。
            </p>
          </div>

          <h2>未来规划</h2>

          <h3>Vite 8 支持</h3>
          <p>
            Vite 6 → 8 的升级路径已经调研过。核心依赖（Vite SSR、Rollup 插件 API）在 Vite 7/8 中保持兼容。
            主要工作是更新 Wrangler 适配层和 Deno Deploy 的 shim。预计在 v0.5.0 时完成迁移。
            Vite 8 的 RSC 支持和更快的 HMR 将直接受益于 KISS 的构建管线。
          </p>

          <h3>.kiss 编译器</h3>
          <p>
            消灭 Lit 运行时依赖是终极目标。自定义编译器将 .kiss 文件编译为原生 <code>HTMLElement</code>，
            消除 58KB 的 Lit 运行时。这不仅是大小优化——它意味着 <strong>真正的零依赖</strong>。
            目前编译器已经完成了设计文档（<a href="/blog/kiss-compiler">详见博文</a>），v0.6.0 目标。
          </p>

          <h3>React 19 / Vue Interop</h3>
          <p>
            通过 Custom Elements 的天然互操作性，KISS Island 可以在任何框架中使用。
            React 19 已经修复了对 Custom Elements 的属性传递支持。Vue 3 原生支持 CE。
            这意味着 KISS 组件可以作为"框架无关"的交互单元被其他应用引用。
          </p>

          <h3>WASM Islands</h3>
          <p>
            探索将计算密集型 Island 编译为 WebAssembly，在 Shadow DOM 内运行。
            适用于数据重处理、图形渲染等场景。
          </p>

          <h3>自动 API RPC 生成</h3>
          <p>
            从 Hono 路由定义自动生成类型安全的客户端调用代码。
            消除手动编写 API 客户端代码的需求。
          </p>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('blog-v040', BlogV040);

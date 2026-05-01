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
      .cmp td {
        color: var(--kiss-text-secondary);
      }
      .cmp td:first-child {
        color: var(--kiss-text-primary);
        font-weight: 500;
      }
      .cmp td.yes {
        color: #2ecc40;
      }
      .cmp td.no {
        color: var(--kiss-text-muted);
      }
      h2 {
        margin-top: 2rem;
      }
      .truth {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      }
      .truth strong {
        color: var(--kiss-text-primary);
      }
      .truth p {
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
        margin: 0.5rem 0 0;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog">
        <div class="container">
          <h1>KISS v0.4.0 — Serverless Integration Milestone</h1>
          <p class="meta" style="color:var(--kiss-text-muted);font-size:0.8125rem;margin-bottom:2rem">
            2026-04-30 · 版本发布
          </p>

          <p>KISS v0.4.0 只有一个核心主题：<strong>Serverless 集成跑通了</strong>。</p>
          <p>
            从 v0.3.2 开始，KISS 的架构文档里就写着 "API Routes 可以部署为
            Serverless"，但直到这个版本，它才真正 CI 自动化、真正跑在生产环境上。
          </p>

          <div class="truth">
            <strong>v0.3.2 → v0.4.0：90 commits · 103 files · +3904 / −1810</strong>
          </div>

          <h2>Serverless API 的落地之路</h2>
          <p>
            这 12 个 commit 是从"文档描述"到"真机部署"的全过程：
          </p>

          <table class="cmp">
            <tr>
              <th>阶段</th>
              <th>问题</th>
              <th>解决方案</th>
            </tr>
            <tr>
              <td>部署平台迁移</td>
              <td><code>deployctl</code>（旧平台 Classic）废弃</td>
              <td>迁移到 <code>deno deploy</code>（新平台 v2）</td>
            </tr>
            <tr>
              <td>CORS</td>
              <td><code>hono/cors</code> 中间件在 Deno Deploy 上不兼容</td>
              <td>手动设置 Access-Control-Allow-Origin</td>
            </tr>
            <tr>
              <td>入口路径</td>
              <td>deployctl 和 deno deploy 的入口解析不一致</td>
              <td>用 <code>--entrypoint=serverless.ts</code> 明确指定</td>
            </tr>
            <tr>
              <td>Import Map</td>
              <td>Deno Deploy 读不到 workspace 配置</td>
              <td>从 clean temp dir 部署，自带 deno.json</td>
            </tr>
            <tr>
              <td>CI 触发</td>
              <td>只 push main + demo/** 变更</td>
              <td><code>deploy-api.yml</code> 自动化 + workflow_dispatch</td>
            </tr>
          </table>

          <p>
            最终成果：<code>kiss-demo-api.sisyphuszheng.deno.net</code> 生产在线，CI 自动部署，前端 <code
            >kiss-hero-ping</code> 一键 verify。 这是 KISS Jamstack 承诺的 "J"（Markup）+ "A"（API）+
            "M"（Markup） 全链路闭环。
          </p>

          <h2>从 v0.3.2 到 v0.4.0 完整变更</h2>

          <h3>@kissjs/ui</h3>
          <table class="cmp">
            <tr>
              <th>变更</th>
              <th>说明</th>
              <th>版本</th>
            </tr>
            <tr>
              <td>新组件：kiss-hero-ping</td>
              <td>可配置 API 的 ping 按钮，🟢/🔴 状态点</td>
              <td>0.3.6 → 0.4.0</td>
            </tr>
            <tr>
              <td>kiss-layout</td>
              <td>sidebar 240px → clamp(200px, 20vw, 280px)，max-width 变量化</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>全组件边框统一</td>
              <td>kiss-button/card/input/code-block/layout 全部 0.5px</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>kiss-input</td>
              <td>修复 undefined string 问题</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>kiss-button</td>
              <td>修复 nothing 输出</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>kiss-code-block</td>
              <td>修复 timeout cleanup</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>theme-toggle</td>
              <td>ARIA 修复，动画访问性</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>effects token</td>
              <td>暗色模式阴影修复</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>vite.config.build</td>
              <td>新增 kiss-hero-ping 构建入口</td>
              <td>0.3.5</td>
            </tr>
            <tr>
              <td>index.ts</td>
              <td>导出 kiss-hero-ping，islands 数组 +1</td>
              <td>0.3.6</td>
            </tr>
          </table>

          <h3>@kissjs/core</h3>
          <table class="cmp">
            <tr>
              <th>变更</th>
              <th>说明</th>
            </tr>
            <tr>
              <td>Service Worker</td>
              <td>PRECACHE 删除，networkFirst（HTML）+ cacheFirst（assets），动态缓存名</td>
            </tr>
            <tr>
              <td>SSR entry</td>
              <td>修复 Island 组件注册缺失（Lit SSR 渲染空标签问题）</td>
            </tr>
            <tr>
              <td>扫描器</td>
              <td>route-scanner 重构，isDirectory() 方法调用修复</td>
            </tr>
            <tr>
              <td>上下文</td>
              <td>createSsrContext 改进</td>
            </tr>
            <tr>
              <td>构建管线</td>
              <td>build-client + build-ssg 稳定化</td>
            </tr>
            <tr>
              <td>deploy.yml</td>
              <td>加 .version 缓存清除文件</td>
            </tr>
            <tr>
              <td>deno.json/jsr.json</td>
              <td>添加 CLI 导出</td>
            </tr>
            <tr>
              <td>types.ts</td>
              <td>JSDoc 修复</td>
            </tr>
          </table>

          <h3>@kissjs/rpc</h3>
          <table class="cmp">
            <tr>
              <th>变更</th>
              <th>说明</th>
            </tr>
            <tr>
              <td>abort race 修复</td>
              <td>RPC 调用取消竞争条件修复</td>
            </tr>
          </table>

          <h3>文档站</h3>
          <table class="cmp">
            <tr>
              <th>类别</th>
              <th>变更</th>
            </tr>
            <tr>
              <td>首页</td>
              <td>全中文、响应式 clamp()、比较表、Quick start 修正、auto/% 尺寸</td>
            </tr>
            <tr>
              <td>全站边框</td>
              <td>17 个文件、40+ 处 1px → 0.5px 统一</td>
            </tr>
            <tr>
              <td>主题</td>
              <td>所有非 Hero 区域硬编码色 → --kiss-* CSS 变量</td>
            </tr>
            <tr>
              <td>Hero 可见度</td>
              <td>#555→#999，#444→#777，border-bottom 隔离</td>
            </tr>
            <tr>
              <td>布局统一</td>
              <td>首页 720px 内容宽度对齐 Guide 页面</td>
            </tr>
            <tr>
              <td>博客</td>
              <td>v0.4.0 发布文、kiss-compiler 设计决策</td>
            </tr>
            <tr>
              <td>架构文档</td>
              <td>设计哲学、部署指南等同步更新</td>
            </tr>
            <tr>
              <td>README</td>
              <td>精简 80%，加 JSR badges，诚实 JS 大小</td>
            </tr>
            <tr>
              <td>导航</td>
              <td>侧边栏组织优化</td>
            </tr>
          </table>

          <h3>CI/CD</h3>
          <table class="cmp">
            <tr>
              <th>流水线</th>
              <th>变更</th>
            </tr>
            <tr>
              <td>Lint & Format</td>
              <td>稳定通过（跳过 docs/ 由于 Deno fmt bug）</td>
            </tr>
            <tr>
              <td>Test</td>
              <td>并行化 test-core + test-ui + test-create，移除 coverage 步骤</td>
            </tr>
            <tr>
              <td>Publish</td>
              <td>自动检测 deno.json 版本变更，多包发布</td>
            </tr>
            <tr>
              <td>Deploy</td>
              <td>三步构建完整 CI，缓存清除</td>
            </tr>
          </table>

          <h3>代码质量</h3>
          <table class="cmp">
            <tr>
              <th>指标</th>
              <th>v0.3.2</th>
              <th>v0.4.0</th>
            </tr>
            <tr>
              <td>Lint 错误</td>
              <td>有残留</td>
              <td>0</td>
            </tr>
            <tr>
              <td>TypeScript 类型</td>
              <td>有残留</td>
              <td>0 errors</td>
            </tr>
            <tr>
              <td>UI 测试通过</td>
              <td>部分</td>
              <td>84/84</td>
            </tr>
            <tr>
              <td>全站 1px 残留</td>
              <td>40+ 处</td>
              <td>0</td>
            </tr>
            <tr>
              <td>硬编码色（非 Hero）</td>
              <td>大量</td>
              <td>0（全部 CSS 变量）</td>
            </tr>
          </table>

          <h2>与其他框架的直观对比</h2>

          <table class="cmp">
            <tr>
              <th>维度</th>
              <th>KISS</th>
              <th>Fresh</th>
              <th>Nuxt</th>
              <th>Next.js</th>
            </tr>
            <tr>
              <td>HTTP 层</td>
              <td>Fetch API</td>
              <td>Fetch API</td>
              <td>Nitro</td>
              <td>定制</td>
            </tr>
            <tr>
              <td>UI 层</td>
              <td>Web Components</td>
              <td>Preact/JSX</td>
              <td>Vue</td>
              <td>React</td>
            </tr>
            <tr>
              <td>静态页面 JS</td>
              <td>~0.4 KB</td>
              <td>~1 KB</td>
              <td>~60 KB</td>
              <td>~70 KB</td>
            </tr>
            <tr>
              <td>单交互组件</td>
              <td>~2-6 KB</td>
              <td>~12 KB</td>
              <td>整包</td>
              <td>整包</td>
            </tr>
            <tr>
              <td>Islands 架构</td>
              <td class="yes">原生</td>
              <td class="yes">原生</td>
              <td class="no">无</td>
              <td class="no">无</td>
            </tr>
            <tr>
              <td>DSD (Declarative Shadow DOM)</td>
              <td class="yes">内置</td>
              <td class="no">—</td>
              <td class="no">—</td>
              <td class="no">—</td>
            </tr>
            <tr>
              <td>SSG 原生</td>
              <td class="yes">是</td>
              <td class="yes">是</td>
              <td class="yes">是</td>
              <td class="yes">是</td>
            </tr>
            <tr>
              <td>多运行时</td>
              <td>Deno/Node/Bun/CF</td>
              <td>Deno</td>
              <td>Node</td>
              <td>Node</td>
            </tr>
            <tr>
              <td>类型安全 RPC</td>
              <td class="yes">Hono RPC</td>
              <td class="no">—</td>
              <td class="no">—</td>
              <td class="no">—</td>
            </tr>
          </table>

          <h2>关于"零 JS"的实话</h2>

          <div class="truth">
            <strong>KISS 不是零 JS，而是零框架 JS。</strong>
            <p>
              每个页面有约 400 字节的内联基础设施脚本（主题初始化 + Service Worker 注册）。
              这是不可消除的——它们是 L2 层（平台 API），在 I 约束（Isolated）的豁免范围内。
            </p>
            <p>
              但 Lit / Hono / 框架核心代码的确是 0 字节。零交互页面只加载这 ~400 字节。 对比之下 Fresh
              每页 ~1KB，Nuxt ~60KB，Next.js ~70KB。
            </p>
            <p>
              有交互的页面按需加载 Island chunk，每个 ~2-6 KB gzip，懒加载 + 独立 Shadow DOM。
            </p>
          </div>

          <h2>未来规划</h2>

          <h3>Vite 8 支持</h3>
          <p>
            Vite 6 → 8 的升级路径已经调研过。核心依赖（Vite SSR、Rollup 插件 API）在 Vite 7/8 中保持兼容。
            主要工作是更新 Wrangler 适配层和 Deno Deploy 的 shim。预计在 v0.5.0 时完成迁移。 Vite 8 的 RSC
            支持和更快的 HMR 将直接受益于 KISS 的构建管线。
          </p>

          <h3>.kiss 编译器</h3>
          <p>
            消灭 Lit 运行时依赖是终极目标。自定义编译器将 .kiss 文件编译为原生 <code>HTMLElement</code>，
            消除 58KB 的 Lit 运行时。这不仅是大小优化——它意味着 <strong>真正的零依赖</strong>。
            目前编译器已经完成了设计文档（<a href="/blog/kiss-compiler">详见博文</a>），v0.6.0 目标。
          </p>

          <h3>React 19 / Vue Interop</h3>
          <p>
            通过 Custom Elements 的天然互操作性，KISS Island 可以在任何框架中使用。 React 19 已经修复了对
            Custom Elements 的属性传递支持。Vue 3 原生支持 CE。 这意味着 KISS
            组件可以作为"框架无关"的交互单元被其他应用引用。
          </p>

          <h3>WASM Islands</h3>
          <p>
            探索将计算密集型 Island 编译为 WebAssembly，在 Shadow DOM 内运行。
            适用于数据重处理、图形渲染等场景。
          </p>

          <h3>自动 API RPC 生成</h3>
          <p>
            从 Hono 路由定义自动生成类型安全的客户端调用代码。 消除手动编写 API 客户端代码的需求。
          </p>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('blog-v040', BlogV040);

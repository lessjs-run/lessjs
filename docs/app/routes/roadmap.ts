/**
 * Roadmap Page — KISS Framework Development Roadmap
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class RoadmapPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .truth-box {
        margin: 1.5rem 0;
        padding: 1rem 1.25rem;
        border: 0.5px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 4px;
      }
      .truth-box strong {
        color: var(--kiss-text-primary);
      }
      .truth-box p {
        margin: 0.5rem 0;
      }
      .roadmap-table,
      .task-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .roadmap-table th,
      .roadmap-table td,
      .task-table th,
      .task-table td {
        padding: 0.75rem 1rem;
        text-align: left;
        vertical-align: top;
        border-bottom: 0.5px solid var(--kiss-border);
      }
      .roadmap-table th,
      .task-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--kiss-text-muted);
      }
      .roadmap-table td:first-child,
      .task-table td:first-child {
        white-space: nowrap;
        font-weight: 600;
        color: var(--kiss-text-primary);
      }
      .status-done {
        color: var(--kiss-accent);
        font-weight: 600;
      }
      .status-now {
        color: var(--kiss-text-primary);
        font-weight: 600;
      }
      .status-next {
        color: var(--kiss-text-secondary);
        font-weight: 600;
      }
      .priority-p0 {
        color: var(--kiss-accent);
        font-weight: 700;
      }
      .priority-p1 {
        color: var(--kiss-text-primary);
        font-weight: 600;
      }
      .priority-p2 {
        color: var(--kiss-text-tertiary);
        font-weight: 600;
      }
      .principle-list {
        margin: 1rem 0 1.5rem;
        padding-left: 1.25rem;
      }
      .principle-list li {
        margin: 0.45rem 0;
        color: var(--kiss-text-secondary);
      }
      .inline-code {
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
        background: var(--kiss-bg-elevated);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/roadmap">
        <div class="container">
          <h1>路线图</h1>
          <p class="subtitle">
            KISS 的目标是成为 Web Standards-first、static-first 的全栈框架。
          </p>

          <div class="truth-box">
            <p>
              <strong>定位裁定：</strong>KISS 不是 Next/Nuxt/SvelteKit 的同类翻版。
              它的核心路线是 DSD-rendered Web Components、Island Upgrade、Hono
              Serverless APIs、SSG-first delivery，未来再扩展 ISR。
            </p>
            <p>
              <strong>术语裁定：</strong>当前实现应称为
              <span class="inline-code">DSD + Custom Element upgrade</span>，
              不再把它描述为传统框架 hydration。Lit 是 adapter，不是 core 的长期基础。
            </p>
          </div>

          <h2>架构审查裁定</h2>
          <ul class="principle-list">
            <li>
              KISS 的主线是 Web Standards-first、static-first、DSD-rendered Web
              Components + Island Upgrade，不追随 React/Vue/Svelte 元框架路线。
            </li>
            <li>
              近期产品化样板应优先选择博客、文档、内容站、营销页和轻量 serverless
              应用；这些场景最能发挥 SSG、DSD 和低 JS 的优势。
            </li>
            <li>
              CRM/admin 可以作为中期目标，但不应成为 v0.5-v0.6 的主打叙事；它需要
              forms/actions、auth/session、validation、data table 和 revalidation
              约定成熟后再推进。
            </li>
            <li>
              未来计划本轮先进入路线图和设计文档；运行时 API、包导出、CLI 行为不在
              本次变更中提前实现。
            </li>
          </ul>

          <h2>版本线</h2>
          <table class="roadmap-table">
            <thead>
              <tr>
                <th>版本</th>
                <th>名称</th>
                <th>目标</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>v0.4.x</td>
                <td>Serverless Demo</td>
                <td>SSG + DSD + Hono API demo 跑通，证明方向可行。</td>
                <td class="status-done">已完成</td>
              </tr>
              <tr>
                <td>v0.5.0</td>
                <td>Trust Release</td>
                <td>修复 quickstart、渲染安全、嵌套 island 路径、SSG smoke 和文档真实性。</td>
                <td class="status-now">当前主线</td>
              </tr>
              <tr>
                <td>v0.6.0</td>
                <td>DSD Renderer 2</td>
                <td>渲染内核优先：safe/unsafe HTML 契约、safe template helper、nested DSD、slot/projection、错误定位。</td>
                <td class="status-next">下一阶段</td>
              </tr>
              <tr>
                <td>v0.7.0</td>
                <td>Island Upgrade</td>
                <td>页面级 island manifest、按页加载、eager/idle/visible 策略真实落地。</td>
                <td>规划中</td>
              </tr>
              <tr>
                <td>v0.8.0</td>
                <td>Serverless Fullstack</td>
                <td>Hono API 一等公民化，FormData actions、typed RPC、部署 adapter；为博客/内容插件提供稳定约定。</td>
                <td>规划中</td>
              </tr>
              <tr>
                <td>v0.9.0</td>
                <td>SSG + ISR + PWA</td>
                <td>revalidate、Cache API、Service Worker、Edge/CDN 缓存一致性。</td>
                <td>规划中</td>
              </tr>
              <tr>
                <td>v0.10.0</td>
                <td>.kiss Compiler Alpha</td>
                <td>可选零框架运行时组件编译器，验证 template/script/style 组件格式。</td>
                <td>实验规划</td>
              </tr>
              <tr>
                <td>v1.0.0</td>
                <td>Stable API</td>
                <td>API freeze、生产基准、迁移文档、兼容性承诺。</td>
                <td>规划中</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.5.0 Trust Release 任务表</h2>
          <table class="task-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>任务</th>
                <th>验收标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="priority-p0">P0</td>
                <td>修复 <span class="inline-code">@kissjs/adapter-lit</span> 插值转义</td>
                <td>文本、属性、布尔属性、事件/属性绑定均有 XSS 回归测试。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>修复 <span class="inline-code">create-kiss</span> 模板</td>
                <td>新项目可执行 <span class="inline-code">deno task dev</span> 与三阶段构建。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>拒绝脚手架覆盖已有目录和路径逃逸</td>
                <td>已有目录、非空目录、<span class="inline-code">../</span> 目标均失败并给出清晰错误。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>修复嵌套 island SSR 路径</td>
                <td><span class="inline-code">app/islands/foo/bar.ts</span> 能同时 SSR 和 client build。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>修复 manifest chunk URL 双 <span class="inline-code">islands</span></td>
                <td>测试断言完整 URL，不只断言包含文件名。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>SSG smoke 测试默认运行</td>
                <td>CI 真实跑 Phase 1/2/3 docs build，不再只标记 ignore。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>文档术语统一</td>
                <td>用户文档使用 Island Upgrade；历史 changelog 可保留 hydration 作为历史语境。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>版本号和发布配置对齐</td>
                <td>deno.json、package.json、README、JSR 导出无冲突。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>Deno-first 工具链基线</td>
                <td>仓库默认 <span class="inline-code">dev</span> / <span class="inline-code">build</span> / package build 不依赖 <span class="inline-code">npm</span> 或 <span class="inline-code">npx</span>；Deno 2.7+ 提供 Vite 8 所需的 <span class="inline-code">node:util.parseEnv</span> 兼容。</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.6.0 DSD Renderer 2</h2>
          <p>
            v0.6 是架构审查后确认的优先路线：先把 DSD renderer 的安全边界、
            递归渲染和错误可观测性做扎实，再继续扩大 Island Upgrade 和 fullstack 能力。
          </p>
          <table class="task-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>任务</th>
                <th>验收标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="priority-p0">P0</td>
                <td>定义 <span class="inline-code">render(): string</span> 安全契约</td>
                <td>文档明确 string render 是 unsafe HTML；设计 safe template helper 与显式 <span class="inline-code">unsafeHTML</span> 边界。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>实现 safe template helper</td>
                <td>默认文本和属性转义；显式 unsafeHTML 才允许原样插入。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>nested DSD</td>
                <td>父组件输出子 custom element 时，子组件可递归渲染为 DSD。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>slot/projection 语义</td>
                <td>layout、page、island 的 slot 投影有覆盖测试。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>错误边界</td>
                <td>组件实例化/渲染失败时构建报错可定位，包含 tag、route、原因，不再只输出空壳。</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.7.0 Island Upgrade</h2>
          <table class="task-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>任务</th>
                <th>验收标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="priority-p0">P0</td>
                <td>页面级 island manifest</td>
                <td>每个 HTML 只注入当前页面实际出现的 island entry。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>真实 upgrade 策略</td>
                <td><span class="inline-code">eager</span>、<span class="inline-code">idle</span>、<span class="inline-code">visible</span> 有浏览器测试。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>Island 通信标准化</td>
                <td>提供 CustomEvent / BroadcastChannel 官方模式，不引入全局 store。</td>
              </tr>
              <tr>
                <td class="priority-p2">P2</td>
                <td>View Transitions 增强</td>
                <td>可选 MPA 页面过渡，不引入 SPA runtime。</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.8.0 Serverless Fullstack</h2>
          <p>
            v0.8 之后再展开更完整的应用约定。博客系统是近期最合适的产品化样板；
            CRM/admin 属于更靠后的中期目标，等 forms、auth、validation 和 data
            loading 约定稳定后再作为官方示例推进。
          </p>
          <table class="task-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>任务</th>
                <th>验收标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="priority-p0">P0</td>
                <td>Deno Deploy 和 Cloudflare Workers adapter</td>
                <td>同一 Hono API routes 可产出两个部署目标。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>FormData actions</td>
                <td>原生表单提交、验证错误、重定向和 JSON 响应均可用。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>typed RPC generation</td>
                <td>从 Hono route 类型生成或导出客户端调用类型。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>env/secrets 规范</td>
                <td>dev/build/deploy 使用一致的配置入口和文档。</td>
              </tr>
              <tr>
                <td class="priority-p2">P2</td>
                <td><span class="inline-code">@kissjs/blog</span> 设计落地</td>
                <td>Markdown/frontmatter、listing、post、tag、pagination、feed 和 sitemap 作为 plain SSG plugin 先行。</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.9.0 SSG + ISR + PWA</h2>
          <table class="task-table">
            <thead>
              <tr>
                <th>优先级</th>
                <th>任务</th>
                <th>验收标准</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="priority-p0">P0</td>
                <td>route-level ISR config</td>
                <td><span class="inline-code">revalidate</span>、fallback、stale response 语义明确。</td>
              </tr>
              <tr>
                <td class="priority-p0">P0</td>
                <td>cache lock</td>
                <td>避免 serverless 并发请求同时再生成同一路由。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>PWA strategy 2</td>
                <td>HTML network-first，assets cache-first，版本更新不会回退旧首页。</td>
              </tr>
              <tr>
                <td class="priority-p1">P1</td>
                <td>Edge/CDN cache recipes</td>
                <td>Cloudflare、Deno Deploy、静态 CDN 至少各有一份部署文档。</td>
              </tr>
            </tbody>
          </table>

          <h2>v0.10.0 .kiss Compiler Alpha</h2>
          <p>
            <span class="inline-code">.kiss</span> compiler 仍然值得保留，但它是长期增强，
            不应阻塞 v0.5-v0.9 的可信内核。目标是把 Lit 从推荐实现降级为可选 adapter，
            不是在当前阶段强制迁移所有用户代码。
          </p>

          <h2>设计原则</h2>
          <ul class="principle-list">
            <li>Web Standards first，不用私有 runtime 复刻浏览器已经拥有的能力。</li>
            <li>DSD first，页面内容必须在 JavaScript 加载前可见。</li>
            <li>Island upgrade，不再把当前模型描述为传统 hydration。</li>
            <li>SSG first，ISR 是 serverless/edge adapter 之后的增强。</li>
            <li>Lit adapter, not foundation。Lit 可用，但 core 的长期边界必须独立。</li>
            <li>Documentation must be falsifiable。文档只描述已实现能力，未来能力进入 roadmap。</li>
          </ul>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; 示例</a>
            <a href="/changelog" class="nav-link">更新日志 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

export const meta = { section: 'Roadmap & Decisions', label: 'Roadmap', order: 10 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class RoadmapPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .phase {
        margin: 1rem 0;
        padding: 1rem 1.25rem;
        border-left: 2px solid var(--less-border-hover);
        background: var(--less-bg-surface);
        border-radius: 0 4px 4px 0;
      }

      .phase h3 {
        margin-top: 0;
      }

      .status {
        display: inline-block;
        margin-bottom: 0.35rem;
        color: var(--less-text-muted);
        font-size: 0.6875rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .version-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.8125rem;
      }
      .version-table th,
      .version-table td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 0.5px solid var(--less-border);
      }
      .version-table th {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--less-text-muted);
      }
      .version-table td:first-child {
        font-weight: 600;
        color: var(--less-text-primary);
        white-space: nowrap;
      }

      .criteria-list {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0;
      }
      .criteria-list li {
        padding: 0.25rem 0;
        padding-left: 1.25rem;
        position: relative;
        color: var(--less-text-secondary);
        font-size: 0.8125rem;
      }
      .criteria-list li::before {
        content: "○";
        position: absolute;
        left: 0;
        color: var(--less-text-muted);
      }
      .criteria-list li.met::before {
        content: "●";
        color: var(--less-accent);
      }

      .callout {
        margin: 1.5rem 0;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/roadmap">
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            LessJS 的路线图围绕一个判断展开：先把 SSG + DSD + Island Upgrade + Hono API
            做可信，再扩展 serverless fullstack、ISR、PWA 和 compiler，最终在公共 API
            稳定后承诺 1.0。
          </p>

          <div class="callout">
            <p>
              Roadmap 不是宣传页。这里列出的未来项只有进入实现和测试后，才会被写成稳定用户指南。
              版本号策略详见
              <a href="/decisions/0006-version-strategy">ADR 0006</a>。
            </p>
          </div>

          <h2>Now: v0.9 — Content Pipeline + SSR Property Bindings 🚧</h2>
          <p>
            v0.8.0 完成了 P1 功能完善（390 测试），v0.9.0 在此基础上推进内容管线和 SSR 修复：
            @lessjs/content 统一内容插件（Blog + Nav + Sitemap 三合一）、
            SSR 属性绑定保留（.prop 不再被剥离，转为 kebab-case HTML 属性 + JSON 序列化）、
            Monorepo 包版本策略确立（ADR 0006 补充）。
            378+ 测试通过（content 25 个新增）。
          </p>
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TC39 Signals 二开</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">@lessjs/signal</span>：
                  <span class="inline-code">signal()</span>、
                  <span class="inline-code">computed()</span>、
                  <span class="inline-code">effect()</span>、
                  <span class="inline-code">islandEffect()</span>。 浏览器原生 <span class="inline-code"
                  >Signal</span> 条件回退。
                </td>
              </tr>
              <tr>
                <td>DSD 规范对齐</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">shadowrootdelegatesfocus</span>、
                  <span class="inline-code">shadowrootserializable</span>、
                  <span class="inline-code">shadowrootslotassignment</span>、
                  <span class="inline-code">shadowrootcustomelementregistry</span>。
                  <span class="inline-code">inferDsdOptions()</span> 自动推断。
                </td>
              </tr>
              <tr>
                <td>Form-Associated CE</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">less-button</span>、
                  <span class="inline-code">less-input</span> 使用
                  <span class="inline-code">ElementInternals</span>，支持
                  <span class="inline-code">:state()</span> 伪类。
                </td>
              </tr>
              <tr>
                <td>Navigation API</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">navigate()</span>、
                  <span class="inline-code">onNavigate()</span>、
                  <span class="inline-code">matchRoute()</span>。 URLPattern + regex fallback。
                </td>
              </tr>
              <tr>
                <td>Speculative Loading</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">&lt;link rel="modulepreload"&gt;</span> for eager；
                  <span class="inline-code">&lt;link rel="prefetch"&gt;</span> for lazy。
                </td>
              </tr>
              <tr>
                <td>dialog/popover + inert</td>
                <td>✅ Done</td>
                <td>
                  原生 <span class="inline-code">&lt;dialog&gt;</span> +
                  <span class="inline-code">::backdrop</span> +
                  <span class="inline-code">inert</span> 无障碍。
                </td>
              </tr>
              <tr>
                <td>Island 系统改进</td>
                <td>✅ Done</td>
                <td>
                  Mixin 替代猴子补丁，适配器显式注入，
                  <span class="inline-code">idle</span> 降级改进。
                </td>
              </tr>
              <tr>
                <td>Quick Wins</td>
                <td>✅ Done</td>
                <td>
                  <span class="inline-code">prefers-color-scheme</span>、escapeHtml 统一、 语义化
                  HTML、CSS 去重。
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Release Phases</h2>
          <div class="phase">
            <span class="status">v0.5.3 done</span>
            <h3>Trust Release</h3>
            <p>
              修复根 middleware scope、island chunk 双前缀、strategy 传递、嵌套 island 路径、SSG CSP
              注入和 DEFAULT_NAV 同步。 文档承诺与构建产物对齐，309 测试通过，构建全流程验证。
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.6.0-alpha.1 done</span>
            <h3>DSD + Island Architecture + Signals + Web Standards</h3>
            <p>
              Declarative Shadow DOM SSR、Safe/Unsafe HTML 品牌类型、L2 嵌套 DSD 递归渲染、 CSS Custom
              Properties 主题系统（替代 _propagateTheme DOM 遍历）、Island 懒加载策略、 TC39
              signal-polyfill 二开（signal/computed/effect/islandEffect）、 DSD
              规范对齐（delegatesFocus/serializable/slotAssignment/scopedRegistry）、 Form-Associated CE +
              ElementInternals + :state()、Navigation API + URLPattern、 Speculative
              Loading、dialog/popover + inert、Island Mixin。 322 测试通过，deno lint 零警告。
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.6.x — in progress</span>
            <h3>v0.6 Stabilization</h3>
            <p>
              alpha 反馈收集、回归测试增强、文档补全。v0.6.0 正式版发布前需要验证所有新增 Web Standards
              功能在真实应用中的表现。
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.7.0 — done</span>
            <h3>稳定基线（P0 审计修复）</h3>
            <p>
              基于四维审计（2026-05-07）的 P0 紧急修复。消除不可信行为，建立工程纪律。
              包含破坏性变更（XSS 修复、catch 行为变更），因此升 MINOR。
              354 测试通过，lessjs.com 上线 Cloudflare Pages。
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.8.0 — done</span>
            <h3>功能完善 + Island Manifest + @lessjs/content</h3>
            <p>
              P1 审计修复 + Island 系统演进。补全测试覆盖、统一组件模型、
              引入页面级 island manifest 替代全局入口。
              @lessjs/content 包已启动（SSG 插件形态，替代 @lessjs/blog）。
              390 测试通过。Playwright E2E 测试 10 个（移至 docs/e2e/）。
            </p>
            <table class="version-table">
              <thead>
                <tr><th>任务</th><th>说明</th><th>状态</th></tr>
              </thead>
              <tbody>
                <tr><td>signals 测试套件</td><td>19 个测试覆盖 signal/computed/effect/islandEffect</td><td>✅ Done</td></tr>
                <tr><td>dsd-hydration.ts 单元测试</td><td>13 个测试覆盖 DsdLitElement Mixin</td><td>✅ Done</td></tr>
                <tr><td>Signal 原生切换</td><td>isNativeSignal() + globalThis.Signal 回退</td><td>✅ Done</td></tr>
                <tr><td>render-dsd.ts 拆分</td><td>770 行拆为 4 模块</td><td>✅ Done</td></tr>
                <tr><td>UI 统一到 DsdLitElement</td><td>3 个组件迁移到 Mixin</td><td>✅ Done</td></tr>
                <tr><td>insertAfterHead 去重</td><td>ui → core</td><td>✅ Done</td></tr>
                <tr><td>包版本统一</td><td>core 0.8.0, adapter-lit 0.6.3</td><td>✅ Done</td></tr>
                <tr><td>定位重写</td><td>静态站点框架 + 混合框架/编译器演进方向</td><td>✅ Done</td></tr>
                <tr><td>Island Upgrade Manifest</td><td>页面级 island 清单 + JSON 落盘</td><td>✅ Done</td></tr>
                <tr><td>@lessjs/content 开发启动</td><td>Vite 插件 + Markdown 解析 + 路由生成（替代 @lessjs/blog）</td><td>✅ Done</td></tr>
                <tr><td>Interactive Playground</td><td>StackBlitz 一键体验</td><td>⬜ Planned</td></tr>
                <tr><td>Playwright E2E 测试</td><td>浏览器级集成测试（已移至 docs/e2e/）</td><td>✅ Done</td></tr>
                <tr><td>Speculative Loading 可观测</td><td>策略浏览器测试</td><td>⬜ Planned</td></tr>
              </tbody>
            </table>
          </div>

          <div class="phase">
            <span class="status">v0.9.0 — in progress</span>
            <h3>Content Pipeline + SSR Property Bindings</h3>
            <p>
              @lessjs/content 统一内容插件（Blog + Nav + Sitemap 三合一 opt-in），
              替代 @lessjs/blog。Nav 模块自动扫描路由 meta 生成 sidebar（virtual:less-nav），
              Sitemap 模块 SSG 后自动生成 sitemap.xml + robots.txt。
              SSR 属性绑定保留为 HTML 属性（.prop → kebab-case attr + JSON 序列化），
              修复数据驱动组件在 SSR 阶段收到空数据的问题。
              Monorepo 包版本策略确立（ADR 0006 补充）。
              378+ 测试通过。
            </p>
            <table class="version-table">
              <thead>
                <tr><th>任务</th><th>说明</th><th>状态</th></tr>
              </thead>
              <tbody>
                <tr><td>@lessjs/content</td><td>Blog + Nav + Sitemap 三合一统一内容插件</td><td>✅ Done</td></tr>
                <tr><td>Nav 自动生成</td><td>路由 meta 扫描 → NavSection[] + virtual:less-nav</td><td>✅ Done</td></tr>
                <tr><td>Sitemap SSG 集成</td><td>SSG 后自动生成 sitemap.xml + robots.txt</td><td>✅ Done</td></tr>
                <tr><td>SSR 属性绑定保留</td><td>.prop → kebab-case attr + JSON 序列化</td><td>✅ Done</td></tr>
                <tr><td>Monorepo 包版本策略</td><td>ADR 0006 补充：谁改了谁升级</td><td>✅ Done</td></tr>
                <tr><td>Interactive Playground</td><td>StackBlitz 一键体验</td><td>⬜ Planned</td></tr>
                <tr><td>Speculative Loading 可观测</td><td>策略浏览器测试</td><td>⬜ Planned</td></tr>
                <tr><td>Docs 路由清理</td><td>删除 /demo、/examples、/styling/less-ui；合并 @lessjs/ui 文档到 /ui</td><td>✅ Done</td></tr>
                <tr><td>仓库清理</td><td>删除 deliverables/、demo/、docs/index.html；e2e/ → docs/e2e/</td><td>✅ Done</td></tr>
              </tbody>
            </table>
          </div>

          <div class="phase">
            <span class="status">v0.10.0</span>
            <h3>Serverless Fullstack + ISR + PWA</h3>
            <p>
              Promote Hono API routes into a complete app story: FormData actions, typed RPC, env/secrets,
              deployment adapters. 路由级 revalidation、缓存锁、stale fallback、Service Worker 策略。
              ISR should arrive only after adapter semantics are clear.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.11.0</span>
            <h3>基础设施成熟 + Compiler Alpha</h3>
            <p>
              P2 审计修复 + .less Compiler Alpha 引入。AST 替代手工 runtime-shim（根治最大技术债）、
              增量 SSG 构建、性能基准、覆盖率门禁、视觉回归测试、安全审计自动化。
              Compiler 需要稳定的 DSD renderer 作为编译目标，因此排在 AST 替换之后。
            </p>
          </div>

          <div class="phase">
            <span class="status">v1.0.0</span>
            <h3>API 稳定承诺</h3>
            <p>
              当以下条件全部满足时，可以打 1.0.0：
            </p>
            <ul class="criteria-list">
              <li>核心模块测试覆盖率 ≥ 80%</li>
              <li>CI 全链路门禁就位（test + typecheck + lint + coverage gate）</li>
              <li>runtime-shim 由 AST 生成，不再手工维护</li>
              <li>公共 API 列表明确文档化（exports、config、CLI flags）</li>
              <li>至少 3 个真实项目 dogfooding</li>
              <li>无 P0/P1 级已知 Bug</li>
            </ul>
            <p>
              1.0.0 不要求 Compiler 生产可用或 ISR 生产可用——这些是 1.x 的增量工作。
            </p>
          </div>

          <div class="phase">
            <span class="status">v1.x</span>
            <h3>增量演进</h3>
            <p>
              1.0 后公共 API 视为稳定，Breaking Change 必须升 MAJOR。
              增量工作包括：Compiler Beta → Stable、@lessjs/content 包完善、Fullstack 示例丰富、
              更多 adapter（Vue/React island bridge）等。
            </p>
          </div>

          <div class="phase">
            <span class="status">v2.0.0（如果需要）</span>
            <h3>Compiler 成为默认</h3>
            <p>
              只有当 .less Compiler 生产可用、社区已自然迁移、将 Compiler 设为默认会破坏现有 Lit
              用户工作流时，才需要 2.0。如果 Lit 兼容模式可以无缝共存，则不需要 2.0。
            </p>
          </div>

          <h2>版本号逻辑</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>版本段</th>
                <th>含义</th>
                <th>Breaking Change</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>v0.7–0.10</td>
                <td>框架在定义自己</td>
                <td>MINOR 升级允许</td>
              </tr>
              <tr>
                <td>v0.11</td>
                <td>过渡版本：基础设施成熟 + 新能力引入</td>
                <td>尽量减少</td>
              </tr>
              <tr>
                <td>v1.0</td>
                <td>公共 API 冻结</td>
                <td>绝不允许</td>
              </tr>
              <tr>
                <td>v1.x</td>
                <td>增量扩展</td>
                <td>公共 API 不破坏</td>
              </tr>
              <tr>
                <td>v2.0</td>
                <td>范式转换（如果需要）</td>
                <td>允许，需迁移指南</td>
              </tr>
            </tbody>
          </table>

          <h2>Product Direction</h2>
          <p>
            Near-term examples should focus on docs, blogs, content sites, product pages and light
            serverless apps. CRM/admin style applications are valid medium-term targets, but they need
            stronger forms, auth, validation, data loading and revalidation contracts before becoming
            official showcase material.
          </p>

          <h2>Principles</h2>
          <ul>
            <li>Web Standards first: prefer platform primitives over framework-specific protocols.</li>
            <li>Static first: dynamic runtime behavior must be explicit.</li>
            <li>DSD first: readable HTML exists before JavaScript runs.</li>
            <li>
              Island upgrade: client JavaScript upgrades interactive components, not the whole page.
            </li>
            <li>
              TC39 Signals first: 二开 signal-polyfill 跟标准走，框架造自己的 effect/islandEffect API。
            </li>
            <li>
              Docs are falsifiable: current guides describe current behavior; future work stays here.
            </li>
          </ul>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

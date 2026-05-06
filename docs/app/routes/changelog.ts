/**
 * Changelog Page — LessJS Framework Version History
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class ChangelogPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .version-section {
        margin: 2rem 0;
        padding: 1.5rem;
        background: var(--less-bg-surface);
        /* 0.5px: reduced to match less-ui spec */
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
      }
      .version-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .version-number {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--less-text-primary);
      }
      .version-date {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        padding: 0.25rem 0.5rem;
        background: var(--less-bg-elevated);
        border-radius: 3px;
      }
      .change-category {
        margin: 1rem 0;
      }
      .change-category h4 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--less-text-muted);
        margin-bottom: 0.5rem;
      }
      .change-category.added h4 {
        color: var(--less-accent);
      }
      .change-category.changed h4 {
        color: var(--less-accent-dim);
      }
      .change-category.fixed h4 {
        color: var(--less-text-secondary);
      }
      .change-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .change-list li {
        padding: 0.375rem 0;
        padding-left: 1.25rem;
        position: relative;
        color: var(--less-text-secondary);
        font-size: 0.875rem;
      }
      .change-list li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--less-text-muted);
      }
      .version-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.875rem;
      }
      .version-table th,
      .version-table td {
        padding: 0.75rem 1rem;
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
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/changelog">
        <div class="container">
          <h1>更新日志</h1>
          <p class="subtitle">
            LessJS 的所有重要变更都记录在这里。
          </p>

          <p>
            格式基于
            <a href="https://keepachangelog.com/zh-CN/1.0.0/" target="_blank"
            >Keep a Changelog</a>，本项目遵循
            <a href="https://semver.org/lang/zh-CN/" target="_blank">语义化版本 2.0.0</a>。
            历史条目保留当时术语；当前文档统一把 LessJS 的客户端模型称为 Island Upgrade，而不是传统
            hydration。
          </p>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.6.0</span>
              <span class="version-date">2026-05-06</span>
            </div>
            <div class="change-category added">
              <h4>新增</h4>
              <ul class="change-list">
                <li>
                  <strong>L2 Nested DSD</strong>：<span class="inline-code">renderDSD()</span>
                  现在递归渲染嵌套 Custom Element。页面组件模版中的
                  <span class="inline-code">&lt;less-layout&gt;</span>、
                  <span class="inline-code">&lt;less-theme-toggle&gt;</span> 等子组件
                  都会生成 <span class="inline-code">&lt;template shadowrootmode="open"&gt;</span>，
                  不需要等 JS 升级就能渲染 Shadow DOM。
                </li>
                <li>
                  <strong>Sidebar SSR 首次渲染</strong>：less-layout 的 sidebar/header/footer
                  在 HTML 中静态存在，全部 CSS 在 DSD 模版内，不依赖 client JS 加载。
                </li>
              </ul>
            </div>
            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>
                  <strong>@lessjs/core 升至 0.6.0</strong>：包含 L2 Nested DSD 实现。
                  其他包版本根据自身情况独立管理。
                </li>
              </ul>
            </div>
            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>
                  <strong>首页 content 被 sidebar BFC 裁剪</strong>：<span class="inline-code">:host([home]) .docs-sidebar { width:0; overflow:hidden }</span>
                  创建的 BFC 会裁剪相邻 flex 子项。改为条件渲染：home 时不渲染 desktop sidebar，
                  移动端用独立 <span class="inline-code">mobile-sidebar-overlay</span> overlay。
                </li>
                <li>
                  <strong>sidebar 样式不依赖 JS</strong>：less-layout 无 DSD 时 sidebar CSS 只在 JS 中，
                  Cloudflare Rocket Loader / SW 缓存导致 sidebar 完全无样式。
                  DSD 将全部 CSS 静态写入 HTML。
                </li>
                <li>
                  <strong>仓库迁移</strong>：<span class="inline-code">SisyphusZheng/kiss</span>
                  → <span class="inline-code">lessjs-run/lessjs</span>，remote 已更新。
                </li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.5.5</span>
              <span class="version-date">2026-05-06</span>
            </div>
            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>
                  <strong>全面品牌重塑 KISS → LessJS 完成</strong>：包名 <span class="inline-code">@kissjs/*</span>
                  → <span class="inline-code">@lessjs/*</span>，主函数 <span class="inline-code">kiss()</span>
                  → <span class="inline-code">less()</span>，全部类名、变量名、注释完成迁移。
                  涉及 105 个文件，1171 行新增，905 行删除。
                </li>
                <li>
                  <strong>文档站全站品牌更新</strong>：CSS 变量 <span class="inline-code">--kiss-*</span>
                  → <span class="inline-code">--less-*</span>（69 处），域名 <span class="inline-code">kiss.js.org</span>
                  → <span class="inline-code">lessjs.com</span>，路由 <span class="inline-code">/kiss-compiler</span>
                  → <span class="inline-code">/less-compiler</span>，README.en.md 全文重写。
                </li>
                <li>
                  <strong>版本号提升</strong>：core 0.5.4→0.5.5，ui 0.5.4→0.5.5，
                  rpc 0.3.0→0.3.1，adapter-lit 0.2.0→0.2.1，create 0.4.5→0.4.6。
                </li>
              </ul>
            </div>
            <div class="change-category fixed">
              <h4>修复</h4>
              <ul class="change-list">
                <li>
                  <strong>移动端 sidebar 无法打开（全浏览器）</strong>：首页 <span class="inline-code">&lt;less-layout home&gt;</span>
                  因 <span class="inline-code">home=true</span> 使用了 <span class="inline-code">display:none</span> 隐藏 sidebar，
                  导致 <span class="inline-code">transform</span> 无法作用于无盒模型的元素。
                  修复为 <span class="inline-code">width:0 + overflow:hidden</span>，保留盒模型使 transform 生效。
                </li>
                <li>
                  <strong>移动端首页 hamburger 只显示遮罩无 sidebar</strong>：改为始终渲染 sidebar，
                  桌面端折叠（width:0），移动端恢复尺寸，配合 <span class="inline-code">:host([menu-open])</span> CSS 控制显隐。
                </li>
                <li>
                  <strong>PWA manifest.json favicon 路径错误</strong>：<span class="inline-code">/favicon.svg</span>
                  → <span class="inline-code">/assets/less-logo.svg</span>，修复浏览器默认 favicon 请求 404。
                </li>
                <li>
                  <strong>dnt npm 构建失败</strong>：<span class="inline-code">packages/rpc/_build_npm.ts</span>
                  的 LICENSE 路径错误（<span class="inline-code">../LICENSE</span> → <span class="inline-code">../../LICENSE</span>）。
                </li>
                <li>
                  <strong>CI 格式检查修复</strong>：deno fmt 格式化 5 个文件，deno lint 清理未使用 imports，
                  publish exclusion 配置修复（<span class="inline-code">!dist</span> 取消 gitignore 排除）。
                </li>
                <li>
                  <strong>遗留 KISS 引用清理</strong>：<span class="inline-code">__kissLit*</span> 全局变量
                  → <span class="inline-code">__lessLit*</span>，<span class="inline-code">.kiss-row</span> CSS 类
                  → <span class="inline-code">.less-row</span>，文档中构建路径引用更新。
                </li>
              </ul>
            </div>
          </div>

          <div class="version-section">
            <div class="version-header">
              <span class="version-number">0.5.3</span>
              <span class="version-date">2026-05-05</span>
            </div>
            <div class="change-category changed">
              <h4>变更</h4>
              <ul class="change-list">
                <li>
                  <strong>Trust
                    Release</strong>：消除文档承诺与构建产物之间的信任差距，框架已承诺的每个行为现在都可以验证。
                  </li>
                  <li>
                    <strong>导航重构</strong>：DEFAULT_NAV 从 9 section 精简为 7 section（Start Here / Core
                    Model / Production / Packages / Strategy / Examples / History），与 nav-data.ts
                    完全同步。
                  </li>
                  <li>
                    <strong>declare + constructor 模式</strong>：所有 @lessjs/ui 组件和 docs island 改为
                    <span class="inline-code">declare</span> reactive fields + constructor 初始化，避免
                    class field 覆盖 Lit 生成的属性 accessor。
                  </li>
                  <li>
                    <strong>customElements.get() 守卫</strong>：所有 island 注册改为 <span
                      class="inline-code"
                    >if (!customElements.get(tagName))</span>，防止 HMR 和 SSR + client
                    重叠时的重复定义错误。
                  </li>
                  <li>
                    <strong>文档大修</strong>：14 个 guide 页面重写，新增 /guide/positioning 页面，roadmap
                    从任务表格改为分阶段叙述，首页去掉对比表改为 "Read Next" grid。
                  </li>
                  <li>
                    <strong>版本号</strong>：@lessjs/core 升至 0.5.3，@lessjs/ui 升至 0.5.2。
                  </li>
                </ul>
              </div>
              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>根 middleware scope 修复</strong>：<span class="inline-code"
                    >_middleware.ts</span> 在项目根目录时生成 <span class="inline-code"
                    >app.use('//*', ...)</span>，仅匹配 <span class="inline-code">/</span>
                    而非所有子路由。安全中间件和认证守卫对子路由静默失效。现改为 <span class="inline-code"
                    >app.use('/*', ...)</span>。
                  </li>
                  <li>
                    <strong>islandChunkMap 双前缀修复</strong>：Vite manifest 的 <span class="inline-code"
                    >entry.file</span> 已包含 <span class="inline-code">islands/</span> 前缀，<span
                      class="inline-code"
                    >buildIslandChunkMap</span> 又拼接了一次，导致 SSG HTML 中 island 脚本 URL 404。
                  </li>
                  <li>
                    <strong>island strategy 传递修复</strong>：<span class="inline-code"
                    >PackageIslandMeta.strategy</span>（eager/lazy/idle/visible）在 build-client
                    中被完全丢弃。所有 package island 无论配置如何都使用默认加载行为。
                  </li>
                  <li>
                    <strong>嵌套 island 路径修复</strong>：<span class="inline-code"
                    >app/islands/posts/index.ts</span> 生成的 tagName <span class="inline-code"
                    >posts-index</span> 被反推为 <span class="inline-code"
                    >islands/posts-index.ts</span>（不存在的路径）。新增 <span class="inline-code"
                    >islandFiles</span> 参数传递原始扫描路径。
                  </li>
                  <li>
                    <strong>SSG CSP meta 注入</strong>：SSR 模式有 CSP header，但 SSG 输出的静态 HTML
                    完全没有 CSP。现通过 <span class="inline-code">injectCspMeta()</span> 注入 <span
                      class="inline-code"
                    >&lt;meta http-equiv="Content-Security-Policy"&gt;</span>。
                  </li>
                  <li>
                    <strong>lit html 模板反引号修复</strong>：getting-started.ts 和 error-handling.ts
                    的目录树/错误层级使用反引号字符，在 lit <span class="inline-code">html</span>
                    模板字面量中破坏 Vite/rolldown 解析。
                  </li>
                </ul>
              </div>
              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>3 个回归测试文件</strong>：entry-descriptor.test.ts（scope + 路径 + islandFiles
                    断言）、entry-generators.test.ts（strategy
                    传递断言）、ssg-postprocess.test.ts（无双前缀断言）。测试从 296 涨至 309。
                  </li>
                  <li>
                    <strong>/guide/positioning 页面</strong>：Framework Positioning，解释 LessJS
                    解决什么问题以及它暂时不解决什么问题。
                  </li>
                  <li>
                    <strong>escapeHtml 交叉引用</strong>：adapter-lit/ssr.ts 中的 escapeHtml 加注释指向
                    @lessjs/core/render-dsd.ts 的 canonical 实现。
                  </li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.5.1</span>
                <span class="version-date">2026-05-04</span>
              </div>
              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>Lit Island 响应式修复</strong>：docs demo、@lessjs/ui 交互组件和 create-kiss
                    模板改为 <span class="inline-code">declare</span> reactive fields，并在 constructor
                    中初始化，避免 class field 覆盖 Lit 生成的属性 accessor。
                  </li>
                  <li>
                    <strong>线上 demo 可交互性</strong>：修复
                    <span class="inline-code">/demo</span> 页面中 Refresh、Say Hello 和 counter
                    点击后不触发重渲染的问题。
                  </li>
                  <li>
                    <strong>回归测试</strong>：新增 reactive property shadowing 测试，防止后续组件再次把 Lit
                    accessor 盖掉。
                  </li>
                  <li>
                    <strong>版本号</strong>：@lessjs/ui 升至 0.5.1，@lessjs/create 升至 0.4.5。
                  </li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.5.0</span>
                <span class="version-date">2026-05-04</span>
              </div>
              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>正式单命令构建</strong>：用户主路径收口为
                    <span class="inline-code">deno task build</span>，内部仍保留 SSR bundle、client island
                    chunks、SSG 三个可观测阶段。
                  </li>
                  <li>
                    <strong>Core/Lit 边界收紧</strong>：docs route components 直接从
                    <span class="inline-code">lit</span> 导入 <span class="inline-code">css</span> /
                    <span class="inline-code">html</span> / <span class="inline-code">LitElement</span>，
                    <span class="inline-code">@lessjs/core</span> 不再通过 docs runtime shim 暴露 Lit。
                  </li>
                  <li>
                    <strong>0.x 公共面收口</strong>：移除未实现的
                    <span class="inline-code">renderNestedDsd()</span> stub，nested DSD 留到 v0.6 的 DSD
                    Renderer 2 正式设计。
                  </li>
                  <li>
                    <strong>Roadmap 刷新</strong>：吸收 2026-05-04 架构审查结论，明确 v0.6 优先 DSD Renderer
                    2，博客/文档/内容站是近期产品化样板，CRM/admin 放到中期。
                  </li>
                  <li>
                    <strong>版本号</strong>：@lessjs/core 升至 0.5.2，@lessjs/ui 升至 0.5.0，@lessjs/rpc
                    升至 0.3.0，@lessjs/adapter-lit 升至 0.2.0，@lessjs/create 升至 0.4.4。
                  </li>
                </ul>
              </div>
              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>adapter-lit 安全插值</strong>：Lit TemplateResult 的动态文本和属性值默认转义，
                    事件绑定和 property 绑定在 SSR HTML 中剥离。
                  </li>
                  <li>
                    <strong>create-kiss 模板</strong>：新项目显式映射
                    <span class="inline-code">lit</span> / <span class="inline-code">@lessjs/core</span> /
                    <span class="inline-code">@lessjs/ui</span>，路由和 island 模板直接导入 Lit。
                  </li>
                  <li>
                    <strong>发布信任测试</strong>：SSG smoke 不再默认全部 ignore；adapter-lit 和 create-kiss
                    增加正式版阻塞测试。
                  </li>
                  <li>
                    <strong>CI 发布补丁</strong>：GitHub Actions 测试任务显式授予
                    <span class="inline-code">--allow-run</span>，create-kiss 模板显式安装 Vite 和 Lit 在
                    SSR 分支需要的 <span class="inline-code">@lit-labs/ssr-dom-shim</span>，并修复 JSR
                    远程运行时的 <span class="inline-code">@lessjs/core/less-runtime</span>、
                    <span class="inline-code">@lessjs/ui</span> package island、Lit adapter 解析路径。
                  </li>
                  <li>
                    <strong>Island 自注册</strong>：脚手架生成的 counter island 现在调用
                    <span class="inline-code">customElements.define()</span>，匹配 client entry 的动态
                    import 副作用注册契约。
                  </li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.5.0-alpha.4</span>
                <span class="version-date">2026-05-04</span>
              </div>
              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>ADR 文档站路由</strong>：docs/decisions/*.md 通过 Vite raw import
                    直接显示在文档站 sidebar 中。
                  </li>
                  <li>
                    <strong>README 重写</strong>：重新定义 LessJS 为 Deno-first、Web Standards-first、DSD +
                    Web Components + Islands 的 fullstack 框架。
                  </li>
                </ul>
              </div>
              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>Deno 2.7+ 基线</strong>：主构建、docs 构建和 GitHub Pages workflow 回到
                    Deno-first，不再依赖 npm/npx 主流程。
                  </li>
                  <li>
                    <strong>Roadmap 与架构文档重整</strong>：v0.5 到 v1.0 的 DSD Renderer、Island
                    Upgrade、Serverless、SSG/ISR、.less compiler 路线重新分层。
                  </li>
                  <li>
                    <strong>版本号</strong>：@lessjs/core 升至 0.5.0-alpha.4，@lessjs/ui 升至
                    0.4.6，@lessjs/adapter-lit 升至 0.1.4。
                  </li>
                </ul>
              </div>
              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>Package island default export warning</strong>：SSR entry 不再假设 package
                    island 暴露 default export，@lessjs/ui 副作用注册模式不再触发 Vite/Rolldown warning。
                  </li>
                  <li>
                    <strong>CI package island 解析</strong>：docs Vite config 显式解析 @lessjs/ui 子路径，CI
                    不再依赖本地 node_modules junction。
                  </li>
                  <li>
                    <strong>Docs navigation</strong>：less-layout 默认 sidebar 和 header 补齐 Decisions /
                    ADR 入口，文档站可直接发现架构决策记录。
                  </li>
                  <li>
                    <strong>Phase 2/3 工作目录</strong>：build:client 和 build:ssg 从 docs 目录读取 .less
                    metadata，build:all 不再依赖残留产物。
                  </li>
                </ul>
              </div>
            </div>

            <h2>
              v0.5.0-alpha.1 — 架构审计与精准修复 <span
                style="font-size:0.75rem;color:var(--less-text-muted);font-weight:400"
              >2026-05-02</span>
            </h2>

            <h3>修复</h3>
            <ul>
              <li>
                <strong>CSS 注入修复：</strong> extractLitStyles() 错误假设 Lit 3.x CSSResult 有 strings
                属性，实际只有 cssText。修复为直接使用 cssText，删除 42 行无用代码。<code
                >packages/kiss-adapter-lit/src/ssr.ts</code>
              </li>
              <li>
                <strong>Island upgrade 修复：</strong> api-consumer 在父 DSD shadow DOM
                内升级时，connectedCallback 中同步调用 _fetchStatus() 导致 LitElement
                更新管线竞态卡死。修复为 updateComplete.then()。<code
                >docs/app/islands/api-consumer.ts</code>
              </li>
            </ul>

            <h3>改进</h3>
            <ul>
              <li>
                <strong>全量架构审计：</strong> 3 agent 深度扫描 13,000+ 行代码，发现 P0-5 项、P1-9 项、P2-7
                项
              </li>
              <li>
                <strong>配置精简：</strong> 删除 jsr.json（冗余）+ 不必要 package.json，统一为单一 deno.json
                配置源
              </li>
              <li>
                <strong>10 条设计原则确立：</strong> 新增 Lit Update Safety、Adapter Test Coverage、Error
                Visibility、Island Lazy by Default、CSS Single Source、One Config File
              </li>
              <li><strong>版本号对齐：</strong> 所有 5 个包的 deno.json 版本统一</li>
            </ul>

            <h3>审计发现</h3>
            <ul>
              <li>kiss-adapter-lit：0 测试（两个 Bug 都出在这里）</li>
              <li>escapeHtml 在 3 处重复编写，编码还不同（&#x27; vs &#39;）</li>
              <li>所有 9 个 Island 全 eager 加载 → 每页完整全局 island entry → 需要页面级 manifest</li>
              <li>旧 Lit SSR client 路线仍在依赖/术语中残留（v0.5.0 声称已移除）</li>
              <li>renderNestedDsd() 是空函数 stub</li>
            </ul>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.5.0-alpha.0</span>
                <span class="version-date">2026-05-02</span>
              </div>
              <div class="change-category added">
                <h4>架构精简</h4>
                <ul class="change-list">
                  <li>
                    <strong>@lessjs/core 零框架运行时</strong>：KissElement 废弃，Lit re-export 移除，core
                    成为纯构建/SSR 基础设施
                  </li>
                  <li>
                    <strong>@lessjs/rpc 原生化</strong>：移除 Lit peer dep，纯 fetch + AbortController
                  </li>
                  <li><strong>OpenProps 设计系统</strong>：替换硬编码 hex，CSS 变量穿透 Shadow DOM</li>
                  <li><strong>Vite 8</strong>：从 Vite 6 升级到 Vite 8.0.10</li>
                  <li><strong>单 deno.json</strong>：删除 docs/deno.json，vendor 模式管理依赖</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.4.0</span>
                <span class="version-date">2026-04-30</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>Serverless API CI 部署</strong>：less-demo-api.sisyphuszheng.deno.net
                    生产在线，deploy-api.yml 自动化（CORS 修复、平台迁移 deployctl→deno deploy）
                  </li>
                  <li>
                    <strong>less-hero-ping 组件</strong>：可配置 API 的 ping Island，🟢/🔴 状态点。提取到
                    @lessjs/ui v0.4.0
                  </li>
                  <li>
                    <strong>首页全中文</strong>：8 段布局、响应式 clamp()/%/rem、四框架比较表、三阶段 Quick
                    start
                  </li>
                  <li><strong>Blog 系统</strong>：v0.4.0 发布文 + kiss-compiler 设计决策</li>
                  <li><strong>路線图</strong>：v0.5.0 → v1.0.0 六阶段规划</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>Service Worker 策略重写</strong>：PRECACHE 删除，HTML 用
                    networkFirst（实时更新），动态缓存名，skipWaiting +
                    clients.claim。根因定位：切回首页变旧版是 SW 缓存，不是 CDN
                  </li>
                  <li><strong>全站 1px → 0.5px 统一</strong>：17 文件、40+ 处边框</li>
                  <li>
                    <strong>全站非 Hero 颜色 → CSS
                      变量</strong>：--less-text-primary/secondary/tertiary/muted，--less-border，--less-bg-surface
                    等
                  </li>
                  <li>
                    <strong>less-layout 响应式</strong>：sidebar 240px → clamp(200px, 20vw, 280px)，header
                    max-width CSS 变量化
                  </li>
                  <li>
                    <strong>首页布局对齐 Guide</strong>：内容区 720px，Hero min-height、hero-inner 居中
                  </li>
                  <li>
                    <strong>README 精简 80%</strong>：JSR shields.io badges（显式版本号），诚实 JS
                    大小（~400B 基础设施，零框架 JS）
                  </li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>Upgrade race</strong>：嵌套在父 Shadow DOM 内的 Island 双渲染问题 — _renderer.ts
                    剥离 defer-hydration
                  </li>
                  <li><strong>Hero 文字可见度</strong>：#555→#999（hero-desc），#444→#777（hero-tech）</li>
                  <li>
                    <strong>页面组件事件不生效</strong>：docs-home 的 @click 在客户端不工作 — 提取为独立
                    Island
                  </li>
                  <li><strong>less-hero-ping 类型错误</strong>：static override 顺序、catch e:unknow</li>
                  <li>
                    <strong>Quick start 命令错误</strong>：npm create@lessjs/app → deno run -A
                    jsr:@lessjs/create
                  </li>
                  <li><strong>API 版本 0.3.6 → 0.4.0</strong></li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.3.4</span>
                <span class="version-date">2026-04-30</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>scanIslands 递归扫描</strong>：支持 app/islands/posts/index.ts 等子目录结构
                  </li>
                  <li><strong>CI 并行化</strong>：test.yml 拆分为 typecheck + 4 个并行 test job</li>
                  <li><strong>CI 缓存</strong>：所有 job 添加 actions/cache，减少依赖安装时间</li>
                  <li>移动端侧边栏 nav link 点击自动关闭（@lessjs/ui 文档站）</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>三阶段构建管线文档化</strong>：架构文档插件表更新为 v0.3.0
                    实际插件列表，构建生命周期从 closeBundle 嵌套 Vite 改为三阶段 CLI 描述
                  </li>
                  <li>
                    <strong>deno-version 锁定</strong>：所有 workflow 从 v2.x 改为 "2"，防止 Deno 3.0
                    意外破坏构建
                  </li>
                  <li>
                    <strong>lessDesignTokens 导出 tokens 子路径</strong>：@lessjs/ui/tokens/colors, effects,
                    spacing, typography 独立导出
                  </li>
                  <li>
                    <strong>kiss-error CSS 变量</strong>：组件错误状态统一使用可配置的 --less-error 变量
                  </li>
                  <li>
                    <strong>less-layout 可配置 header 高度</strong>：56px 硬编码替换为
                    --less-layout-header-height CSS 变量
                  </li>
                  <li>README 包版本号更新至 0.3.2 / 0.2.3</li>
                  <li>README coverage badge 替换为 CI badge</li>
                  <li>@lessjs/ui-plugin 的 cdn:false 配置项 JSDoc 修正：不再误导性地说"使用 npm 替代"</li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>
                    <strong>主题切换按钮点击无响应（v0.2.x 历史问题）</strong>：less-theme-toggle 在 Shadow
                    DOM 中事件的 composedPath() 未正确穿透，导致点击事件被吞；data-theme
                    未传播到所有嵌套组件的 host 元素。根因：旧 Lit SSR client 路线要求客户端补丁先于
                    customElements.define() 执行，而当时的执行顺序没有保证
                  </li>
                  <li>
                    <strong>Island 计数器重复渲染（v0.2.x 历史问题）</strong>：静态 import 导致
                    customElements.define() 在旧客户端补丁前运行，Lit 对已定义的元素做 DSD
                    接管时先全量渲染再 patch，造成两次渲染。修复：改为动态 import() 保证补丁先执行
                  </li>
                  <li>
                    <strong>Island chunk 404</strong>：build-client.ts 未设置 base='/client/'，Vite 生成的
                    __vite__mapDeps 指向 /islands/*.js 而非 /client/islands/*.js
                  </li>
                  <li>
                    <strong>DSD polyfill 报错</strong>：template-shadowroot document.write() polyfill 在 ESM
                    环境下报 "Cannot use import statement outside module"，移除（现代浏览器已原生支持 DSD）
                  </li>
                  <li>
                    <strong>P0 — less-input 显示 "undefined" 字符串</strong>：.value="&#36;{this.value ??
                    ''}"，避免未设置值时显示文本 "undefined"
                  </li>
                  <li>
                    <strong>P0 — @lessjs/core 缺少 CLI exports</strong>：deno.json 和 jsr.json 未导出
                    cli/build-client 和 cli/build-ssg，导致 create-kiss 脚手架创建的项目无法运行 deno task
                    build:client/build:ssg
                  </li>
                  <li>
                    <strong>P0 — dist/tokens/colors.js 缺失</strong>：deno.json
                    已声明导出但构建产出中不存在（build 重新执行后修复）
                  </li>
                  <li>
                    <strong>P0 — SSG 构建崩溃（globalThis.module 删早）</strong>：CJS polyfill 在
                    ssrLoadModule 被删除，导致 node-domexception 报 ReferenceError
                  </li>
                  <li>
                    <strong>P1 — 暗色模式阴影不可见</strong>：effects.ts 中 rgba(0,0,0,...)
                    阴影在黑色背景上不可见，添加 [data-theme="dark"] 亮色阴影变体
                  </li>
                  <li>
                    <strong>P1 — less-button href/target 渲染 "undefined"</strong>：href=&#36;{hrefAttr} /
                    target=&#36;{this.target} 在未设置时渲染字面量 "undefined"，改用 nothing sentinel
                  </li>
                  <li>
                    <strong>P1 — less-button 每次 render 创建新箭头函数</strong>：disabled 时的 @click
                    内联箭头函数提取为类方法 _preventClick
                  </li>
                  <li>
                    <strong>P1 — less-input 错误状态 ARIA 默认值</strong>：aria-invalid="false" /
                    aria-errormessage="" 始终存在，改用 nothing sentinel
                  </li>
                  <li>
                    <strong>P1 — less-code-block setTimeout 无清理</strong>：添加 _copyTimer +
                    disconnectedCallback 清除超时
                  </li>
                  <li>
                    <strong>P1 — colors.ts 注释颠倒</strong>：lessDarkColors / lessLightColors 的 JSDoc
                    Light/Dark 标签互换
                  </li>
                  <li>
                    <strong>P1 — kiss-rpc 重试延迟不响应 abort</strong>：await new Promise(setTimeout)
                    不监听 signal.aborted，改为 race 模式
                  </li>
                  <li>
                    <strong>P1 — less-theme-toggle 无限递归</strong>：_propagateTheme 无递归深度限制，添加
                    depth 参数 + 最大 10 层
                  </li>
                  <li>
                    <strong>P2 — vite-plugin-dts 隐式依赖</strong>：@lessjs/rpc 的 devDependencies 中包含
                    vite-plugin-dts，但 @lessjs/core 也使用但未声明
                  </li>
                  <li>
                    <strong>P2 — build-ssg.ts 全局污染未清理</strong>：CJS
                    polyfill（globalThis.module/exports）用完未 delete
                  </li>
                  <li>
                    <strong>P2 — ssg-smoke 测试 silent pass</strong>：7 个测试在无构建产出时 return
                    而非跳过，改为 Deno.test({ ignore })
                  </li>
                  <li>
                    <strong>P0/P1 — 8 个 assertEquals(true, true) 僵尸断言</strong>：替换为有意义断言或移除
                  </li>
                  <li>
                    <strong>types.ts JSDoc 错误</strong>：packageIslands 注释说
                    '@lessjs/ui/islands'，实际实现是 import(pkg).islands
                  </li>
                  <li>
                    <strong>context.ts decodeURIComponent 无保护</strong>：遇畸形编码抛 URIError，添加
                    try-catch 回退
                  </li>
                  <li><strong>RpcController.hostConnected() 死代码</strong>：空方法 + 对应测试一并移除</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.3.0</span>
                <span class="version-date">2026-04-29</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>Package Islands 自动检测</strong>：通过 packageIslands 配置自动扫描并注册来自
                    npm/JSR 包的 Islands
                  </li>
                  <li>
                    <strong>less-theme-toggle Island</strong>：Dark/Light 主题切换组件，从 less-layout
                    中提取为独立 Island（DSD + upgrade）
                  </li>
                  <li>
                    <strong>KissBuildContext 架构重构</strong>：替代闭包共享可变状态，提升构建管道的可测试性
                  </li>
                  <li>
                    <strong>EntryDescriptor + renderEntry 模板化</strong>：替代 hono-entry.ts 的字符串拼接
                  </li>
                  <li>Vite manifest 集成：build.ts 使用 build.manifest:true 生成客户端入口映射</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>less-layout 简化为纯静态组件</strong>：移除 _isLight 属性、localStorage
                    读取、_handleThemeToggle 方法
                  </li>
                  <li>L2 全局主题切换脚本已删除：由 less-theme-toggle Island upgrade 替代</li>
                  <li>客户端构建自动化生成包内 Island 导入和注册代码</li>
                  <li>
                    SSG post-processing 使用 insertBeforeBodyClose/insertAfterHead 辅助函数，替代 naive
                    string replace
                  </li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>Island chunk 检测从 grep JS 文件内容改为读取 Rollup manifest（确定性、无误报）</li>
                  <li>HTML 插入操作增强鲁棒性：处理标签属性、大小写差异、空白变体</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.2.0</span>
                <span class="version-date">2026-04-27</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>
                    <strong>Package Islands 自动检测</strong>：自动检测并注册来自 npm/JSR 包的 Islands
                  </li>
                  <li>
                    <code>packageIslands</code> configuration option to specify which packages to scan
                  </li>
                  <li>
                    <code>scanPackageIslands()</code> function to dynamically import packages and read
                    <code>islands</code> export
                  </li>
                  <li>
                    <code>less-theme-toggle</code> Island for theme switching (Dark/Light)
                  </li>
                  <li>
                    Package Island metadata type: <code>PackageIslandMeta</code>
                  </li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>
                    <strong>破坏性变更</strong>：<code>less-layout</code> 主题切换逻辑已移除 — 请使用
                    <code>less-theme-toggle</code> Island
                  </li>
                  <li>
                    <code>less-layout</code> simplified to static component (no client-side state)
                  </li>
                  <li>
                    L2 theme toggle script removed (replaced by Island upgrade)
                  </li>
                  <li>
                    Client build now auto-generates import and registration code for package Islands
                  </li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>主题切换现在使用正确的 Island upgrade (DSD + 客户端状态)</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.1.7</span>
                <span class="version-date">2026-04-27</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>Logger 模块支持 <code>LessJS_LOG_LEVEL</code> 环境变量</li>
                  <li>
                    @lessjs/ui 组件库：less-button, less-card, less-input, less-code-block, less-layout
                  </li>
                  <li>design-tokens CSS 自定义属性（瑞士国际主义风格）</li>
                  <li>examples/hello 最小示例：演示 LessJS 基础</li>
                  <li>文档站 dogfooding：/ui 页面使用真实 LessJS UI 组件</li>
                  <li>SSR 兼容性文档（/guide/ssg）</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>@lessjs/ui 版本升级至 0.1.4</li>
                  <li>文档站现在导入 @lessjs/ui 组件</li>
                  <li>迁移所有示例到 static properties + customElements.define() 模式</li>
                  <li>移除 packages/kiss-ui/deno.json 中的 experimentalDecorators 配置</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.1.6</span>
                <span class="version-date">2026-04-26</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>纯黑白色设计系统 + 主题切换</li>
                  <li>/ui 设计系统展示页面</li>
                  <li>移动端响应式侧边栏 + 汉堡菜单</li>
                  <li>CSS :has() 选择器实现侧边栏切换（零 JS）</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>合并页面样式（pageStyles）— 消除 840 行重复 CSS</li>
                  <li>移除页面样式中所有 !important hack</li>
                  <li>侧边栏现在使用滑入动画 + 背景模糊</li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>点击背景现在可以关闭侧边栏（L2 脚本）</li>
                  <li>移动端响应式布局改进</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.1.5</span>
                <span class="version-date">2026-04-20</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>LessJS 架构文档（K·I·S·S 四约束）</li>
                  <li>DSD（声明式 Shadow DOM）输出支持</li>
                  <li>Jamstack 对齐文档</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>从 DIA 重新品牌为 LessJS Architecture</li>
                  <li>更新 README 包含双重含义（理念 + 架构）</li>
                </ul>
              </div>
            </div>

            <div class="version-section">
              <div class="version-header">
                <span class="version-number">0.1.4</span>
                <span class="version-date">2026-04-15</span>
              </div>

              <div class="change-category added">
                <h4>新增</h4>
                <ul class="change-list">
                  <li>inject 选项：自定义样式表/脚本注入</li>
                  <li>API Routes 部署文档</li>
                </ul>
              </div>

              <div class="change-category changed">
                <h4>变更</h4>
                <ul class="change-list">
                  <li>标记 ui 选项已弃用（请使用 inject）</li>
                </ul>
              </div>

              <div class="change-category fixed">
                <h4>修复</h4>
                <ul class="change-list">
                  <li>RPC call() 现在抛出 RpcError 而不是返回 null</li>
                </ul>
              </div>
            </div>

            <h2>上游依赖 / 兼容性问题</h2>
            <table class="version-table">
              <thead>
                <tr>
                  <th>问题</th>
                  <th>根源</th>
                  <th>影响</th>
                  <th>缓解方案</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deno fmt dprint-core panic</td>
                  <td>dprint-core 0.67.4 在处理嵌套 Lit 模板字面量（含 HTML 实体 &lt; 等）时 panic</td>
                  <td>docs/ 中 Lit tagged template 无法格式化</td>
                  <td>CI 中 fmt --check 跳过 docs/，仅检查 packages/</td>
                </tr>
                <tr>
                  <td>node-domexception CJS 兼容</td>
                  <td>node-domexception@1.0.0 使用 module.exports (CJS)，Deno 的 ESM 运行时无法直接加载</td>
                  <td>SSG 构建失败：ReferenceError: module is not defined</td>
                  <td>globalThis.module / exports polyfill，用完后 finally 清理</td>
                </tr>
                <tr>
                  <td>parse5 / entities 版本锁</td>
                  <td>entities@6 与 parse5@7 的兼容性要求，需同步升级</td>
                  <td>依赖安装失败</td>
                  <td>升级 entities 到 ^6</td>
                </tr>
                <tr>
                  <td>旧 Lit SSR client 时序</td>
                  <td>
                    当时的 Lit SSR client 补丁必须在 customElements.define()
                    之前执行，否则已注册的元素会全量渲染再 patch（双重渲染）
                  </td>
                  <td>Island 组件双重渲染 / DSD 接管不匹配</td>
                  <td>动态 import() 确保旧客户端补丁先于任何组件注册执行</td>
                </tr>
                <tr>
                  <td>@lessjs/core → lit resolve alias</td>
                  <td>
                    Vite lib mode 构建中将 @lessjs/core 映射为 lit，使编译产物直接依赖 lit 而非 @lessjs/core
                  </td>
                  <td>@lessjs/ui 的 dist 消费者无需安装 @lessjs/core</td>
                  <td>resolve.alias + build.ts serializeAlias 传递到 CLI 构建</td>
                </tr>
                <tr>
                  <td>Window CRLF vs Unix LF</td>
                  <td>Windows Git 自动转换行尾导致 deno fmt CI 失败</td>
                  <td>多平台协作者间格式冲突</td>
                  <td>.gitattributes eol=lf 统一行尾</td>
                </tr>
                <tr>
                  <td>tsup → Vite lib mode</td>
                  <td>tsup 不支持 Deno 的 node: 前缀保留</td>
                  <td>Node 原生模块导入失败</td>
                  <td>迁移至 Vite lib format: 'es'，天然保留 node: 前缀</td>
                </tr>
              </tbody>
            </table>

            <h2>版本历史</h2>
            <table class="version-table">
              <thead>
                <tr>
                  <th>版本</th>
                  <th>日期</th>
                  <th>亮点</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0.3.4</td>
                  <td>2026-04-30</td>
                  <td>Code audit fixes + upstream compat docs + version bump + release</td>
                </tr>
                <tr>
                  <td>0.3.0</td>
                  <td>2026-04-29</td>
                  <td>
                    Package Islands auto-detection + less-theme-toggle Island + build pipeline refactor
                  </td>
                </tr>
                <tr>
                  <td>0.2.0</td>
                  <td>2026-04-27</td>
                  <td>Package Islands auto-detection + less-theme-toggle Island</td>
                </tr>
                <tr>
                  <td>0.1.7</td>
                  <td>2026-04-27</td>
                  <td>Architecture audit + dogfooding + docs self-hosting</td>
                </tr>
                <tr>
                  <td>0.1.6</td>
                  <td>2026-04-26</td>
                  <td>Design system + mobile responsive</td>
                </tr>
                <tr>
                  <td>0.1.5</td>
                  <td>2026-04-20</td>
                  <td>LessJS Architecture branding</td>
                </tr>
                <tr>
                  <td>0.1.4</td>
                  <td>2026-04-15</td>
                  <td>inject option + API Routes docs</td>
                </tr>
                <tr>
                  <td>0.1.3</td>
                  <td>2026-04-10</td>
                  <td>@lessjs/rpc + @lessjs/ui</td>
                </tr>
                <tr>
                  <td>0.1.2</td>
                  <td>2026-04-05</td>
                  <td>Island AST transform</td>
                </tr>
                <tr>
                  <td>0.1.1</td>
                  <td>2026-04-01</td>
                  <td>Initial JSR release</td>
                </tr>
              </tbody>
            </table>

            <div class="nav-row">
              <a href="/roadmap" class="nav-link">&larr; 开发计划</a>
              <a href="/guide/getting-started" class="nav-link">快速上手 &rarr;</a>
            </div>
          </div>
        </less-layout>
      `;
    }
  }

  customElements.define('page-changelog', ChangelogPage);
  export default ChangelogPage;
  export const tagName = 'page-changelog';

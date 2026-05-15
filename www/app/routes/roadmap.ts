export const meta = {
  section: 'Roadmap & Decisions',
  label: 'Roadmap',
  order: 10,
};

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class RoadmapPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .callout {
        padding: 1rem;
        background: var(--less-bg-muted);
        border-left: 4px solid var(--less-color-primary);
        margin: 1.5rem 0;
      }

      .callout p {
        margin: 0;
      }

      .reset-table,
      .version-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
      }

      .reset-table th,
      .reset-table td,
      .version-table th,
      .version-table td {
        border: 1px solid var(--less-border);
        padding: 0.75rem;
        text-align: left;
        vertical-align: top;
      }

      .reset-table th,
      .version-table th {
        background: var(--less-bg-muted);
        font-weight: 600;
      }

      .tracks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .track {
        border: 1px solid var(--less-border);
        border-radius: 8px;
        padding: 1rem;
        background: var(--less-bg-surface);
      }

      .track h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }

      .track p {
        margin: 0;
        color: var(--less-text-secondary);
      }

      .phase {
        border-left: 4px solid var(--less-color-primary);
        padding-left: 1rem;
        margin: 2rem 0;
      }

      .phase h3 {
        margin: 0 0 0.5rem;
        color: var(--less-color-primary);
      }

      .phase.deferred {
        border-left-color: var(--less-text-secondary);
      }

      .status {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .status.done {
        background: #d4edda;
        color: #155724;
      }

      .status.next {
        background: #fff3cd;
        color: #856404;
      }

      .status.planned {
        background: #cce5ff;
        color: #004085;
      }

      .status.deferred {
        background: var(--less-bg-muted);
        color: var(--less-text-secondary);
      }

      .compact-list,
      .criteria-list {
        margin: 0.75rem 0 0;
        padding-left: 1.25rem;
      }

      .compact-list li,
      .criteria-list li {
        margin: 0.45rem 0;
      }

      code {
        font-size: 0.92em;
        overflow-wrap: anywhere;
      }

      @media (max-width: 720px) {
        .reset-table,
        .version-table {
          display: block;
          overflow-x: auto;
        }

        .reset-table th,
        .reset-table td,
        .version-table th,
        .version-table td {
          min-width: 9rem;
        }
      }
    `,
  ];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout
        locale="${this.locale || 'zh'}"
        .locales="${['en', 'zh']}"
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/roadmap"
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            LessJS 的路线图在 2026-05-15 按 <code>origin/main</code> 重新校准：源码已到
            <code>0.14.9</code>，但下一阶段必须先修复发布一致性、package island SSR、per-page island
            manifest 和 create scaffold 入口，再扩大 Web Components registry hub 叙事。
          </p>

          <div class="callout">
            <p>
              当前原则是事实优先、标准优先、协议优先：已经被测试证明的能力进入文档；尚未冻结的能力留在
              roadmap 和 ADR； registry hub 只能建立在 renderer kernel、package manifest 和 release parity
              稳定之后。 版本纪律继续遵循 ADR 0006，npm 发布策略继续遵循 ADR 0007，2026-05-15 的执行 SOP
              见 ADR 20260515-1。
            </p>
          </div>

          <h2>2026-05-15 Main-Branch Review Reset</h2>
          <p>
            LessJS 应被定义为 Web Standards-first 的 DSD/WC 应用框架和渲染基础设施。近期目标不是追随
            OpenWC，也不是先做中心化 marketplace，而是把 LessJS 自己已经具备的 DSD 渲染、SSR bundle、SSG
            pipeline、 package island model 和发布纪律产品化。
          </p>

          <table class="reset-table">
            <thead>
              <tr>
                <th>议题</th>
                <th>中立判断</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OpenWC</td>
                <td>
                  只作为历史经验和概念参考，不作为路线图主轴。<code>@open-wc/testing</code>
                  与 <code>@open-wc/semantic-dom-diff</code> 已经明显老化；<code>@web/test-runner</code>
                  较新，但仍偏 Node/npm 工具链。LessJS 应继续以 Deno、Playwright 和自举 SSG 作为验证主线。
                </td>
              </tr>
              <tr>
                <td>构建工具</td>
                <td>
                  不采用 webpack，也不把 Rollup/OpenWC building presets 写进路线图。当前的 Vite 8、ESM
                  bundle 和 Phase 3 Vite-free 方向更贴近 LessJS，需要继续抽象构建边界，
                  而不是切换到旧生态方案。
                </td>
              </tr>
              <tr>
                <td>Open UI</td>
                <td>
                  保留为组件契约参考：parts、states、events、a11y、form behavior 和设计 token 可以帮助
                  LessJS 描述组件能力，但不会把 LessJS 改造成 OpenWC 项目模板。
                </td>
              </tr>
              <tr>
                <td>SSR/SSG for WC</td>
                <td>
                  这是更强的主线。LessJS 已有 <code>RenderAdapter</code>、<code>renderDSD()</code>、
                  <code>renderRoute()</code>、<code>ssgRender()</code> 和 <code>PackageIslandMeta</code>，
                  下一步应把它们整理为稳定的 Web Components 渲染内核。
                </td>
              </tr>
              <tr>
                <td>WC registry hub</td>
                <td>
                  值得探索，但先做 manifest/protocol，不先承诺中心化市场。中心 hub 会带来治理、审核、
                  安全和长期维护压力；更合理的顺序是让包能自描述、被本地扫描、被文档站索引。
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Three Workstreams</h2>
          <div class="tracks">
            <section class="track">
              <h3>Engine</h3>
              <p>
                把 DSD renderer、SSR bundle、route rendering 和 SSG pipeline 收束为一个可复用的 Web
                Components rendering kernel。
              </p>
            </section>
            <section class="track">
              <h3>Protocol</h3>
              <p>
                定义组件包如何声明 tag、module、SSR 可渲染性、upgrade strategy、parts、states、 events 和
                tokens。
              </p>
            </section>
            <section class="track">
              <h3>Ecosystem</h3>
              <p>
                优先解决可发现性、文档索引、benchmark、interactive scaffold 和 npm
                触达，而不是过早建设中心化 hub。
              </p>
            </section>
          </div>

          <h2>Foundation Already Built</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Outcome</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>v0.7-v0.10</td>
                <td>建立 SSR、DSD、Island Upgrade、Hono API、SSG 与基础文档站。</td>
                <td>Done</td>
              </tr>
              <tr>
                <td>v0.11-v0.13</td>
                <td>补强适配器、文档体系、npm 发布路径、组件包暴露方式。</td>
                <td>Done</td>
              </tr>
              <tr>
                <td>v0.14-v0.14.9</td>
                <td>
                  确立 DSD/WC 为主叙事，完成 docs 自举、发布纪律、标准审计入口、安全补丁和 main
                  线鲁棒性修补。
                </td>
                <td>Done</td>
              </tr>
            </tbody>
          </table>

          <h2>Next Roadmap</h2>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>v0.14.2 Standards &amp; Safety Patch</h3>
            <p>已完成：先修正真实标准和安全边界，再扩大生态叙事。</p>
            <ul class="criteria-list">
              <li>
                修正 DSD 属性输出，补齐 <code>shadowrootclonable</code>，重新核对 WHATWG template 属性。
              </li>
              <li>收紧 <code>headExtras</code> / <code>headFragments</code> 的注入边界和文档说明。</li>
              <li>修复 route regex 风险，避免路由参数生成过宽匹配。</li>
              <li>补真实 SSR bundle 测试，并覆盖 i18n、content、UI、docs 自举的关键路径。</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status next">Next</span>
            <h3>v0.15 Renderer Kernel &amp; Release Parity</h3>
            <p>
              目标：先让 install、scaffold、package SSR 和 SSG manifest 真实可靠，再冻结 Web Component
              render protocol。
            </p>
            <ul class="criteria-list">
              <li>
                修复 <code>@lessjs/create</code> 的 JSR metadata endpoint、<code>adapter-vite</code>
                版本解析、<code>--help</code> 和项目名校验。
              </li>
              <li>
                对齐 <code>deno.lock</code>、package versions、changelog 和 registry
                latest，发布前后都有自动检查。
              </li>
              <li>让 package islands 在 SSR bundle 中被显式导入和注册，不能只参与 client upgrade。</li>
              <li>
                接通 <code>buildIslandChunkMap()</code>、<code>generateIslandManifests()</code> 和 <code
                >writeIslandManifests()</code>，或明确推迟页面级 manifest 文档。
              </li>
              <li>正式定义 adapter contract：输入、输出、错误模型、hydration hints 和 DSD 约束。</li>
              <li>
                把 DSD metrics/report、nested custom element rendering、route rendering
                整理成公开内核能力。
              </li>
              <li>继续以 Playwright 作为真实浏览器验证主线，而不是引入老旧 DOM diff/test preset。</li>
              <li>为 Lit 之外的 adapter 留出边界，但不在协议稳定前承诺多适配器矩阵或中心化 hub。</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.16 WC Package Protocol</h3>
            <p>目标：把 <code>PackageIslandMeta</code> 扩展为 CEM-compatible 的组件包 manifest。</p>
            <ul class="criteria-list">
              <li>
                声明 tag、module、SSR renderability、upgrade strategy、parts、states、events 和 tokens。
              </li>
              <li>
                在 Custom Elements Manifest 兼容字段之上增加 LessJS 的 <code>ssr</code>、<code
                >dsd</code>、<code>hydrate</code> 和 diagnostics 字段。
              </li>
              <li>支持本地 registry index，使组件包可以被扫描、校验和文档站索引。</li>
              <li>为 Open UI 风格的组件契约保留字段，但避免绑定到 OpenWC 项目模板。</li>
              <li>提供 manifest 校验和迁移说明，避免生态入口先于协议成熟。</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.17 Ecosystem Entry</h3>
            <p>目标：让 LessJS 组件和应用更容易被发现、试用和比较。</p>
            <ul class="criteria-list">
              <li>改善 npm 触达、文档搜索、benchmark 和 interactive scaffold。</li>
              <li>
                建立本地 registry 页面原型，展示组件 manifest、SSR/SSG 结果、bundle
                cost、测试状态和文档索引能力。
              </li>
              <li>提供可复制的 starter 和 migration examples，但不承诺中心化 marketplace。</li>
              <li>把性能、可访问性和 SSR/SSG 行为作为生态入口的展示指标。</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.18 Hub Prototype &amp; v1.0 API Freeze</h3>
            <p>目标：先发布静态 hub 原型，再冻结真正支撑 1.0 的公共边界。</p>
            <ul class="criteria-list">
              <li>公共 hub 只消费 manifest 和验证产物，不直接相信 README 或营销字段。</li>
              <li>明确 package provenance、审核、举报、安全响应和维护边界，避免过早 marketplace 化。</li>
              <li>
                冻结 <code>lessjs()</code> 配置、renderer protocol、adapter contract 和 package manifest。
              </li>
              <li>明确 breaking change policy、migration policy、support window 和 release cadence。</li>
              <li>
                用 docs 自举、SSR bundle、SSG output、Playwright smoke 和 package manifest
                校验作为发布门槛。
              </li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Long-term Bets</span>
            <h3>v1.0+ Bets</h3>
            <p>这些方向有价值，但应在 renderer/protocol 稳定之后推进。</p>
            <ul class="criteria-list">
              <li>Edge SSR、ISR、compiler pipeline 和 multi-adapter support。</li>
              <li>
                WC registry hub：只有在 manifest/protocol、本地
                index、安全模型和治理规则成熟后再考虑中心化。
              </li>
              <li>更广义的 full-stack 能力：不能先于渲染协议稳定成为主承诺。</li>
            </ul>
          </div>

          <h2>Rejected / Deferred</h2>
          <ul class="criteria-list">
            <li>No webpack：不把 LessJS 路线图倒回 webpack 或旧 bundler preset。</li>
            <li>
              No OpenWC toolchain adoption：OpenWC 可学习，但不采用其旧测试栈和项目模板作为 LessJS
              主路径。
            </li>
            <li>
              No generic full-stack promise before renderer protocol stabilizes：先把 DSD/WC
              渲染内核做稳，再扩展上层能力。
            </li>
            <li>
              No centralized WC hub before
              manifest/protocol：先做自描述、扫描、索引和安全边界，再讨论中心化分发。
            </li>
          </ul>

          <h2>Reference Positioning</h2>
          <p>
            路线图参考 WHATWG template / DSD 属性、Open UI 组件契约方向、OpenWC/Modern Web 的历史经验，
            以及 Playwright 的真实浏览器验证定位；这些参考不改变 LessJS 的 Deno-first、standards-first
            路线。
          </p>

          <nav class="nav-row">
            <a class="nav-link" href="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
            >20260515 ADR/SOP →</a>
            <a class="nav-link" href="/decisions/0024-standards-first-wc-renderer-roadmap"
            >Strategic Roadmap ADR →</a>
            <a class="nav-link" href="/docs/decisions/adr-0006-version-roadmap">Version Roadmap ADR →</a>
            <a class="nav-link" href="/docs/decisions/adr-0007-npm-publishing-strategy"
            >Publishing Strategy →</a>
            <a class="nav-link" href="/docs/architecture">Architecture →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout
        locale="${this.locale || 'en'}"
        .locales="${['en', 'zh']}"
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/en/roadmap"
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            As of 2026-05-15, the LessJS roadmap is recalibrated against
            <code>origin/main</code>: source packages are at <code>0.14.9</code>, but the next phase must
            fix release parity, package island SSR, per-page island manifests, and the create scaffold
            before expanding the Web Components registry hub story.
          </p>

          <div class="callout">
            <p>
              The roadmap is fact-first, standards-first, and protocol-first. Tested capabilities move
              into docs; unfinished boundaries stay in the roadmap and ADRs; the registry hub only follows
              renderer kernel, package manifest, and release parity stability. Version discipline follows
              ADR 0006, npm publishing follows ADR 0007, and the 2026-05-15 execution SOP is ADR
              20260515-1.
            </p>
          </div>

          <h2>2026-05-15 Main-Branch Review Reset</h2>
          <p>
            LessJS should be positioned as a Web Standards-first DSD/WC application framework and
            rendering infrastructure. The near-term goal is not to follow OpenWC or lead with a
            centralized marketplace, but to productize LessJS's own DSD rendering, SSR bundle, SSG
            pipeline, package island model, and release discipline.
          </p>

          <table class="reset-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Neutral judgement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OpenWC</td>
                <td>
                  Useful as historical and conceptual reference, but not as the roadmap spine.
                  <code>@open-wc/testing</code> and <code>@open-wc/semantic-dom-diff</code>
                  are visibly old; <code>@web/test-runner</code> is newer, but still leans into the
                  Node/npm toolchain. LessJS should continue validating through Deno, Playwright, and its
                  self-hosted SSG path.
                </td>
              </tr>
              <tr>
                <td>Build tooling</td>
                <td>
                  Do not adopt webpack, and do not put Rollup/OpenWC building presets on the roadmap. The
                  current Vite 8, ESM bundle, and Phase 3 Vite-free direction fit LessJS better. The next
                  step is to abstract the build boundary, not switch to an older ecosystem preset.
                </td>
              </tr>
              <tr>
                <td>Open UI</td>
                <td>
                  Keep it as component contract guidance: parts, states, events, accessibility, form
                  behavior, and design tokens can help LessJS describe components without turning LessJS
                  into an OpenWC project template.
                </td>
              </tr>
              <tr>
                <td>SSR/SSG for WC</td>
                <td>
                  This is the stronger mainline. LessJS already has <code>RenderAdapter</code>,
                  <code>renderDSD()</code>, <code>renderRoute()</code>, <code>ssgRender()</code>, and
                  <code>PackageIslandMeta</code>; these should become a stable Web Components rendering
                  kernel.
                </td>
              </tr>
              <tr>
                <td>WC registry hub</td>
                <td>
                  Worth exploring, but manifest/protocol comes first. A central hub brings governance,
                  review, security, and maintenance costs. The better first step is self-describing
                  packages that can be locally scanned and indexed by docs.
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Three Workstreams</h2>
          <div class="tracks">
            <section class="track">
              <h3>Engine</h3>
              <p>
                Consolidate the DSD renderer, SSR bundle, route rendering, and SSG pipeline into a
                reusable Web Components rendering kernel.
              </p>
            </section>
            <section class="track">
              <h3>Protocol</h3>
              <p>
                Define how component packages declare tags, modules, SSR renderability, upgrade strategy,
                parts, states, events, and tokens.
              </p>
            </section>
            <section class="track">
              <h3>Ecosystem</h3>
              <p>
                Prioritize discoverability, docs indexing, benchmarks, interactive scaffolds, and npm
                reach before committing to any centralized hub.
              </p>
            </section>
          </div>

          <h2>Foundation Already Built</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Outcome</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>v0.7-v0.10</td>
                <td>Established SSR, DSD, Island Upgrade, Hono API, SSG, and the first docs site.</td>
                <td>Done</td>
              </tr>
              <tr>
                <td>v0.11-v0.13</td>
                <td>Strengthened adapters, docs, npm publishing, and component package exports.</td>
                <td>Done</td>
              </tr>
              <tr>
                <td>v0.14-v0.14.9</td>
                <td>
                  Made DSD/WC the primary narrative and added docs self-hosting, release discipline,
                  standards audit entry points, safety patches, and mainline robustness fixes.
                </td>
                <td>Done</td>
              </tr>
            </tbody>
          </table>

          <h2>Next Roadmap</h2>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>v0.14.2 Standards &amp; Safety Patch</h3>
            <p>Completed: fix standards and safety boundaries before expanding the ecosystem story.</p>
            <ul class="criteria-list">
              <li>
                Correct DSD attribute output, add <code>shadowrootclonable</code>, and re-check WHATWG
                template attributes.
              </li>
              <li>
                Tighten <code>headExtras</code> / <code>headFragments</code> injection boundaries and
                documentation.
              </li>
              <li>Fix route regex risk so parameterized routes do not generate overly broad matches.</li>
              <li>
                Add real SSR bundle tests and cover the key i18n, content, UI, and docs self-hosting
                paths.
              </li>
            </ul>
          </div>

          <div class="phase">
            <span class="status next">Next</span>
            <h3>v0.15 Renderer Kernel &amp; Release Parity</h3>
            <p>
              Goal: make install, scaffold, package SSR, and SSG manifests reliable before freezing the
              Web Component render protocol.
            </p>
            <ul class="criteria-list">
              <li>
                Fix <code>@lessjs/create</code> JSR metadata endpoint, <code>adapter-vite</code> version
                resolution, <code>--help</code>, and project-name validation.
              </li>
              <li>
                Align <code>deno.lock</code>, package versions, changelog, and registry latest with
                automated checks before and after publish.
              </li>
              <li>
                Explicitly import and register package islands in the SSR bundle instead of using them
                only for client upgrade.
              </li>
              <li>
                Wire <code>buildIslandChunkMap()</code>, <code>generateIslandManifests()</code>, and <code
                >writeIslandManifests()</code>, or clearly defer page-level manifest docs.
              </li>
              <li>
                Define the adapter contract: inputs, outputs, error model, hydration hints, and DSD
                constraints.
              </li>
              <li>
                Make DSD metrics/reporting, nested custom element rendering, and route rendering part of
                the public kernel.
              </li>
              <li>
                Keep Playwright as the real-browser validation mainline instead of adopting older DOM
                diff/test presets.
              </li>
              <li>
                Leave room for non-Lit adapters without promising a full adapter matrix or centralized hub
                before the protocol stabilizes.
              </li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.16 WC Package Protocol</h3>
            <p>
              Goal: extend <code>PackageIslandMeta</code> into a CEM-compatible component package
              manifest.
            </p>
            <ul class="criteria-list">
              <li>
                Declare tag, module, SSR renderability, upgrade strategy, parts, states, events, and
                tokens.
              </li>
              <li>
                Add LessJS <code>ssr</code>, <code>dsd</code>, <code>hydrate</code>, and diagnostics
                fields on top of Custom Elements Manifest-compatible metadata.
              </li>
              <li>
                Support a local registry index so packages can be scanned, validated, and indexed by docs.
              </li>
              <li>
                Keep fields for Open UI-style component contracts without binding LessJS to OpenWC
                templates.
              </li>
              <li>
                Provide manifest validation and migration notes so ecosystem entry follows protocol
                maturity.
              </li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.17 Ecosystem Entry</h3>
            <p>Goal: make LessJS components and applications easier to discover, try, and compare.</p>
            <ul class="criteria-list">
              <li>Improve npm reach, docs search, benchmarks, and interactive scaffolds.</li>
              <li>
                Create a local registry page prototype that demonstrates component manifests, SSR/SSG
                results, bundle cost, test status, and docs indexing.
              </li>
              <li>
                Provide reproducible starters and migration examples without promising a centralized
                marketplace.
              </li>
              <li>Use performance, accessibility, and SSR/SSG behavior as ecosystem-facing signals.</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status planned">Planned</span>
            <h3>v0.18 Hub Prototype &amp; v1.0 API Freeze</h3>
            <p>
              Goal: publish the static hub prototype first, then freeze the public boundaries that
              actually support 1.0.
            </p>
            <ul class="criteria-list">
              <li>
                The public hub consumes manifests and validation artifacts; it does not trust README or
                marketing fields directly.
              </li>
              <li>
                Define package provenance, review, reporting, security response, and maintenance
                boundaries before marketplace behavior.
              </li>
              <li>
                Freeze <code>lessjs()</code> config, renderer protocol, adapter contract, and package
                manifest.
              </li>
              <li>
                Define breaking change policy, migration policy, support window, and release cadence.
              </li>
              <li>
                Use docs self-hosting, SSR bundle, SSG output, Playwright smoke, and package manifest
                validation as release gates.
              </li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Long-term Bets</span>
            <h3>v1.0+ Bets</h3>
            <p>These directions matter, but should follow renderer/protocol stability.</p>
            <ul class="criteria-list">
              <li>Edge SSR, ISR, compiler pipeline, and multi-adapter support.</li>
              <li>
                WC registry hub: only after manifest/protocol, local index, security model, and governance
                mature.
              </li>
              <li>
                Broader full-stack capabilities: do not make them the main promise before the rendering
                protocol is stable.
              </li>
            </ul>
          </div>

          <h2>Rejected / Deferred</h2>
          <ul class="criteria-list">
            <li>No webpack: do not route LessJS back through webpack or older bundler presets.</li>
            <li>
              No OpenWC toolchain adoption: learn from OpenWC without adopting its older testing stack or
              project template as the main path.
            </li>
            <li>
              No generic full-stack promise before renderer protocol stabilizes: make the DSD/WC rendering
              kernel solid first.
            </li>
            <li>
              No centralized WC hub before manifest/protocol: self-description, scanning, indexing, and
              security boundaries come first.
            </li>
          </ul>

          <h2>Reference Positioning</h2>
          <p>
            This roadmap considers WHATWG template / DSD attributes, Open UI component contract direction,
            OpenWC/Modern Web historical experience, and Playwright’s real-browser validation positioning.
            These references do not change LessJS’s Deno-first, standards-first path.
          </p>

          <nav class="nav-row">
            <a class="nav-link" href="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
            >20260515 ADR/SOP →</a>
            <a class="nav-link" href="/en/decisions/0024-standards-first-wc-renderer-roadmap"
            >Strategic Roadmap ADR →</a>
            <a class="nav-link" href="/en/docs/decisions/adr-0006-version-roadmap"
            >Version Roadmap ADR →</a>
            <a class="nav-link" href="/en/docs/decisions/adr-0007-npm-publishing-strategy"
            >Publishing Strategy →</a>
            <a class="nav-link" href="/en/docs/architecture">Architecture →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

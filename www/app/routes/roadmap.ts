export const meta = { section: '', label: 'Roadmap', order: 10 };

import { headerNav, navSections } from 'virtual:less-nav';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../components/page-styles.js';
const pageSheet = new StyleSheet();
pageSheet.replaceSync(pageStyles);
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-callout';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
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
        border: 1px solid var(--border);
        padding: 0.75rem;
        text-align: left;
        vertical-align: top;
      }

      .reset-table th,
      .version-table th {
        background: var(--bg-muted);
        font-weight: 600;
      }

      .tracks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .track {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 1rem;
        background: var(--bg-surface);
      }

      .track h3 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }

      .track p {
        margin: 0;
        color: var(--text-secondary);
      }

      .phase {
        border-left: 4px solid var(--brand);
        padding-left: 1rem;
        margin: 2rem 0;
      }

      .phase h3 {
        margin: 0 0 0.5rem;
        color: var(--brand);
      }

      .phase.deferred {
        border-left-color: var(--text-secondary);
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
        background: var(--bg-muted);
        color: var(--text-secondary);
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
    `);

export class RoadmapPage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, pageSheet, routeSheet];

  override render() {
    return (this.getAttribute('locale') || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="${this.getAttribute('locale') || 'zh'}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/roadmap"
        home
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            从渲染内核到通用 WC SSR/SSG 引擎 + Registry Hub。六个 Phase，近细远粗。 当前版本 <code
            >v0.18.0</code>，下一里程碑 <code>v0.18.1</code>。
          </p>

          <less-callout type="info">
            事实优先、标准优先、协议优先。已测试的能力进入文档；未冻结的留在 roadmap 和 ADR；registry
            hub 只在 renderer kernel、package manifest 和 release parity 稳定之后才建设。版本纪律遵循
            ADR 0006。
          </less-callout>

          <h2>Six-Phase Vision</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Version</th>
                <th>Name</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>v0.15.x</td>
                <td>Renderer Kernel</td>
                <td>结构化渲染输出、错误分类、构建报告</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td>v0.16.x</td>
                <td>WC Package Protocol</td>
                <td>CEM manifest + 本地 registry + 构建集成</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td>v0.17.x</td>
                <td>Ecosystem Entry</td>
                <td>Manifest-native pipeline、跨运行时、CLI 工具</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>4</td>
                <td>v0.18.x</td>
                <td>Universal WC Engine</td>
                <td>CEM 解析器 + 4 级兼容分类、第三方 WC 自动检测、dsd-report 兼容性报告</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>5</td>
                <td>v0.19.x</td>
                <td>Platform + Hub</td>
                <td>Registry Hub、搜索、快照预览、Edge 渲染、Scoped Registries</td>
                <td><span class="status deferred">Far</span></td>
              </tr>
              <tr>
                <td>6</td>
                <td>v1.0.x</td>
                <td>General-Purpose Engine</td>
                <td>任意 CEM manifest WC 包 → 自动 SSR/SSG，API freeze</td>
                <td><span class="status deferred">Vision</span></td>
              </tr>
            </tbody>
          </table>

          <h2>Phase Details</h2>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 1: v0.15.x — Renderer Kernel</h3>
            <p>
              v0.15.1 审计门禁、v0.15.2 RenderOutput + RenderHooks、v0.15.3 dsd-report + Release Gate。
              渲染内核产品化完成。
            </p>
            <ul class="compact-list">
              <li>
                <code>RenderOutput</code> / <code>RenderError</code> / <code>HydrationHint</code>
                结构化类型
              </li>
              <li><code>RendererProtocol</code> 命名适配器 + <code>RenderHooks</code> 生命周期</li>
              <li><code>dsd-report.json</code> SSG 构建报告</li>
              <li>7-gate release pipeline: fmt / lint / typecheck / audit / test / build / e2e</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 2: v0.16.x — WC Package Protocol</h3>
            <p>
              从 3 字段 <code>PackageIslandMeta</code> 升级为 20+ 字段 CEM 兼容
              <code>LessPackageManifest</code>。LessJS 第一次能以数据描述 WC 包。
            </p>
            <ul class="compact-list">
              <li>v0.16.0: Manifest 类型系统 + 本地 registry + validate + @lessjs/ui manifest</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 3: v0.17.x — Ecosystem Entry</h3>
            <p>消除向后兼容层，管道 manifest-native 化，跨运行时支持，SSR admission 边界硬化。</p>
            <ul class="compact-list">
              <li>v0.17.0: 删除 PackageIslandMeta + manifest-native pipeline</li>
              <li>v0.17.1: 跨运行时 adapter-vite（Deno API → Node.js compat）</li>
              <li>v0.17.2: SSR filtering + dsd-report manifest 决策</li>
              <li>v0.17.3: 多框架适配器探索（adapter-vanilla 增强、adapter-react）</li>
              <li>v0.17.4: 兼容性边界硬化 + SSR admission planner</li>
              <li>v0.17.5: 审计注释 + 测试固件</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 4: v0.18.x — Universal WC Engine</h3>
            <p>
              CEM 解析器 + 4 级兼容分类 + 构建时自动检测 + dsd-report 报告扩展。第三方 WC 包默认
              client-only，安全接入 LessJS 生态。
            </p>
            <ul class="compact-list">
              <li>
                v0.18.0: CEM 解析器、4 级兼容分类器（ssr-capable / client-only / rejected /
                experimental-dom）、SSR admission 集成、dsd-report cemCompatibility 报告、构建时自动扫描
                node_modules
              </li>
              <li>v0.18.1: <code>less validate-manifest</code> CLI — 安装前验证包兼容性</li>
              <li>v0.18.2: <code>less add</code> 一键安装流程</li>
              <li>v0.18.3（实验）: DOM 模拟渲染 client-only 组件 (Happy DOM)</li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Far</span>
            <h3>Phase 5: v0.19.x — Platform + Hub</h3>
            <p>从本地 registry 到公共 registry。Hub 放在主仓库 monorepo，直到规模需要分离。</p>
            <ul class="compact-list">
              <li>Hub API + 包搜索 + 浏览界面</li>
              <li>SSR/SSG 快照预览 + bundle cost 分析</li>
              <li>版本冲突检测 + 安全审计 + 发布者身份验证</li>
              <li>Scoped Custom Element Registries + Edge runtime 渲染</li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Vision</span>
            <h3>Phase 6: v1.0.x — General-Purpose Engine</h3>
            <p>任意 CEM manifest WC 包 → 自动 SSR/SSG，零配置。API freeze。从"工具"走向"标准"。</p>
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
            路线图参考
            <a href="https://html.spec.whatwg.org/multipage/scripting.html#the-template-element"
            >WHATWG HTML template / DSD 属性</a>、
            <a href="https://custom-elements-manifest.open-wc.org/">Custom Elements Manifest</a>、
            <a href="https://open-ui.org/">Open UI</a> 组件契约方向、
            <a href="https://open-wc.org/docs/">OpenWC</a> 的历史工具链经验、
            <a href="https://lit.dev/docs/v2/ssr/overview/">Lit SSR</a>、
            <a href="https://fast.design/docs/getting-started/quick-start">FAST</a>、
            <a href="https://wicg.github.io/webcomponents/proposals/Scoped-Custom-Element-Registries.html"
            >Scoped Custom Element Registries</a> 和
            <a href="https://drafts.css-houdini.org/">CSS Houdini</a>。这些参考只校准边界，不改变 LessJS
            的 Deno-first、standards-first 路线。
          </p>

          <nav class="nav-row">
            <a class="nav-link" href="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
            >20260515 ADR/SOP →</a>
            <a class="nav-link" href="/decisions/0024-standards-first-wc-renderer-roadmap"
            >Strategic Roadmap ADR →</a>
            <a class="nav-link" href="/decisions/adr-0006-version-roadmap">Version Roadmap ADR →</a>
            <a class="nav-link" href="/decisions/adr-0007-npm-publishing-strategy"
            >Publishing Strategy →</a>
            <a class="nav-link" href="/engine/architecture">Architecture →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        locale="${this.getAttribute('locale') || 'en'}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/en/roadmap"
        home
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            From renderer kernel to general-purpose WC SSR/SSG engine + Registry Hub. Six phases,
            near-term fine and far-term coarse. Current version <code>v0.18.0</code>, next milestone <code
            >v0.18.1</code>.
          </p>

          <less-callout type="info">
            Fact-first, standards-first, protocol-first. Tested capabilities move into docs; unfinished
            boundaries stay in the roadmap and ADRs; the registry hub only follows renderer kernel,
            package manifest, and release parity stability. Version discipline follows ADR 0006.
          </less-callout>

          <h2>Six-Phase Vision</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Version</th>
                <th>Name</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>v0.15.x</td>
                <td>Renderer Kernel</td>
                <td>Structured render output, error taxonomy, build report</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td>v0.16.x</td>
                <td>WC Package Protocol</td>
                <td>CEM manifest + local registry + build integration</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td>v0.17.x</td>
                <td>Ecosystem Entry</td>
                <td>Manifest-native pipeline, cross-runtime, CLI tooling</td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>4</td>
                <td>v0.18.x</td>
                <td>Universal WC Engine</td>
                <td>
                  CEM parser + 4-tier compatibility, third-party WC auto-detection, dsd-report
                  compatibility report
                </td>
                <td><span class="status done">Done</span></td>
              </tr>
              <tr>
                <td>5</td>
                <td>v0.19.x</td>
                <td>Platform + Hub</td>
                <td>Registry Hub, search, snapshots, Edge rendering, Scoped Registries</td>
                <td><span class="status deferred">Far</span></td>
              </tr>
              <tr>
                <td>6</td>
                <td>v1.0.x</td>
                <td>General-Purpose Engine</td>
                <td>Any CEM manifest WC package → automatic SSR/SSG, API freeze</td>
                <td><span class="status deferred">Vision</span></td>
              </tr>
            </tbody>
          </table>

          <h2>Phase Details</h2>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 1: v0.15.x — Renderer Kernel</h3>
            <p>
              v0.15.1 audit gates, v0.15.2 RenderOutput + RenderHooks, v0.15.3 dsd-report + Release Gate.
              The rendering kernel is productized.
            </p>
            <ul class="compact-list">
              <li>
                <code>RenderOutput</code> / <code>RenderError</code> / <code>HydrationHint</code>
                structured types
              </li>
              <li><code>RendererProtocol</code> named adapters + <code>RenderHooks</code> lifecycle</li>
              <li><code>dsd-report.json</code> SSG build report</li>
              <li>7-gate release pipeline: fmt / lint / typecheck / audit / test / build / e2e</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 2: v0.16.x — WC Package Protocol</h3>
            <p>
              Upgrade from 3-field <code>PackageIslandMeta</code> to 20+ field CEM-compatible
              <code>LessPackageManifest</code>. LessJS can describe WC packages as data for the first
              time.
            </p>
            <ul class="compact-list">
              <li>v0.16.0: Manifest type system + local registry + validate + @lessjs/ui manifest</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 3: v0.17.x — Ecosystem Entry</h3>
            <p>
              Eliminate backward compat layer, manifest-native pipeline, cross-runtime support, SSR
              admission boundary hardening.
            </p>
            <ul class="compact-list">
              <li>v0.17.0: Delete PackageIslandMeta + manifest-native pipeline</li>
              <li>v0.17.1: Cross-runtime adapter-vite (Deno API → Node.js compat)</li>
              <li>v0.17.2: SSR filtering + dsd-report manifest decisions</li>
              <li>
                v0.17.3: Multi-framework adapter exploration (adapter-vanilla enhanced, adapter-react)
              </li>
              <li>v0.17.4: Compatibility boundary hardening + SSR admission planner</li>
              <li>v0.17.5: Audit comments + test fixtures</li>
            </ul>
          </div>

          <div class="phase">
            <span class="status done">Done</span>
            <h3>Phase 4: v0.18.x — Universal WC Engine</h3>
            <p>
              CEM parser + 4-tier compatibility classifier + build-time auto-detection + dsd-report schema
              extensions. Third-party WC packages default to client-only, safely integrated into LessJS
              ecosystem.
            </p>
            <ul class="compact-list">
              <li>
                v0.18.0: CEM parser, 4-tier classifier (ssr-capable / client-only / rejected /
                experimental-dom), SSR admission integration, dsd-report cemCompatibility section,
                build-time node_modules auto-scan
              </li>
              <li>
                v0.18.1: <code>less validate-manifest</code> CLI — pre-install package compatibility
                validation
              </li>
              <li>v0.18.2: <code>less add</code> one-click install flow</li>
              <li>v0.18.3 (experimental): DOM simulation for client-only components (Happy DOM)</li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Far</span>
            <h3>Phase 5: v0.19.x — Platform + Hub</h3>
            <p>
              From local registry to public registry. Hub lives in main repo monorepo until scale demands
              separation.
            </p>
            <ul class="compact-list">
              <li>Hub API + package search + browse UI</li>
              <li>SSR/SSG snapshot previews + bundle cost analysis</li>
              <li>Version conflict detection + security audit + publisher authentication</li>
              <li>Scoped Custom Element Registries + Edge runtime rendering</li>
            </ul>
          </div>

          <div class="phase deferred">
            <span class="status deferred">Vision</span>
            <h3>Phase 6: v1.0.x — General-Purpose Engine</h3>
            <p>
              Any CEM manifest WC package → automatic SSR/SSG, zero config. API freeze. From "tool" to
              "standard".
            </p>
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
            This roadmap considers
            <a href="https://html.spec.whatwg.org/multipage/scripting.html#the-template-element"
            >WHATWG HTML template / DSD attributes</a>,
            <a href="https://custom-elements-manifest.open-wc.org/">Custom Elements Manifest</a>,
            <a href="https://open-ui.org/">Open UI</a> component-contract work,
            <a href="https://open-wc.org/docs/">OpenWC</a> historical tooling experience,
            <a href="https://lit.dev/docs/v2/ssr/overview/">Lit SSR</a>,
            <a href="https://fast.design/docs/getting-started/quick-start">FAST</a>,
            <a href="https://wicg.github.io/webcomponents/proposals/Scoped-Custom-Element-Registries.html"
            >Scoped Custom Element Registries</a>, and
            <a href="https://drafts.css-houdini.org/">CSS Houdini</a>. These references calibrate
            boundaries; they do not change LessJS's Deno-first, standards-first path.
          </p>

          <nav class="nav-row">
            <a class="nav-link" href="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
            >20260515 ADR/SOP →</a>
            <a class="nav-link" href="/en/decisions/0024-standards-first-wc-renderer-roadmap"
            >Strategic Roadmap ADR →</a>
            <a class="nav-link" href="/en/decisions/adr-0006-version-roadmap"
            >Version Roadmap ADR →</a>
            <a class="nav-link" href="/en/decisions/adr-0007-npm-publishing-strategy"
            >Publishing Strategy →</a>
            <a class="nav-link" href="/en/engine/architecture">Architecture →</a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

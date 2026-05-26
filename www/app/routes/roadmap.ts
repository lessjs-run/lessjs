export const meta = { section: '', label: 'Roadmap', order: 10 };
export const tagName = 'page-roadmap';

import { DsdElement, StyleSheet } from '@lessjs/core';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-callout';
import '@lessjs/ui/less-layout';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(pageStyles);

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  .version-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .version-table th,
  .version-table td {
    border: 1px solid var(--border);
    padding: 0.75rem;
    text-align: left;
    vertical-align: top;
  }

  .version-table th {
    background: var(--bg-muted);
    font-weight: 600;
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

  .phase.next {
    border-left-color: #856404;
  }

  .phase.planned {
    border-left-color: #004085;
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

  .status.current {
    background: #eeedfe;
    color: var(--brand);
  }

  .status.next {
    background: #fff3cd;
    color: #856404;
  }

  .status.planned {
    background: #cce5ff;
    color: #004085;
  }

  .status.vision {
    background: var(--bg-muted);
    color: var(--text-secondary);
  }

  .criteria-list {
    margin: 0.75rem 0 0;
    padding-left: 1.25rem;
  }

  .criteria-list li {
    margin: 0.45rem 0;
  }

  @media (max-width: 720px) {
    .version-table {
      display: block;
      overflow-x: auto;
    }

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
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="${this._getLocale('zh')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/roadmap"
        home
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            当前项目线是 <code>v0.21.0 Reactive DSD</code>。LessJS 的中心是
            DSD-first Web Components 渲染引擎，SSG、Hydration 策略、Reactive DSD 与 ISR 合同已在 v0.21 落地。
          </p>

          <less-callout type="info">
            路线图遵循 ADR-0037：已验证能力进入文档，未冻结能力保留在 Roadmap。LessJS 不承诺任意
            Web Component 自动 SSR；它承诺 SSR、client-only 或拒绝构建这三类确定结果。
          </less-callout>

          <h2>Six-Phase Vision</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Name</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>v0.15.x</td><td>Renderer Kernel</td><td>结构化渲染输出、hooks、build report</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.16.x</td><td>WC Package Protocol</td><td>Manifest、本地 registry、包协议</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.17.x</td><td>Ecosystem Entry</td><td>manifest-native pipeline、多适配器边界</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.18.x</td><td>Universal WC Engine</td><td>CEM parser、兼容性分层、验证 CLI、less add</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.19.x</td><td>Registry Hub MVP</td><td>可搜索包索引、报告、快照和组件浏览</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.20.x</td><td>Ocean-Island</td><td>DsdElement、DSD-native UI、CSS Parts、cleanup gate</td><td><span class="status shipped">Shipped</span></td></tr>
              <tr><td>v0.21.x</td><td>Reactive DSD</td><td>DsdElement + Signals、安全模板、streaming DSD</td><td><span class="status current">Current</span></td></tr>
              <tr><td>v0.22.x</td><td>Architecture Integrity</td><td>包边界、consumer imports、adapter 清理、质量门禁</td><td><span class="status planned">Planned</span></td></tr>
              <tr><td>v0.23.x</td><td>Edge Full-Stack</td><td>ISR handler、KV adapters、Showcase、部署指南</td><td><span class="status planned">Planned</span></td></tr>
              <tr><td>v1.0.x</td><td>Stable Engine</td><td>API/schema freeze、确定性包准入保证</td><td><span class="status vision">Vision</span></td></tr>
            </tbody>
          </table>

          <div class="phase">
            <span class="status shipped">Shipped</span>
            <h3>v0.20.x - Ocean-Island Architecture</h3>
            <p>
              v0.20 把 DSD 组件从 Lit 运行时中解耦出来：<code>DsdElement</code> 成为 DSD 基类，
              <code>StyleSheet</code> 解决 SSR CSSOM 边界，UI 组件通过 CSS Parts 暴露标准外部样式 API。
            </p>
            <ul class="criteria-list">
              <li>DSD-native ocean components do not depend on Lit.</li>
              <li>Known third-party SSR errors are classified and gated.</li>
              <li>Public docs now distinguish shipped SSG from planned ISR/SSR.</li>
            </ul>
          </div>

          <div class="phase next">
            <span class="status current">Current</span>
            <h3>v0.21.x - Reactive DSD</h3>
            <p>
              v0.21 让 DsdElement、Signals、安全模板和 streaming DSD 成为当前公开能力。
            </p>
            <ul class="criteria-list">
              <li><code>client:load</code>, <code>client:idle</code>, <code>client:visible</code>, <code>client:only</code></li>
              <li>Reactive DSD with safe templates</li>
              <li>Streaming DSD contract</li>
              <li>Route-level ISR metadata as a future handler contract</li>
            </ul>
          </div>

          <div class="phase planned">
            <span class="status planned">Planned</span>
            <h3>v0.22.x - Architecture Integrity</h3>
            <p>
              2026-05-26 的审查把 v0.22 重置为架构债务清偿线：先清理 consumer import surface、
              core 包边界、adapter-vite 拆分、signals facade、validation ownership 和质量门禁。
            </p>
          </div>

          <h2>Non-Goals Before v1.0</h2>
          <ul class="criteria-list">
            <li>No webpack：不把 LessJS 路线图倒回 webpack 或旧 bundler preset。</li>
            <li>不承诺任意 CEM 包自动 SSR。</li>
            <li>不把 Registry Hub 宣传成成熟 marketplace。</li>
            <li>不在架构债务清偿之前追逐泛全栈框架完整性。</li>
            <li>不把 auth、ORM、permission、database SDK 做进核心。</li>
          </ul>

          <nav class="nav-row">
            <a class="nav-link" href="/engine/architecture">Architecture -></a>
            <a class="nav-link" href="/engine/standards-registry">Standards &amp; Registry -></a>
          </nav>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/en/roadmap"
        home
      >
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            The current project line is <code>v0.21.0 Reactive DSD</code>.
            LessJS centers on a DSD-first Web Components rendering engine. SSG is shipped;
            hydration strategies, Reactive DSD, and the ISR contract landed in v0.21.
          </p>

          <less-callout type="info">
            The roadmap follows ADR-0037: proven capabilities move into docs, unfinished contracts
            stay in Roadmap. LessJS does not promise universal automatic SSR for arbitrary Web
            Components; it promises deterministic SSR, client-only, or rejection outcomes.
          </less-callout>

          <h2>Six-Phase Vision</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Name</th>
                <th>Goal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>v0.15.x</td><td>Renderer Kernel</td><td>Structured render output, hooks, build report</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.16.x</td><td>WC Package Protocol</td><td>Manifest, local registry, package protocol</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.17.x</td><td>Ecosystem Entry</td><td>Manifest-native pipeline and multi-adapter boundary</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.18.x</td><td>Universal WC Engine</td><td>CEM parser, compatibility tiers, validation CLI, less add</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.19.x</td><td>Registry Hub MVP</td><td>Searchable package index, reports, snapshots, component browser</td><td><span class="status done">Done</span></td></tr>
              <tr><td>v0.20.x</td><td>Ocean-Island</td><td>DsdElement, DSD-native UI, CSS Parts, cleanup gate</td><td><span class="status shipped">Shipped</span></td></tr>
              <tr><td>v0.21.x</td><td>Reactive DSD</td><td>DsdElement + Signals, safe templates, streaming DSD</td><td><span class="status current">Current</span></td></tr>
              <tr><td>v0.22.x</td><td>Architecture Integrity</td><td>Package boundaries, consumer imports, adapter cleanup, quality gates</td><td><span class="status planned">Planned</span></td></tr>
              <tr><td>v0.23.x</td><td>Edge Full-Stack</td><td>ISR handler, KV adapters, Showcase, deployment guides</td><td><span class="status planned">Planned</span></td></tr>
              <tr><td>v1.0.x</td><td>Stable Engine</td><td>API/schema freeze and deterministic package guarantees</td><td><span class="status vision">Vision</span></td></tr>
            </tbody>
          </table>

          <div class="phase">
            <span class="status shipped">Shipped</span>
            <h3>v0.20.x - Ocean-Island Architecture</h3>
            <p>
              v0.20 decouples DSD components from the Lit runtime. <code>DsdElement</code>
              becomes the DSD base, <code>StyleSheet</code> handles the SSR CSSOM boundary,
              and UI components expose standard CSS Parts.
            </p>
            <ul class="criteria-list">
              <li>DSD-native ocean components do not depend on Lit.</li>
              <li>Known third-party SSR errors are classified and gated.</li>
              <li>Public docs distinguish shipped SSG from planned ISR/SSR.</li>
            </ul>
          </div>

          <div class="phase next">
            <span class="status current">Current</span>
            <h3>v0.21.x - Reactive DSD</h3>
            <p>
              v0.21 makes DsdElement, Signals, safe templates, and streaming DSD
              the current public line.
            </p>
            <ul class="criteria-list">
              <li><code>client:load</code>, <code>client:idle</code>, <code>client:visible</code>, <code>client:only</code></li>
              <li>Reactive DSD with safe templates</li>
              <li>Streaming DSD contract</li>
              <li>Route-level ISR metadata as a future handler contract</li>
            </ul>
          </div>

          <div class="phase planned">
            <span class="status planned">Planned</span>
            <h3>v0.22.x - Architecture Integrity</h3>
            <p>
              The 2026-05-26 review resets v0.22 as an architecture debt paydown line:
              consumer import surface, core package boundaries, adapter-vite decomposition,
              signals facade, validation ownership, and stronger quality gates.
            </p>
          </div>

          <h2>Non-Goals Before v1.0</h2>
          <ul class="criteria-list">
            <li>No webpack: do not route LessJS back through webpack or older bundler presets.</li>
            <li>No universal automatic SSR promise for arbitrary CEM packages.</li>
            <li>No mature marketplace claim for Registry Hub yet.</li>
            <li>No generic full-stack parity chase before architecture debt paydown.</li>
            <li>No auth, ORM, permissions, or database SDK inside core.</li>
          </ul>

          <nav class="nav-row">
            <a class="nav-link" href="/en/engine/architecture">Architecture -></a>
            <a class="nav-link" href="/en/engine/standards-registry">Standards &amp; Registry -></a>
          </nav>
        </div>
      </less-layout>
    `;
  }
}

export default RoadmapPage;

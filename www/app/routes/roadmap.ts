export const meta = { section: 'Roadmap & Decisions', label: 'Roadmap', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class RoadmapPage extends LitElement {
  static override styles = [pageStyles, css`
    .phase { margin: 1rem 0; padding: 1rem 1.25rem; border-left: 2px solid var(--less-border-hover); background: var(--less-bg-surface); border-radius: 0 4px 4px 0; }
    .phase h3 { margin-top: 0; }
    .status { display: inline-block; margin-bottom: 0.35rem; color: var(--less-text-muted); font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; }
    .version-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8125rem; }
    .version-table th, .version-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 0.5px solid var(--less-border); }
    .version-table th { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--less-text-muted); }
    .version-table td:first-child { font-weight: 600; color: var(--less-text-primary); white-space: nowrap; }
    .criteria-list { list-style: none; padding: 0; margin: 0.5rem 0; }
    .criteria-list li { padding: 0.25rem 0; padding-left: 1.25rem; position: relative; color: var(--less-text-secondary); font-size: 0.8125rem; }
    .criteria-list li::before { content: "○"; position: absolute; left: 0; color: var(--less-text-muted); }
    .criteria-list li.met::before { content: "●"; color: var(--less-accent); }
    .callout { margin: 1.5rem 0; }
  `];

  override render() { return (this.locale||'zh')==='en'?this._renderEn():this._renderZh(); }

  private _renderZh() { return html`<less-layout locale="${this.locale||'zh'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/roadmap"><div class="container">
    <h1>Roadmap</h1>
    <p class="subtitle">LessJS 的路线图围绕一个判断展开：先把 SSG + DSD + Island Upgrade + Hono API 做可信，再扩展 serverless fullstack、ISR、PWA 和 compiler，最终在公共 API 稳定后承诺 1.0。</p>

    <h2>Now: v0.14.1 — Release Hardening</h2>
    <p>v0.14.1 是发布硬化版本：统一 @lessjs/signals 命名，修复脚手架 CLI 子路径、发布流程、E2E 隔离、根质量任务和 SSG 产物稳定性。当前状态：零 dirty publish、CI 覆盖 E2E、475 测试通过。</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Core API 收敛</td><td>✅ Done</td><td>18 导出 → 6 子路径，/render-dsd /html-escape 移除</td></tr>
      <tr><td>ssr-handler.ts 删除</td><td>✅ Done</td><td>纯 re-export facade 彻底消失</td></tr>
      <tr><td>编译期 Phase 校验</td><td>✅ Done</td><td>Phase1Token/Phase2Token/Phase3Token branded types</td></tr>
      <tr><td>core-Vite 分离</td><td>✅ Done</td><td>虚拟模块 ID 迁至 @lessjs/adapter-vite/virtual-ids</td></tr>
      <tr><td>CI coverage</td><td>✅ Done</td><td>所有 test job 加 --coverage</td></tr>
      <tr><td>零 barrel 文件</td><td>✅ Done</td><td>content/src/nav/index.ts 和 sitemap/types.ts 内联</td></tr>
    </tbody></table>

    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — 稳定基线</h3><p>审计修复：render-dsd 测试、island 测试、XSS 修复、pre-commit hooks、CI 补全。73 个新增测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — 功能完善 + Island Manifest</h3><p>Signals 测试、DSD 拆分、UI 统一到 DsdLitElement、Playwright E2E、Island Manifest。390 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n 独立包、SSG locale 展开、双语文档站、View Transitions API、Speculation Rules API、SSG 后处理管线重构。446 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.10 — SSR Architecture Purification</h3><p>ADR 0008-0014 七条决策：消除 globalThis 桥接、消除 .less/ 临时文件、提取 @lessjs/app、消除 less-runtime barrel、SSR bundle 导出公共 API。448 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.11 — Runtime/Build Separation</h3><p>ADR 0017: @lessjs/core 拆为纯运行时 + @lessjs/adapter-vite。Core 零 node:*、零 npm:、零 Vite 依赖。5 个兼容性补丁消除。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.12 — Virtual Data Modules</h3><p>ADR 0018: 消除所有插件模块状态，纯函数替代 stateful init/getter 模式，虚拟模块成为 SSR 数据唯一桥接。buildCoreSubpathAliases() 删除，@deno/vite-plugin 接管本地解析。20 条 resolve.alias 删除。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.14.1 — Release Hardening</h3><p>脚手架、发布、CI/E2E、signals 命名和 SSG 产物稳定性修复。</p></div>
    <div class="phase"><div class="status">Next Target</div><h3>v0.14 — DSD Engine + Islands Enhancement</h3><p>DSD 渲染引擎增强与 Islands 策略扩展（ADR 0020）。包括 DSD static 层性能优化、Island 加载策略细化、构建 metadata 硬化。暂无确切时间表。</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>所有 package 公共 API 稳定、遵循 SemVer、迁移文档完备。判定标准见 <a href="/blog/0006-version-strategy">ADR 0006</a>。</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/roadmap"><div class="container">
    <h1>Roadmap</h1>
    <p class="subtitle">The LessJS roadmap centers on one judgment: make SSG + DSD + Island Upgrade + Hono API trustworthy first, then expand to serverless fullstack, ISR, PWA, and compiler, and finally commit to 1.0 after public APIs stabilize.</p>
    <div class="callout"><p>This roadmap is not a marketing page. Future items listed here will only become stable user guides after they enter implementation and testing. See <a href="/blog/0006-version-strategy">ADR 0006</a> for versioning strategy.</p></div>

    <h2>Now: v0.14.1 — Release Hardening</h2>
    <p>v0.14.1 hardens the release path: unified @lessjs/signals naming, fixed scaffolded CLI subpaths, publish safety, isolated E2E, root quality tasks, and stable SSG artifacts. Current state: no dirty publish path, E2E covered in CI, 475 tests passing.</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Core API convergence</td><td>✅ Done</td><td>18 exports → 6 subpaths, /render-dsd /html-escape removed</td></tr>
      <tr><td>ssr-handler.ts deleted</td><td>✅ Done</td><td>Pure re-export facade eliminated</td></tr>
      <tr><td>Compile-time phase checks</td><td>✅ Done</td><td>Phase1Token/Phase2Token/Phase3Token branded types</td></tr>
      <tr><td>Core-Vite separation</td><td>✅ Done</td><td>Virtual module IDs moved to @lessjs/adapter-vite/virtual-ids</td></tr>
      <tr><td>CI coverage</td><td>✅ Done</td><td>All test jobs collect --coverage</td></tr>
      <tr><td>Zero barrel files</td><td>✅ Done</td><td>content/src/nav/index.ts and sitemap/types.ts inlined</td></tr>
    </tbody></table>

    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — Stable Baseline</h3><p>Audit fixes: render-dsd tests, island tests, XSS fixes, pre-commit hooks, CI completion. 73 new tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — Feature Completeness + Island Manifest</h3><p>Signals tests, DSD split, UI unified to DsdLitElement, Playwright E2E, Island Manifest. 390 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n standalone package, SSG locale expansion, bilingual docs, View Transitions API, Speculation Rules API, SSG post-process pipeline refactor. 446 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.10 — SSR Architecture Purification</h3><p>ADR 0008-0014 seven decisions: eliminate globalThis bridges, eliminate .less/ temp files, extract @lessjs/app, eliminate less-runtime barrel, SSR bundle public APIs. 448 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.11 — Runtime/Build Separation</h3><p>ADR 0017: @lessjs/core split into pure runtime + @lessjs/adapter-vite. Core: zero node:*, zero npm:, zero Vite deps. Five compatibility patches eliminated.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.12 — Virtual Data Modules</h3><p>ADR 0018: Eliminated all plugin module state. Pure functions replace stateful init/getter patterns. Virtual modules become the only SSR data bridge. buildCoreSubpathAliases() deleted, @deno/vite-plugin handles local resolution. 20 resolve.alias entries removed.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.14.1 — Release Hardening</h3><p>Scaffold, publishing, CI/E2E, signals naming, and SSG artifact stability fixes.</p></div>
    <div class="phase"><div class="status">Next Target</div><h3>v0.14 — DSD Engine + Islands Enhancement</h3><p>DSD rendering engine and island strategy enhancements (ADR 0020). DSD static layer performance optimization, island loading strategy refinement, build metadata hardening. No fixed timeline.</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>All package APIs stable, following SemVer, with complete migration docs. Criteria in <a href="/blog/0006-version-strategy">ADR 0006</a>.</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

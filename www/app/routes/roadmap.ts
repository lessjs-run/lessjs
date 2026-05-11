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
    <h2>Now: v0.11 — Runtime/Build Separation</h2>
    <p>v0.10.0 完成了 SSR 架构净化（448 测试）。v0.11.0 通过 ADR 0017 将 @lessjs/core 拆分为纯运行时 + @lessjs/adapter-vite 构建编排。Core 不再包含 Vite 插件代码，零 node:*、零 npm:、零 Vite 依赖，可在 Deno / Node / Bun / Edge 任意运行。5 个 npm: specifier 补丁不再需要碰到框架本身。</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Runtime/Build 分离</td><td>✅ Done</td><td>ADR 0017: core 纯运行时 + adapter-vite 构建编排</td></tr>
      <tr><td>Core 零 node:* 依赖</td><td>✅ Done</td><td>无 node:path, node:process, node:url, node:fs</td></tr>
      <tr><td>Core 零 Vite 依赖</td><td>✅ Done</td><td>无 Plugin type, 无 esbuild, 无 @hono/vite-dev-server</td></tr>
      <tr><td>Core 零 npm: 依赖</td><td>✅ Done</td><td>仅 parse5 作为纯 JS HTML 解析器</td></tr>
      <tr><td>@lessjs/adapter-vite</td><td>✅ Done</td><td>less() → Plugin[]，路由扫描，HMR，SSG 三阶段，npm:→bare 翻译</td></tr>
      <tr><td>用户 API 兼容</td><td>✅ Done</td><td>lessjs() 仍从 @lessjs/app 导出，用户代码零改动</td></tr>
      <tr><td>路由级 revalidation</td><td>📋 Planned</td><td>按需重新生成静态页面</td></tr>
      <tr><td>Cache lock</td><td>📋 Planned</td><td>并发构建时的缓存锁</td></tr>
      <tr><td>Stale fallback</td><td>📋 Planned</td><td>新内容构建中返回旧内容</td></tr>
      <tr><td>Service Worker 策略</td><td>📋 Planned</td><td>NetworkFirst/CacheFirst 可配置</td></tr>
      <tr><td>CDN recipes</td><td>📋 Planned</td><td>Cloudflare/Netlify 缓存配置模板</td></tr>
      <tr><td>.less Compiler Alpha</td><td>📋 Planned</td><td>AST runtime-shim 生成，消除 Lit 依赖</td></tr>
    </tbody></table>
    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — 稳定基线</h3><p>审计修复：render-dsd 测试、island 测试、XSS 修复、pre-commit hooks、CI 补全。73 个新增测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — 功能完善 + Island Manifest</h3><p>Signals 测试、DSD 拆分、UI 统一到 DsdLitElement、Playwright E2E、Island Manifest。390 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n 独立包、SSG locale 展开、双语文档站、View Transitions API、Speculation Rules API、SSG 后处理管线重构。446 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.10 — SSR Architecture Purification + API Boundary</h3><p>ADR 0008-0014 七条决策：消除 globalThis 桥接、消除 .less/ 临时文件、提取 @lessjs/app、消除 less-runtime barrel、SSR bundle 导出 renderRoute()/getStaticPaths()/routeInfo 公共 API。448 测试。</p></div>
    <div class="phase"><div class="status">v0.11 Target</div><h3>v0.11 — ISR + PWA + Compiler Alpha</h3><p>增量构建、缓存策略、离线支持、CDN 配置模板、.less Compiler Alpha。详见 <a href="/decisions/0003-pwa-support">ADR 0003</a>、<a href="/decisions/0002-less-compiler-eliminate-lit">ADR 0002</a>。</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>所有 package 公共 API 稳定、遵循 SemVer、迁移文档完备。判定标准见 <a href="/decisions/0006-version-strategy">ADR 0006</a>。</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/roadmap"><div class="container">
    <h1>Roadmap</h1>
    <p class="subtitle">The LessJS roadmap centers on one judgment: make SSG + DSD + Island Upgrade + Hono API trustworthy first, then expand to serverless fullstack, ISR, PWA, and compiler, and finally commit to 1.0 after public APIs stabilize.</p>
    <div class="callout"><p>This roadmap is not a marketing page. Future items listed here will only become stable user guides after they enter implementation and testing. See <a href="/decisions/0006-version-strategy">ADR 0006</a> for versioning strategy.</p></div>
    <h2>Now: v0.11 — Runtime/Build Separation</h2>
    <p>v0.10.0 completed SSR architecture purification (448 tests). v0.11.0 splits @lessjs/core into pure runtime + @lessjs/adapter-vite build orchestration via ADR 0017. Core no longer contains Vite plugin code — zero node:*, zero npm:, zero Vite dependency. Runs in Deno / Node / Bun / Edge. Five npm: specifier patches no longer need to touch the framework itself.</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Runtime/Build Separation</td><td>✅ Done</td><td>ADR 0017: core pure runtime + adapter-vite build orchestration</td></tr>
      <tr><td>Core zero node:* deps</td><td>✅ Done</td><td>No node:path, node:process, node:url, node:fs</td></tr>
      <tr><td>Core zero Vite deps</td><td>✅ Done</td><td>No Plugin type, no esbuild, no @hono/vite-dev-server</td></tr>
      <tr><td>Core zero npm: deps</td><td>✅ Done</td><td>Only parse5 as pure JS HTML parser</td></tr>
      <tr><td>@lessjs/adapter-vite</td><td>✅ Done</td><td>less() → Plugin[], route scanning, HMR, SSG 3-phase, npm:→bare rewrite</td></tr>
      <tr><td>User API Compatibility</td><td>✅ Done</td><td>lessjs() still from @lessjs/app, zero user code changes</td></tr>
      <tr><td>Route-level revalidation</td><td>📋 Planned</td><td>On-demand static page regeneration</td></tr>
      <tr><td>Cache lock</td><td>📋 Planned</td><td>Concurrency lock for builds</td></tr>
      <tr><td>Stale fallback</td><td>📋 Planned</td><td>Serve old content while building new</td></tr>
      <tr><td>Service Worker strategy</td><td>📋 Planned</td><td>Configurable NetworkFirst/CacheFirst</td></tr>
      <tr><td>CDN recipes</td><td>📋 Planned</td><td>Cloudflare/Netlify cache config templates</td></tr>
      <tr><td>.less Compiler Alpha</td><td>📋 Planned</td><td>AST runtime-shim generation, eliminate Lit dependency</td></tr>
    </tbody></table>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Route-level revalidation</td><td>📋 Planned</td><td>On-demand static page regeneration</td></tr>
      <tr><td>Cache lock</td><td>📋 Planned</td><td>Concurrency lock for builds</td></tr>
      <tr><td>Stale fallback</td><td>📋 Planned</td><td>Serve old content while building new</td></tr>
      <tr><td>Service Worker strategy</td><td>📋 Planned</td><td>Configurable NetworkFirst/CacheFirst</td></tr>
      <tr><td>CDN recipes</td><td>📋 Planned</td><td>Cloudflare/Netlify cache config templates</td></tr>
      <tr><td>.less Compiler Alpha</td><td>📋 Planned</td><td>AST runtime-shim generation, eliminate Lit dependency</td></tr>
    </tbody></table>
    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — Stable Baseline</h3><p>Audit fixes: render-dsd tests, island tests, XSS fixes, pre-commit hooks, CI completion. 73 new tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — Feature Completeness + Island Manifest</h3><p>Signals tests, DSD split, UI unified to DsdLitElement, Playwright E2E, Island Manifest. 390 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n standalone package, SSG locale expansion, bilingual docs, View Transitions API, Speculation Rules API, SSG post-process pipeline refactor. 446 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.10 — SSR Architecture Purification + API Boundary</h3><p>ADR 0008-0014 seven decisions: eliminate globalThis bridges, eliminate .less/ temp files, extract @lessjs/app, eliminate less-runtime barrel, SSR bundle exports renderRoute()/getStaticPaths()/routeInfo public APIs. 448 tests.</p></div>
    <div class="phase"><div class="status">v0.11 Target</div><h3>v0.11 — ISR + PWA + Compiler Alpha</h3><p>Incremental builds, caching strategies, offline support, CDN config templates, .less Compiler Alpha. See <a href="/decisions/0003-pwa-support">ADR 0003</a>, <a href="/decisions/0002-less-compiler-eliminate-lit">ADR 0002</a>.</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>All package public APIs stable, following SemVer, with complete migration docs. Criteria in <a href="/decisions/0006-version-strategy">ADR 0006</a>.</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

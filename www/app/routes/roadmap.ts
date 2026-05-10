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
    <h2>Now: v0.9 — i18n + Content Pipeline + View Transitions + Speculation Rules</h2>
    <p>v0.8.0 完成了 P1 功能完善（390 测试），v0.9.0 推进内容管线、i18n 国际化和 SSR 修复，v0.9.2 新增 View Transitions API 和 Speculation Rules API。446 测试通过。</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>TC39 Signals</td><td>✅ Done</td><td>@lessjs/signal: signal(), computed(), effect(), islandEffect()</td></tr>
      <tr><td>DSD 规范对齐</td><td>✅ Done</td><td>shadowrootdelegatesfocus, shadowrootserializable, shadowrootslotassignment, shadowrootcustomelementregistry</td></tr>
      <tr><td>Form-Associated CE</td><td>✅ Done</td><td>less-button, less-input 使用 ElementInternals</td></tr>
      <tr><td>Navigation API</td><td>✅ Done</td><td>navigate(), onNavigate(), matchRoute()</td></tr>
      <tr><td>Speculative Loading</td><td>✅ Done</td><td>modulepreload for eager, prefetch for lazy</td></tr>
      <tr><td>dialog/popover + inert</td><td>✅ Done</td><td>原生 &lt;dialog&gt; + ::backdrop + inert</td></tr>
      <tr><td>Island 系统改进</td><td>✅ Done</td><td>Mixin 替代猴子补丁，适配器显式注入</td></tr>
      <tr><td>@lessjs/i18n 独立包</td><td>✅ Done</td><td>从 content 拆出，lessI18n() 独立插件，SSG locale 展开</td></tr>
      <tr><td>双语文档站</td><td>✅ Done</td><td>25/30 页面英文版 + language switcher + en/zh 路径</td></tr>
      <tr><td>View Transitions API</td><td>✅ Done</td><td>跨页面 MPA 动画，Chrome 111+, Safari 18+, Firefox 129+，默认开启</td></tr>
      <tr><td>Speculation Rules API</td><td>✅ Done</td><td>浏览器 prefetch/prerender，Chrome 121+，显式启用</td></tr>
      <tr><td>SSG 后处理管线</td><td>✅ Done</td><td>5 步管线：clientScript → viewTransition → speculation → CSP → DSD polyfill</td></tr>
    </tbody></table>
    <h2>Next: v0.10 — SSG + ISR + PWA</h2>
    <p>构建能力成熟——增量构建、缓存策略、离线支持。详见 <a href="/decisions/0003-pwa-support">ADR 0003</a>。</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>路由级 revalidation</td><td>📋 Planned</td><td>按需重新生成静态页面</td></tr>
      <tr><td>Cache lock</td><td>📋 Planned</td><td>并发构建时的缓存锁</td></tr>
      <tr><td>Stale fallback</td><td>📋 Planned</td><td>新内容构建中返回旧内容</td></tr>
      <tr><td>Service Worker 策略</td><td>📋 Planned</td><td>NetworkFirst/CacheFirst 可配置</td></tr>
      <tr><td>CDN recipes</td><td>📋 Planned</td><td>Cloudflare/Netlify 缓存配置模板</td></tr>
    </tbody></table>
    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — 稳定基线</h3><p>审计修复：render-dsd 测试、island 测试、XSS 修复、pre-commit hooks、CI 补全。73 个新增测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — 功能完善 + Island Manifest</h3><p>Signals 测试、DSD 拆分、UI 统一到 DsdLitElement、Playwright E2E、Island Manifest。390 测试。</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n 独立包、SSG locale 展开、双语文档站、View Transitions API、Speculation Rules API、SSG 后处理管线重构。446 测试。</p></div>
    <div class="phase"><div class="status">v0.10 Target</div><h3>v0.10 — SSG + ISR + PWA</h3><p>增量构建、缓存策略、离线支持、CDN 配置模板。</p></div>
    <div class="phase"><div class="status">v0.11 Target</div><h3>v0.11 — 基础设施成熟 + Compiler Alpha</h3><p>AST runtime-shim 生成、增量 SSG、覆盖率门禁、.less Compiler Alpha。详见 <a href="/decisions/0002-less-compiler-eliminate-lit">ADR 0002</a>。</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>所有 package 公共 API 稳定、遵循 SemVer、迁移文档完备。判定标准见 <a href="/decisions/0006-version-strategy">ADR 0006</a>。</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/roadmap"><div class="container">
    <h1>Roadmap</h1>
    <p class="subtitle">The LessJS roadmap centers on one judgment: make SSG + DSD + Island Upgrade + Hono API trustworthy first, then expand to serverless fullstack, ISR, PWA, and compiler, and finally commit to 1.0 after public APIs stabilize.</p>
    <div class="callout"><p>This roadmap is not a marketing page. Future items listed here will only become stable user guides after they enter implementation and testing. See <a href="/decisions/0006-version-strategy">ADR 0006</a> for versioning strategy.</p></div>
    <h2>Now: v0.9 — i18n + Content Pipeline + View Transitions + Speculation Rules</h2>
    <p>v0.8.0 completed P1 feature completeness (390 tests). v0.9.0 advances i18n, content pipeline, and SSR fixes. v0.9.2 adds View Transitions API and Speculation Rules API. 446 tests passing.</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>TC39 Signals</td><td>✅ Done</td><td>@lessjs/signal: signal(), computed(), effect(), islandEffect()</td></tr>
      <tr><td>DSD Spec Alignment</td><td>✅ Done</td><td>shadowrootdelegatesfocus, shadowrootserializable, shadowrootslotassignment, shadowrootcustomelementregistry</td></tr>
      <tr><td>Form-Associated CE</td><td>✅ Done</td><td>less-button, less-input using ElementInternals</td></tr>
      <tr><td>Navigation API</td><td>✅ Done</td><td>navigate(), onNavigate(), matchRoute()</td></tr>
      <tr><td>Speculative Loading</td><td>✅ Done</td><td>modulepreload for eager, prefetch for lazy</td></tr>
      <tr><td>dialog/popover + inert</td><td>✅ Done</td><td>Native &lt;dialog&gt; + ::backdrop + inert</td></tr>
      <tr><td>Island System</td><td>✅ Done</td><td>Mixin replaces monkey-patch, explicit adapter injection</td></tr>
      <tr><td>@lessjs/i18n Package</td><td>✅ Done</td><td>Extracted from content, lessI18n() standalone plugin, SSG locale expansion</td></tr>
      <tr><td>Bilingual Docs</td><td>✅ Done</td><td>25/30 pages with English version + language switcher + en/zh paths</td></tr>
      <tr><td>View Transitions API</td><td>✅ Done</td><td>Cross-page MPA animations, Chrome 111+, Safari 18+, Firefox 129+, enabled by default</td></tr>
      <tr><td>Speculation Rules API</td><td>✅ Done</td><td>Browser prefetch/prerender, Chrome 121+, opt-in via speculation: true</td></tr>
      <tr><td>SSG Post-process Pipeline</td><td>✅ Done</td><td>5-step pipeline: clientScript → viewTransition → speculation → CSP → DSD polyfill</td></tr>
    </tbody></table>
    <h2>Next: v0.10 — SSG + ISR + PWA</h2>
    <p>Build capability maturation — incremental builds, caching strategies, offline support. See <a href="/decisions/0003-pwa-support">ADR 0003</a>.</p>
    <table class="version-table"><thead><tr><th>Area</th><th>Status</th><th>Notes</th></tr></thead><tbody>
      <tr><td>Route-level revalidation</td><td>📋 Planned</td><td>On-demand static page regeneration</td></tr>
      <tr><td>Cache lock</td><td>📋 Planned</td><td>Concurrency lock for builds</td></tr>
      <tr><td>Stale fallback</td><td>📋 Planned</td><td>Serve old content while building new</td></tr>
      <tr><td>Service Worker strategy</td><td>📋 Planned</td><td>Configurable NetworkFirst/CacheFirst</td></tr>
      <tr><td>CDN recipes</td><td>📋 Planned</td><td>Cloudflare/Netlify cache config templates</td></tr>
    </tbody></table>
    <h2>Release Phases</h2>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.7 — Stable Baseline</h3><p>Audit fixes: render-dsd tests, island tests, XSS fixes, pre-commit hooks, CI completion. 73 new tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.8 — Feature Completeness + Island Manifest</h3><p>Signals tests, DSD split, UI unified to DsdLitElement, Playwright E2E, Island Manifest. 390 tests.</p></div>
    <div class="phase"><div class="status">✅ Completed</div><h3>v0.9 — i18n + View Transitions + Speculation Rules</h3><p>@lessjs/i18n standalone package, SSG locale expansion, bilingual docs, View Transitions API, Speculation Rules API, SSG post-process pipeline refactor. 446 tests.</p></div>
    <div class="phase"><div class="status">v0.10 Target</div><h3>v0.10 — SSG + ISR + PWA</h3><p>Incremental builds, caching strategies, offline support, CDN config templates.</p></div>
    <div class="phase"><div class="status">v0.11 Target</div><h3>v0.11 — Infrastructure Maturity + Compiler Alpha</h3><p>AST runtime-shim generation, incremental SSG, coverage gates, .less Compiler Alpha. See <a href="/decisions/0002-less-compiler-eliminate-lit">ADR 0002</a>.</p></div>
    <div class="phase"><div class="status">v1.0 Target</div><h3>v1.0 — Public API Stability</h3><p>All package public APIs stable, following SemVer, with complete migration docs. Criteria in <a href="/decisions/0006-version-strategy">ADR 0006</a>.</p></div>
    <div class="nav-row"><a href="/contributing" class="nav-link">&larr; Contributing</a><a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

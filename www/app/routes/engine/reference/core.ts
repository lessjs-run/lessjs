/**
 * @lessjs/docs - API Reference: All Packages
 *
 * v0.14.9 API surface - organized by package.
 * Only public exports are listed.
 */

import { headerNav, navSections } from 'virtual:less-nav';
import { filterArchitectureNav } from '../../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

export const tagName = 'api-core-page';

export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .api-section {
        margin-bottom: 2.5rem;
      }
      .pkg-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 2rem 0 0.5rem;
      }
      .pkg-import {
        font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
      }
      .fn-name {
        font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--text-primary);
        margin: 1.25rem 0 0.25rem;
      }
      .fn-sig {
        font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
        line-height: 1.5;
      }
      .fn-desc {
        font-size: 0.875rem;
        line-height: 1.7;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
      }
    `);

export default class ApiCorePage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/engine/reference/core"
      >
        <div class="container">
          <h1>API 参考</h1>
          <p class="subtitle">所有 LessJS 包的公开 API 接口 (v0.14.9)。</p>

          <p>
            当前 API 中包的 Island 支持故意保持精简：包导出一个
            <code>islands</code> 数组，包含 <code>tagName</code>、<code>modulePath</code>
            和可选的 <code>strategy</code>。一键安装、自动注册、自动渲染和自动
            Hydration 是路线图特性，需要先完成与 Custom Elements Manifest 兼容的包协议。
          </p>

          <div class="api-section">
            <!-- ─── @lessjs/core ───────────────────────────── -->
            <div class="pkg-name">@lessjs/core</div>
            <div class="pkg-import">import { ... } from '@lessjs/runtime';</div>
            <p>纯运行时。零 Vite/Node 依赖。支持 Deno、Node、Bun、Edge。</p>

            <div class="fn-name">renderDsd()</div>
            <div class="fn-sig">
              renderDsd(tagName, componentClass, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              服务端渲染 Custom Element 为 DSD HTML。支持三层：dsd-static、dsd-interactive、pure-island。
            </div>

            <div class="fn-name">renderDSDByName()</div>
            <div class="fn-sig">
              renderDSDByName(tagName, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              类似 renderDsd，但通过 tag name 从 customElements 注册表查找组件类。
            </div>

            <div class="fn-name">escapeHtml() / escapeAttr() / escapeAttrValue()</div>
            <div class="fn-sig">
              escapeHtml(str): string - escapeAttrValue(value): string - escapeAttr(attr): string
            </div>
            <div class="fn-desc">
              HTML/属性转义，使用 SafeHtml/UnsafeHtml 品牌类型防止双重转义。
            </div>

            <div class="fn-name">defineIsland()</div>
            <div class="fn-sig">defineIsland(componentClass, options?): CustomElementConstructor</div>
            <div class="fn-desc">
              为 CE 类包装 Island 升级逻辑。支持 4 种策略：load、idle、visible、only。
            </div>

            <div class="fn-name">syncState() / getProps()</div>
            <div class="fn-sig">
              syncState(element, props): void - getProps(element): Record&lt;string, unknown&gt;
            </div>
            <div class="fn-desc">框架无关的 SSR 属性绑定和反序列化。</div>

            <div class="fn-name">registerAdapter() / getAdapter()</div>
            <div class="fn-sig">
              registerAdapter(adapter: RenderAdapter): void - getAdapter(): RenderAdapter | undefined
            </div>
            <div class="fn-desc">
              SSR 渲染器插件接口（如 Lit TemplateResult -> DSD HTML 通过 @lessjs/adapter-lit）。
              当前注册表存储一个活跃适配器。未来渲染器协议必须定义适配器身份、能力、错误、
              Hydration 提示和 DSD 约束，然后多适配器行为才会被记录为稳定。
            </div>

            <div class="fn-name">createSsrContext() / extractParams() / parseQuery()</div>
            <div class="fn-sig">
              createSsrContext(opts): SsrContext - extractParams(ctx, keys): Record - parseQuery(ctx):
              Record
            </div>
            <div class="fn-desc">
              服务端渲染上下文，包含请求、参数和查询解析。
            </div>

            <div class="fn-name">LessError / SsrRenderError</div>
            <div class="fn-sig">extends Error</div>
            <div class="fn-desc">
              结构化错误类，包含 code、statusCode、isOperational 和 toJSON()。
            </div>

            <div class="fn-name">renderSsrError() / wrapInDocument() / camelToKebab()</div>
            <div class="fn-desc">
              SSR 错误页面渲染、文档包装器和 Lit 兼容属性名转换。
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>子路径导出：</strong> <code>@lessjs/core/logger</code> (createLogger)、<code
              >@lessjs/core/errors</code>、<code>@lessjs/core/context</code>、<code
              >@lessjs/core/navigation</code> (navigate/onNavigate/matchRoute)、<code
              >@lessjs/core/constants</code>。
            </p>

            <!-- ─── @lessjs/adapter-vite ─────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-vite</div>
            <div class="pkg-import">import { lessPipeline } from '@lessjs/adapter-vite';</div>
            <p>
              Vite 构建编排：路由、Island、SSG 三阶段管线。包含 <code>lessPipeline()</code> — <code>less()</code> 已标记 @deprecated 于 v0.25。
            </p>

            <div class="fn-name">lessPipeline()</div>
            <div class="fn-sig">lessPipeline(options?: FrameworkOptions, ctx?: LessBuildContext): Plugin[]</div>
            <div class="fn-desc">
              声明式构建管线入口。替代旧 <code>less()</code>。处理路由扫描、Hono 入口生成、Island 转换、SSR 和 SSG。返回 7+ 个插件。
            </div>

            <div class="fn-name">LessBuildContext</div>
            <div class="fn-sig">class LessBuildContext(options)</div>
            <div class="fn-desc">
              跨阶段状态容器。阶段 1 写入路由/Island，阶段 2 写入客户端清单，阶段 3 读取所有内容进行 SSG 渲染。
            </div>

            <div class="fn-name">构建工具函数</div>
            <div class="fn-desc">
              <code>printBuildManifest()</code>、<code>scanClientBuild()</code>、<code
              >scanSSGOutput()</code>、<code>buildIslandChunkMap()</code>、<code
              >buildSpeculationRulesJson()</code>、<br>
              <code>injectClientScript()</code>、<code>injectCspMeta()</code>、<code
              >injectDsdPolyfill()</code>、<code>injectSpeculationRules()</code>、<code
              >injectViewTransitionMeta()</code>、<br>
              <code>extractCustomElementTags()</code>、<code>generateIslandManifests()</code>、<code
              >writeIslandManifests()</code>
            </div>

            <div class="fn-name">包 Island 和未来清单</div>
            <div class="fn-desc">
              <code>packageIslands</code> 当前扫描导出 <code>islands</code>
              元数据数组的包。未来 WC 包协议将添加 CEM 兼容字段，包括标签、模块、导出、属性、
              事件、插槽、CSS 部件、CSS 自定义属性、自定义状态、<code>ssr</code>、<code>dsd</code>、
              <code>hydrate</code> 和诊断。在该协议发布前，Registry Hub 和 <code>less add</code>
              行为仍为路线图项目。
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>子路径导出：</strong> <code>@lessjs/adapter-vite/build-context</code>、<code
              >@lessjs/adapter-vite/virtual-ids</code>
            </p>

            <!-- ─── @lessjs/app ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/app</div>
            <div class="pkg-import">import { lessjs } from '@lessjs/app';</div>
            <p>
              统一入口。组合 lessPipeline()() + lessI18n()，共享 ctx。<strong
              >推荐所有项目使用。</strong>
            </p>

            <div class="fn-name">lessjs()</div>
            <div class="fn-sig">lessjs(options: LessjsOptions): Plugin[]</div>
            <div class="fn-desc">
              接受核心选项 + content + i18n 嵌套配置。创建共享 LessBuildContext 并传递给所有子插件。
            </div>

            <!-- ─── @lessjs/content ──────────────────────────── -->
            <div class="pkg-name">@lessjs/content</div>
            <div class="pkg-import">import { lessContent } from '@lessjs/content';</div>
            <p>
              构建时内容插件：博客 + 导航 + Sitemap。数据通过虚拟模块流转（ADR 0018）。
            </p>

            <div class="fn-name">lessContent()</div>
            <div class="fn-sig">lessContent(options: LessContentOptions &amp; { ctx? }): Plugin[]</div>
            <div class="fn-desc">
              创建内容插件。模块：blog（md frontmatter）、nav（路由元数据扫描）、sitemap（SSG 输出扫描）。
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>子路径导出：</strong> <code>@lessjs/content/blog-data</code>、<code
              >@lessjs/content/nav</code>、<code>@lessjs/content/sitemap</code>
            </p>

            <!-- ─── @lessjs/i18n ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/i18n</div>
            <div class="pkg-import">import { lessI18n } from '@lessjs/i18n';</div>

            <div class="fn-name">lessI18n()</div>
            <div class="fn-sig">lessI18n(options: LessI18nOptions &amp; { ctx? }): Plugin</div>
            <div class="fn-desc">
              SSG 的语言环境扩展 + 路由级辅助函数（i18nStaticPaths、switchLocale）。
            </div>

            <!-- ─── @lessjs/adapter-lit ──────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-lit</div>
            <div class="pkg-import">
              import { installLitAdapter, WithDsdHydration, DsdLitElement } from '@lessjs/adapter-lit';
            </div>

            <div class="fn-name">installLitAdapter()</div>
            <div class="fn-desc">
              修补核心渲染管线以处理 Lit TemplateResult -> DSD HTML 转换。在 SSR bundle 入口调用一次。
            </div>

            <div class="fn-name">WithDsdHydration / DsdLitElement</div>
            <div class="fn-desc">
              DSD Hydration 的混入/基类。当 shadow root 已存在时跳过重新渲染；声明式绑定 hydrateEvents。
            </div>

            <!-- ─── @lessjs/ui ───────────────────────────────── -->
            <div class="pkg-name">@lessjs/ui</div>
            <div class="pkg-import">import { ... } from '@lessjs/ui';</div>
            <p>
              8 个 Web Components：less-button、less-input、less-card、less-code-block、less-layout、
              less-theme-toggle、less-hero-ping、less-dialog。
            </p>

            <!-- ─── @lessjs/signals ───────────────────────────── -->
            <div class="pkg-name">@lessjs/signals</div>
            <div class="pkg-import">import { signal, computed, effect } from '@lessjs/signals';</div>
            <p>
              TC39 Signals polyfill。还导出：batch、untracked、channel、islandEffect、themeSignal、isNativeSignal。
            </p>

            <!-- ─── @lessjs/rpc ──────────────────────────────── -->
            <div class="pkg-name">@lessjs/rpc</div>
            <div class="pkg-import">import { RpcController, RpcError } from '@lessjs/rpc';</div>
            <p>
              基于 fetch 的 RPC Lit ReactiveController，支持自动重试、中止和加载/错误状态管理。
            </p>

            <!-- ─── @lessjs/create ───────────────────────────── -->
            <div class="pkg-name">@lessjs/create</div>
            <div class="pkg-import">deno run -A jsr:@lessjs/create my-app</div>
            <p>
              CLI 脚手架。生成包含 Deno 配置、Vite 配置、路由、Island 和示例组件的新 LessJS 项目。
            </p>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        locale="en"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(filterArchitectureNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/engine/reference/core"
      >
        <div class="container">
          <h1>API Reference</h1>
          <p class="subtitle">Public API surface of all LessJS packages (v0.14.9).</p>

          <p>
            Package island support is intentionally small in the current API: packages export an
            <code>islands</code> array with <code>tagName</code>, <code>modulePath</code>, and optional
            <code>strategy</code>. One-command install, automatic registration, automatic rendering, and
            automatic hydration are roadmap features that require a Custom Elements Manifest-compatible
            package protocol first.
          </p>

          <div class="api-section">
            <!-- ─── @lessjs/core ───────────────────────────── -->
            <div class="pkg-name">@lessjs/core</div>
            <div class="pkg-import">import { ... } from '@lessjs/runtime';</div>
            <p>Pure runtime. Zero Vite/Node dependencies. Works in Deno, Node, Bun, Edge.</p>

            <div class="fn-name">renderDsd()</div>
            <div class="fn-sig">
              renderDsd(tagName, componentClass, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Server-side renders a Custom Element as DSD HTML. Supports all three layers: dsd-static,
              dsd-interactive, pure-island.
            </div>

            <div class="fn-name">jsx() / jsxs() / Fragment</div>
            <div class="fn-sig">
              jsx(tag, props, children?): VNode — jsxs(tag, props, children?): VNode — Fragment: symbol
            </div>
            <div class="fn-desc">
              JSX factory functions returning VNode objects. Fragment groups children without a wrapper
              DOM element. The automatic JSX runtime (<code>@lessjs/core/jsx-runtime</code>) is
              configured via <code>deno.json</code> compilerOptions.
            </div>

            <div class="fn-name">renderToString()</div>
            <div class="fn-sig">
              renderToString(node: unknown): string
            </div>
            <div class="fn-desc">
              Converts a VNode tree to an HTML string for SSR/SSG output. Event handlers (onClick etc.)
              are silently ignored. Text content is HTML-escaped. Supports className → class,
              htmlFor → for, and style object serialisation.
            </div>

            <div class="fn-name">renderToDom()</div>
            <div class="fn-sig">
              renderToDom(node: unknown, signal?: AbortSignal): Node
            </div>
            <div class="fn-desc">
              Converts a VNode tree to real DOM nodes for CSR and hydration. Event handlers are wired
              via native addEventListener with AbortSignal lifecycle. SVG elements are auto-detected
              and created with createElementNS.
            </div>

            <div class="fn-name">VNode / isVNode()</div>
            <div class="fn-sig">
              VNode: { tag, props, children, key?, ref? } — isVNode(v: unknown): v is VNode
            </div>
            <div class="fn-desc">
              5-field frozen interface for JSX element descriptions. isVNode is the type guard.
              VNode is a pure data structure — no VDOM diff, no runtime tree.
            </div>

            <div class="fn-name">renderDSDStream()</div>
            <div class="fn-sig">
              renderDSDStream(components, options?): ReadableStream&lt;Uint8Array&gt;
            </div>
            <div class="fn-desc">
              Streams a document shell, DSD component chunks, and footer using Web Streams so
              request-time handlers can return new Response(stream).
            </div>

            <div class="fn-name">renderDSDByName()</div>
            <div class="fn-sig">
              renderDSDByName(tagName, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Like renderDsd but looks up the component class from customElements registry by tag name.
            </div>

            <div class="fn-name">escapeHtml() / escapeAttr() / escapeAttrValue()</div>
            <div class="fn-sig">
              escapeHtml(str): string - escapeAttrValue(value): string - escapeAttr(attr): string
            </div>
            <div class="fn-desc">
              HTML/attribute escaping with SafeHtml/UnsafeHtml branded types for double-escape prevention.
            </div>

            <div class="fn-name">defineIsland()</div>
            <div class="fn-sig">defineIsland(componentClass, options?): CustomElementConstructor</div>
            <div class="fn-desc">
              Wraps a CE class with island upgrade logic. Supports 4 strategies: load, idle,
              visible, only.
            </div>

            <div class="fn-name">syncState() / getProps()</div>
            <div class="fn-sig">
              syncState(element, props): void - getProps(element): Record&lt;string, unknown&gt;
            </div>
            <div class="fn-desc">Framework-agnostic SSR prop binding and deserialization.</div>

            <div class="fn-name">registerAdapter() / getAdapter()</div>
            <div class="fn-sig">
              registerAdapter(adapter: RenderAdapter): void - getAdapter(): RenderAdapter | undefined
            </div>
            <div class="fn-desc">
              Plugin interface for SSR renderers (e.g., Lit TemplateResult -> DSD HTML via
              @lessjs/adapter-lit). The current registry stores one active adapter. A future renderer
              protocol must define adapter identity, capabilities, errors, hydration hints, and DSD
              constraints before multi-adapter behavior is documented as stable.
            </div>

            <div class="fn-name">createSsrContext() / extractParams() / parseQuery()</div>
            <div class="fn-sig">
              createSsrContext(opts): SsrContext - extractParams(ctx, keys): Record - parseQuery(ctx):
              Record
            </div>
            <div class="fn-desc">
              Server-side rendering context with request, params, and query parsing.
            </div>

            <div class="fn-name">LessError / SsrRenderError</div>
            <div class="fn-sig">extends Error</div>
            <div class="fn-desc">
              Structured error classes with code, statusCode, isOperational, and toJSON().
            </div>

            <div class="fn-name">renderSsrError() / wrapInDocument() / camelToKebab()</div>
            <div class="fn-desc">
              SSR error page rendering, document wrapper, and Lit-compatible attribute name conversion.
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/core/logger</code> (createLogger), <code
              >@lessjs/core/errors</code>, <code>@lessjs/core/context</code>, <code
              >@lessjs/core/navigation</code> (navigate/onNavigate/matchRoute), <code
              >@lessjs/core/constants</code>.
            </p>

            <!-- ─── @lessjs/adapter-vite ─────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-vite</div>
            <div class="pkg-import">import { lessPipeline } from '@lessjs/adapter-vite';</div>
            <p>
              Vite build orchestration: routes, islands, SSG 3-phase pipeline. Contains <code
              >lessPipeline()</code>.
            </p>

            <div class="fn-name">lessPipeline()</div>
            <div class="fn-sig">lessPipeline(options?: FrameworkOptions, ctx?: LessBuildContext): Plugin[]</div>
            <div class="fn-desc">
              Creates the LessJS Vite plugin array. Handles route scanning, Hono entry generation, island
              transform, SSR SSR and SSG. Returns 7+ plugins.
            </div>

            <div class="fn-name">LessBuildContext</div>
            <div class="fn-sig">class LessBuildContext(options)</div>
            <div class="fn-desc">
              Cross-phase state container. Phase 1 writes routes/islands, Phase 2 writes client manifests,
              Phase 3 reads all for SSG rendering.
            </div>

            <div class="fn-name">Build utilities</div>
            <div class="fn-desc">
              <code>printBuildManifest()</code>, <code>scanClientBuild()</code>, <code
              >scanSSGOutput()</code>, <code>buildIslandChunkMap()</code>, <code
              >buildSpeculationRulesJson()</code>,<br>
              <code>injectClientScript()</code>, <code>injectCspMeta()</code>, <code
              >injectDsdPolyfill()</code>, <code>injectSpeculationRules()</code>, <code
              >injectViewTransitionMeta()</code>,<br>
              <code>extractCustomElementTags()</code>, <code>generateIslandManifests()</code>, <code
              >writeIslandManifests()</code>
            </div>

            <div class="fn-name">Package islands and future manifests</div>
            <div class="fn-desc">
              <code>packageIslands</code> currently scans packages that export an <code>islands</code>
              metadata array. The future WC package protocol will add CEM-compatible fields for tags,
              modules, exports, attributes, properties, events, slots, CSS parts, CSS custom properties,
              custom states, <code>ssr</code>, <code>dsd</code>, <code>hydrate</code>, and diagnostics.
              Until that protocol ships, registry hub and <code>less add</code> behavior remain roadmap
              items.
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/adapter-vite/build-context</code>, <code
              >@lessjs/adapter-vite/virtual-ids</code>
            </p>

            <!-- ─── @lessjs/app ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/app</div>
            <div class="pkg-import">import { lessjs } from '@lessjs/app';</div>
            <p>
              Unified entry. Wraps lessPipeline()() + lessI18n() with shared ctx. <strong
              >Recommended for all projects.</strong>
            </p>

            <div class="fn-name">lessjs()</div>
            <div class="fn-sig">lessjs(options: LessjsOptions): Plugin[]</div>
            <div class="fn-desc">
              Accepts core options + content + i18n nested configs. Creates shared LessBuildContext and
              passes to all sub-plugins.
            </div>

            <!-- ─── @lessjs/content ──────────────────────────── -->
            <div class="pkg-name">@lessjs/content</div>
            <div class="pkg-import">import { lessContent } from '@lessjs/content';</div>
            <p>
              Build-time content plugin: Blog + Nav + Sitemap. Data flows through virtual modules (ADR
              0018).
            </p>

            <div class="fn-name">lessContent()</div>
            <div class="fn-sig">lessContent(options: LessContentOptions &amp; { ctx? }): Plugin[]</div>
            <div class="fn-desc">
              Creates content plugins. Modules: blog (md frontmatter), nav (route meta scanning), sitemap
              (SSG output scan).
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/content/blog-data</code>, <code
              >@lessjs/content/nav</code>, <code>@lessjs/content/sitemap</code>
            </p>

            <!-- ─── @lessjs/i18n ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/i18n</div>
            <div class="pkg-import">import { lessI18n } from '@lessjs/i18n';</div>

            <div class="fn-name">lessI18n()</div>
            <div class="fn-sig">lessI18n(options: LessI18nOptions &amp; { ctx? }): Plugin</div>
            <div class="fn-desc">
              Locale expansion for SSG + route-level helpers (i18nStaticPaths, switchLocale).
            </div>

            <!-- ─── @lessjs/adapter-lit ──────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-lit</div>
            <div class="pkg-import">
              import { installLitAdapter, WithDsdHydration, DsdLitElement } from '@lessjs/adapter-lit';
            </div>

            <div class="fn-name">installLitAdapter()</div>
            <div class="fn-desc">
              Patches core's render pipeline to handle Lit TemplateResult -> DSD HTML conversion. Call once
              in SSR bundle entry.
            </div>

            <div class="fn-name">WithDsdHydration / DsdLitElement</div>
            <div class="fn-desc">
              Mixin/base class for DSD hydration. Skip re-render when shadow root already exists; bind
              hydrateEvents declaratively.
            </div>

            <!-- ─── @lessjs/ui ───────────────────────────────── -->
            <div class="pkg-name">@lessjs/ui</div>
            <div class="pkg-import">import { ... } from '@lessjs/ui';</div>
            <p>
              8 Web Components: less-button, less-input, less-card, less-code-block, less-layout,
              less-theme-toggle, less-hero-ping, less-dialog.
            </p>

            <!-- ─── @lessjs/signals ───────────────────────────── -->
            <div class="pkg-name">@lessjs/signals</div>
            <div class="pkg-import">import { signal, computed, effect } from '@lessjs/signals';</div>
            <p>
              TC39 Signals polyfill. Also exports: batch, untracked, channel, islandEffect, themeSignal,
              isNativeSignal.
            </p>

            <!-- ─── @lessjs/rpc ──────────────────────────────── -->
            <div class="pkg-name">@lessjs/rpc</div>
            <div class="pkg-import">import { RpcController, RpcError } from '@lessjs/rpc';</div>
            <p>
              Lit ReactiveController for fetch-based RPC with auto-retry, abort, and loading/error state
              management.
            </p>

            <!-- ─── @lessjs/create ───────────────────────────── -->
            <div class="pkg-name">@lessjs/create</div>
            <div class="pkg-import">deno run -A jsr:@lessjs/create my-app</div>
            <p>
              CLI scaffold. Generates a new LessJS project with Deno config, Vite config, routes, islands,
              and example component.
            </p>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ApiCorePage);

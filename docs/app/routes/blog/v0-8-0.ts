/**
 * Blog: LessJS v0.8.0 — Feature Completion + Island Manifest + Blog
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'blog-v0-8-0';

export default class BlogV080 extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .date {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        margin-bottom: 2rem;
      }
      h2 {
        margin-top: 2.5rem;
      }
      .feature-card {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        padding: 1.25rem;
        margin: 1.5rem 0;
      }
      .feature-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        color: var(--less-text-primary);
      }
      .feature-card p {
        margin: 0.5rem 0 0;
        color: var(--less-text-secondary);
        font-size: 0.8125rem;
      }
      .feature-card .tag {
        display: inline-block;
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.125rem 0.375rem;
        border-radius: 2px;
        background: var(--less-accent);
        color: var(--less-bg-primary);
      }
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
      }
      .stat-item {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        padding: 1rem;
        text-align: center;
      }
      .stat-number {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--less-accent);
        display: block;
      }
      .stat-label {
        font-size: 0.6875rem;
        color: var(--less-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-top: 0.25rem;
        display: block;
      }
      .milestone {
        border-left: 2px solid var(--less-accent);
        padding-left: 1rem;
        margin: 1rem 0;
      }
      .milestone-title {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--less-text-primary);
      }
      .milestone-desc {
        font-size: 0.8125rem;
        color: var(--less-text-secondary);
      }
      .en-section {
        border-top: 0.5px solid var(--less-border);
        margin-top: 3rem;
        padding-top: 2rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/blog/v0-8-0">
        <div class="container">
          <p style="margin-bottom:0.5rem"><a href="/blog" style="font-size:0.75rem;color:var(--less-text-muted)">&larr; 博客</a></p>
          <h1>v0.8.0 — 功能完善 + Island Manifest + Blog 启动</h1>
          <p class="subtitle">P1 审计修复全部完成，Island 系统进入页面级清单时代，@lessjs/blog 包正式起步。</p>
          <p class="date">2026-05-08</p>

          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-number">390</span>
              <span class="stat-label">测试通过</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">36</span>
              <span class="stat-label">新增测试</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">3</span>
              <span class="stat-label">新模块</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">7</span>
              <span class="stat-label">工作包</span>
            </div>
          </div>

          <h2>核心变更</h2>

          <div class="feature-card">
            <span class="tag">New</span>
            <h3>Signal 原生切换</h3>
            <p>
              <span class="inline-code">@lessjs/signal</span> 新增
              <span class="inline-code">isNativeSignal()</span> 检测函数。
              当浏览器支持 TC39 Signals 提案时，优先使用
              <span class="inline-code">globalThis.Signal</span>，
              不可用时自动回退 polyfill。这是"Web Standards first"原则的直接体现——
              框架不造自己的 Signal，而是跟标准走。
            </p>
          </div>

          <div class="feature-card">
            <span class="tag">New</span>
            <h3>Island Upgrade Manifest</h3>
            <p>
              <span class="inline-code">@lessjs/core/island-manifest</span> 新模块（130 行）。
              每个页面生成独立的 island 清单 JSON，替代之前的全局 island 入口。
              <span class="inline-code">extractCustomElementTags()</span> 正则提取页面中的自定义元素标签，
              <span class="inline-code">generateIslandManifests()</span> 生成页面级清单，
              <span class="inline-code">writeIslandManifests()</span> 落盘到
              <span class="inline-code">island-manifests/</span> 目录。
              这意味着 SSG 构建产物可以实现真正的按需加载——每个页面只加载自己需要的 island 脚本。
            </p>
          </div>

          <div class="feature-card">
            <span class="tag">New</span>
            <h3>@lessjs/blog 包</h3>
            <p>
              新包 <span class="inline-code">@lessjs/blog</span>（v0.8.0）以 Vite 插件形态提供博客能力。
              <span class="inline-code">lessBlog()</span> 插件集成到 Vite 构建流程，
              <span class="inline-code">parseMarkdownFile()</span> 解析 Markdown + frontmatter，
              <span class="inline-code">scanPosts()</span> + <span class="inline-code">generateBlogRoutes()</span>
              自动生成路由。支持 draft 过滤、自定义 basePath 和 markdown 渲染器。
              v0.8 范围明确：.md → 路由 → 列表/文章页，不做 MDX、评论或标签系统。
            </p>
          </div>

          <h2>架构改进</h2>

          <div class="milestone">
            <div class="milestone-title">render-dsd.ts 拆分</div>
            <div class="milestone-desc">
              770 行单文件拆为 4 个模块：render-dsd-core.ts（主渲染器）、render-dsd-escape.ts（XSS 安全）、
              render-dsd-nested.ts（L2 嵌套）、render-dsd.ts（统一导出 + 向后兼容）。
              拆分后每个模块职责单一，便于独立测试和维护。
            </div>
          </div>

          <div class="milestone">
            <div class="milestone-title">UI 统一到 DsdLitElement</div>
            <div class="milestone-desc">
              LessButton、LessInput、LessThemeToggle 三个组件迁移到 DsdLitElement Mixin，
              消除手工 _dsdHydrated + createRenderRoot() 重复代码。
              所有 UI 组件现在共享同一套 DSD hydration 机制。
            </div>
          </div>

          <div class="milestone">
            <div class="milestone-title">insertAfterHead 去重</div>
            <div class="milestone-desc">
              从 @lessjs/ui 移至 @lessjs/core，消除跨包重复实现。
              这是一个典型的"共享工具函数应该住在哪"的修复。
            </div>
          </div>

          <h2>Bug 修复</h2>
          <ul>
            <li>
              <strong>island-effect cleanup 泄漏</strong>：
              islandEffect() 在 disconnectedCallback 中未正确清理 Signal effect，
              组件移除后 effect 仍执行。
            </li>
            <li>
              <strong>buildIslandChunkMap 重复前缀</strong>：
              在已包含 islands/ 前缀的路径上再次拼接，导致 SSG HTML 中 island 脚本 URL 404。
            </li>
          </ul>

          <h2>测试覆盖</h2>
          <p>
            新增 36 个测试用例：Signals 测试套件 19 个、dsd-hydration 13 个、
            Island Manifest 7 个、@lessjs/blog 10 个、Native Signal 2 个（部分重叠计数）。
            全量 390 测试通过，deno lint 零警告，deno check 零错误。
          </p>

          <h2>下一步</h2>
          <p>
            v0.8 的核心功能已完成，剩余 P2 项（Interactive Playground、Playwright E2E、
            Speculative Loading 可观测）将在后续迭代中补全。
            下一个重点方向：用 @lessjs/blog 重写文档站本身，实现 dogfooding。
          </p>

          <!-- English version -->
          <div class="en-section">
            <h2>v0.8.0 — Feature Completion + Island Manifest + Blog Launch</h2>
            <p class="subtitle">
              All P1 audit fixes complete. Island system enters per-page manifest era.
              @lessjs/blog package officially starts.
            </p>

            <h3>Highlights</h3>
            <ul>
              <li>
                <strong>Signal Native Switch</strong>:
                <span class="inline-code">isNativeSignal()</span> detects browser-native
                <span class="inline-code">globalThis.Signal</span> and falls back to polyfill automatically.
                Web Standards first — the framework follows the spec, not the other way around.
              </li>
              <li>
                <strong>Island Upgrade Manifest</strong>:
                Per-page island manifest JSON replaces the global island entry.
                Each SSG page only loads the islands it actually uses.
                <span class="inline-code">extractCustomElementTags()</span>,
                <span class="inline-code">generateIslandManifests()</span>,
                <span class="inline-code">writeIslandManifests()</span>.
              </li>
              <li>
                <strong>@lessjs/blog</strong>:
                New Vite plugin package for blog/content sites.
                <span class="inline-code">lessBlog()</span> integrates into Vite build,
                <span class="inline-code">parseMarkdownFile()</span> handles Markdown + frontmatter,
                <span class="inline-code">scanPosts()</span> + <span class="inline-code">generateBlogRoutes()</span>
                auto-generate routes. Draft filtering, custom basePath, custom markdown renderer.
                v0.8 scope: .md → routes → list/post pages. No MDX, comments, or tags.
              </li>
            </ul>

            <h3>Architecture Improvements</h3>
            <ul>
              <li>
                <strong>render-dsd.ts split</strong>: 770-line monolith → 4 focused modules
                (core, escape, nested, barrel export). Backward-compatible.
              </li>
              <li>
                <strong>UI unified to DsdLitElement</strong>:
                3 components migrated to the Mixin pattern.
                All UI components now share the same DSD hydration mechanism.
              </li>
              <li>
                <strong>insertAfterHead dedup</strong>: Moved from @lessjs/ui to @lessjs/core.
                Shared utility functions belong in core.
              </li>
            </ul>

            <h3>Bug Fixes</h3>
            <ul>
              <li>
                <strong>island-effect cleanup leak</strong>:
                islandEffect() didn't properly clean up Signal effects in disconnectedCallback.
              </li>
              <li>
                <strong>buildIslandChunkMap double prefix</strong>:
                Re-prepended islands/ prefix on already-prefixed paths, causing 404s in SSG HTML.
              </li>
            </ul>

            <h3>Test Coverage</h3>
            <p>
              +36 test cases. 390 total tests passing. Zero lint warnings. Zero type errors.
            </p>

            <h3>What's Next</h3>
            <p>
              v0.8 core features are complete. Remaining P2 items (Interactive Playground,
              Playwright E2E, Speculative Loading observability) will land in later iterations.
              Next focus: rewrite the docs site itself using @lessjs/blog — dogfooding begins.
            </p>
          </div>

          <div class="nav-row">
            <a href="/blog/v0-5-alpha1" class="nav-link">&larr; v0.5-alpha1 全量架构审计</a>
            <a href="/changelog" class="nav-link">更新日志 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, BlogV080);

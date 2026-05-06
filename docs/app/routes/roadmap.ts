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
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/roadmap">
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            LessJS 的路线图围绕一个判断展开：先把 SSG + DSD + Island Upgrade + Hono API 做可信，再扩展
            serverless fullstack、ISR、PWA 和 compiler。
          </p>

          <div class="callout">
            <p>
              Roadmap 不是宣传页。这里列出的未来项只有进入实现和测试后，才会被写成稳定用户指南。
            </p>
          </div>

          <h2>Now: v0.6 Stabilization</h2>
          <p>
            v0.6.0-alpha.1 已完成 DSD + Island + CSS 变量主题 + Signals 二开 + Form-Associated CE +
            Navigation API + dialog/popover + Speculative Loading 架构审查全部 8 Phase 38 项任务。
            当前聚焦稳定化：回归测试、文档更新、alpha 反馈收集。
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
                  <span class="inline-code">@lessjs/signals</span>：
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
            <span class="status">v0.7</span>
            <h3>Island Upgrade Manifest + Speculative Loading</h3>
            <p>
              Move from global island entry toward page-level island manifests. Make eager, idle and
              visible strategies observable in browser tests, then document them as stable behavior. Add
              Speculation Rules for predictive prefetch.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.8</span>
            <h3>Serverless Fullstack</h3>
            <p>
              Promote Hono API routes into a complete app story: FormData actions, typed RPC, env/secrets,
              deployment adapters and small official examples for content-driven apps.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.9</span>
            <h3>SSG + ISR + PWA</h3>
            <p>
              Add route-level revalidation, cache locks, stale fallback, service worker strategy and CDN
              recipes. ISR should arrive only after adapter semantics are clear.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.10</span>
            <h3>.less Compiler Alpha</h3>
            <p>
              Explore a compiler that can reduce runtime cost and make Lit optional. It remains an
              optimization path, not a prerequisite for the current framework model.
            </p>
          </div>

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

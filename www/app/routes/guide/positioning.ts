export const meta = { section: 'Quick Start', label: 'Framework Positioning', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/core';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-callout';

export class PositioningPage extends DsdElement {
  declare locale?: string;

  static override styles = [pageStyles];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout
        nav-items='${JSON.stringify(filterFrameworkNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/guide/positioning"
        locale="zh"
        locales='${JSON.stringify(['en', 'zh'])}'
      >
        <div class="container">
          <h1>框架定位</h1>
          <p class="subtitle">
            LessJS 当前最准确的定位是 <strong>DSD-first Web Components 应用框架</strong>：
            以 DSD/WC 渲染引擎为中心，向应用框架和 Registry Hub 延伸。
          </p>

          <h2>三支柱架构</h2>

          <div class="pillar">
            <div class="num">支柱 1</div>
            <h3>全栈框架</h3>
            <p>
              文件约定路由 + Hono API Route + Serverless 部署。SSG/ISR/SSR 同一套渲染引擎--<strong>不是 SSG 框架</strong>，
              SSG 只是渲染引擎的当前使用模式。renderDSD() 是渲染时机无关的，build-time / ISR / request-time 都用同一套引擎。
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 2</div>
            <h3>通用 WC 渲染引擎</h3>
            <p>
              Declarative Shadow DOM 零 JS 首屏。v0.20.0 已引入 DsdElement、StyleSheet 和 CSS Parts。
              第三方 WC 通过兼容性分类得到 SSR、client-only 或拒绝构建的确定结果。
            </p>
          </div>

          <div class="pillar">
            <div class="num">支柱 3</div>
            <h3>Registry Hub</h3>
            <p>
              Web Component 发现、兼容性验证、一键安装。Playwright 渲染真实组件预览。
              当前是 early access evidence pipeline，不是成熟 marketplace。
            </p>
          </div>

          <h2>设计理念</h2>

          <div class="pillar">
            <div class="num">Principle 01</div>
            <h3>Web Standards First</h3>
            <p>
              HTTP 使用 Fetch API，UI 使用 Custom Elements 和 Shadow DOM，模块使用 ESM， 服务端使用 Hono
              对齐 Web 标准。用户学到的知识应该能离开 LessJS 继续使用。
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 02</div>
            <h3>Rendering-Timing-Agnostic</h3>
            <p>
              renderDSD() 不关心什么时候被调用--build-time (SSG)、cache-expiry-time (ISR)、
              request-time (SSR) 用同一套引擎。SSG 是当前默认模式，不是框架身份。
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 03</div>
            <h3>Islands Are Upgrades, Not Hydration</h3>
            <p>
              页面先是可读、可缓存、可爬取的 HTML。交互组件随后通过 Custom Element upgrade
              变成活的组件。框架不把整页状态恢复当成默认成本。
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 04</div>
            <h3>Adapters Extend, They Do Not Define</h3>
            <p>
              Lit / React / Vanilla 是可插拔适配器，不是框架绑定。同一页面多框架共存，
              每个组件独立 hydration。未来的 Vue adapter 同样遵循这个边界。
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 05</div>
            <h3>Docs Must Be Falsifiable</h3>
            <p>
              文档要写当前行为，而不是愿景口号。能运行的写成指南；还没稳定的写进 Roadmap；
              风险和限制写在架构页里，而不是藏到用户踩坑之后。
            </p>
          </div>

          <h2>最适合的场景</h2>
          <table>
            <thead>
              <tr>
                <th>场景</th>
                <th>为什么适合</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>文档站和产品站</td>
                <td>SSG 产物简单，首屏 HTML 稳定，交互通常集中在少数 island。</td>
              </tr>
              <tr>
                <td>博客和内容站</td>
                <td>内容优先、可爬取、可缓存，后续可以引入 ISR 和增量构建。</td>
              </tr>
              <tr>
                <td>轻量 Serverless 应用</td>
                <td>Hono API routes 和 Fetch 模型让部署到 Deno Deploy、Workers 等平台更自然。</td>
              </tr>
              <tr>
                <td>组件化设计系统展示</td>
                <td>Web Components 是平台能力，包级 island 可以跨项目复用。Registry Hub 提供发现和安装。</td>
              </tr>
              <tr>
                <td>WC 重度用户</td>
                <td>混用 Shoelace/Material Web/Media Chrome 等 WC 库，DSD 预渲染 + Island 升级。</td>
              </tr>
            </tbody>
          </table>

          <h2>正在建设的能力</h2>
          <p>以下能力已规划但尚未完成，不应视为成熟卖点：</p>
          <ul>
            <li>Hydration 策略（client:load/idle/visible/only）- 当前只有 ssr:true/false</li>
            <li>ISR 缓存层 - stale-while-revalidate</li>
            <li>Vue adapter - 当前支持 Lit/React/Vanilla</li>
            <li>Supabase 集成 - Auth + DB + Realtime</li>
            <li>公开 Hub 服务 - 当前为本地 MVP</li>
          </ul>

          <h2>工程取舍</h2>
          <table>
            <thead>
              <tr>
                <th>选择</th>
                <th>原因</th>
                <th>代价</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DSD 渲染引擎</td>
                <td>零 JS 首屏，浏览器原生能力。其他框架无法通过工程优化追平。</td>
                <td>第三方 WC 的 shadow DOM 内部不可预测，Tier 1 预渲染需逐一验证。</td>
              </tr>
              <tr>
                <td>Hono 运行时</td>
                <td>足够小，贴近 Fetch，跨运行时迁移成本低。</td>
                <td>部署适配器和平台能力仍需要逐步补齐。</td>
              </tr>
              <tr>
                <td>多框架适配器</td>
                <td>同一页面 Lit/React/Vanilla 共存，按需选择。</td>
                <td>每个适配器有独立 hydration 语义，维护成本随适配器数量增长。</td>
              </tr>
              <tr>
                <td>渲染时机无关</td>
                <td>同一引擎支持 SSG/ISR/SSR，不锁定渲染模式。</td>
                <td>ISR 和 request-time SSR 尚未实现。</td>
              </tr>
            </tbody>
          </table>

          <h2>与常见框架的关系</h2>
          <table>
            <thead>
              <tr>
                <th>框架</th>
                <th>LessJS 的差异</th>
                <th>LessJS 借鉴的部分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Astro</td>
                <td>WC 在 Astro 里是二等公民（当普通元素处理），没有 DSD 预渲染。LessJS WC 是一等公民。</td>
                <td>内容优先、岛屿交互、静态交付。</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>Fresh 锁定 Preact。LessJS 全栈框架层同级，但多了 WC 引擎 + Hub 两个支柱。</td>
                <td>Deno-first、Fetch-first、island-first。</td>
              </tr>
              <tr>
                <td>Next.js</td>
                <td>Next 锁定 React，必须有 runtime。LessJS 零 runtime 首屏 + 跨框架 WC 引擎。</td>
                <td>路由约定、构建产物、部署适配器的工程纪律。</td>
              </tr>
            </tbody>
          </table>

          <less-callout type="info" label="为什么选 WC 不选 React？">
            三个答案：(1) 样式隔离 - Shadow DOM 是浏览器机制不是约定；
            (2) 跨框架 - Shoelace/Material Web 写一次，React/Vue/Angular/Svelte 都能用；
            (3) 零 JS 首屏 - DSD 是浏览器原生 HTML，不需要任何 runtime。
          </less-callout>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
            <a href="/engine/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout
        nav-items='${JSON.stringify(filterFrameworkNav(navSections))}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/en/guide/positioning"
        locale="en"
        locales='${JSON.stringify(['en', 'zh'])}'
      >
        <div class="container">
          <h1>Framework Positioning</h1>
          <p class="subtitle">
            LessJS is best described today as a <strong>DSD-first Web Components application framework</strong>:
            a DSD/WC rendering engine that extends into an app framework and Registry Hub.
          </p>

          <h2>Three-Pillar Architecture</h2>

          <div class="pillar">
            <div class="num">Pillar 1</div>
            <h3>Full-Stack Framework</h3>
            <p>
              File-convention routing + Hono API routes + serverless deployment. SSG/ISR/SSR - same rendering engine.
              <strong>Not an SSG framework</strong> - SSG is one mode of the rendering engine, not the framework's identity.
              renderDSD() is rendering-timing-agnostic: build-time, ISR, or request-time, same engine.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 2</div>
            <h3>Universal WC Rendering Engine</h3>
            <p>
              Declarative Shadow DOM zero-JS first paint. v0.20.0 adds DsdElement, StyleSheet, and CSS Parts.
              Third-party WCs get deterministic SSR, client-only, or rejected outcomes through compatibility classification.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Pillar 3</div>
            <h3>Registry Hub</h3>
            <p>
              Web Component discovery, compatibility validation, one-click install. Playwright-rendered real component previews.
              This is an early-access evidence pipeline, not a mature marketplace yet.
            </p>
          </div>

          <h2>Design Principles</h2>

          <div class="pillar">
            <div class="num">Principle 01</div>
            <h3>Web Standards First</h3>
            <p>
              HTTP uses Fetch API, UI uses Custom Elements and Shadow DOM, modules use ESM, server uses
              Hono aligned with Web standards. What users learn should be transferable beyond LessJS.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 02</div>
            <h3>Rendering-Timing-Agnostic</h3>
            <p>
              renderDSD() doesn't care when it's called - build-time (SSG), cache-expiry-time (ISR),
              request-time (SSR), same engine. SSG is the current default mode, not the framework's identity.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 03</div>
            <h3>Islands Are Upgrades, Not Hydration</h3>
            <p>
              Pages are first readable, cacheable, crawlable HTML. Interactive components become alive
              later through Custom Element upgrade. The framework does not treat full-page state
              restoration as a default cost.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 04</div>
            <h3>Adapters Extend, They Do Not Define</h3>
            <p>
              Lit / React / Vanilla are pluggable adapters, not framework bindings. Multi-framework
              coexistence on the same page, each component with independent hydration. A future Vue
              adapter will follow the same boundary.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 05</div>
            <h3>Docs Must Be Falsifiable</h3>
            <p>
              Docs should describe current behavior, not aspirational vision. Runnable features go into
              guides; not-yet-stable items go into the Roadmap; risks and limitations belong in
              architecture pages, not discovered after users hit problems.
            </p>
          </div>

          <h2>Best-Fit Scenarios</h2>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Why It Fits</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Docs &amp; product sites</td>
                <td>
                  SSG output is simple, first-paint HTML is stable, interactivity is limited to a few
                  islands.
                </td>
              </tr>
              <tr>
                <td>Blogs &amp; content sites</td>
                <td>
                  Content-first, crawlable, cacheable. ISR and incremental builds can be added later.
                </td>
              </tr>
              <tr>
                <td>Lightweight Serverless apps</td>
                <td>
                  Hono API routes and the Fetch model make deployment to Deno Deploy, Workers, etc.
                  natural.
                </td>
              </tr>
              <tr>
                <td>Componentized design system showcases</td>
                <td>
                  Web Components are a platform capability. Package-level islands can be reused across
                  projects. Registry Hub provides discovery and installation.
                </td>
              </tr>
              <tr>
                <td>WC-heavy users</td>
                <td>
                  Mix Shoelace/Material Web/Media Chrome WC libraries. DSD pre-rendering + Island upgrade.
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Capabilities Under Construction</h2>
          <p>
            The following capabilities are planned but not yet complete. They should not be described as mature selling points:
          </p>
          <ul>
            <li>Hydration strategies (client:load/idle/visible/only) - currently only ssr:true/false</li>
            <li>ISR cache layer - stale-while-revalidate</li>
            <li>Vue adapter - currently supports Lit/React/Vanilla</li>
            <li>Supabase integration - Auth + DB + Realtime</li>
            <li>Public Hub service - currently a local MVP</li>
          </ul>

          <h2>Engineering Trade-Offs</h2>
          <table>
            <thead>
              <tr>
                <th>Choice</th>
                <th>Why</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DSD rendering engine</td>
                <td>Zero-JS first paint, browser-native capability. Other frameworks cannot match this through optimization.</td>
                <td>Third-party WC shadow DOM is unpredictable; Tier 1 pre-rendering requires per-library validation.</td>
              </tr>
              <tr>
                <td>Hono runtime</td>
                <td>Small enough, close to Fetch, low cost to migrate across runtimes.</td>
                <td>Deploy adapters and platform capabilities still need incremental filling.</td>
              </tr>
              <tr>
                <td>Multi-framework adapters</td>
                <td>Lit/React/Vanilla coexist on the same page, choose per component.</td>
                <td>Each adapter has independent hydration semantics; maintenance cost grows with adapter count.</td>
              </tr>
              <tr>
                <td>Rendering-timing-agnostic</td>
                <td>Same engine supports SSG/ISR/SSR, no rendering mode lock-in.</td>
                <td>ISR and request-time SSR are not yet implemented.</td>
              </tr>
            </tbody>
          </table>

          <h2>Relationship With Common Frameworks</h2>
          <table>
            <thead>
              <tr>
                <th>Framework</th>
                <th>What Differentiates LessJS</th>
                <th>What LessJS Borrows</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Astro</td>
                <td>WC is second-class in Astro (treated as plain elements), no DSD pre-rendering. LessJS has WC as first-class citizens.</td>
                <td>Content-first, island interactivity, static delivery.</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>Fresh is locked to Preact. LessJS full-stack framework layer is a peer, but adds WC engine + Hub pillars.</td>
                <td>Deno-first, Fetch-first, island-first.</td>
              </tr>
              <tr>
                <td>Next.js</td>
                <td>Next is locked to React, requires runtime. LessJS has zero-runtime first paint + cross-framework WC engine.</td>
                <td>Route conventions, build output, deployment adapter engineering discipline.</td>
              </tr>
            </tbody>
          </table>

          <less-callout type="info" label="Why WC over React?">
            Three answers: (1) Style isolation - Shadow DOM is a browser mechanism, not a convention;
            (2) Cross-framework - Shoelace/Material Web write once, works with React/Vue/Angular/Svelte;
            (3) Zero-JS first paint - DSD is native browser HTML, requires no runtime.
          </less-callout>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
            <a href="/engine/architecture" class="nav-link">Architecture &rarr;</a>
            <a href="/engine/standards-registry" class="nav-link">Standards &amp; Registry &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-positioning', PositioningPage);
export default PositioningPage;
export const tagName = 'page-positioning';

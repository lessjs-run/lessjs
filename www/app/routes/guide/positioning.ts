export const meta = { section: 'Start Here', label: 'Framework Positioning', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class PositioningPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/guide/positioning"
        locale="zh"
        .locales="${['en', 'zh']}"
      >
        <div class="container">
          <h1>框架定位</h1>
          <p class="subtitle">
            LessJS 是一个 Deno-first、Web Standards-first、static-first 的 Web 框架。
            它的目标不是成为所有场景的最大框架，而是把内容优先、渐进增强和 Serverless API
            组织成一条可信的工程路径。
          </p>

          <h2>一句话定位</h2>
          <p>
            LessJS 用 <strong>DSD-rendered Web Components</strong> 输出首屏 HTML，用
            <strong>Island Upgrade</strong> 接管少量交互，用 <strong>Hono + Fetch API</strong>
            提供服务端能力，用 <strong>SSG</strong> 作为默认交付形态，用
            <strong>Serverless/Edge</strong> 部署动态部分。
          </p>

          <div class="callout">
            <p>
              这不是"另一个 hydration 框架"。更准确地说，LessJS 是一个把 Web Components、 Declarative
              Shadow DOM、ESM、Fetch API 和静态部署打通的应用骨架。
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
            <h3>Static First, Dynamic When Explicit</h3>
            <p>
              默认产物应该是静态 HTML、CSS 和必要的 island JavaScript。 需要 API、认证、数据写入或
              revalidation 时再显式进入 serverless/edge 模式。
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
              Lit 是当前最现实的作者体验；未来的 <span class="inline-code">.less</span>
              compiler 是优化路径，不是框架成立的前提。运行时、构建和文档都应该保持 adapter 边界清晰。
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
                <td>内容优先、可爬取、可缓存，后续可以引入 PWA 和增量构建。</td>
              </tr>
              <tr>
                <td>轻量 Serverless 应用</td>
                <td>Hono API routes 和 Fetch 模型让部署到 Deno Deploy、Workers 等平台更自然。</td>
              </tr>
              <tr>
                <td>组件化设计系统展示</td>
                <td>Web Components 是平台能力，包级 island 可以跨项目复用。</td>
              </tr>
            </tbody>
          </table>

          <h2>暂时不主打的场景</h2>
          <p>LessJS 可以演进到更复杂的全栈应用，但当前文档不应把下列能力描述成成熟卖点：</p>
          <ul>
            <li>高频数据后台、CRM、复杂权限系统。</li>
            <li>生产级 ISR、分布式 cache lock、revalidate queue。</li>
            <li>整页客户端状态框架和传统 SPA 路由。</li>
            <li>完全消除 Lit 的生产级 compiler。</li>
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
                <td>Lit authoring</td>
                <td>Web Components 生态成熟，SSR 可行，API 稳定。</td>
                <td>需要管理安全渲染边界，compiler 优化仍是未来项。</td>
              </tr>
              <tr>
                <td>Hono runtime</td>
                <td>足够小，贴近 Fetch，跨运行时迁移成本低。</td>
                <td>部署适配器和平台能力仍需要逐步补齐。</td>
              </tr>
              <tr>
                <td>SSG default</td>
                <td>部署简单，缓存友好，文档/内容站收益最大。</td>
                <td>动态数据和 ISR 需要额外运行时约定。</td>
              </tr>
            </tbody>
          </table>

          <h2>与常见框架的关系</h2>
          <table>
            <thead>
              <tr>
                <th>框架</th>
                <th>LessJS 不追随的部分</th>
                <th>LessJS 借鉴的部分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Astro</td>
                <td>多 UI 框架整合不是近期目标。</td>
                <td>内容优先、岛屿交互、静态交付。</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>不绑定 Preact，也不把 JSX 当作核心 DSL。</td>
                <td>Deno-first、Fetch-first、island-first。</td>
              </tr>
              <tr>
                <td>Next / Nuxt</td>
                <td>不以大型全栈平台为默认复杂度。</td>
                <td>路由约定、构建产物、部署适配器的工程纪律。</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
            <a href="/guide/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/en/guide/positioning"
        locale="en"
        .locales="${['en', 'zh']}"
      >
        <div class="container">
          <h1>Framework Positioning</h1>
          <p class="subtitle">
            LessJS is a Deno-first, Web Standards-first, static-first web framework.
            Its goal is not to be the biggest framework for every scenario, but to organize
            content-first, progressive enhancement, and Serverless API into a trustworthy
            engineering path.
          </p>

          <h2>One-Line Positioning</h2>
          <p>
            LessJS uses <strong>DSD-rendered Web Components</strong> for first-paint HTML,
            <strong>Island Upgrade</strong> for targeted interactivity,
            <strong>Hono + Fetch API</strong> for server-side capability,
            <strong>SSG</strong> as the default delivery model, and
            <strong>Serverless/Edge</strong> for dynamic deployment.
          </p>

          <div class="callout">
            <p>
              This is not "another hydration framework." More accurately, LessJS is an application
              skeleton that wires together Web Components, Declarative Shadow DOM, ESM, Fetch API,
              and static deployment.
            </p>
          </div>

          <h2>Design Principles</h2>

          <div class="pillar">
            <div class="num">Principle 01</div>
            <h3>Web Standards First</h3>
            <p>
              HTTP uses Fetch API, UI uses Custom Elements and Shadow DOM, modules use ESM,
              server uses Hono aligned with Web standards. What users learn should be transferable
              beyond LessJS.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 02</div>
            <h3>Static First, Dynamic When Explicit</h3>
            <p>
              The default output should be static HTML, CSS, and only necessary island JavaScript.
              Opt into serverless/edge mode explicitly when API, auth, writes, or revalidation
              are needed.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 03</div>
            <h3>Islands Are Upgrades, Not Hydration</h3>
            <p>
              Pages are first readable, cacheable, crawlable HTML. Interactive components become
              alive later through Custom Element upgrade. The framework does not treat full-page
              state restoration as a default cost.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 04</div>
            <h3>Adapters Extend, They Do Not Define</h3>
            <p>
              Lit is the most practical authoring experience today; a future
              <span class="inline-code">.less</span> compiler is an optimization path,
              not a prerequisite for the framework. Runtime, build, and docs should all
              keep adapter boundaries clear.
            </p>
          </div>

          <div class="pillar">
            <div class="num">Principle 05</div>
            <h3>Docs Must Be Falsifiable</h3>
            <p>
              Docs should describe current behavior, not aspirational vision. Runnable features
              go into guides; not-yet-stable items go into the Roadmap; risks and limitations
              belong in architecture pages, not discovered after users hit problems.
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
                <td>SSG output is simple, first-paint HTML is stable, interactivity is limited to a few islands.</td>
              </tr>
              <tr>
                <td>Blogs &amp; content sites</td>
                <td>Content-first, crawlable, cacheable. PWA and incremental builds can be added later.</td>
              </tr>
              <tr>
                <td>Lightweight Serverless apps</td>
                <td>Hono API routes and the Fetch model make deployment to Deno Deploy, Workers, etc. natural.</td>
              </tr>
              <tr>
                <td>Componentized design system showcases</td>
                <td>Web Components are a platform capability. Package-level islands can be reused across projects.</td>
              </tr>
            </tbody>
          </table>

          <h2>Not-Yet-Primary Scenarios</h2>
          <p>LessJS can evolve toward more complex full-stack apps, but current docs should not describe these as mature selling points:</p>
          <ul>
            <li>High-frequency data dashboards, CRM, complex permission systems.</li>
            <li>Production-grade ISR, distributed cache lock, revalidate queue.</li>
            <li>Full-page client state frameworks and traditional SPA routing.</li>
            <li>A production-grade compiler that fully eliminates Lit.</li>
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
                <td>Lit authoring</td>
                <td>Web Components ecosystem is mature, SSR is viable, API is stable.</td>
                <td>Must manage safe rendering boundaries; compiler optimization is future work.</td>
              </tr>
              <tr>
                <td>Hono runtime</td>
                <td>Small enough, close to Fetch, low cost to migrate across runtimes.</td>
                <td>Deploy adapters and platform capabilities still need incremental filling.</td>
              </tr>
              <tr>
                <td>SSG default</td>
                <td>Simple deployment, cache-friendly, maximal benefit for docs/content sites.</td>
                <td>Dynamic data and ISR require additional runtime conventions.</td>
              </tr>
            </tbody>
          </table>

          <h2>Relationship With Common Frameworks</h2>
          <table>
            <thead>
              <tr>
                <th>Framework</th>
                <th>What LessJS Does Not Follow</th>
                <th>What LessJS Borrows</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Astro</td>
                <td>Multi-UI-framework integration is not a near-term goal.</td>
                <td>Content-first, island interactivity, static delivery.</td>
              </tr>
              <tr>
                <td>Fresh</td>
                <td>Not bound to Preact, does not use JSX as the core DSL.</td>
                <td>Deno-first, Fetch-first, island-first.</td>
              </tr>
              <tr>
                <td>Next / Nuxt</td>
                <td>Does not default to large-scale full-stack complexity.</td>
                <td>Route conventions, build output, deployment adapter engineering discipline.</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
            <a href="/guide/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-positioning', PositioningPage);
export default PositioningPage;
export const tagName = 'page-positioning';

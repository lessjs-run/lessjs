import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class PositioningPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/positioning">
        <div class="container">
          <h1>Framework Positioning</h1>
          <p class="subtitle">
            KISS 是一个 Deno-first、Web Standards-first、static-first 的 Web
            框架。它的目标不是成为所有场景的最大框架，而是把内容优先、渐进增强和 Serverless API
            组织成一条可信的工程路径。
          </p>

          <h2>一句话定位</h2>
          <p>
            KISS 用 <strong>DSD-rendered Web Components</strong> 输出首屏 HTML， 用 <strong>Island
              Upgrade</strong> 接管少量交互，用
            <strong>Hono + Fetch API</strong> 提供服务端能力，用
            <strong>SSG</strong> 作为默认交付形态。
          </p>

          <div class="callout">
            <p>
              这不是“另一个 hydration 框架”。更准确地说，KISS 是一个把 Web Components、 Declarative Shadow
              DOM、ESM、Fetch API 和静态部署打通的应用骨架。
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
          <p>
            KISS 可以演进到更复杂的全栈应用，但当前文档不应把下列能力描述成成熟卖点：
          </p>
          <ul>
            <li>高频数据后台、CRM、复杂权限系统。</li>
            <li>生产级 ISR、分布式 cache lock、revalidate queue。</li>
            <li>整页客户端状态框架和传统 SPA 路由。</li>
            <li>完全消除 Lit 的生产级 compiler。</li>
          </ul>

          <h2>与常见框架的关系</h2>
          <table>
            <thead>
              <tr>
                <th>框架</th>
                <th>KISS 不追随的部分</th>
                <th>KISS 借鉴的部分</th>
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

          <h2>文档承诺</h2>
          <p>
            KISS 文档应该只承诺当前能验证的能力，把未来功能明确标为 roadmap。
            如果某个功能依赖尚未完成的安全边界、构建 metadata、平台 adapter 或运行时约定，
            文档必须直接说明它还不是稳定路径。
          </p>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">Getting Started &rarr;</a>
            <a href="/guide/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-positioning', PositioningPage);
export default PositioningPage;
export const tagName = 'page-positioning';

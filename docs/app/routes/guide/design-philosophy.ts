import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class DesignPhilosophyPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout currentPath="/guide/design-philosophy">
        <div class="container">
          <h1>设计理念</h1>
          <p class="subtitle">
            LessJS 的哲学不是“少写代码”这么单薄，而是把复杂度放在正确的位置：
            平台已经解决的问题交给平台，框架必须解决的问题才由框架承担。
          </p>

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
              默认产物应该是静态 HTML、CSS 和必要的 island JavaScript。需要 API、认证、 数据写入或
              revalidation 时再显式进入 serverless/fullstack 模式。
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
              Lit 是当前最现实的作者体验；未来的 <span class="inline-code">.kiss</span>
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

          <h2>不追求的东西</h2>
          <p>
            LessJS 不追求把所有前端范式压进一个框架，也不追求用抽象遮住平台。
            如果一个功能必须引入大量专有协议，它需要证明自己能显著降低实际复杂度。
          </p>

          <div class="nav-row">
            <a href="/guide/getting-started" class="nav-link">&larr; Getting Started</a>
            <a href="/guide/architecture" class="nav-link">Architecture &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-design-philosophy', DesignPhilosophyPage);
export default DesignPhilosophyPage;
export const tagName = 'page-design-philosophy';

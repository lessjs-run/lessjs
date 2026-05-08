/**
 * Hello World Demo — LessJS Architecture
 *
 * K + S 约束演示：
 * - SSG + DSD 输出
 * - 内容在 JS 加载前可见
 * - @lessjs/ui 组件
 */
export const meta = { section: 'Examples', label: 'Hello World', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-card';
import '@lessjs/ui/less-button';

export class HelloDemoPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .demo-container {
        padding: 2rem;
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 8px;
        margin: 1.5rem 0;
      }
      .demo-container h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin: 0 0 1rem;
        color: var(--less-text-primary);
      }
      .demo-container .subtitle {
        color: var(--less-text-tertiary);
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }
      .demo-container .cards {
        display: grid;
        gap: 1rem;
      }
      less-card {
        --less-bg-card: var(--less-bg-elevated);
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout current-path="/examples/hello">
        <div class="container">
          <h1>Hello World Demo</h1>
          <p class="subtitle">
            K + S 约束：SSG + DSD 输出，内容在 JS 加载前可见
          </p>

          <h2>Live Demo</h2>
          <div class="demo-container">
            <h1>Hello, LessJS!</h1>
            <p class="subtitle">完全基于 Web 标准构建的极简全栈框架。</p>
            <div class="actions">
              <less-button variant="primary" href="https://jsr.io/@lessjs/core">快速上手</less-button>
              <less-button href="https://github.com/lessjs-run/LessJS">GitHub</less-button>
            </div>
            <div class="cards">
              <less-card>
                <h3 slot="header">SSG + DSD</h3>
                <p>
                  带声明式 Shadow DOM 的静态站点生成。内容在 JavaScript 加载前就可见。
                </p>
              </less-card>
              <less-card>
                <h3 slot="header">Islands 架构</h3>
                <p>
                  交互式组件按需 upgrade。默认静态优先，渐进增强。
                </p>
              </less-card>
              <less-card>
                <h3 slot="header">API Routes</h3>
                <p>带 Hono RPC 的 Serverless 端点。服务端到客户端类型安全。</p>
              </less-card>
            </div>
          </div>

          <h2>约束验证</h2>
          <table>
            <thead>
              <tr>
                <th>约束</th>
                <th>验证</th>
                <th>实现</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>K</strong> — Knowledge</td>
                <td>✓ 内容在构建时已知</td>
                <td>SSG + DSD 输出</td>
              </tr>
              <tr>
                <td><strong>I</strong> — Isolated</td>
                <td>✓ 无交互 Island</td>
                <td>纯静态页面</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Semantic</td>
                <td>✓ DSD 内容可达</td>
                <td>Shadow DOM 声明式渲染</td>
              </tr>
              <tr>
                <td><strong>S</strong> — Static</td>
                <td>✓ 纯静态文件</td>
                <td>dist/index.html</td>
              </tr>
            </tbody>
          </table>

          <div class="nav-row">
            <a href="/examples" class="nav-link">&larr; Examples</a>
            <a href="/examples/minimal-blog" class="nav-link">Minimal Blog &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-hello-demo', HelloDemoPage);
export default HelloDemoPage;
export const tagName = 'page-hello-demo';

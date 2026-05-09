export const meta = { section: 'Production', label: 'Deployment', order: 50 };
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class DeploymentPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 0.75rem;
        margin: 1rem 0 1.5rem;
      }

      .platform-card {
        padding: 1rem;
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
      }

      .platform-card h3 {
        margin: 0 0 0.4rem;
      }

      .platform-card p {
        margin: 0;
        font-size: 0.8125rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/deployment">
        <div class="container">
          <h1>部署</h1>
          <p class="subtitle">
            LessJS 优先部署静态文件。运行时 API 路由在应用需要动态行为时， 通过 serverless 或 edge adapter
            单独部署。
          </p>

          <h2>Build Once</h2>
          <less-code-block><pre><code>deno task build</code></pre></less-code-block>
          <p>
            构建输出 <span class="inline-code">dist/</span>：带 Declarative Shadow DOM 的静态 HTML、
            client island chunks 和复制的公开资源。
          </p>

          <h2>Static Hosting</h2>
          <div class="platform-grid">
            <div class="platform-card">
              <h3>GitHub Pages</h3>
              <p>部署在仓库子路径下时，设置 Vite <span class="inline-code">base</span>。</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Pages</h3>
              <p>
                构建命令：<span class="inline-code">deno task build</span>；输出目录：<span
                  class="inline-code"
                >dist</span>。
              </p>
            </div>
            <div class="platform-card">
              <h3>Netlify</h3>
              <p>发布目录：<span class="inline-code">dist</span>。</p>
            </div>
            <div class="platform-card">
              <h3>Vercel</h3>
              <p>使用静态输出，Framework 预设选 "Other"。</p>
            </div>
            <div class="platform-card">
              <h3>S3 / CloudFront</h3>
              <p>
                上传 <span class="inline-code">dist</span> 并配置合适的缓存头。
              </p>
            </div>
          </div>

          <h2>GitHub Pages Base Path</h2>
          <p>
            如果站点从 <span class="inline-code">https://user.github.io/repo/</span> 提供服务， 在 Vite
            中配置基础路径。
          </p>
          <less-code-block
          ><pre><code>// vite.config.ts
            import { defineConfig } from 'vite';
            import { less } from '@lessjs/core';

            export default defineConfig({
              base: '/repo/',
              plugins: [less()],
            });</code></pre></less-code-block>

            <h2>API Deployment</h2>
            <p>
              API 路由属于生成的 Hono app。静态托管不会自动执行它们。 当应用需要运行时行为时，通过平台
              adapter 部署 API 路由。
            </p>
            <table>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deno Deploy</td>
                  <td>Natural fit</td>
                  <td>Closest to the Deno-first development model.</td>
                </tr>
                <tr>
                  <td>Cloudflare Workers</td>
                  <td>Good fit</td>
                  <td>Hono maps well to Workers.</td>
                </tr>
                <tr>
                  <td>Vercel / Netlify Functions</td>
                  <td>Needs adapter</td>
                  <td>Requires documented build output and runtime entry contract.</td>
                </tr>
              </tbody>
            </table>

            <h2>No Production SSR Server by Default</h2>
            <p>
              LessJS 主路径不需要长期运行的生产 SSR 服务器。静态页面应保持静态； 动态行为应为显式 API
              或未来的 ISR。这使托管便宜、可缓存、运维轻量。
            </p>

            <h2>Deployment Checklist</h2>
            <ul>
              <li>在本地或 CI 中运行 <span class="inline-code">deno task build</span>。</li>
              <li>发布前预览 <span class="inline-code">dist/</span>。</li>
              <li>确认部署在子目录下时的 base path。</li>
              <li>确认所选托管路径下 CSP/安全头仍然有效。</li>
              <li>如果 island 调用运行时端点，单独部署 API 路由。</li>
            </ul>

            <div class="nav-row">
              <a href="/guide/testing" class="nav-link">&larr; 测试</a>
              <a href="/roadmap" class="nav-link">开发计划 &rarr;</a>
            </div>
          </div>
        </less-layout>
      `;
    }
  }

  customElements.define('page-deployment', DeploymentPage);
  export default DeploymentPage;
  export const tagName = 'page-deployment';

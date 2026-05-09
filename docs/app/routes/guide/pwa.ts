/**
 * PWA Support — @lessjs/core PWA feature guide
 */
export const meta = { section: 'Production', label: 'PWA Support', order: 60 };
import { headerNav, navSections } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class PwaPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/pwa">
        <div class="container">
          <h1>PWA 支持</h1>
          <p class="subtitle">
            LessJS 生成纯静态 HTML + Declarative Shadow DOM，天然是 PWA 的理想基座：
            页面预渲染、资源版本化哈希、API routes 可独立部署到 serverless 平台。 关键原则是新鲜度：HTML
            优先走网络，哈希资源优先走缓存。
          </p>

          <h2>快速启用</h2>
          <p>
            在 <span class="inline-code">vite.config.ts</span> 中给 <span class="inline-code"
            >less()</span>
            插件传入 <span class="inline-code">pwa</span> 选项即可：
          </p>
          <less-code-block
          ><pre><code>// vite.config.ts
            import { less } from '@lessjs/core';

            export default defineConfig({
              plugins: [
                less({
                  pwa: {
                    name: 'My LessJS App',
                    shortName: 'LessJS',
                    themeColor: '#000000',
                    backgroundColor: '#ffffff',
                  },
                }),
              ],
            });</code></pre></less-code-block>

            <h2>构建产物</h2>
            <p>
              启用 PWA 后，SSG 构建会在 <span class="inline-code">dist/</span> 中额外生成：
            </p>
            <ul>
              <li>
                <span class="inline-code">manifest.json</span> — Web App Manifest，包含
                name、theme_color、icons
              </li>
              <li>
                <span class="inline-code">sw.js</span> — Service Worker，策略为 NetworkFirst（HTML/API）+
                CacheFirst（静态资源）
              </li>
              <li>
                HTML 注入 — 每个 HTML 文件自动注入 <span class="inline-code"
                >&lt;link rel="manifest"&gt;</span> 和 sw 注册脚本
              </li>
            </ul>

            <h2>Service Worker 策略</h2>
            <p>
              LessJS 内置的 Service Worker 不依赖 Workbox，约 100 行代码，策略简洁：
            </p>
            <less-code-block
            ><pre><code>self.addEventListener('install', () => self.skipWaiting());

            self.addEventListener('fetch', (e) => {
              const url = new URL(e.request.url);
              const isAsset = /\\.[a-z0-9]+$/i.test(url.pathname)
                && !url.pathname.includes('/api/');

                e.respondWith(
                  isAsset
                    ? cacheFirst(e.request)   // 带 hash 的 JS/CSS/图片
                    : networkFirst(e.request)  // HTML 和 API
                  );
                });</code></pre></less-code-block>

                <h3>为什么不预缓存 HTML</h3>
                <p>
                  过期的 <span class="inline-code">index.html</span> 比第一次加载的网络请求更糟。 因此 Service
                  Worker 刻意避免完整 precache，HTML 始终优先走网络。 带 hash 的 JS/CSS
                  资源可以放心缓存，因为文件名变化时 URL 自然失效。
                </p>

                <h2>配置选项</h2>
                <table>
                  <thead>
                    <tr>
                      <th>选项</th>
                      <th>类型</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="inline-code">name</span></td>
                      <td>string</td>
                      <td>应用全名，显示在安装提示和启动画面</td>
                    </tr>
                    <tr>
                      <td><span class="inline-code">shortName</span></td>
                      <td>string</td>
                      <td>短名称，显示在主屏幕图标下方</td>
                    </tr>
                    <tr>
                      <td><span class="inline-code">themeColor</span></td>
                      <td>string</td>
                      <td>主题色，影响浏览器 UI 着色</td>
                    </tr>
                    <tr>
                      <td><span class="inline-code">backgroundColor</span></td>
                      <td>string</td>
                      <td>启动画面背景色</td>
                    </tr>
                  </tbody>
                </table>

                <h2>收益与成本</h2>
                <table>
                  <thead>
                    <tr>
                      <th>维度</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>离线访问</td>
                      <td>已访问的页面和资源在离线时可用</td>
                    </tr>
                    <tr>
                      <td>即时重访</td>
                      <td>缓存资源零延迟加载</td>
                    </tr>
                    <tr>
                      <td>可安装</td>
                      <td>移动端可以"添加到主屏幕"</td>
                    </tr>
                    <tr>
                      <td>代码量</td>
                      <td>约 100 行 Service Worker，无 Workbox 依赖</td>
                    </tr>
                  </tbody>
                </table>

                <h2>与 Islands 的配合</h2>
                <p>
                  PWA 和 Islands 架构天然互补：
                </p>
                <ul>
                  <li>Layer 1 (dsd-static) 组件的 HTML 已在 DSD 中，离线时直接可用</li>
                  <li>Layer 2 (dsd-interactive) 组件的 JS chunk 被 CacheFirst 缓存，离线升级无延迟</li>
                  <li>Layer 3 (pure-island) 组件需要网络获取数据，但框架代码已缓存</li>
                  <li>API routes 走 NetworkFirst，离线时 Service Worker 可以返回缓存或离线页面</li>
                </ul>

                <div class="nav-row">
                  <a href="/guide/deployment" class="nav-link">&larr; Deployment</a>
                  <a href="/guide/content-system" class="nav-link">Content System &rarr;</a>
                </div>
              </div>
            </less-layout>
          `;
        }
      }

      customElements.define('page-pwa', PwaPage);
      export default PwaPage;
      export const tagName = 'page-pwa';

/**
 * PWA Support - via less() plugin (from @lessjs/adapter-vite)
 */
export const meta = { section: 'Production', label: 'PWA Support', order: 60 };
import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class PwaPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/pwa"><div class="container">
    <h1>PWA 支持</h1>
    <p class="subtitle">LessJS 生成纯静态 HTML + Declarative Shadow DOM，天然是 PWA 的理想基座：页面预渲染、资源版本化哈希、API routes 可独立部署到 serverless 平台。</p>
    <h2>快速启用</h2>
    <p>在 vite.config.ts 中给 less() 插件传入 pwa 选项即可：</p>
    <less-code-block><pre><code>less({ pwa: { name: 'My App', shortName: 'LessJS', themeColor: '#000000', backgroundColor: '#ffffff' } })</code></pre></less-code-block>
    <h2>构建产物</h2>
    <p>启用 PWA 后，SSG 构建会在 dist/ 中额外生成：manifest.json、sw.js（NetworkFirst + CacheFirst，无 Workbox）、HTML 注入。</p>
    <h2>Service Worker 策略</h2>
    <p>LessJS 内置的 Service Worker 不依赖 Workbox，策略简洁：带 hash 的 JS/CSS/图片走 CacheFirst，HTML 和 API 走 NetworkFirst。HTML 始终优先走网络，因为过期的 index.html 比首次加载更糟。</p>
    <h2>与 Islands 的配合</h2>
    <p>PWA 和 Islands 架构天然互补：Layer 1 DSD 组件离线直接可用，Layer 2 JS chunk 被 CacheFirst 缓存，Layer 3 框架代码已缓存。API routes 走 NetworkFirst。</p>
    <div class="nav-row"><a href="/guide/deployment" class="nav-link">&larr; Deployment</a><a href="/guide/content-system" class="nav-link">Content System &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/pwa"><div class="container">
    <h1>PWA Support</h1>
    <p class="subtitle">LessJS generates static HTML + Declarative Shadow DOM, making it a natural PWA foundation: pages are pre-rendered, assets are version-hashed, and API routes deploy independently to serverless platforms.</p>
    <h2>Quick Setup</h2>
    <p>Pass the <span class="inline-code">pwa</span> option to the <span class="inline-code">less()</span> plugin in <span class="inline-code">vite.config.ts</span>:</p>
    <less-code-block><pre><code>less({ pwa: { name: 'My App', shortName: 'LessJS', themeColor: '#000000', backgroundColor: '#ffffff' } })</code></pre></less-code-block>
    <h2>Build Outputs</h2>
    <p>With PWA enabled, the SSG build generates: <span class="inline-code">manifest.json</span>, <span class="inline-code">sw.js</span> (NetworkFirst + CacheFirst, no Workbox), and HTML injection of manifest link + SW registration.</p>
    <h2>Service Worker Strategy</h2>
    <p>LessJS's built-in Service Worker is ~100 lines with no Workbox dependency. Hash-versioned JS/CSS/images use CacheFirst; HTML and API routes use NetworkFirst. HTML always prefers the network because stale index.html is worse than a first-time load.</p>
    <h2>Integration With Islands</h2>
    <p>PWA and Islands architecture complement each other: Layer 1 DSD components work offline immediately, Layer 2 JS chunks are cached via CacheFirst, Layer 3 framework code is cached. API routes use NetworkFirst for fresh data.</p>
    <div class="nav-row"><a href="/guide/deployment" class="nav-link">&larr; Deployment</a><a href="/guide/content-system" class="nav-link">Content System &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('page-pwa', PwaPage);
export default PwaPage;
export const tagName = 'page-pwa';

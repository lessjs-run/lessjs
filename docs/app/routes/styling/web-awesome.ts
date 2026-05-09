export const meta = { section: 'Packages', label: 'Web Awesome', order: 30 };
import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class WebAwesomePage extends LitElement {
  static override styles = [pageStyles, css`.demo-box { padding: 1.25rem; border: 0.5px solid var(--less-border); border-radius: 3px; margin: 0.75rem 0 1.5rem; } .demo-box .component-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }`];
  override render() { return (this.locale||'zh')==='en'?this._renderEn():this._renderZh(); }

  private _renderZh() { return html`<less-layout locale="${this.locale||'zh'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/styling/web-awesome"><div class="container">
    <h1>Web Awesome 组件</h1>
    <p class="subtitle">通过 CDN 使用 50+ UI 组件。无需导入。</p>
    <h2>工作原理</h2>
    <p>在 less() 配置中设置 inject 选项，将 Web Awesome 的 CSS 和 loader 注入到 head。所有 wa-* 自定义元素全局可用。</p>
    <div class="demo-box"><h3>按钮</h3><div class="component-row"><wa-button variant="brand">品牌</wa-button><wa-button variant="success">成功</wa-button><wa-button variant="danger">危险</wa-button><wa-button variant="default">默认</wa-button></div></div>
    <div class="nav-row"><a href="/ui" class="nav-link">&larr; Design System</a><a href="/reference/core" class="nav-link">API Reference &rarr;</a></div>
  </div></less-layout>`; }

  private _renderEn() { return html`<less-layout locale="${this.locale||'en'}" .locales="${['en','zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/styling/web-awesome"><div class="container">
    <h1>Web Awesome Components</h1>
    <p class="subtitle">50+ UI components via CDN. No imports needed.</p>
    <h2>How It Works</h2>
    <p>Set the <span class="inline-code">inject</span> option in your <span class="inline-code">less()</span> config to inject Web Awesome's CSS and loader into <span class="inline-code">&lt;head&gt;</span>. All <span class="inline-code">&lt;wa-*&gt;</span> custom elements are globally available — no per-component imports needed.</p>
    <div class="demo-box"><h3>Buttons</h3><div class="component-row"><wa-button variant="brand">Brand</wa-button><wa-button variant="success">Success</wa-button><wa-button variant="danger">Danger</wa-button><wa-button variant="default">Default</wa-button></div></div>
    <div class="nav-row"><a href="/ui" class="nav-link">&larr; Design System</a><a href="/reference/core" class="nav-link">API Reference &rarr;</a></div>
  </div></less-layout>`; }
}

customElements.define('page-web-awesome', WebAwesomePage);
export default WebAwesomePage;
export const tagName = 'page-web-awesome';

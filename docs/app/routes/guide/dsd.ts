export const meta = { section: 'Core Model', label: 'DSD Rendering', order: 30 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class DsdGuidePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0 1.5rem; }
      .comparison-item { padding: 1rem 1.25rem; border: 0.5px solid var(--less-border); border-radius: 4px; }
      .comparison-item.less { background: var(--less-bg-surface); }
      @media (max-width: 720px) { .comparison { grid-template-columns: 1fr; } }
    `,
  ];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/guide/dsd">
        <div class="container">
          <h1>DSD 渲染架构</h1>
          <p class="subtitle">Declarative Shadow DOM 是 LessJS 渲染模型的核心。浏览器原生解析 HTML，内容在 JavaScript 运行前就已经可见——这不是渐进增强的噱头，而是架构基线。</p>
          <h2>什么是 DSD</h2>
          <p>Declarative Shadow DOM (DSD) 是 WHATWG HTML 标准的一部分，允许在 HTML 中声明式地创建 Shadow DOM。浏览器在解析 HTML 时自动创建 shadow root 并填充内容，无需任何 JavaScript 执行。</p>
          <less-code-block><pre><code>&lt;my-component&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;内容在 JS 加载前就已经可见&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-component&gt;</code></pre></less-code-block>
          <h2>为什么选择 DSD</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>传统 SSR Hydration</h3>
              <ul><li>服务端渲染完整 DOM，客户端需要恢复整棵组件树。</li><li>Hydration 不匹配会导致闪烁、重复渲染或交互丢失。</li><li>框架通常依赖专有标记（注释节点、data 属性）做水合。</li></ul>
            </div>
            <div class="comparison-item less">
              <h3>DSD-first</h3>
              <ul><li>浏览器原生解析 shadow root，零 JS 开销。</li><li>Custom Element upgrade 是幂等操作：重复定义不会破坏已有 DOM。</li><li>输出是纯净 HTML，无框架标记、无注释节点。</li></ul>
            </div>
          </div>
          <h2>三层组件模型</h2>
          <p>LessJS 将组件按交互需求分为三层。层级越高，客户端 JavaScript 参与越多。详见 <a href="/guide/islands-deep">Island 深度指南</a>。</p>
          <table><thead><tr><th>层级</th><th>名称</th><th>客户端 JS</th><th>典型场景</th></tr></thead><tbody>
            <tr><td>Layer 1</td><td>dsd-static</td><td>零</td><td>导航栏、文章内容、页脚</td></tr>
            <tr><td>Layer 2</td><td>dsd-interactive</td><td>仅事件绑定</td><td>展开/折叠、主题切换、Tab 切换</td></tr>
            <tr><td>Layer 3</td><td>pure-island</td><td>完整框架</td><td>实时图表、复杂表单、WebSocket</td></tr>
          </tbody></table>
          <h2>Slot 投影机制</h2>
          <p>LessJS 的 DSD 渲染器支持 Slot 投影。当组件的 light DOM 中包含子元素时，SSR 会将它们放置在 &lt;/template&gt; 之后，浏览器自动投影到 shadow DOM 中对应的 &lt;slot&gt; 位置。</p>
          <less-code-block><pre><code>&lt;less-layout current-path="/guide/dsd"&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;...&lt;/style&gt;
    &lt;main&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/main&gt;
  &lt;/template&gt;
  &lt;div class="container"&gt;
    &lt;h1&gt;DSD 渲染架构&lt;/h1&gt;
  &lt;/div&gt;
&lt;/less-layout&gt;</code></pre></less-code-block>
          <h2>WHATWG DSD 属性</h2>
          <p>LessJS 支持 WHATWG HTML Living Standard 定义的 DSD 模板属性，通过 DsdOptions 配置或组件静态属性自动推断。</p>
          <table><thead><tr><th>属性</th><th>配置项</th><th>作用</th></tr></thead><tbody>
            <tr><td>shadowrootdelegatesfocus</td><td>delegatesFocus: true</td><td>自动将焦点委托给 shadow DOM 内第一个可聚焦元素</td></tr>
            <tr><td>shadowrootserializable</td><td>serializable: true</td><td>启用 getInnerHTML() 序列化</td></tr>
            <tr><td>shadowrootslotassignment="manual"</td><td>slotAssignment: 'manual'</td><td>手动控制 slot 分配</td></tr>
            <tr><td>shadowrootcustomelementregistry</td><td>customElementRegistry: 'name'</td><td>使用作用域自定义元素注册表</td></tr>
          </tbody></table>
          <h2>DSD-first 原则</h2>
          <ul><li><strong>零闪烁</strong>：内容在 HTML 解析阶段就已渲染，不存在 hydration 闪烁。</li><li><strong>渐进增强</strong>：即使 JavaScript 加载失败或被禁用，内容仍然可见。</li><li><strong>SEO 友好</strong>：搜索引擎爬虫无需执行 JavaScript 即可获取完整内容。</li></ul>
          <h2>常见问题</h2>
          <h3>DSD 在哪些浏览器中支持？</h3>
          <p>Chrome 90+、Edge 90+、Safari 16.4+、Firefox 123+ 已原生支持 DSD。对于旧版浏览器，LessJS 的 client entry 会在升级时创建 shadow root 并填充内容，功能等价。</p>
          <h3>为什么不用 @lit-labs/ssr？</h3>
          <p>@lit-labs/ssr 的输出包含 &lt;!--lit-part--&gt; 标记注释。LessJS 需要纯净的 DSD HTML，不依赖任何框架专有标记。</p>
          <div class="nav-row">
            <a href="/guide/ssg" class="nav-link">&larr; Rendering & SSG</a>
            <a href="/guide/islands-deep" class="nav-link">Island 深度指南 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout locale="${this.locale || 'en'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/guide/dsd">
        <div class="container">
          <h1>DSD Architecture</h1>
          <p class="subtitle">Declarative Shadow DOM is the core of LessJS's rendering model. The browser natively parses HTML, content is visible before JavaScript runs — this is not a progressive enhancement gimmick, it is the architectural baseline.</p>
          <h2>What Is DSD</h2>
          <p>Declarative Shadow DOM (DSD) is part of the WHATWG HTML standard, allowing declarative creation of Shadow DOM in HTML. The browser automatically creates shadow roots and populates content during HTML parsing, with zero JavaScript execution.</p>
          <less-code-block><pre><code>&lt;my-component&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;:host { display: block; }&lt;/style&gt;
    &lt;p&gt;Content visible before JS loads.&lt;/p&gt;
  &lt;/template&gt;
&lt;/my-component&gt;</code></pre></less-code-block>
          <h2>Why DSD</h2>
          <div class="comparison">
            <div class="comparison-item">
              <h3>Traditional SSR Hydration</h3>
              <ul><li>Server renders full DOM, client must restore entire component tree.</li><li>Hydration mismatches cause flicker, re-renders, or lost interactivity.</li><li>Frameworks rely on proprietary markers (comment nodes, data attributes).</li></ul>
            </div>
            <div class="comparison-item less">
              <h3>DSD-first</h3>
              <ul><li>Browser natively parses shadow roots, zero JS cost.</li><li>Custom Element upgrade is idempotent: re-definition does not break existing DOM.</li><li>Output is clean HTML — no framework markers, no comment nodes.</li></ul>
            </div>
          </div>
          <h2>Three-Layer Component Model</h2>
          <p>LessJS classifies components by interactivity needs. See <a href="/guide/islands-deep">Island Deep Guide</a> for details.</p>
          <table><thead><tr><th>Layer</th><th>Type</th><th>Client JS</th><th>Use Cases</th></tr></thead><tbody>
            <tr><td>Layer 1</td><td>dsd-static</td><td>None</td><td>Nav, article content, footer</td></tr>
            <tr><td>Layer 2</td><td>dsd-interactive</td><td>Events only</td><td>Collapse, theme toggle, tabs</td></tr>
            <tr><td>Layer 3</td><td>pure-island</td><td>Full framework</td><td>Charts, complex forms, WebSocket</td></tr>
          </tbody></table>
          <h2>Slot Projection</h2>
          <p>The DSD renderer supports slot projection. Light DOM children are placed after &lt;/template&gt; and the browser automatically projects them into the corresponding &lt;slot&gt; positions.</p>
          <h2>WHATWG DSD Attributes</h2>
          <table><thead><tr><th>Attribute</th><th>Option</th><th>Purpose</th></tr></thead><tbody>
            <tr><td>shadowrootdelegatesfocus</td><td>delegatesFocus: true</td><td>Delegates focus to the first focusable element in shadow DOM</td></tr>
            <tr><td>shadowrootserializable</td><td>serializable: true</td><td>Enables getInnerHTML() serialization</td></tr>
            <tr><td>shadowrootslotassignment="manual"</td><td>slotAssignment: 'manual'</td><td>Manual slot assignment control</td></tr>
            <tr><td>shadowrootcustomelementregistry</td><td>customElementRegistry: 'name'</td><td>Scoped custom element registry</td></tr>
          </tbody></table>
          <h2>DSD-first Principles</h2>
          <ul><li><strong>Zero flicker</strong>: Content renders during HTML parsing — no hydration flicker.</li><li><strong>Progressive enhancement</strong>: Content remains visible even if JS fails to load or is disabled.</li><li><strong>SEO-friendly</strong>: Crawlers get full content without executing JavaScript.</li></ul>
          <h2>FAQ</h2>
          <h3>Which browsers support DSD?</h3>
          <p>Chrome 90+, Edge 90+, Safari 16.4+, Firefox 123+ natively support DSD. For older browsers, LessJS client entry creates shadow roots during upgrade — functionally equivalent.</p>
          <h3>Why not @lit-labs/ssr?</h3>
          <p>@lit-labs/ssr output includes &lt;!--lit-part--&gt; marker comments. LessJS requires clean DSD HTML with no framework-specific markers.</p>
          <div class="nav-row">
            <a href="/guide/ssg" class="nav-link">&larr; Rendering &amp; SSG</a>
            <a href="/guide/islands-deep" class="nav-link">Island Deep Guide &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-dsd-guide', DsdGuidePage);
export default DsdGuidePage;
export const tagName = 'page-dsd-guide';

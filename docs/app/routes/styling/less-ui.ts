export const meta = { section: 'Packages', label: '@lessjs/ui', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class LessUIPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .callout {
        padding: 1rem 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--less-border-hover);
        background: var(--less-bg-surface);
        border-radius: 0 3px 3px 0;
      }
      .callout.warn {
        border-left-color: var(--less-text-muted);
      }
      .component-grid {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;
      }
      .component-card {
        padding: 1rem;
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
      }
      .component-card h4 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }
      .component-card p {
        margin: 0;
        color: var(--less-text-muted);
        font-size: 0.875rem;
      }
    `,
  ];
  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/styling/less-ui">
        <div class="container">
          <h1>@lessjs/ui</h1>
          <p class="subtitle">
            LessJS Architecture 的 UI 层：暗黑瑞士国际主义风格的 Web Components 组件库。
          </p>

          <h2>安装</h2>
          <code-block
          ><pre><code>// deno.json
            {
              "imports": {
                "@lessjs/ui": "jsr:@lessjs/ui@^0.5.2"
              }
            }</code></pre></code-block>

            <h2>可用组件</h2>
            <p>
              <span class="inline-code">@lessjs/ui</span> v0.5.0 提供以下 Web Components：
            </p>

            <div class="component-grid">
              <div class="component-card">
                <h4>less-button</h4>
                <p>按钮组件，支持 variants (default, primary, ghost) 和 sizes (sm, md, lg)</p>
              </div>
              <div class="component-card">
                <h4>less-card</h4>
                <p>卡片组件，支持 header/footer slots 和 variants (default, elevated, borderless)</p>
              </div>
              <div class="component-card">
                <h4>less-input</h4>
                <p>输入组件，支持 label、error states 和 validation</p>
              </div>
              <div class="component-card">
                <h4>less-code-block</h4>
                <p>代码块组件，带复制按钮和语法高亮</p>
              </div>
              <div class="component-card">
                <h4>less-layout</h4>
                <p>布局组件，包含 header、sidebar、footer 和移动端 hamburger 菜单</p>
              </div>
            </div>

            <h2>使用示例</h2>
            <code-block
            ><pre><code>// app/routes/index.ts
              import { html, LitElement } from 'lit';
              import '@lessjs/ui/less-button';
              import '@lessjs/ui/less-card';

              export class MyPage extends LitElement {
                override render() {
                  return html&#96;
                    &lt;less-button variant="primary"&gt;Click me&lt;/less-button&gt;
                    &lt;less-card&gt;
                      &lt;h3 slot="header"&gt;Title&lt;/h3&gt;
                      &lt;p&gt;Card content&lt;/p&gt;
                    &lt;/less-card&gt;
                  &#96;;
                }
              }</code></pre></code-block>

              <h2>设计令牌</h2>
              <p>
                组件使用 CSS 自定义属性作为设计令牌，可通过
                <span class="inline-code">@lessjs/ui/design-tokens</span> 导入：
              </p>
              <code-block
              ><pre><code>import '@lessjs/ui/design-tokens';

              // 可用的 CSS 自定义属性：
              // --less-bg-base, --less-text-primary, --less-border-base
              // --less-spacing-sm, --less-spacing-md, --less-spacing-lg
              // --less-font-sans, --less-font-mono
              // --less-radius-sm, --less-radius-md</code></pre></code-block>

              <h2>设计原则</h2>
              <p>@lessjs/ui 遵循 LessJS Architecture 四约束：</p>
              <ul>
                <li>
                  <strong>Web Standards First</strong>：组件是标准 Web Components（Lit），非框架私有抽象。
                </li>
                <li>
                  <strong>Minimal Augmentation</strong>：UI 层是可选的，不用 @lessjs/ui 也能写 LessJS 应用。
                </li>
                <li><strong>No Framework Binding</strong>：组件可在任何 Web Components 环境使用。</li>
                <li><strong>No Runtime Binding</strong>：纯 ESM 输出，无平台依赖。</li>
                <li><strong>Static (S)</strong>：所有组件输出 DSD，内容在 JS 加载前可见。</li>
              </ul>

              <h2>SSR 兼容性</h2>
              <p>
                所有组件使用 <span class="inline-code">static properties</span> 而非
                <span class="inline-code">@property</span> 装饰器，确保 Vite SSR 兼容。详见
                <a href="/guide/ssg#ssr-compatibility" style="color: var(--less-accent);">SSG 文档</a>。
              </p>

              <div class="callout warn">
                <p>
                  <strong>历史说明</strong>：v0.1.0-0.1.3 是 WebAwesome CDN loader。v0.1.4+ 开始自有 Web
                  Components 组件库（当前 v0.5.0）。如需 WebAwesome，改用
                  <span class="inline-code">inject</span> 选项手动注入 CDN。
                </p>
              </div>

              <div class="nav-row">
                <a href="/guide/deployment" class="nav-link">&larr; Deployment</a>
                <a href="/styling/web-awesome" class="nav-link">Web Awesome &rarr;</a>
              </div>
            </div>
          </less-layout>
        `;
      }
    }

    customElements.define('page-less-ui', LessUIPage);
    export default LessUIPage;
    export const tagName = 'page-less-ui';

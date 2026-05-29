/**
 * v0.21 Demo: Hydration strategies guide.
 */
export const meta = { section: 'Core', label: 'Islands & Hydration', order: 25 };

import { headerNav, navSections } from 'virtual:less-nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

// Side-effect imports: defineIsland() registers custom elements for SSR rendering.
// During SSR the strategy scheduling (IntersectionObserver etc.) is skipped
// via the SSR guard in island.ts — only customElements.define() runs.
import '../../islands/demo-load.js';
import '../../islands/demo-idle.js';
import '../../islands/demo-visible.js';
import '../../islands/demo-only.js';
import '../../islands/reactive-showcase.js';

export class IslandsGuidePage extends DsdElement {
  declare locale?: string;

  static override styles = [openPropsTokenSheet, pageStyles];

  override render(): string {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _getLocale(_defaultLocale: string): string {
    return this.locale || _defaultLocale;
  }

  private _renderZh(): string {
    return `
      <less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['zh', 'en'])
    }' headerNav='${this._escape(JSON.stringify(headerNav))}' navSections='${
      this._escape(JSON.stringify(filterDocsNav(navSections)))
    }'>
        <h1>Ocean 响应式（DsdElement + Signals）</h1>
        <p>v0.21 的核心能力：Ocean 组件不再需要 Lit 或 React 来实现响应式。<code>signal()</code> + <code>html</code> 模板 + <code>@click</code> 事件绑定 = 零框架运行时。</p>
        <reactive-showcase></reactive-showcase>

        <h2>Hydration 策略</h2>
        <p>LessJS v0.21 支持四种 hydration 策略：</p>

        <h2><code>client:load</code></h2>
        <p>模块加载时立即导入。适用于首屏交互元素。</p>
        <demo-load></demo-load>

        <h2><code>client:idle</code></h2>
        <p>延迟到浏览器空闲时导入（requestIdleCallback）。适用于非关键 UI。</p>
        <demo-idle></demo-idle>

        <h2><code>client:visible</code></h2>
        <p>元素进入视口时导入（IntersectionObserver，200px rootMargin）。适用于懒加载内容。</p>
        <div style="height:400px"></div>
        <demo-visible></demo-visible>

        <h2><code>client:only</code></h2>
        <p>纯客户端渲染——无 DSD，无 SSR。组件完全拥有其 shadow root。</p>
        <demo-only></demo-only>
      </less-layout>
    `;
  }

  private _renderEn(): string {
    return `
      <less-layout locale="en" locales='${JSON.stringify(['zh', 'en'])}' headerNav='${
      this._escape(JSON.stringify(headerNav))
    }' navSections='${this._escape(JSON.stringify(filterDocsNav(navSections)))}'>
        <h1>Reactive DSD (DsdElement + Signals)</h1>
        <p>v0.21's signature: Ocean components no longer need Lit or React for reactivity. <code>signal()</code> + <code>html</code> template + <code>@click</code> bindings = zero framework runtime.</p>
        <reactive-showcase></reactive-showcase>

        <h2>Hydration Strategies</h2>
        <p>LessJS v0.21 supports four hydration strategies:</p>

        <h2><code>client:load</code></h2>
        <p>Imports immediately when the module loads. Best for above-the-fold interactive elements.</p>
        <demo-load></demo-load>

        <h2><code>client:idle</code></h2>
        <p>Defers until browser is idle (requestIdleCallback). Best for below-the-fold or non-critical UI.</p>
        <demo-idle></demo-idle>

        <h2><code>client:visible</code></h2>
        <p>Imports when entering the viewport (IntersectionObserver, 200px rootMargin). Best for lazy content.</p>
        <div style="height:400px"></div>
        <demo-visible></demo-visible>

        <h2><code>client:only</code></h2>
        <p>Client-only render — no DSD, no SSR. The component fully owns its shadow root.</p>
        <demo-only></demo-only>
      </less-layout>
    `;
  }

  private _escape(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(
      /</g,
      '&lt;',
    ).replace(/>/g, '&gt;');
  }
}

export default IslandsGuidePage;

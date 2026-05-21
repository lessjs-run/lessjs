/**
 * Content System — @lessjs/content feature guide
 */
export const meta = { section: 'Core', label: 'Content System', order: 40 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterFrameworkNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class ContentSystemPage extends DsdElement {
  static override styles = [pageStyles];
  override render() {
    return (this.getAttribute('locale') || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this.getAttribute('locale') || 'zh'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/content-system"><div class="container">
    <h1>Content System</h1>
    <p class="subtitle">@lessjs/content 是 LessJS 的统一内容插件（博客 + 导航 + 站点地图）。把 .md 文件丢进内容目录，自动获得文章列表和详情页。纯 SSG 插件，不依赖 Lit，博客页面不加载页面级框架运行时。</p>
    <h2>快速开始</h2>
    <p>在 vite.config.ts 中添加 lessContent() 插件即可：</p>
    <less-code-block><pre><code>lessContent({ blog: { contentDir: 'content/blog', basePath: '/blog' }, nav: { routesDir: 'app/routes' }, sitemap: { hostname: 'https://example.com' } })</code></pre></less-code-block>
    <h2>Markdown 文件</h2>
    <p>内容目录中的每个 .md 文件自动成为一篇博客文章。Frontmatter 支持 title、date、tags、draft 和 excerpt。</p>
    <h2>API 参考</h2>
    <p>路由组件通过虚拟模块导入数据：<span class="inline-code">import { posts, getPostBySlug } from 'virtual:less-blog-data'</span>。底层工具函数：<span class="inline-code">parseMarkdownFile()</span>、<span class="inline-code">slugFromFilename()</span>。</p>
    <h2>架构约束</h2>
    <p>内容插件不依赖 Lit，作为纯 SSG 插件运行。当前能力：.md → 路由 → 列表/文章页 + 导航自动生成 + 站点地图。暂不支持 MDX、评论、分页和标签系统。</p>
    <div class="nav-row"><a href="/guide/ssg" class="nav-link">&larr; Rendering & SSG</a><a href="/guide/rpc" class="nav-link">RPC 远程调用 &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this.getAttribute('locale') || 'en'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterFrameworkNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/content-system"><div class="container">
    <h1>Content System</h1>
    <p class="subtitle"><span class="inline-code">@lessjs/content</span> is LessJS's unified content plugin (blog + nav + sitemap). Drop .md files into a content directory, get post lists and detail pages automatically. Pure SSG plugin with no Lit dependency — blog pages load zero page-level framework runtime.</p>
    <h2>Quick Start</h2>
    <p>Add <span class="inline-code">lessContent()</span> to your Vite config:</p>
    <less-code-block><pre><code>lessContent({ blog: { contentDir: 'content/blog', basePath: '/blog' }, nav: { routesDir: 'app/routes' }, sitemap: { hostname: 'https://example.com' } })</code></pre></less-code-block>
    <h2>Markdown Files</h2>
    <p>Every <span class="inline-code">.md</span> file in the content directory becomes a blog post. Frontmatter supports <span class="inline-code">title</span>, <span class="inline-code">date</span>, <span class="inline-code">tags</span>, <span class="inline-code">draft</span>, and <span class="inline-code">excerpt</span>.</p>
    <h2>API Reference</h2>
    <ul><li><span class="inline-code">virtual:less-blog-data</span> — Route components import <span class="inline-code">posts</span>, <span class="inline-code">getPostBySlug(slug)</span> from here (ADR 0018).</li><li><span class="inline-code">parseMarkdownFile(content, filename)</span> — Parses a markdown file with gray-matter frontmatter.</li><li><span class="inline-code">slugFromFilename(filename)</span> — Extracts the slug from a filename.</li></ul>
    <h2>Architecture Constraints</h2>
    <p>The content plugin has no Lit dependency and runs as a pure SSG plugin. Current scope: .md → routes → list/detail pages + auto-generated nav + sitemap. MDX, comments, pagination, and tag systems are not yet supported.</p>
    <div class="nav-row"><a href="/guide/ssg" class="nav-link">&larr; Rendering &amp; SSG</a><a href="/guide/rpc" class="nav-link">RPC &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('page-content-system', ContentSystemPage);
export default ContentSystemPage;
export const tagName = 'page-content-system';

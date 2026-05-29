export const meta = { section: 'Core', label: 'Routing & Data', order: 3 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { pageStyles } from '../../components/page-styles.js';
import { filterDocsNav } from '../../utils/nav-filter.ts';
import { DsdElement } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';

export class RoutingDataPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `
      <less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/guide/routing-and-data">
        <div class="container">
          <h1>路由与数据</h1>
          <p class="subtitle">
            LessJS 使用文件系统路由。文件即 URL、动态片段、特殊文件和构建时数据注入。
          </p>

          <h2>文件系统路由</h2>
          <p>
            <code>app/routes/</code> 下的页面组件自动映射为路由。每个页面模块必须默认导出 Custom Element 类和 <code>tagName</code>。
          </p>
          <table>
            <thead><tr><th>文件</th><th>URL</th></tr></thead>
            <tbody>
              <tr><td><code>app/routes/index.ts</code></td><td><code>/</code></td></tr>
              <tr><td><code>app/routes/about.ts</code></td><td><code>/about</code></td></tr>
              <tr><td><code>app/routes/docs/index.ts</code></td><td><code>/docs</code></td></tr>
              <tr><td><code>app/routes/docs/install.ts</code></td><td><code>/docs/install</code></td></tr>
            </tbody>
          </table>

          <h2>页面契约</h2>
          <p>每个路由文件需导出以下内容：</p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class AboutPage extends DsdElement {
  override render() {
    return '&lt;main&gt;About&lt;/main&gt;';
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></less-code-block>

          <h2>动态路由：方括号语法</h2>
          <p>文件名中的 <code>[param]</code> 转换为 Hono 路由参数，SSR 时作为组件属性注入：</p>
          <table>
            <thead><tr><th>文件</th><th>路由</th><th>注入属性</th></tr></thead>
            <tbody>
              <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
              <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
            </tbody>
          </table>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class PostPage extends DsdElement {
  slug = '';

  override render() {
    return \`&lt;article&gt;Post: \${this.slug}&lt;/article&gt;\`;
  }
}

customElements.define('page-post', PostPage);</code></pre></less-code-block>

          <h2>特殊文件</h2>
          <table>
            <thead><tr><th>文件</th><th>作用</th></tr></thead>
            <tbody>
              <tr><td><code>_renderer.ts</code></td><td>为路由子树包裹 SSR 输出。用于布局外壳、文档级组合</td></tr>
              <tr><td><code>_middleware.ts</code></td><td>挂载 Hono middleware。用于 headers、auth、CSP 和请求守卫</td></tr>
              <tr><td><code>api/*.ts</code></td><td>在文件系统路由树下定义 Hono API handlers</td></tr>
            </tbody>
          </table>

          <h2>构建时数据注入 (SSG)</h2>
          <p>
            LessJS 的默认生产产物是静态 HTML。构建过程分三个阶段：
          </p>
          <table>
            <thead><tr><th>阶段</th><th>输入</th><th>输出</th></tr></thead>
            <tbody>
              <tr><td>SSR Bundle</td><td>routes、renderers、middleware、API handlers、islands</td><td>生成的 Hono entry</td></tr>
              <tr><td>Client Islands</td><td>build metadata</td><td>island entry 和浏览器 chunks</td></tr>
              <tr><td>SSG</td><td>生成的 Hono app</td><td>静态 HTML + 复制资源</td></tr>
            </tbody>
          </table>
          <p>构建命令：</p>
          <less-code-block><pre><code>deno task build</code></pre></less-code-block>
          <p>输出在 <code>dist/</code>，可直接部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel 或 S3。</p>

          <h2>构建时获取数据</h2>
          <p>在页面组件中，可以在模块顶层执行数据获取。数据在 SSG 构建时获取，写入静态 HTML：</p>
          <less-code-block><pre><code>// app/routes/blog/index.ts
import { DsdElement } from '@lessjs/runtime';

// 构建时获取数据
const posts = await fetch('https://api.example.com/posts')
  .then(r => r.json());

export class BlogIndex extends DsdElement {
  override render() {
    return \`
      &lt;main&gt;
        &lt;h2&gt;Blog Posts (\${posts.length})&lt;/h2&gt;
        &lt;ul&gt;
          \${posts.map(p => \`
            &lt;li&gt;&lt;a href="/blog/\${p.slug}"&gt;\${p.title}&lt;/a&gt;&lt;/li&gt;
          \`).join('')}
        &lt;/ul&gt;
      &lt;/main&gt;
    \`;
  }
}

customElements.define('page-blog-index', BlogIndex);</code></pre></less-code-block>

          <less-callout type="info" label="内容系统">
            对于 Markdown 博客等场景，可以使用 <code>@lessjs/content</code> 插件。
            它提供 frontmatter 解析、导航元数据扫描和 sitemap 生成。
          </less-callout>

          <h2>SSG 输出示例</h2>
          <p>SSG 渲染后组件以 Declarative Shadow DOM 形式嵌入 HTML：</p>
          <less-code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* 组件样式 */&lt;/style&gt;
    &lt;main&gt;内容在 JavaScript 加载前即可见。&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></less-code-block>

          <div class="nav-row">
            <a href="/guide/core-concepts" class="nav-link">&larr; 核心概念</a>
            <a href="/guide/islands-and-ssr" class="nav-link">Islands 与 SSR &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return `
      <less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterDocsNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/guide/routing-and-data">
        <div class="container">
          <h1>Routing &amp; Data</h1>
          <p class="subtitle">
            LessJS uses filesystem routing. Files map to URLs, with dynamic segments, special files,
            and build-time data injection.
          </p>

          <h2>Filesystem Routing</h2>
          <p>
            Page components under <code>app/routes/</code> are automatically mapped to routes. Each page
            module must export a Custom Element class as default and a <code>tagName</code>.
          </p>
          <table>
            <thead><tr><th>File</th><th>URL</th></tr></thead>
            <tbody>
              <tr><td><code>app/routes/index.ts</code></td><td><code>/</code></td></tr>
              <tr><td><code>app/routes/about.ts</code></td><td><code>/about</code></td></tr>
              <tr><td><code>app/routes/docs/index.ts</code></td><td><code>/docs</code></td></tr>
              <tr><td><code>app/routes/docs/install.ts</code></td><td><code>/docs/install</code></td></tr>
            </tbody>
          </table>

          <h2>Page Contract</h2>
          <p>Each route file must export:</p>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class AboutPage extends DsdElement {
  override render() {
    return '&lt;main&gt;About&lt;/main&gt;';
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></less-code-block>

          <h2>Dynamic Routes: Bracket Syntax</h2>
          <p>Filenames with <code>[param]</code> map to Hono route params and are injected as component properties during SSR:</p>
          <table>
            <thead><tr><th>File</th><th>Route</th><th>Property</th></tr></thead>
            <tbody>
              <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
              <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
            </tbody>
          </table>
          <less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';

export class PostPage extends DsdElement {
  slug = '';

  override render() {
    return \`&lt;article&gt;Post: \${this.slug}&lt;/article&gt;\`;
  }
}

customElements.define('page-post', PostPage);</code></pre></less-code-block>

          <h2>Special Files</h2>
          <table>
            <thead><tr><th>File</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><code>_renderer.ts</code></td><td>Wraps SSR output for route subtrees. Layout shells, document composition</td></tr>
              <tr><td><code>_middleware.ts</code></td><td>Mounts Hono middleware. Headers, auth, CSP, request guards</td></tr>
              <tr><td><code>api/*.ts</code></td><td>Defines Hono API handlers within the filesystem route tree</td></tr>
            </tbody>
          </table>

          <h2>Build-time Data Injection (SSG)</h2>
          <p>
            LessJS's default production output is static HTML. The build process has three phases:
          </p>
          <table>
            <thead><tr><th>Phase</th><th>Input</th><th>Output</th></tr></thead>
            <tbody>
              <tr><td>SSR Bundle</td><td>routes, renderers, middleware, API handlers, islands</td><td>Generated Hono entry</td></tr>
              <tr><td>Client Islands</td><td>build metadata</td><td>Island entry + browser chunks</td></tr>
              <tr><td>SSG</td><td>Generated Hono app</td><td>Static HTML + copied assets</td></tr>
            </tbody>
          </table>
          <p>Build command:</p>
          <less-code-block><pre><code>deno task build</code></pre></less-code-block>
          <p>Output lands in <code>dist/</code> and can be deployed directly to GitHub Pages, Cloudflare Pages, Netlify, Vercel, or S3.</p>

          <h2>Fetching Data at Build Time</h2>
          <p>Perform data fetching at the module top-level. Data is fetched during SSG build and baked into static HTML:</p>
          <less-code-block><pre><code>// app/routes/blog/index.ts
import { DsdElement } from '@lessjs/runtime';

// Fetch at build time
const posts = await fetch('https://api.example.com/posts')
  .then(r => r.json());

export class BlogIndex extends DsdElement {
  override render() {
    return \`
      &lt;main&gt;
        &lt;h2&gt;Blog Posts (\${posts.length})&lt;/h2&gt;
        &lt;ul&gt;
          \${posts.map(p => \`
            &lt;li&gt;&lt;a href="/blog/\${p.slug}"&gt;\${p.title}&lt;/a&gt;&lt;/li&gt;
          \`).join('')}
        &lt;/ul&gt;
      &lt;/main&gt;
    \`;
  }
}

customElements.define('page-blog-index', BlogIndex);</code></pre></less-code-block>

          <less-callout type="info" label="Content System">
            For Markdown blogs and similar use cases, use the <code>@lessjs/content</code> plugin.
            It provides frontmatter parsing, navigation metadata scanning, and sitemap generation.
          </less-callout>

          <h2>SSG Output Example</h2>
          <p>After SSG rendering, components are embedded as Declarative Shadow DOM in HTML:</p>
          <less-code-block><pre><code>&lt;page-home&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;/* component styles */&lt;/style&gt;
    &lt;main&gt;Content is visible before JavaScript loads.&lt;/main&gt;
  &lt;/template&gt;
&lt;/page-home&gt;</code></pre></less-code-block>

          <div class="nav-row">
            <a href="/guide/core-concepts" class="nav-link">&larr; Core Concepts</a>
            <a href="/guide/islands-and-ssr" class="nav-link">Islands &amp; SSR &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-routing-data', RoutingDataPage);
export default RoutingDataPage;
export const tagName = 'page-routing-data';

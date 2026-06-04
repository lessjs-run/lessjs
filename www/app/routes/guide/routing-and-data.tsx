export const meta = { section: 'Core', label: 'Routing & Data', order: 3 };
import { pageStyles } from '../../components/page-styles.js';
import { DsdElement } from '@openelement/core';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-callout';

const localesJson = JSON.stringify(['en', 'zh']);

export class RoutingDataPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageStyles];

  override render() {
    const locale = this._getLocale('zh');
    const isEn = locale === 'en';
    return (
      
        <div class='container'>
          {isEn ? <RoutingDataEn /> : <RoutingDataZh />}
        </div>
      
    );
  }
}

// ── ZH ──────────────────────────────────────────────────────
function RoutingDataZh() {
  return (
    <>
      <h1>路由与数据</h1>
      <p class='subtitle'>
        openElement 使用文件系统路由。文件即 URL、动态片段、特殊文件和构建时数据注入。
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
      <open-code-block><pre><code>{`import { DsdElement } from '@openelement/core';

export class AboutPage extends DsdElement {
  override render() {
    return '<main>About</main>';
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';`}</code></pre></open-code-block>

      <h2>动态路由：方括号语法</h2>
      <p>文件名中的 <code>[param]</code> 转换为 Hono 路由参数，SSR 时作为组件属性注入：</p>
      <table>
        <thead><tr><th>文件</th><th>路由</th><th>注入属性</th></tr></thead>
        <tbody>
          <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
          <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
        </tbody>
      </table>
      <open-code-block><pre><code>{`import { DsdElement } from '@openelement/core';

export class PostPage extends DsdElement {
  slug = '';

  override render() {
    return \`<article>Post: \${this.slug}</article>\`;
  }
}

customElements.define('page-post', PostPage);`}</code></pre></open-code-block>

      <h2>特殊文件</h2>
      <table>
        <thead><tr><th>文件</th><th>作用</th></tr></thead>
        <tbody>
          <tr><td><code>_renderer.ts</code></td><td>为路由子树包裹 VNode。用于布局外壳、文档级组合</td></tr>
          <tr><td><code>_middleware.ts</code></td><td>挂载 Hono middleware。用于 headers、auth、CSP 和请求守卫</td></tr>
          <tr><td><code>api/*.ts</code></td><td>在文件系统路由树下定义 Hono API handlers</td></tr>
        </tbody>
      </table>

      <h2>构建时数据注入 (SSG)</h2>
      <p>openElement 的默认生产产物是静态 HTML。构建过程分三个阶段：</p>
      <table>
        <thead><tr><th>阶段</th><th>输入</th><th>输出</th></tr></thead>
        <tbody>
          <tr><td>SSR Bundle</td><td>routes、renderers、middleware、API handlers、islands</td><td>生成的 Hono entry</td></tr>
          <tr><td>Client Islands</td><td>build metadata</td><td>island entry 和浏览器 chunks</td></tr>
          <tr><td>SSG</td><td>生成的 Hono app</td><td>静态 HTML + 复制资源</td></tr>
        </tbody>
      </table>
      <p>构建命令：</p>
      <open-code-block><pre><code>deno task build</code></pre></open-code-block>
      <p>输出在 <code>dist/</code>，可直接部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel 或 S3。</p>

      <h2>构建时获取数据</h2>
      <p>在页面组件中，可以在模块顶层执行数据获取。数据在 SSG 构建时获取，写入静态 HTML：</p>
      <open-code-block><pre><code>{`// app/routes/blog/index.ts
import { DsdElement } from '@openelement/core';

// 构建时获取数据
const posts = await fetch('https://api.example.com/posts')
  .then(r => r.json());

export class BlogIndex extends DsdElement {
  override render() {
    return \`
      <main>
        <h2>Blog Posts (\${posts.length})</h2>
        <ul>
          \${posts.map(p => \`
            <li><a href="/blog/\${p.slug}">\${p.title}</a></li>
          \`).join('')}
        </ul>
      </main>
    \`;
  }
}

customElements.define('page-blog-index', BlogIndex);`}</code></pre></open-code-block>

      <open-callout type='info' label='内容系统'>
        对于 Markdown 博客等场景，可以使用 <code>@openelement/content</code> 插件。
        它提供 frontmatter 解析、导航元数据扫描和 sitemap 生成。
      </open-callout>

      <h2>SSG 输出示例</h2>
      <p>SSG 渲染后组件以 Declarative Shadow DOM 形式嵌入 HTML：</p>
      <open-code-block><pre><code>{`<page-home>
  <template shadowrootmode="open">
    <style>/* 组件样式 */</style>
    <main>内容在 JavaScript 加载前即可见。</main>
  </template>
</page-home>`}</code></pre></open-code-block>

      <div class='nav-row'>
        <a href='/guide/core-concepts' class='nav-link'>&larr; 核心概念</a>
        <a href='/guide/islands-and-ssr' class='nav-link'>Islands 与 SSR &rarr;</a>
      </div>
    </>
  );
}

// ── EN ──────────────────────────────────────────────────────
function RoutingDataEn() {
  return (
    <>
      <h1>Routing &amp; Data</h1>
      <p class='subtitle'>
        openElement uses filesystem routing. Files map to URLs, with dynamic segments, special files,
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
      <open-code-block><pre><code>{`import { DsdElement } from '@openelement/core';

export class AboutPage extends DsdElement {
  override render() {
    return '<main>About</main>';
  }
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';`}</code></pre></open-code-block>

      <h2>Dynamic Routes: Bracket Syntax</h2>
      <p>Filenames with <code>[param]</code> map to Hono route params and are injected as component properties during SSR:</p>
      <table>
        <thead><tr><th>File</th><th>Route</th><th>Property</th></tr></thead>
        <tbody>
          <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
          <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
        </tbody>
      </table>
      <open-code-block><pre><code>{`import { DsdElement } from '@openelement/core';

export class PostPage extends DsdElement {
  slug = '';

  override render() {
    return \`<article>Post: \${this.slug}</article>\`;
  }
}

customElements.define('page-post', PostPage);`}</code></pre></open-code-block>

      <h2>Special Files</h2>
      <table>
        <thead><tr><th>File</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>_renderer.ts</code></td><td>Wraps route VNodes. Layout shells, document composition</td></tr>
          <tr><td><code>_middleware.ts</code></td><td>Mounts Hono middleware. Headers, auth, CSP, request guards</td></tr>
          <tr><td><code>api/*.ts</code></td><td>Defines Hono API handlers within the filesystem route tree</td></tr>
        </tbody>
      </table>

      <h2>Build-time Data Injection (SSG)</h2>
      <p>openElement's default production output is static HTML. The build process has three phases:</p>
      <table>
        <thead><tr><th>Phase</th><th>Input</th><th>Output</th></tr></thead>
        <tbody>
          <tr><td>SSR Bundle</td><td>routes, renderers, middleware, API handlers, islands</td><td>Generated Hono entry</td></tr>
          <tr><td>Client Islands</td><td>build metadata</td><td>Island entry + browser chunks</td></tr>
          <tr><td>SSG</td><td>Generated Hono app</td><td>Static HTML + copied assets</td></tr>
        </tbody>
      </table>
      <p>Build command:</p>
      <open-code-block><pre><code>deno task build</code></pre></open-code-block>
      <p>Output lands in <code>dist/</code> and can be deployed directly to GitHub Pages, Cloudflare Pages, Netlify, Vercel, or S3.</p>

      <h2>Fetching Data at Build Time</h2>
      <p>Perform data fetching at the module top-level. Data is fetched during SSG build and baked into static HTML:</p>
      <open-code-block><pre><code>{`// app/routes/blog/index.ts
import { DsdElement } from '@openelement/core';

// Fetch at build time
const posts = await fetch('https://api.example.com/posts')
  .then(r => r.json());

export class BlogIndex extends DsdElement {
  override render() {
    return \`
      <main>
        <h2>Blog Posts (\${posts.length})</h2>
        <ul>
          \${posts.map(p => \`
            <li><a href="/blog/\${p.slug}">\${p.title}</a></li>
          \`).join('')}
        </ul>
      </main>
    \`;
  }
}

customElements.define('page-blog-index', BlogIndex);`}</code></pre></open-code-block>

      <open-callout type='info' label='Content System'>
        For Markdown blogs and similar use cases, use the <code>@openelement/content</code> plugin.
        It provides frontmatter parsing, navigation metadata scanning, and sitemap generation.
      </open-callout>

      <h2>SSG Output Example</h2>
      <p>After SSG rendering, components are embedded as Declarative Shadow DOM in HTML:</p>
      <open-code-block><pre><code>{`<page-home>
  <template shadowrootmode="open">
    <style>/* component styles */</style>
    <main>Content is visible before JavaScript loads.</main>
  </template>
</page-home>`}</code></pre></open-code-block>

      <div class='nav-row'>
        <a href='/guide/core-concepts' class='nav-link'>&larr; Core Concepts</a>
        <a href='/guide/islands-and-ssr' class='nav-link'>Islands &amp; SSR &rarr;</a>
      </div>
    </>
  );
}

customElements.define('page-routing-data', RoutingDataPage);
export default RoutingDataPage;
export const tagName = 'page-routing-data';

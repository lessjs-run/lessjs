---
title: '路由与数据'
section: 'Core'
label: 'Routing & Data'
order: 3
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/guide/routing-and-data">

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
          <open-code-block><pre><code>import  from '@openelement/core';

export class AboutPage extends DsdElement
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></open-code-block>

    <h2>动态路由：方括号语法</h2>
    <p>文件名中的 <code>[param]</code> 转换为 Hono 路由参数，SSR 时作为组件属性注入：</p>
    <table>
      <thead><tr><th>文件</th><th>路由</th><th>注入属性</th></tr></thead>
      <tbody>
        <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
        <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
      </tbody>
    </table>
    <open-code-block><pre><code>import  from '@openelement/core';

export class PostPage extends DsdElement &lt;/article&gt;\

---
title: '配置'
section: 'Production'
label: 'Configuration'
order: 10
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath='/guide/configuration'

    <h1>配置</h1>
    <p class='subtitle'>
      LessJS 通过 Vite 插件配置。路由、island、静态输出、head 注入、PWA 和 middleware
      是各自独立的关注点。
    </p>
    <h2>Minimal Configuration</h2>
    <less-code-block>
      <pre><code>import  from 'vite';

import from '@lessjs/app';
export default defineConfig();</code></pre>
</less-code-block>

<p>
使用 <span class='inline-code'>lessjs()</span>
是推荐方式--它组合了核心插件、内容管线和
i18n，一个调用包含所有功能。如果你只需要核心路由和 island 功能，也可以单独使用
<span class='inline-code'>lessPipeline()</span> from
<span class='inline-code'>@lessjs/adapter-vite</span>。
</p>
<h2>Main Options</h2>
<table>
<thead>
<tr>
<th>Option</th>
<th>Default</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td>routesDir</td>
<td>'app/routes'</td>
<td>Page routes, API routes, renderer and route-tree middleware.</td>
</tr>
<tr>
<td>islandsDir</td>
<td>'app/islands'</td>
<td>Custom Elements for local client-side upgrade.</td>
</tr>
<tr>
<td>componentsDir</td>
<td>'app/components'</td>
<td>Shared server-rendered components.</td>
</tr>
<tr>
<td>packageIslands</td>
<td>[]</td>
<td>Packages that export an islands metadata array.</td>
</tr>
</tbody>
</table>
<h2>JSX 配置</h2>
<p>
LessJS 使用 JSX + Signal 作为组件模型。需要配置 deno.json 和 vite.config.ts：
</p>
<less-code-block>
<pre><code>// deno.json
,
"imports":
}</code></pre>
</less-code-block>
<less-code-block>
<pre><code>// vite.config.ts
export default defineConfig(,
plugins: [lessjs()]
});</code></pre>
</less-code-block>
<p>
<span class='inline-code'>jsx: 'automatic'</span>
告诉 esbuild 使用 LessJS 的 jsx-runtime 而不是 React 的。Vite 的 SSR 和 client island
构建都会正确转换 <span class='inline-code'>.tsx</span> 文件。
</p>
<h2>Document Metadata, Head Injection, Package Islands, Middleware, PWA</h2>
<less-code-block>
<pre><code>lessjs(,
inject: ,
packageIslands: ['@lessjs/ui'],
middleware: },
pwa: ,
content: , nav: },
i18n: ,
});</code></pre>
</less-code-block>
<div class='nav-row'>
<a href='/api/reference' class='nav-link'>← API Design</a>
<a href='/guide/error-handling' class='nav-link'>Security &amp; Middleware →</a>
</div>

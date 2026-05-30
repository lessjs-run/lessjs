---
title: 'Configuration'
section: 'Production'
label: 'Configuration'
order: 10
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath='/en/guide/configuration'

    <h1>Configuration</h1>
    <p class='subtitle'>
      LessJS is configured through Vite plugins. Routes, islands, static output, head
      injection, PWA, and middleware are independent concerns.
    </p>
    <h2>Minimal Configuration</h2>
    <less-code-block>
      <pre><code>import  from 'vite';

import from '@lessjs/app';
export default defineConfig();</code></pre>
</less-code-block>

<p>
Use <span class='inline-code'>lessjs()</span>
as the recommended entry - it combines the core plugin, content pipeline, and i18n in a
single call. If you only need core routing and island functionality, you can use
<span class='inline-code'>lessPipeline()</span> from
<span class='inline-code'>@lessjs/adapter-vite</span> directly.
</p>
<h2>Options Reference</h2>
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
<td>
Packages exporting an islands metadata array. This is not yet a full registry
protocol.
</td>
</tr>
</tbody>
</table>
<p>
Future <code>less add</code>
support should update this option only after a package manifest passes validation. Until
then, third-party packages should be added explicitly and reviewed like any other
dependency.
</p>
<h2>JSX Configuration (v0.24.1)</h2>
<p>
LessJS v0.24.1 uses JSX+Signal as the component model. Configure deno.json and
vite.config.ts:
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
tells esbuild to use LessJS's jsx-runtime instead of React's. Both Vite SSR and client
island builds will correctly transform <span class='inline-code'>.tsx</span> files.
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
<p>
See <a href='/guide/api'>API Reference</a> for the complete options table, or check the

      <a href='/guide/error-handling'>Security &amp; Middleware</a> 
      guide for CSP and middleware configuration.
    </p>
    <div class='nav-row'>
      <a href='/api/reference' class='nav-link'>← API Design</a>
      <a href='/guide/error-handling' class='nav-link'>Security &amp; Middleware →</a>
    </div>

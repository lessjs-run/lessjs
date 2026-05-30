---
title: 'API Routes'
section: 'Core'
label: 'API Routes'
order: 60
---

<less-layout
locale=
locales=
navItems=
headerNav=
currentPath='/en/guide/api'

    <h1>API Routes</h1>
    <p class='subtitle'>
      LessJS's server layer is Hono. API routes use standard Request/Response semantics and
      are suitable for serverless or edge runtime deployment.
    </p>
    <h2>Design Principles</h2>
    <div class='principle'>
      <p>
        <strong>Use platform primitives.</strong> 
        Prefer Fetch, Request, Response over framework-specific transports.
      </p>
      <p>
        <strong>Validate at boundaries.</strong> 
        Parse and validate request bodies before business logic sees the data.
      </p>
      <p>
        <strong>Declare runtime explicitly.</strong> 
        Static pages can call APIs, but the APIs need a serverless or edge deployment target.
      </p>
    </div>
    <h2>Create API Routes</h2>
    <p>
      Place API routes in 
      <span class='inline-code'>app/routes/api</span>. Default-export a Hono app for complex
      APIs, or a plain function <span class='inline-code'>(ctx) =&gt; Response</span> 
      for simple endpoints. The context has <span class='inline-code'>request</span>, 
      <span class='inline-code'>params</span>, <span class='inline-code'>env</span>, and 
      <span class='inline-code'>platform</span>.
    </p>
    <less-code-block>
      <pre><code>// app/routes/api/posts.ts

import from 'hono';
const app = new Hono();
app.get('/', (c) =&gt; c.json([]));
app.post('/', async (c) =&gt; , 201); });
export default app;</code></pre>
</less-code-block>
<less-code-block>

<pre><code>// app/routes/api/health.ts — simple endpoint, no Hono needed
import type from '@lessjs/core/api';

export default function GET(ctx: LessApiContext) );
}</code></pre>
</less-code-block>
<h2>Request Validation</h2>
<p>
LessJS does not mandate a validation library. Zod with
<span class='inline-code'>@hono/zod-validator</span> is a practical default.
</p>
<h2>Type-Safe RPC</h2>
<p>
<span class='inline-code'>@lessjs/rpc</span>
provides type-safe client/server calling conventions. See
<a href='/api/reference'>RPC Guide</a>.
</p>
<h2>Static Build Boundary</h2>
<p>
SSG output is static files. API routes are part of the generated Hono app, but static
hosting won't execute them. Deploy API routes via serverless adapters or platform
functions when runtime behavior is needed.
</p>
<div class='nav-row'>
<a href='/api/reference' class='nav-link'>← RPC</a>
<a href='/guide/configuration' class='nav-link'>Configuration →</a>
</div>

---
title: 'Routing & Data'
section: 'Core'
label: 'Routing & Data'
order: 3
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/zh/guide/routing-and-data">

          <h1>Routing &amp; Data</h1>
          <p class="subtitle">
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
          <open-code-block><pre><code>import  from '@openelement/core';

export class AboutPage extends DsdElement
}

customElements.define('page-about', AboutPage);
export default AboutPage;
export const tagName = 'page-about';</code></pre></open-code-block>

    <h2>Dynamic Routes: Bracket Syntax</h2>
    <p>Filenames with <code>[param]</code> map to Hono route params and are injected as component properties during SSR:</p>
    <table>
      <thead><tr><th>File</th><th>Route</th><th>Property</th></tr></thead>
      <tbody>
        <tr><td><code>posts/[slug].ts</code></td><td><code>/posts/:slug</code></td><td><code>slug</code></td></tr>
        <tr><td><code>users/[id]/posts.ts</code></td><td><code>/users/:id/posts</code></td><td><code>id</code></td></tr>
      </tbody>
    </table>
    <open-code-block><pre><code>import  from '@openelement/core';

export class PostPage extends DsdElement &lt;/article&gt;\

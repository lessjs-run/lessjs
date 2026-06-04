---
title: 'Getting Started'
section: 'Quick Start'
label: 'Getting Started'
order: 1
---

<open-layout locale="$" locales='$' nav-items='$' header-nav='$' current-path="/en/guide/getting-started">
        <div class="content-grid">

          <h1>Getting Started</h1>
          <p class="subtitle">
            Start from a minimal project: create an app, start the dev server, build static output,
            and understand what each directory is responsible for.
          </p>

          <open-callout type="info" label="Recommended">
            Deno 2.7+ recommended. openElement is a Deno-first project - dependencies are managed
            through <span class="inline-code">deno.json</span>, and all dev/build commands
            use Deno tasks.
          </open-callout>

          <section class="step">
            <h2>1. Create a Project</h2>
            <open-code-block><pre><code>deno run -A jsr:@openelement/create my-app

cd my-app</code></pre></open-code-block>

<p>
The scaffolded project includes page routes, a sample island, Vite config,
and common Deno tasks.
</p>
</section>

          <section class="step">
            <h2>2. Start the Dev Server</h2>
            <open-code-block><pre><code>deno task dev</code></pre></open-code-block>
            <p>
              Dev mode provides module loading and hot reload through Vite, with SSR/API behavior
              via the generated Hono entry. Open <span class="inline-code">http://localhost:5173</span>
              by default.
            </p>
          </section>

          <section class="step">
            <h2>3. Build Static Output</h2>
            <open-code-block><pre><code>deno task build</code></pre></open-code-block>
            <p>
              The build command produces the SSR bundle, client island entry, and SSG HTML sequentially.
              The final output lands in <span class="inline-code">dist/</span> and can be deployed
              to any static hosting platform.
            </p>
          </section>

          <section class="step">
            <h2>4. Preview the Production Build</h2>
            <open-code-block><pre><code>deno task preview</code></pre></open-code-block>
            <p>
              The preview command checks the final static output, not the dev server behavior.
              Run it at least once before deployment.
            </p>
          </section>

          <h2>Project Structure</h2>
          <open-code-block><pre><code>my-app/

|-- app/
| |-- routes/
| | |-- index.ts # page route for /
| | |-- about.ts # page route for /about
| | └-- api/
| | └-- status.ts # API route
| |-- islands/
| | └-- counter.ts # client-upgraded Custom Element
| └-- _renderer.ts # optional layout wrapper
|-- deno.json # tasks and imports
└-- vite.config.ts # openElement plugin config</code></pre></open-code-block>

    <h2>Writing a Page</h2>
    <p>
      A page is a Web Component. SSR renders it into Declarative Shadow DOM, so content
      is visible before JavaScript runs.
    </p>
    <open-code-block><pre><code>import  from '@openelement/core';

export class HomePage extends DsdElement
}

customElements.define('page-home', HomePage);
export default HomePage;
export const tagName = 'page-home';</code></pre></open-code-block>

          <h2>Adding Interactivity</h2>
          <p>
            Place components that need client-side behavior in <span class="inline-code">app/islands</span>.
            The page HTML is rendered first; the browser upgrades the components after loading
            the island entry.
          </p>
          <open-code-block><pre><code>&lt;counter-island count="1"&gt;&lt;/counter-island&gt;</code></pre></open-code-block>

          <div class="note">
            <p>
              Next steps: <a href="/guide/core-concepts">Core Concepts</a>,
              <a href="/guide/routing-and-data">Routing &amp; Data</a>,
              <a href="/guide/islands-and-ssr">Islands &amp; SSR</a>, and
              <a href="/guide/deployment">Deployment</a>.
            </p>
          </div>

          <div class="nav-row">
            <a href="/guide/core-concepts" class="nav-link">Core Concepts &rarr;</a>
          </div>
        </div>

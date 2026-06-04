---
title: 'Deployment'
section: 'Production'
label: 'Deployment'
order: 5
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath='/en/guide/deployment'

    <h1>Deployment</h1>
    <p class='subtitle'>
      LessJS prioritizes static file deployment. Runtime API routes are deployed separately
      via serverless or edge adapters when the app needs dynamic behavior.
    </p>
    <h2>Build Once</h2>
    <open-code-block>
      <pre><code>deno task build</code></pre>
    </open-code-block>
    <p>
      The build outputs 
      <span class='inline-code'>dist/</span>: static HTML with Declarative Shadow DOM, client
      island chunks, and copied public assets.
    </p>
    <h2>Static Hosting</h2>
    <div class='platform-grid'>
      <div class='platform-card'>
        <h3>GitHub Pages</h3>
        <p>Set Vite base when deploying under a repo sub-path.</p>
      </div>
      <div class='platform-card'>
        <h3>Cloudflare Pages</h3>
        <p>Build command: deno task build; Output dir: dist.</p>
      </div>
      <div class='platform-card'>
        <h3>Netlify</h3>
        <p>Publish directory: dist.</p>
      </div>
      <div class='platform-card'>
        <h3>Vercel</h3>
        <p>Use static output, Framework preset: "Other".</p>
      </div>
      <div class='platform-card'>
        <h3>S3 / CloudFront</h3>
        <p>Upload dist/ with appropriate cache headers.</p>
      </div>
    </div>
    <h2>API Deployment</h2>
    <p>
      API routes belong to the generated Hono app. Static hosting doesn't execute them. Deploy
      API routes via platform adapters when runtime behavior is needed.
    </p>
    <h2>No Production SSR Server by Default</h2>
    <p>
      LessJS's main path doesn't need a long-running production SSR server. Static pages stay
      static; dynamic behavior should be explicit API or future ISR. This keeps hosting cheap,
      cacheable, and operationally lightweight.
    </p>
    <h2>PWA Support</h2>
    <p>
      LessJS supports Progressive Web Apps. Place your manifest and service worker in the
      <code>public/</code> directory — they're automatically copied to the output during build.
      CSP meta and view transition metadata can be auto-injected via the Vite plugin.
    </p>
    <open-code-block><pre><code> from '@openelement/app';

export default defineConfig(,
})],
});`}</code></pre></open-code-block>

    <h2>Deployment Checklist</h2>
    <ul>
      <li>
        Run <span class='inline-code'>deno task build</span> locally or in CI.
      </li>
      <li>
        Preview <span class='inline-code'>dist/</span> before publishing.
      </li>
      <li>Confirm base path when deploying to a sub-directory.</li>
      <li>Verify CSP/security headers still apply at the chosen hosting path.</li>
      <li>If islands call runtime endpoints, deploy API routes separately.</li>
    </ul>
    <div class='nav-row'>
      <a href='/guide/islands-and-ssr' class='nav-link'>← Islands &amp; SSR</a>
      <a href='/roadmap' class='nav-link'>Roadmap →</a>
    </div>

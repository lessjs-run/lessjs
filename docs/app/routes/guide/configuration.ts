import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class ConfigurationPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/configuration">
        <div class="container">
          <h1>Configuration</h1>
          <p class="subtitle">
            KISS is configured through the Vite plugin. Keep configuration explicit:
            routes, islands, static output, head injection, PWA and middleware are separate concerns.
          </p>

          <h2>Minimal Config</h2>
          <code-block><pre><code>// vite.config.ts
import { defineConfig } from 'vite';
import { kiss } from '@kissjs/core';

export default defineConfig({
  plugins: [kiss()],
});</code></pre></code-block>

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
                <td><span class="inline-code">routesDir</span></td>
                <td><span class="inline-code">'app/routes'</span></td>
                <td>Page routes, API routes, renderers and route-tree middleware.</td>
              </tr>
              <tr>
                <td><span class="inline-code">islandsDir</span></td>
                <td><span class="inline-code">'app/islands'</span></td>
                <td>Local client-upgraded Custom Elements.</td>
              </tr>
              <tr>
                <td><span class="inline-code">componentsDir</span></td>
                <td><span class="inline-code">'app/components'</span></td>
                <td>Shared server-rendered components.</td>
              </tr>
              <tr>
                <td><span class="inline-code">packageIslands</span></td>
                <td><span class="inline-code">[]</span></td>
                <td>Packages that export an <span class="inline-code">islands</span> metadata array.</td>
              </tr>
              <tr>
                <td><span class="inline-code">build.outDir</span></td>
                <td><span class="inline-code">'dist'</span></td>
                <td>Static output directory.</td>
              </tr>
            </tbody>
          </table>

          <h2>Document Metadata</h2>
          <code-block><pre><code>kiss({
  html: {
    lang: 'en',
    title: 'My KISS App',
  },
});</code></pre></code-block>

          <h2>Head Injection</h2>
          <p>
            Use <span class="inline-code">inject</span> for external stylesheets, module scripts and small head fragments.
            URLs are validated before being added to the generated document.
          </p>
          <code-block><pre><code>kiss({
  inject: {
    stylesheets: [
      'https://cdn.example.com/theme.css',
    ],
    scripts: [
      'https://cdn.example.com/widget.js',
    ],
    headFragments: [
      '&lt;meta name="theme-color" content="#050505"&gt;',
    ],
  },
});</code></pre></code-block>

          <h2>Package Islands</h2>
          <p>
            Package islands are reusable Web Components discovered at build time.
            This is how <span class="inline-code">@kissjs/ui</span> contributes interactive components to the docs site.
          </p>
          <code-block><pre><code>kiss({
  packageIslands: ['@kissjs/ui'],
});</code></pre></code-block>

          <h2>Island Strategy</h2>
          <p>
            The framework option declares the default upgrade strategy. Current implementation still needs hardening
            so this metadata consistently reaches the client build.
          </p>
          <code-block><pre><code>kiss({
  island: {
    upgradeStrategy: 'idle',
  },
});</code></pre></code-block>

          <h2>Middleware</h2>
          <code-block><pre><code>kiss({
  middleware: {
    logger: true,
    requestId: true,
    cors: true,
    corsOrigin: 'https://example.com',
    securityHeaders: true,
    csp: {
      policy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      nonce: false,
      reportOnly: false,
    },
  },
});</code></pre></code-block>

          <h2>PWA</h2>
          <p>
            PWA support generates manifest and service worker assets during SSG. Treat it as an enhancement,
            not as a replacement for static HTML correctness.
          </p>
          <code-block><pre><code>kiss({
  pwa: {
    name: 'My KISS App',
    shortName: 'KISS',
    themeColor: '#050505',
    backgroundColor: '#ffffff',
  },
});</code></pre></code-block>

          <h2>Complete Example</h2>
          <code-block><pre><code>export default defineConfig({
  base: '/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      packageIslands: ['@kissjs/ui'],
      html: {
        lang: 'en',
        title: 'My KISS App',
      },
      build: {
        outDir: 'dist',
      },
    }),
  ],
});</code></pre></code-block>

          <div class="nav-row">
            <a href="/guide/api-design" class="nav-link">&larr; API Design</a>
            <a href="/guide/security-middleware" class="nav-link">Security & Middleware &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-configuration', ConfigurationPage);
export default ConfigurationPage;
export const tagName = 'page-configuration';

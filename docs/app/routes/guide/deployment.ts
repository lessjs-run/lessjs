import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';
import '../../islands/code-block.js';

export class DeploymentPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: 0.75rem;
        margin: 1rem 0 1.5rem;
      }

      .platform-card {
        padding: 1rem;
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
      }

      .platform-card h3 {
        margin: 0 0 0.4rem;
      }

      .platform-card p {
        margin: 0;
        font-size: 0.8125rem;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/guide/deployment">
        <div class="container">
          <h1>Deployment</h1>
          <p class="subtitle">
            KISS deploys static files first. Runtime API routes are deployed separately through serverless
            or edge adapters when your application needs dynamic behavior.
          </p>

          <h2>Build Once</h2>
          <code-block><pre><code>deno task build</code></pre></code-block>
          <p>
            The build writes <span class="inline-code">dist/</span>: static HTML with Declarative Shadow
            DOM, client island chunks and copied public assets.
          </p>

          <h2>Static Hosting</h2>
          <div class="platform-grid">
            <div class="platform-card">
              <h3>GitHub Pages</h3>
              <p>Set Vite <span class="inline-code">base</span> when deploying under a repo path.</p>
            </div>
            <div class="platform-card">
              <h3>Cloudflare Pages</h3>
              <p>
                Build command: <span class="inline-code">deno task build</span>; output: <span
                  class="inline-code"
                >dist</span>.
              </p>
            </div>
            <div class="platform-card">
              <h3>Netlify</h3>
              <p>Publish directory: <span class="inline-code">dist</span>.</p>
            </div>
            <div class="platform-card">
              <h3>Vercel</h3>
              <p>Use static output with framework preset “Other”.</p>
            </div>
            <div class="platform-card">
              <h3>S3 / CloudFront</h3>
              <p>
                Upload <span class="inline-code">dist</span> and configure cache headers deliberately.
              </p>
            </div>
          </div>

          <h2>GitHub Pages Base Path</h2>
          <p>
            If the site is served from <span class="inline-code">https://user.github.io/repo/</span>,
            configure the base path in Vite.
          </p>
          <code-block
          ><pre><code>// vite.config.ts
            import { defineConfig } from 'vite';
            import { kiss } from '@kissjs/core';

            export default defineConfig({
              base: '/repo/',
              plugins: [kiss()],
            });</code></pre></code-block>

            <h2>API Deployment</h2>
            <p>
              API routes belong to the generated Hono app. Static hosts do not execute them automatically.
              Deploy API routes through a platform adapter when the app needs runtime behavior.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Deno Deploy</td>
                  <td>Natural target</td>
                  <td>Closest to the Deno-first development model.</td>
                </tr>
                <tr>
                  <td>Cloudflare Workers</td>
                  <td>Good target</td>
                  <td>Hono already maps well to Workers.</td>
                </tr>
                <tr>
                  <td>Vercel / Netlify Functions</td>
                  <td>Adapter work</td>
                  <td>Needs documented build output and runtime entry contracts.</td>
                </tr>
              </tbody>
            </table>

            <h2>No Production SSR Server by Default</h2>
            <p>
              KISS does not require a long-running production SSR server for its main path. Static pages
              should stay static; dynamic behavior should be explicit API or future ISR behavior. This keeps
              hosting cheap, cacheable and operationally small.
            </p>

            <h2>Deployment Checklist</h2>
            <ul>
              <li>Run <span class="inline-code">deno task build</span> locally or in CI.</li>
              <li>Preview <span class="inline-code">dist/</span> before publishing.</li>
              <li>Confirm base path when deploying below a subdirectory.</li>
              <li>Confirm CSP/security headers survive the selected hosting path.</li>
              <li>Deploy API routes separately if islands call runtime endpoints.</li>
            </ul>

            <div class="nav-row">
              <a href="/guide/testing" class="nav-link">&larr; Testing</a>
              <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
            </div>
          </div>
        </kiss-layout>
      `;
    }
  }

  customElements.define('page-deployment', DeploymentPage);
  export default DeploymentPage;
  export const tagName = 'page-deployment';

export const meta = { section: 'Production', label: 'Security & Middleware', order: 20 };
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class SecurityMiddlewarePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .chain {
        padding: 1rem;
        background: var(--less-bg-surface);
        border-left: 2px solid var(--less-border-hover);
        border-radius: 0 4px 4px 0;
        margin: 1rem 0;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        line-height: 1.8;
        color: var(--less-text-secondary);
        white-space: pre-wrap;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/security-middleware">
        <div class="container">
          <h1>安全与中间件</h1>
          <p class="subtitle">
            Middleware is where LessJS connects route-tree structure with production safety:
            request headers, CSP, auth guards, CORS and API-specific protections.
          </p>

          <h2>Mental Model</h2>
          <p>
            LessJS middleware is Hono middleware mounted from file-system route scopes.
            A middleware file affects its route subtree; nested middleware composes from outer to inner scope.
          </p>
          <div class="chain">request
  -> root middleware
  -> nested middleware
  -> page or API handler
  -> response post-processing</div>

          <h2>Route-Tree Middleware</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Intended scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="inline-code">app/routes/_middleware.ts</span></td>
                <td>All pages and API routes.</td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/admin/_middleware.ts</span></td>
                <td><span class="inline-code">/admin/*</span></td>
              </tr>
              <tr>
                <td><span class="inline-code">app/routes/api/_middleware.ts</span></td>
                <td><span class="inline-code">/api/*</span></td>
              </tr>
            </tbody>
          </table>

          <code-block><pre><code>// app/routes/admin/_middleware.ts
import type { Context, Next } from 'hono';

export default async function adminOnly(c: Context, next: Next) {
  const session = c.req.header('x-session');
  if (!session) return c.text('Unauthorized', 401);
  await next();
}</code></pre></code-block>

          <h2>CSP</h2>
          <p>
            CSP is a framework-level trust boundary because LessJS emits HTML, DSD templates and island scripts.
            If CSP is enabled for SSR responses, SSG output must receive the equivalent meta policy during static
            post-processing.
          </p>
          <code-block><pre><code>// vite.config.ts
less({
  middleware: {
    csp: {
      policy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      nonce: false,
      reportOnly: false,
    },
  },
});</code></pre></code-block>

          <h2>CORS</h2>
          <p>
            Configure CORS deliberately for API routes. Content pages often do not need cross-origin access;
            API routes often do.
          </p>
          <code-block><pre><code>less({
  middleware: {
    corsOrigin: 'https://example.com',
  },
});</code></pre></code-block>

          <h2>Security Headers</h2>
          <p>
            Common production headers should be enabled in one place and tested through both SSR and SSG paths.
          </p>
          <ul>
            <li><span class="inline-code">X-Content-Type-Options: nosniff</span></li>
            <li><span class="inline-code">X-Frame-Options</span> or equivalent CSP frame policy</li>
            <li><span class="inline-code">Referrer-Policy</span></li>
            <li><span class="inline-code">Permissions-Policy</span></li>
            <li><span class="inline-code">Content-Security-Policy</span> or SSG meta equivalent</li>
          </ul>

          <h2>Current Boundary</h2>
          <p>
            Two security issues should stay visible until fixed: root middleware must mount across the whole route tree,
            and SSG must not drop CSP when it post-processes static HTML. These are P1 reliability items because they
            affect production protections, not only developer ergonomics.
          </p>

          <div class="nav-row">
            <a href="/guide/configuration" class="nav-link">&larr; Configuration</a>
            <a href="/guide/error-handling" class="nav-link">Error Handling &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-security-middleware', SecurityMiddlewarePage);
export default SecurityMiddlewarePage;
export const tagName = 'page-security-middleware';

export const meta = { section: 'Production', label: 'Testing', order: 40 };
import { navSections, headerNav } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '../../islands/code-block.js';

export class TestingPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/testing">
        <div class="container">
          <h1>测试</h1>
          <p class="subtitle">
            LessJS tests should protect the framework contract: route scanning, DSD output, island
            metadata, middleware scope, SSG post-processing and package boundaries.
          </p>

          <h2>Project Tests</h2>
          <p>
            Application code can use Deno's built-in test runner. Start with units for pure logic and API
            handlers, then add build smoke tests for the routes that matter most.
          </p>
          <code-block
          ><pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run</code></pre></code-block>

          <h2>Route Utilities</h2>
          <code-block
          ><pre><code>import { assertEquals } from 'jsr:@std/assert';
            import { extractParams, parseQuery } from '@lessjs/core';

            Deno.test('extractParams parses dynamic segments', () => {
              const params = extractParams('/users/:id', '/users/42');
              assertEquals(params, { id: '42' });
            });

            Deno.test('parseQuery returns plain values', () => {
              const query = parseQuery(new URL('https://example.com/?page=2'));
              assertEquals(query, { page: '2' });
            });</code></pre></code-block>

            <h2>Build Smoke Test</h2>
            <p>
              A static-first framework needs at least one test that builds the site and verifies generated
              HTML. This catches route scanner, SSR, client island and SSG integration problems.
            </p>
            <code-block
            ><pre><code>deno task build
              # then inspect dist/index.html, dist/client, manifest, CSP/PWA tags as needed</code></pre></code-block>

              <h2>Framework CI Baseline</h2>
              <p>
                For this repository, the package-level CI baseline is intentionally narrower than a full-root
                lint/typecheck because generated docs/public assets can have different tool constraints.
              </p>
              <code-block
              ><pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run
                deno lint packages/
                deno fmt --check packages/
                deno check packages/core/src/index.ts packages/rpc/src/index.ts packages/ui/src/index.ts
                deno task build:all</code></pre></code-block>

                <h2>High-Value Regression Tests</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Test</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Middleware</td>
                      <td>
                        Root <span class="inline-code">_middleware.ts</span> protects <span class="inline-code"
                        >/</span> and nested routes.
                      </td>
                    </tr>
                    <tr>
                      <td>SSG CSP</td>
                      <td>Static HTML receives CSP meta when middleware CSP is configured.</td>
                    </tr>
                    <tr>
                      <td>Nested islands</td>
                      <td>
                        <span class="inline-code">app/islands/posts/index.ts</span> resolves to the scanned file
                        path.
                      </td>
                    </tr>
                    <tr>
                      <td>Strategies</td>
                      <td>
                        Package and default island strategies are represented in the generated client entry.
                      </td>
                    </tr>
                    <tr>
                      <td>Renderer</td>
                      <td>
                        Unsafe HTML, attributes, nested DSD and Lit adapter output have explicit expectations.
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h2>Browser Tests</h2>
                <p>
                  Use browser tests when behavior depends on Custom Element upgrade, IntersectionObserver, idle
                  loading, service workers or real DOM semantics. Unit tests are not enough for island strategy
                  work.
                </p>

                <h2>Playwright E2E Tests</h2>
                <p>
                  LessJS includes Playwright end-to-end tests that verify the SSG output in a real browser.
                  These tests confirm that Declarative Shadow DOM is correctly parsed, custom elements upgrade,
                  and island strategies work as expected.
                </p>
                <code-block
                ><pre><code># Install Playwright browsers (first time)
deno task test:e2e:install

# Run E2E tests (builds docs site first, then tests against static server)
deno task test:e2e</code></pre></code-block>
                <p>
                  The E2E suite covers two areas:
                </p>
                <ul>
                  <li><strong>DSD Layers</strong> — HTML structure, shadow root attachment, styles, no raw template text</li>
                  <li><strong>Nested Custom Elements</strong> — CE discovery, shadow root upgrade after DSD parsing, navigation</li>
                </ul>

                <div class="nav-row">
                  <a href="/guide/error-handling" class="nav-link">&larr; Error Handling</a>
                  <a href="/guide/deployment" class="nav-link">Deployment &rarr;</a>
                </div>
              </div>
            </less-layout>
          `;
        }
      }

      customElements.define('page-testing', TestingPage);
      export default TestingPage;
      export const tagName = 'page-testing';

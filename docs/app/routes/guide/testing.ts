export const meta = { section: 'Production', label: 'Testing', order: 40 };
import { headerNav, navSections } from 'virtual:less-nav';
import { html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

export class TestingPage extends LitElement {
  static override styles = [pageStyles];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}" currentPath="/guide/testing">
        <div class="container">
          <h1>测试</h1>
          <p class="subtitle">
            LessJS 测试应保护框架契约：路由扫描、DSD 输出、island 元数据、 middleware 范围、SSG
            后处理和包边界。
          </p>

          <h2>项目测试</h2>
          <p>
            应用代码可以使用 Deno 内置的测试运行器。从纯逻辑和 API handler 的单元测试开始，
            再为最重要的路由添加构建冒烟测试。
          </p>
          <less-code-block
          ><pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run</code></pre></less-code-block>

          <h2>路由工具</h2>
          <less-code-block
          ><pre><code>import { assertEquals } from 'jsr:@std/assert';
            import { extractParams, parseQuery } from '@lessjs/core';

            Deno.test('extractParams parses dynamic segments', () => {
              const params = extractParams('/users/:id', '/users/42');
              assertEquals(params, { id: '42' });
            });

            Deno.test('parseQuery returns plain values', () => {
              const query = parseQuery(new URL('https://example.com/?page=2'));
              assertEquals(query, { page: '2' });
            });</code></pre></less-code-block>

            <h2>构建冒烟测试</h2>
            <p>
              静态优先框架至少需要一个测试来构建站点并验证生成的 HTML。 这能捕获路由扫描、SSR、client island
              和 SSG 集成问题。
            </p>
            <less-code-block
            ><pre><code>deno task build
              # then inspect dist/index.html, dist/client, manifest, CSP/PWA tags as needed</code></pre></less-code-block>

              <h2>框架 CI 基线</h2>
              <p>
                对于本仓库，包级别 CI 基线故意比全根 lint/typecheck 更窄， 因为生成的 docs/public
                资源可能有不同的工具约束。
              </p>
              <less-code-block
              ><pre><code>deno test --allow-read --allow-write --allow-env --allow-net --allow-run
                deno lint packages/
                deno fmt --check packages/
                deno check packages/core/src/index.ts packages/rpc/src/index.ts packages/ui/src/index.ts
                deno task build:all</code></pre></less-code-block>

                <h2>高价值回归测试</h2>
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
                        Root <span class="inline-code">_middleware.ts</span> covers <span class="inline-code"
                        >/</span> and nested routes.
                      </td>
                    </tr>
                    <tr>
                      <td>SSG CSP</td>
                      <td>Static HTML receives CSP meta when middleware CSP is configured.</td>
                    </tr>
                    <tr>
                      <td>嵌套 island</td>
                      <td>
                        <span class="inline-code">app/islands/posts/index.ts</span> resolves to the scanned file
                        path.
                      </td>
                    </tr>
                    <tr>
                      <td>策略</td>
                      <td>
                        Package and default island strategies are reflected in generated client entry.
                      </td>
                    </tr>
                    <tr>
                      <td>渲染器</td>
                      <td>
                        Unsafe HTML, attributes, nested DSD and Lit adapter output have clear expectations.
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h2>浏览器测试</h2>
                <p>
                  当行为依赖 Custom Element 升级、IntersectionObserver、idle 加载、 service worker 或真实 DOM
                  语义时，使用浏览器测试。 单元测试不足以覆盖 island 策略工作。
                </p>

                <h2>Playwright E2E 测试</h2>
                <p>
                  LessJS 包含 Playwright 端到端测试，在真实浏览器中验证 SSG 输出。 这些测试确认 Declarative
                  Shadow DOM 被正确解析、Custom Elements 升级、 island 策略按预期工作。
                </p>
                <less-code-block
                ><pre><code># Install Playwright browsers (first time)
                  deno task test:e2e:install

                  # Run E2E tests (builds docs site first, then tests against static server)
                  deno task test:e2e</code></pre></less-code-block>
                <p>
                  E2E 测试套件覆盖两个领域：
                </p>
                <ul>
                  <li><strong>DSD 层级</strong> — HTML 结构、shadow root 挂载、样式、无原始 template 文本</li>
                  <li><strong>嵌套 Custom Elements</strong> — CE 发现、DSD 解析后 shadow root 升级、导航</li>
                </ul>

                <div class="nav-row">
                  <a href="/guide/error-handling" class="nav-link">&larr; 错误处理</a>
                  <a href="/guide/deployment" class="nav-link">部署 &rarr;</a>
                </div>
              </div>
            </less-layout>
          `;
        }
      }

      customElements.define('page-testing', TestingPage);
      export default TestingPage;
      export const tagName = 'page-testing';

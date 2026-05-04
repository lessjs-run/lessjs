import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export class RoadmapPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .phase {
        margin: 1rem 0;
        padding: 1rem 1.25rem;
        border-left: 2px solid var(--kiss-border-hover);
        background: var(--kiss-bg-surface);
        border-radius: 0 4px 4px 0;
      }

      .phase h3 {
        margin-top: 0;
      }

      .status {
        display: inline-block;
        margin-bottom: 0.35rem;
        color: var(--kiss-text-muted);
        font-size: 0.6875rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/roadmap">
        <div class="container">
          <h1>Roadmap</h1>
          <p class="subtitle">
            KISS 的路线图围绕一个判断展开：先把 SSG + DSD + Island Upgrade + Hono API 做可信，再扩展
            serverless fullstack、ISR、PWA 和 compiler。
          </p>

          <div class="callout">
            <p>
              Roadmap 不是宣传页。这里列出的未来项只有进入实现和测试后，才会被写成稳定用户指南。
            </p>
          </div>

          <h2>Now: Trust Hardening</h2>
          <p>
            当前优先级是修复框架已经承诺的行为，而不是扩大功能面。
          </p>
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Work</th>
                <th>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Middleware</td>
                <td>
                  Root <span class="inline-code">_middleware.ts</span> must cover the whole route tree.
                </td>
                <td>
                  Security headers and auth guards cannot silently disappear below <span
                    class="inline-code"
                  >/</span>.
                </td>
              </tr>
              <tr>
                <td>SSG Security</td>
                <td>Static post-processing must preserve CSP behavior from SSR.</td>
                <td>Static deployments need the same security contract as generated Hono responses.</td>
              </tr>
              <tr>
                <td>Islands</td>
                <td>Nested island paths must use scanned file paths, not rebuilt tag names.</td>
                <td>Apps should be able to organize islands in subdirectories.</td>
              </tr>
              <tr>
                <td>Strategies</td>
                <td>
                  Island <span class="inline-code">strategy</span> metadata must reach the client build.
                </td>
                <td>Package islands and framework options should affect runtime loading behavior.</td>
              </tr>
            </tbody>
          </table>

          <h2>Release Phases</h2>
          <div class="phase">
            <span class="status">v0.6</span>
            <h3>DSD Renderer 2</h3>
            <p>
              Define safe/unsafe HTML contracts, preserve Lit escaping semantics, support nested DSD,
              improve slot/projection behavior, and make render failures point to route/tag/source.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.7</span>
            <h3>Island Upgrade Manifest</h3>
            <p>
              Move from global island entry toward page-level island manifests. Make eager, idle and
              visible strategies observable in browser tests, then document them as stable behavior.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.8</span>
            <h3>Serverless Fullstack</h3>
            <p>
              Promote Hono API routes into a complete app story: FormData actions, typed RPC, env/secrets,
              deployment adapters and small official examples for content-driven apps.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.9</span>
            <h3>SSG + ISR + PWA</h3>
            <p>
              Add route-level revalidation, cache locks, stale fallback, service worker strategy and CDN
              recipes. ISR should arrive only after adapter semantics are clear.
            </p>
          </div>

          <div class="phase">
            <span class="status">v0.10</span>
            <h3>.kiss Compiler Alpha</h3>
            <p>
              Explore a compiler that can reduce runtime cost and make Lit optional. It remains an
              optimization path, not a prerequisite for the current framework model.
            </p>
          </div>

          <h2>Product Direction</h2>
          <p>
            Near-term examples should focus on docs, blogs, content sites, product pages and light
            serverless apps. CRM/admin style applications are valid medium-term targets, but they need
            stronger forms, auth, validation, data loading and revalidation contracts before becoming
            official showcase material.
          </p>

          <h2>Principles</h2>
          <ul>
            <li>Web Standards first: prefer platform primitives over framework-specific protocols.</li>
            <li>Static first: dynamic runtime behavior must be explicit.</li>
            <li>DSD first: readable HTML exists before JavaScript runs.</li>
            <li>
              Island upgrade: client JavaScript upgrades interactive components, not the whole page.
            </li>
            <li>
              Docs are falsifiable: current guides describe current behavior; future work stays here.
            </li>
          </ul>

          <div class="nav-row">
            <a href="/guide/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/decisions" class="nav-link">Architecture Decisions &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('page-roadmap', RoadmapPage);
export default RoadmapPage;
export const tagName = 'page-roadmap';

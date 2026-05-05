/**
 * PWA Support — architecture decision for LessJS SSG
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class PwaPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .adr-meta {
        font-size: 0.75rem;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
      }
      h2 {
        font-size: 1rem;
        font-weight: 500;
        margin: 1.5rem 0 0.5rem;
        color: var(--less-text-primary);
      }
      h3 {
        font-size: 0.875rem;
        font-weight: 500;
        margin: 1rem 0 0.25rem;
        color: var(--less-text-secondary);
      }
      p {
        font-size: 0.8125rem;
        line-height: 1.7;
        color: var(--less-text-secondary);
        margin: 0 0 0.75rem;
      }
      .code-block {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        padding: 1rem;
        font-family: "SF Mono", "Fira Code", monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0.75rem 0 1.25rem;
        color: var(--less-text-secondary);
        white-space: pre;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/guide/pwa">
        <div class="container">
          <p class="adr-meta">ADR 0003 · 2026-04-30 · Partially implemented</p>
          <h1>PWA Support for LessJS SSG</h1>

          <h2>Context</h2>
          <p>
            LessJS generates pure static HTML with Declarative Shadow DOM. This is the ideal substrate for a
            PWA: pages are pre-rendered, assets are versioned hashes, and API routes can stay outside the
            static artifact on a serverless platform. The important rule is freshness: HTML should prefer
            network, while hashed assets can prefer cache.
          </p>

          <h2>Implementation</h2>
          <p>
            Added to <code>build-ssg.ts</code> — after Phase 3, the SSG script generates:
          </p>
          <ul
            style="font-size:0.8125rem;color:var(--less-text-secondary);margin:0.5rem 0 1rem;line-height:1.8"
          >
            <li><code>manifest.json</code> — Web App Manifest with name, theme_color, icons</li>
            <li>
              <code>sw.js</code> — Service Worker with NetworkFirst (HTML/API) + CacheFirst (assets)
            </li>
            <li>HTML injection — <code>&lt;link rel="manifest"&gt;</code> + sw registration script</li>
          </ul>

          <h3>API</h3>
          <div class="code-block">
            // vite.config.ts export default defineConfig({ plugins: [kiss({ pwa: { name: 'My LessJS App',
            shortName: 'LessJS', themeColor: '#000000', backgroundColor: '#ffffff', }, })], })
          </div>

          <h3>Service Worker strategy</h3>
          <div class="code-block">
            self.addEventListener('install', () => self.skipWaiting()) self.addEventListener('fetch',
            (e) => { const url = new URL(e.request.url) const isAsset = /\\.[a-z0-9]+$/i.test(url.pathname)
            && !url.pathname.includes('/api/') e.respondWith(isAsset ? cacheFirst(e.request) :
            networkFirst(e.request)) })
          </div>

          <h2>Current status</h2>
          <p>
            The <code>build-ssg.ts</code> script accepts a <code>pwa</code> option. When provided, it
            generates manifest.json and sw.js in the output directory, and injects manifest links + sw
            registration into every HTML file. The <code>kiss()</code> plugin already carries this option
            through build metadata.
          </p>
          <p>
            Benefit: offline access, instant repeat visits, installable on mobile. Cost: ~100 lines of
            code. No dependency on Workbox. The current service worker intentionally avoids full precache
            because stale <code>index.html</code> is worse than a first-load network request.
          </p>

          <div class="nav-row" style="margin-top:2rem">
            <a href="/guide/kiss-compiler" class="nav-link">&larr; LessJS Compiler</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-pwa', PwaPage);
export default PwaPage;
export const tagName = 'page-pwa';

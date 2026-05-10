/**
 * @lessjs/docs - API Reference: @lessjs/core
 */

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'api-core-page';

export const meta = { section: 'Packages', label: 'API Reference', order: 5 };

export default class ApiCorePage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .api-section {
        margin-bottom: 2.5rem;
      }
      .fn-name {
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--less-text-primary);
        margin: 1.5rem 0 0.25rem;
      }
      .fn-sig {
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.75rem;
        color: var(--less-text-tertiary);
        margin-bottom: 0.5rem;
        line-height: 1.5;
      }
      .fn-desc {
        font-size: 0.875rem;
        line-height: 1.7;
        color: var(--less-text-secondary);
        margin-bottom: 0.5rem;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container">
          <h1>API Reference: @lessjs/core</h1>
          <p class="subtitle">Public API exports from the core LessJS package.</p>

          <div class="api-section">
            <h2>Plugin</h2>

            <div class="fn-name">less()</div>
            <div class="fn-sig">less(options?: FrameworkOptions): Plugin[]</div>
            <div class="fn-desc">
              Creates the LessJS Vite plugin array. Accepts options for routes, islands, SSR, PWA, HTML
              injection, and build configuration. Returns an array of Vite plugins that handle route
              scanning, island transformation, SSR bundling, and build metadata generation.
            </div>

            <h2>Rendering</h2>

            <div class="fn-name">renderDSD()</div>
            <div class="fn-sig">
              renderDSD(tagName, componentClass, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Server-side renders a Custom Element as Declarative Shadow DOM HTML. Instantiates the
              component, sets properties, calls render(), wraps output in a DSD template. Supports all
              three component layers (dsd-static, dsd-interactive, pure-island).
            </div>

            <div class="fn-name">renderDSDByName()</div>
            <div class="fn-sig">
              renderDSDByName(tagName, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Like renderDSD but looks up the component class from globalThis.customElements by tag name.
              Useful when the class isn't directly importable.
            </div>

            <div class="fn-name">wrapInDocument()</div>
            <div class="fn-sig">wrapInDocument(html, options?): string</div>
            <div class="fn-desc">
              Wraps HTML content in a full document with &lt;!DOCTYPE html&gt;, &lt;html&gt;,
              &lt;head&gt;, and &lt;body&gt;. Supports title, lang, meta tags, head extras, client
              scripts, CSP nonce, and dev mode scripts.
            </div>

            <div class="fn-name">serializeAttributes()</div>
            <div class="fn-sig">serializeAttributes(props): string</div>
            <div class="fn-desc">
              Serializes a props object into HTML attribute string. Handles booleans (attr-only), strings
              (escaped), objects (JSON-encoded + escaped), and camelCase→kebab-case conversion for Lit
              compatibility.
            </div>

            <h2>Islands</h2>

            <div class="fn-name">island()</div>
            <div class="fn-sig">island(componentClass, options?): CustomElementConstructor</div>
            <div class="fn-desc">
              Wraps a Custom Element class with island upgrade logic. Returns a new class that handles SSR
              prop deserialization, DSD hydration, and upgrade strategy (eager/lazy/idle/visible).
            </div>

            <div class="fn-name">lessBind()</div>
            <div class="fn-sig">lessBind(element, props): void</div>
            <div class="fn-desc">
              Binds SSR-serialized properties (from data-ssr-props) onto a Custom Element instance.
              Framework-agnostic: works with Lit, vanilla, or any Custom Element.
            </div>

            <div class="fn-name">getSSRProps()</div>
            <div class="fn-sig">getSSRProps(element): Record&lt;string, unknown&gt;</div>
            <div class="fn-desc">
              Reads and deserializes properties stored in data-ssr-props attribute. Returns the parsed
              props object. Used internally by lessBind() and island().
            </div>

            <h2>Routing & Navigation</h2>

            <div class="fn-name">navigate()</div>
            <div class="fn-sig">navigate(url, options?): void</div>
            <div class="fn-desc">
              Client-side navigation using the Navigation API (with popstate fallback). Updates URL and
              dispatches navigation callbacks.
            </div>

            <div class="fn-name">onNavigate()</div>
            <div class="fn-sig">onNavigate(callback): () =&gt; void</div>
            <div class="fn-desc">
              Registers a navigation callback. Returns an unsubscribe function. Callback receives the
              destination URL and navigation type ('push' | 'replace').
            </div>

            <div class="fn-name">matchRoute()</div>
            <div class="fn-sig">matchRoute(url, routes): RouteMatch | null</div>
            <div class="fn-desc">
              Matches a URL against a list of route patterns. Supports dynamic segments (:param) and
              catch-all routes (*path). Returns matched route with extracted params.
            </div>

            <h2>Utilities</h2>

            <div class="fn-name">escapeHtml()</div>
            <div class="fn-sig">escapeHtml(str): string</div>
            <div class="fn-desc">
              HTML-escapes a string. Supports SafeHtml/UnsafeHtml branded types to prevent
              double-escaping.
            </div>

            <div class="fn-name">escapeAttrValue()</div>
            <div class="fn-sig">escapeAttrValue(value): string</div>
            <div class="fn-desc">
              Escapes a value for safe HTML attribute embedding. Handles null/undefined (returns empty
              string), converts to string, then escapes.
            </div>

            <div class="fn-name">createLogger()</div>
            <div class="fn-sig">createLogger(name): LessLogger</div>
            <div class="fn-desc">
              Creates a scoped logger with prefix. Returns methods: error, warn, info, debug. Each
              prefixes messages with [scope].
            </div>

            <h2>Error Classes</h2>

            <div class="fn-name">LessError</div>
            <div class="fn-sig">extends Error</div>
            <div class="fn-desc">
              Base error class with code, statusCode, isOperational, and toJSON(). Extend for typed
              application errors.
            </div>

            <div class="fn-name">SsrRenderError</div>
            <div class="fn-sig">extends LessError</div>
            <div class="fn-desc">
              SSR rendering failure. Non-operational (system error, not recoverable). Carries
              componentPath and cause.
            </div>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ApiCorePage);

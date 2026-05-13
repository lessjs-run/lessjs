/**
 * @lessjs/docs - API Reference: All Packages
 *
 * v0.14.1 API surface - organized by package.
 * Only public exports are listed.
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
      .pkg-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--less-text-primary);
        margin: 2rem 0 0.5rem;
      }
      .pkg-import {
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.75rem;
        color: var(--less-text-tertiary);
        margin-bottom: 1rem;
      }
      .fn-name {
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--less-text-primary);
        margin: 1.25rem 0 0.25rem;
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
      <less-layout
        locale="${this.locale || 'zh'}"
        .locales="${['en', 'zh']}"
        .navItems="${navSections}"
        .headerNav="${headerNav}"
      >
        <div class="container">
          <h1>API Reference</h1>
          <p class="subtitle">Public API surface of all LessJS packages (v0.14.1).</p>

          <div class="api-section">
            <!-- ─── @lessjs/core ───────────────────────────── -->
            <div class="pkg-name">@lessjs/core</div>
            <div class="pkg-import">import { ... } from '@lessjs/core';</div>
            <p>Pure runtime. Zero Vite/Node dependencies. Works in Deno, Node, Bun, Edge.</p>

            <div class="fn-name">renderDSD()</div>
            <div class="fn-sig">
              renderDSD(tagName, componentClass, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Server-side renders a Custom Element as DSD HTML. Supports all three layers: dsd-static,
              dsd-interactive, pure-island.
            </div>

            <div class="fn-name">renderDSDByName()</div>
            <div class="fn-sig">
              renderDSDByName(tagName, props?, sourceInfo?, dsdOptions?): Promise&lt;string&gt;
            </div>
            <div class="fn-desc">
              Like renderDSD but looks up the component class from customElements registry by tag name.
            </div>

            <div class="fn-name">escapeHtml() / escapeAttr() / escapeAttrValue()</div>
            <div class="fn-sig">
              escapeHtml(str): string — escapeAttrValue(value): string — escapeAttr(value): string
            </div>
            <div class="fn-desc">
              HTML/attribute escaping with SafeHtml/UnsafeHtml branded types for double-escape prevention.
            </div>

            <div class="fn-name">island()</div>
            <div class="fn-sig">island(componentClass, options?): CustomElementConstructor</div>
            <div class="fn-desc">
              Wraps a CE class with island upgrade logic. Supports 4 strategies: eager, lazy, idle,
              visible.
            </div>

            <div class="fn-name">lessBind() / getSSRProps()</div>
            <div class="fn-sig">
              lessBind(element, props): void — getSSRProps(element): Record&lt;string, unknown&gt;
            </div>
            <div class="fn-desc">Framework-agnostic SSR prop binding and deserialization.</div>

            <div class="fn-name">registerAdapter() / getAdapter()</div>
            <div class="fn-sig">
              registerAdapter(adapter: RenderAdapter): void — getAdapter(): RenderAdapter | undefined
            </div>
            <div class="fn-desc">
              Plugin interface for SSR renderers (e.g., Lit TemplateResult → DSD HTML via
              @lessjs/adapter-lit).
            </div>

            <div class="fn-name">createSsrContext() / extractParams() / parseQuery()</div>
            <div class="fn-sig">
              createSsrContext(opts): SsrContext — extractParams(ctx, keys): Record — parseQuery(ctx):
              Record
            </div>
            <div class="fn-desc">
              Server-side rendering context with request, params, and query parsing.
            </div>

            <div class="fn-name">LessError / SsrRenderError</div>
            <div class="fn-sig">extends Error</div>
            <div class="fn-desc">
              Structured error classes with code, statusCode, isOperational, and toJSON().
            </div>

            <div class="fn-name">renderSsrError() / wrapInDocument() / camelToKebab()</div>
            <div class="fn-desc">
              SSR error page rendering, document wrapper, and Lit-compatible attribute name conversion.
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/core/logger</code> (createLogger), <code
              >@lessjs/core/errors</code>, <code>@lessjs/core/context</code>, <code
              >@lessjs/core/navigation</code> (navigate/onNavigate/matchRoute), <code
              >@lessjs/core/constants</code>.
            </p>

            <!-- ─── @lessjs/adapter-vite ─────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-vite</div>
            <div class="pkg-import">import { less } from '@lessjs/adapter-vite';</div>
            <p>
              Vite build orchestration: routes, islands, SSG 3-phase pipeline. Contains <code
              >less()</code> (moved from core in v0.11).
            </p>

            <div class="fn-name">less()</div>
            <div class="fn-sig">less(options?: FrameworkOptions, ctx?: LessBuildContext): Plugin[]</div>
            <div class="fn-desc">
              Creates the LessJS Vite plugin array. Handles route scanning, Hono entry generation, island
              transform, SSR SSR and SSG. Returns 7+ plugins.
            </div>

            <div class="fn-name">LessBuildContext</div>
            <div class="fn-sig">class LessBuildContext(options)</div>
            <div class="fn-desc">
              Cross-phase state container. Phase 1 writes routes/islands, Phase 2 writes client manifests,
              Phase 3 reads all for SSG rendering.
            </div>

            <div class="fn-name">Build utilities</div>
            <div class="fn-desc">
              <code>printBuildManifest()</code>, <code>scanClientBuild()</code>, <code
              >scanSSGOutput()</code>, <code>buildIslandChunkMap()</code>, <code
              >buildSpeculationRulesJson()</code>,<br>
              <code>injectClientScript()</code>, <code>injectCspMeta()</code>, <code
              >injectDsdPolyfill()</code>, <code>injectSpeculationRules()</code>, <code
              >injectViewTransitionMeta()</code>,<br>
              <code>extractCustomElementTags()</code>, <code>generateIslandManifests()</code>, <code
              >writeIslandManifests()</code>
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/adapter-vite/build-context</code>, <code
              >@lessjs/adapter-vite/virtual-ids</code>
            </p>

            <!-- ─── @lessjs/app ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/app</div>
            <div class="pkg-import">import { lessjs } from '@lessjs/app';</div>
            <p>
              Unified entry. Combines less() + lessContent() + lessI18n() with shared ctx. <strong
              >Recommended for all projects.</strong>
            </p>

            <div class="fn-name">lessjs()</div>
            <div class="fn-sig">lessjs(options: LessjsOptions): Plugin[]</div>
            <div class="fn-desc">
              Accepts core options + content + i18n nested configs. Creates shared LessBuildContext and
              passes to all sub-plugins.
            </div>

            <!-- ─── @lessjs/content ──────────────────────────── -->
            <div class="pkg-name">@lessjs/content</div>
            <div class="pkg-import">import { lessContent } from '@lessjs/content';</div>
            <p>
              Build-time content plugin: Blog + Nav + Sitemap. Data flows through virtual modules (ADR
              0018).
            </p>

            <div class="fn-name">lessContent()</div>
            <div class="fn-sig">lessContent(options: LessContentOptions &amp; { ctx? }): Plugin[]</div>
            <div class="fn-desc">
              Creates content plugins. Modules: blog (md frontmatter), nav (route meta scanning), sitemap
              (SSG output scan).
            </div>

            <p class="fn-desc" style="margin-top:1rem">
              <strong>Subpath exports:</strong> <code>@lessjs/content/blog-data</code>, <code
              >@lessjs/content/nav</code>, <code>@lessjs/content/sitemap</code>
            </p>

            <!-- ─── @lessjs/i18n ─────────────────────────────── -->
            <div class="pkg-name">@lessjs/i18n</div>
            <div class="pkg-import">import { lessI18n } from '@lessjs/i18n';</div>

            <div class="fn-name">lessI18n()</div>
            <div class="fn-sig">lessI18n(options: LessI18nOptions &amp; { ctx? }): Plugin</div>
            <div class="fn-desc">
              Locale expansion for SSG + route-level helpers (i18nStaticPaths, switchLocale).
            </div>

            <!-- ─── @lessjs/adapter-lit ──────────────────────── -->
            <div class="pkg-name">@lessjs/adapter-lit</div>
            <div class="pkg-import">
              import { installLitAdapter, WithDsdHydration, DsdLitElement } from '@lessjs/adapter-lit';
            </div>

            <div class="fn-name">installLitAdapter()</div>
            <div class="fn-desc">
              Patches core's render pipeline to handle Lit TemplateResult → DSD HTML conversion. Call once
              in SSR bundle entry.
            </div>

            <div class="fn-name">WithDsdHydration / DsdLitElement</div>
            <div class="fn-desc">
              Mixin/base class for DSD hydration. Skip re-render when shadow root already exists; bind
              hydrateEvents declaratively.
            </div>

            <!-- ─── @lessjs/ui ───────────────────────────────── -->
            <div class="pkg-name">@lessjs/ui</div>
            <div class="pkg-import">import { ... } from '@lessjs/ui';</div>
            <p>
              8 Web Components: less-button, less-input, less-card, less-code-block, less-layout,
              less-theme-toggle, less-hero-ping, less-dialog.
            </p>

            <!-- ─── @lessjs/signals ───────────────────────────── -->
            <div class="pkg-name">@lessjs/signals</div>
            <div class="pkg-import">import { signal, computed, effect } from '@lessjs/signals';</div>
            <p>
              TC39 Signals polyfill. Also exports: batch, untracked, channel, islandEffect, themeSignal,
              isNativeSignal.
            </p>

            <!-- ─── @lessjs/rpc ──────────────────────────────── -->
            <div class="pkg-name">@lessjs/rpc</div>
            <div class="pkg-import">import { RpcController, RpcError } from '@lessjs/rpc';</div>
            <p>
              Lit ReactiveController for fetch-based RPC with auto-retry, abort, and loading/error state
              management.
            </p>

            <!-- ─── @lessjs/create ───────────────────────────── -->
            <div class="pkg-name">@lessjs/create</div>
            <div class="pkg-import">deno run -A jsr:@lessjs/create my-app</div>
            <p>
              CLI scaffold. Generates a new LessJS project with Deno config, Vite config, routes, islands,
              and example component.
            </p>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, ApiCorePage);

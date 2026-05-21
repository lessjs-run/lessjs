/**
 * @lessjs/ui — Design System
 * Two plates. Zero noise.
 *
 * Dogfooding: uses real less-button, less-card, less-input components.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
import { headerNav, navSections } from 'virtual:less-nav';
import { filterEngineNav } from '../../utils/nav-filter.ts';
import { DsdElement, StyleSheet } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-button';
import '@lessjs/ui/less-card';
import '@lessjs/ui/less-input';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      :host {
        display: block;
      }
      .section {
        margin-bottom: 3.5rem;
      }
      .section-title {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 0.5px solid var(--border);
      }
      .palette-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--border);
        border: 0.5px solid var(--border);
        border-radius: 6px;
        overflow: hidden;
      }
      .palette-card {
        padding: 1.5rem;
      }
      .palette-dark {
        background: var(--bg-base);
      }
      .palette-light {
        background: #fff;
      }
      .palette-name {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 1rem;
      }
      .palette-dark .palette-name {
        color: var(--text-muted);
      }
      .palette-light .palette-name {
        color: var(--text-secondary);
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .swatch-item {
        text-align: center;
      }
      .swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 4px;
        margin-bottom: 0.375rem;
      }
      .palette-dark .swatch {
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .palette-light .swatch {
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .swatch-label {
        font-size: 0.5625rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .palette-dark .swatch-label {
        color: var(--text-muted);
      }
      .palette-light .swatch-label {
        color: var(--text-secondary);
      }
      .palette-desc {
        font-size: 0.75rem;
        line-height: 1.6;
      }
      .palette-dark .palette-desc {
        color: var(--text-muted);
      }
      .palette-dark .palette-desc strong {
        color: var(--text-primary);
      }
      .palette-light .palette-desc {
        color: var(--text-secondary);
      }
      .palette-light .palette-desc strong {
        color: var(--text-primary);
      }
      .type-scale {
        display: flex;
        flex-direction: column;
      }
      .type-row {
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        padding: 0.75rem 0;
        border-bottom: 0.5px solid var(--border);
      }
      .type-row:last-child {
        border-bottom: none;
      }
      .type-label {
        min-width: 72px;
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
      }
      .type-sample {
        color: var(--text-primary);
      }
      .preview-card {
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 6px;
        overflow: hidden;
      }
      .preview-header {
        padding: 0.875rem 1.25rem;
        border-bottom: 0.5px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .preview-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .preview-badge {
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        background: var(--brand-subtle);
        color: var(--text-secondary);
        border: 0.5px solid var(--border);
      }
      .preview-body {
        padding: 1.25rem;
        display: flex;
        gap: 0.625rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      .install-section {
        margin-top: 3.5rem;
        padding: 2rem;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 6px;
        text-align: center;
      }
      .install-section h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1rem;
      }
      .install-cmd {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 1.25rem;
        background: var(--bg-elevated);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        font-family: "SF Mono", monospace;
        font-size: 0.8125rem;
        color: var(--text-primary);
      }
      .install-cmd .prompt {
        color: var(--text-muted);
      }
      .install-section p {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin: 0.75rem 0 0;
      }
      @media (max-width: 900px) {
        .section {
          margin-bottom: 2.5rem;
        }
        .type-row {
          gap: 1rem;
        }
        .preview-body {
          padding: 1rem;
        }
        .install-section {
          padding: 1.5rem 1rem;
        }
      }
      @media (max-width: 640px) {
        .palette-row {
          grid-template-columns: 1fr;
        }
        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        .install-cmd {
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
        }
      }
    `,
);

export class UIShowcase extends DsdElement {
  static override styles = [routeSheet];

  override render() {
    return (this.getAttribute('locale') || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this.getAttribute('locale') || 'zh'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterEngineNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/engine/design-system"><div class="container">
    <h1>设计系统</h1>
    <p class="subtitle"><strong>双色板。零噪音。</strong><br>深色和浅色。没有别的。</p>
    <div class="section"><div class="section-title">色板</div><div class="palette-row">
      <div class="palette-card palette-dark"><div class="palette-name">深色</div><div class="swatch-grid"><div class="swatch-item"><div class="swatch" style="background:#000"></div><div class="swatch-label">基底</div></div><div class="swatch-item"><div class="swatch" style="background:#0a0a0a"></div><div class="swatch-label">表面</div></div><div class="swatch-item"><div class="swatch" style="background:#fff"></div><div class="swatch-label">主色</div></div><div class="swatch-item"><div class="swatch" style="background:#999"></div><div class="swatch-label">次色</div></div><div class="swatch-item"><div class="swatch" style="background:#666"></div><div class="swatch-label">第三色</div></div><div class="swatch-item"><div class="swatch" style="background:#444"></div><div class="swatch-label">静默</div></div></div><p class="palette-desc"><strong>黑色</strong> 基底。白色强调。灰色分层。</p></div>
      <div class="palette-card palette-light"><div class="palette-name">浅色</div><div class="swatch-grid"><div class="swatch-item"><div class="swatch" style="background:#fff"></div><div class="swatch-label">基底</div></div><div class="swatch-item"><div class="swatch" style="background:#fafafa"></div><div class="swatch-label">表面</div></div><div class="swatch-item"><div class="swatch" style="background:#000"></div><div class="swatch-label">主色</div></div><div class="swatch-item"><div class="swatch" style="background:#555"></div><div class="swatch-label">次色</div></div><div class="swatch-item"><div class="swatch" style="background:#888"></div><div class="swatch-label">第三色</div></div><div class="swatch-item"><div class="swatch" style="background:#aaa"></div><div class="swatch-label">静默</div></div></div><p class="palette-desc"><strong>白色</strong> 基底。黑色强调。灰色分层。</p></div>
    </div></div>
    <div class="section"><div class="section-title">按钮</div><div class="preview-card"><div class="preview-header"><span class="preview-title">变体</span><span class="preview-badge">可用</span></div><div class="preview-body"><less-button variant="primary">主要按钮</less-button><less-button>默认按钮</less-button><less-button variant="ghost">幽灵按钮</less-button></div></div></div>
    <div class="section"><div class="section-title">输入框</div><div class="preview-card"><div class="preview-header"><span class="preview-title">文本输入</span><span class="preview-badge">可用</span></div><div class="preview-body" style="flex-direction:column;gap:0.75rem"><less-input placeholder="输入邮箱..." label="邮箱"></less-input><less-input type="password" placeholder="密码" label="密码" required></less-input><less-input value="hello@lessjs.org" label="只读" disabled></less-input></div></div></div>
    <div class="install-section"><h3>安装 @lessjs/ui</h3><div class="install-cmd"><span class="prompt">$</span> deno add jsr:@lessjs/ui</div><p>Deno、Node、Bun。零配置。</p></div>
    <div class="nav-row"><a href="/engine/architecture" class="nav-link">&larr; Architecture</a><a href="/engine/reference/core" class="nav-link">API Reference &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this.getAttribute('locale') || 'en'}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(filterEngineNav(navSections))}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/engine/design-system"><div class="container">
    <h1>Design System</h1>
    <p class="subtitle"><strong>Two plates. Zero noise.</strong><br>Dark and light. Nothing else.</p>
    <div class="section"><div class="section-title">Palettes</div><div class="palette-row">
      <div class="palette-card palette-dark"><div class="palette-name">Dark</div><div class="swatch-grid"><div class="swatch-item"><div class="swatch" style="background:#000"></div><div class="swatch-label">Base</div></div><div class="swatch-item"><div class="swatch" style="background:#0a0a0a"></div><div class="swatch-label">Surface</div></div><div class="swatch-item"><div class="swatch" style="background:#fff"></div><div class="swatch-label">Primary</div></div><div class="swatch-item"><div class="swatch" style="background:#999"></div><div class="swatch-label">Secondary</div></div><div class="swatch-item"><div class="swatch" style="background:#666"></div><div class="swatch-label">Tertiary</div></div><div class="swatch-item"><div class="swatch" style="background:#444"></div><div class="swatch-label">Muted</div></div></div><p class="palette-desc"><strong>Black</strong> base. White accent. Gray layers.</p></div>
      <div class="palette-card palette-light"><div class="palette-name">Light</div><div class="swatch-grid"><div class="swatch-item"><div class="swatch" style="background:#fff"></div><div class="swatch-label">Base</div></div><div class="swatch-item"><div class="swatch" style="background:#fafafa"></div><div class="swatch-label">Surface</div></div><div class="swatch-item"><div class="swatch" style="background:#000"></div><div class="swatch-label">Primary</div></div><div class="swatch-item"><div class="swatch" style="background:#555"></div><div class="swatch-label">Secondary</div></div><div class="swatch-item"><div class="swatch" style="background:#888"></div><div class="swatch-label">Tertiary</div></div><div class="swatch-item"><div class="swatch" style="background:#aaa"></div><div class="swatch-label">Muted</div></div></div><p class="palette-desc"><strong>White</strong> base. Black accent. Gray layers.</p></div>
    </div></div>
    <div class="section"><div class="section-title">Buttons</div><div class="preview-card"><div class="preview-header"><span class="preview-title">Variants</span><span class="preview-badge">Ready</span></div><div class="preview-body"><less-button variant="primary">Primary</less-button><less-button>Default</less-button><less-button variant="ghost">Ghost</less-button></div></div></div>
    <div class="section"><div class="section-title">Inputs</div><div class="preview-card"><div class="preview-header"><span class="preview-title">Text Input</span><span class="preview-badge">Ready</span></div><div class="preview-body" style="flex-direction:column;gap:0.75rem"><less-input placeholder="Enter email..." label="Email"></less-input><less-input type="password" placeholder="Password" label="Password" required></less-input><less-input value="hello@lessjs.org" label="Read-only" disabled></less-input></div></div></div>
    <div class="install-section"><h3>Install @lessjs/ui</h3><div class="install-cmd"><span class="prompt">$</span> deno add jsr:@lessjs/ui</div><p>Deno, Node, Bun. Zero config.</p></div>
    <div class="nav-row"><a href="/engine/architecture" class="nav-link">&larr; Architecture</a><a href="/engine/reference/core" class="nav-link">API Reference &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('ui-showcase', UIShowcase);
export default UIShowcase;
export const tagName = 'ui-showcase';

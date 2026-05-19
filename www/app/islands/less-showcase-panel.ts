/**
 * LessShowcasePanel — Multi-framework Tab Container Island
 *
 * Renders a tabbed panel with live showcase islands on the left
 * and source code on the right. Used on the homepage to demonstrate
 * Lit/React/Vanilla components coexisting.
 *
 * Architecture:
 * - Extends DsdLitElement for DSD pipeline compatibility
 * - Uses private _activeTab + requestUpdate() (Rolldown decorator issue)
 * - Imports showcase islands lazily via dynamic import references
 * - Responsive: 760px below stacks to vertical layout
 *
 * @lessjs/app island — client-side only (showcase islands are ssr: false)
 */
import { css, html } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from '@lessjs/ui/design-tokens';
import '@lessjs/ui/less-code-block';

// Import showcase islands — they are ssr: false so client-side only
import './shoelace-showcase.js';
import './react-showcase.js';
import './media-chrome-showcase.js';

export const tagName = 'less-showcase-panel';

// ssr: false — showcase islands need client-side DOM
export const less = { ssr: false };

/** Tab configuration for the showcase panel */
export interface ShowcaseTab {
  /** Tab label text */
  label: string;
  /** Framework tag text (e.g. "Lit", "React") */
  tag: string;
  /** Tag background color */
  tagColor: string;
  /** Showcase island tagName */
  islandTag: string;
  /** Source code to display */
  code: string;
  /** Code panel title */
  codeLabel: string;
  /** Adapter description */
  adapterDesc: string;
  /** Install command */
  installCmd: string;
}

export default class LessShowcasePanel extends DsdLitElement {
  private _activeTab = 0;
  private _tabs: ShowcaseTab[] = [];

  static override styles = [
    lessDesignTokens,
    css`
      :host {
        display: block;
      }

      /* ── Tab Bar ── */
      .tab-bar {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--less-border);
        margin-bottom: 16px;
      }
      .tab-item {
        padding: 10px 18px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        color: var(--less-text-tertiary, #71717a);
        font-size: 13px;
        font-weight: 500;
        transition: border-color var(--less-duration-fast, 200ms) var(--less-easing-default, ease-out),
                    color var(--less-duration-fast, 200ms) var(--less-easing-default, ease-out);
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border-left: none;
        border-right: none;
        border-top: none;
        font-family: inherit;
      }
      .tab-item:hover {
        color: var(--less-text-secondary);
      }
      .tab-item[active] {
        border-bottom-color: var(--less-brand, #534AB7);
        color: var(--less-brand, #534AB7);
      }
      .tab-tag {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .tab-tag.lit { background: #e6f1fb; color: #185fa5; }
      .tab-tag.react { background: #e1f0ff; color: #0d6efd; }
      .tab-tag.vanilla { background: #e1f5ee; color: #0f6e56; }

      /* ── Content Area — side by side ── */
      .showcase-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .showcase-left {
        background: var(--less-bg-surface);
        border: 1px solid var(--less-border);
        border-radius: var(--less-radius-lg, 12px);
        padding: 1.25rem;
        min-height: 200px;
        display: flex;
        flex-direction: column;
      }
      .showcase-right {
        background: #0d0d12;
        border-radius: var(--less-radius-lg, 12px);
        border: 1px solid rgba(255,255,255,0.06);
        overflow: hidden;
      }
      .code-bar {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 10px 16px 0;
      }
      .code-bar i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .code-bar .r { background: #ff5f57; }
      .code-bar .y { background: #febc2e; }
      .code-bar .g { background: #28c840; }
      .code-bar span {
        color: #71717a;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-left: 5px;
      }
      .showcase-right less-code-block pre {
        background: transparent !important;
        border: none !important;
        padding: 12px 16px !important;
        margin: 0 !important;
      }
      .showcase-right code {
        font-family: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace !important;
        font-size: 12px !important;
        line-height: 1.8 !important;
        color: #e4e4e7 !important;
        background: transparent !important;
      }

      /* ── Footer: adapter + install ── */
      .showcase-footer {
        margin-top: 14px;
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        padding-top: 12px;
        border-top: 1px solid var(--less-border);
      }
      .adapter-desc {
        font-size: 12px;
        color: var(--less-text-secondary);
      }
      .install-cmd {
        font-family: "JetBrains Mono", "SF Mono", "Fira Code", Consolas, monospace;
        font-size: 12px;
        color: var(--less-text-primary);
        background: var(--less-code-bg);
        padding: 4px 10px;
        border-radius: var(--less-radius-sm, 4px);
        border: 0.5px solid var(--less-code-border);
      }

      /* ── Responsive ── */
      @media (max-width: 760px) {
        .showcase-content {
          grid-template-columns: 1fr;
        }
        .tab-bar {
          flex-wrap: wrap;
          gap: 0;
        }
      }

      /* ── Reduced motion ── */
      @media (prefers-reduced-motion: reduce) {
        .tab-item {
          transition: none;
        }
      }

      /* ── Focus visible ── */
      .tab-item:focus-visible {
        outline: 2px solid var(--less-brand);
        outline-offset: 2px;
      }
    `,
  ];

  /** Active tab index */
  get activeTab(): number {
    return this._activeTab;
  }
  set activeTab(val: number) {
    this._activeTab = val;
    this.requestUpdate();
  }

  /** Tab configuration array */
  get tabs(): ShowcaseTab[] {
    return this._tabs;
  }
  set tabs(val: ShowcaseTab[]) {
    this._tabs = val;
    this.requestUpdate();
  }

  private _onTabClick(idx: number) {
    this._activeTab = idx;
    this.requestUpdate();
  }

  override render() {
    const activeTab = this._tabs[this._activeTab];
    return html`
      <div class="tab-bar" role="tablist">
        ${this._tabs.map((tab, idx) => html`
          <button
            class="tab-item"
            role="tab"
            ?active="${this._activeTab === idx}"
            aria-selected="${this._activeTab === idx}"
            @click="${() => this._onTabClick(idx)}"
          >
            <span class="tab-tag ${tab.tag.toLowerCase()}">${tab.tag}</span>${tab.label}
          </button>
        `)}
      </div>
      <div class="showcase-content">
        <div class="showcase-left">
          ${activeTab
            ? html`<${activeTab.islandTag}></${activeTab.islandTag}>`
            : ''}
        </div>
        <div class="showcase-right">
          ${activeTab
            ? html`
              <div class="code-bar">
                <i class="r"></i><i class="y"></i><i class="g"></i>
                <span>${activeTab.codeLabel}</span>
              </div>
              <less-code-block><pre><code>${activeTab.code}</code></pre></less-code-block>
            `
            : ''}
        </div>
      </div>
      ${activeTab
        ? html`
          <div class="showcase-footer">
            <span class="adapter-desc">${activeTab.adapterDesc}</span>
            <code class="install-cmd">${activeTab.installCmd}</code>
          </div>
        `
        : ''}
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, LessShowcasePanel);
} catch { /* already defined */ }

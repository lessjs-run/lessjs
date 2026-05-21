/**
 * LessShowcasePanel — Ocean component (v0.20.0 Ocean-Island).
 *
 * Multi-framework tabbed showcase panel. Tabs switch between
 * Lit/React/Vanilla island demos with source code on the right.
 * Pure DsdElement — zero Lit dependency.
 *
 * @lessjs/app island — client-side only (showcase islands are ssr: false)
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-code-block';

import './shoelace-showcase.js';
import './react-showcase.js';
import './media-chrome-showcase.js';

export const tagName = 'less-showcase-panel';

export const less = { ssr: false };

export interface ShowcaseTab {
  label: string;
  tag: string;
  tagColor: string;
  islandTag: string;
  code: string;
  codeLabel: string;
  adapterDesc: string;
  installCmd: string;
}

const panelStyles = new StyleSheet();
panelStyles.replaceSync(`
  :host {
    display: block;
  }
  .tab-bar {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }
  .tab-item {
    padding: 10px 18px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: var(--text-muted, #71717a);
    font-size: 13px;
    font-weight: 500;
    transition: border-color var(--duration-fast, 200ms) var(--easing-default, ease-out),
                color var(--duration-fast, 200ms) var(--easing-default, ease-out);
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
    color: var(--text-secondary);
  }
  .tab-item[active] {
    border-bottom-color: var(--brand, #534AB7);
    color: var(--brand, #534AB7);
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
  .showcase-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .showcase-left {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    padding: 1.25rem;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }
  .showcase-right {
    background: #0d0d12;
    border-radius: var(--radius-lg, 12px);
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
  .showcase-footer {
    margin-top: 14px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .adapter-desc {
    font-size: 12px;
    color: var(--text-secondary);
  }
  .install-cmd {
    font-family: "JetBrains Mono", "SF Mono", "Fira Code", Consolas, monospace;
    font-size: 12px;
    color: var(--text-primary);
    background: var(--bg-code);
    padding: 4px 10px;
    border-radius: var(--radius-sm, 4px);
    border: 0.5px solid var(--code-border);
  }
  @media (max-width: 760px) {
    .showcase-content {
      grid-template-columns: 1fr;
    }
    .tab-bar {
      flex-wrap: wrap;
      gap: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tab-item {
      transition: none;
    }
  }
  .tab-item:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
  }
`);

export default class LessShowcasePanel extends DsdElement {
  static override styles = [openPropsTokenSheet, panelStyles];

  private _activeTab = 0;
  private _tabs: ShowcaseTab[] = [];

  get activeTab(): number {
    return this._activeTab;
  }
  set activeTab(val: number) {
    this._activeTab = val;
    this._renderToDOM();
  }

  get tabs(): ShowcaseTab[] {
    return this._tabs;
  }
  set tabs(val: ShowcaseTab[]) {
    this._tabs = val;
    this._renderToDOM();
  }

  private _onTabClick(idx: number): void {
    this._activeTab = idx;
    this._renderToDOM();
  }

  override render(): string {
    // When DSD-hydrated, the shadow DOM already has content from DSD template
    if (this._dsdHydrated) return '';

    const activeTab = this._tabs[this._activeTab];

    const tabButtons = this._tabs.map((tab, idx) => {
      const isActive = this._activeTab === idx;
      return `<button class="tab-item" role="tab"${
        isActive ? ' active' : ''
      } aria-selected="${isActive}" data-tab-idx="${idx}">
        <span class="tab-tag ${tab.tag.toLowerCase()}">${tab.tag}</span>${tab.label}
      </button>`;
    }).join('');

    const leftContent = activeTab ? `<${activeTab.islandTag}></${activeTab.islandTag}>` : '';

    const rightContent = activeTab
      ? `<div class="code-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span>${activeTab.codeLabel}</span></div>
        <less-code-block><pre><code>${
        activeTab.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }</code></pre></less-code-block>`
      : '';

    const footer = activeTab
      ? `<div class="showcase-footer">
        <span class="adapter-desc">${activeTab.adapterDesc}</span>
        <code class="install-cmd">${activeTab.installCmd}</code>
      </div>`
      : '';

    return `
      <div class="tab-bar" role="tablist">${tabButtons}</div>
      <div class="showcase-content">
        <div class="showcase-left">${leftContent}</div>
        <div class="showcase-right">${rightContent}</div>
      </div>
      ${footer}
    `;
  }

  /** Re-render shadow DOM and re-bind tab click events. */
  private _renderToDOM(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = this.render();

    // Bind tab click handlers
    const buttons = this.shadowRoot.querySelectorAll<HTMLButtonElement>('[data-tab-idx]');
    buttons.forEach((btn) => {
      const idx = parseInt(btn.getAttribute('data-tab-idx') || '0', 10);
      btn.addEventListener('click', () => this._onTabClick(idx));
    });
  }
}

try {
  customElements.define(tagName, LessShowcasePanel);
} catch { /* already defined */ }

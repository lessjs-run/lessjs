/**
 * @lessjs/ui - LessCallout Component
 *
 * Callout/notice box for inline documentation alerts.
 * Supports 4 types: info, warning, danger, tip.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 *
 * @csspart container -The callout wrapper
 * @csspart icon -The type icon span
 * @csspart content -The body content area
 *
 * Usage:
 * ```html
 * <less-callout type="info" label="Note">
 *   This is an informational callout.
 * </less-callout>
 * ```
 */

import { DsdElement, StyleSheet } from '@lessjs/core';
import { openPropsTokenSheet } from './open-props-tokens.js';

export const tagName = 'less-callout';

const TYPE_CONFIG: Record<string, { borderColor: string; bgColor: string; icon: string }> = {
  info: {
    borderColor: 'var(--brand, #534AB7)',
    bgColor: 'rgba(83,74,183,0.06)',
    icon: '\u2139\uFE0F',
  },
  warning: {
    borderColor: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.06)',
    icon: '\u26A0',
  },
  danger: {
    borderColor: '#EF4444',
    bgColor: 'rgba(239,68,68,0.06)',
    icon: '\u2715',
  },
  tip: {
    borderColor: '#22C55E',
    bgColor: 'rgba(34,197,94,0.06)',
    icon: '\u2713',
  },
};

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }
  .callout {
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    border-left: 3px solid var(--brand, #534AB7);
    background: rgba(83,74,183,0.06);
    border-radius: 0 var(--radius-2, 8px) var(--radius-2, 8px) 0;
  }
  .callout-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .callout-icon {
    font-size: 14px;
    line-height: 1;
    flex-shrink: 0;
  }
  .callout-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--gray-9);
  }
  .callout-body {
    font-size: 0.9375rem;
    line-height: 1.75;
    color: var(--gray-7);
  }
  .callout-body ::slotted(p) {
    margin: 0;
  }
`);

export class LessCallout extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override observedAttributes = ['type', 'label'];

  override render(): string {
    const type = this.getAttribute('type') || 'info';
    const label = this.getAttribute('label') || '';
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

    const header = label
      ? `<div class="callout-header">
          <span class="callout-icon" part="icon">${config.icon}</span>
          <span class="callout-title">${this._esc(label)}</span>
        </div>`
      : '';

    return `<div class="callout" part="container"
        style="border-left-color:${config.borderColor};background:${config.bgColor};">
      ${header}
      <div class="callout-body" part="content">
        <slot></slot>
      </div>
    </div>`;
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = this.render();
    this._hydrateEvents();
  }

  /** Escape HTML text content to prevent XSS (SSR-safe, no DOM API) */
  private _esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

export default LessCallout;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessCallout);
}

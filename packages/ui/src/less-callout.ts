/**
 * @lessjs/ui - LessCallout Component
 *
 * Callout/notice box for inline documentation alerts.
 * Supports 4 types: info, warning, danger, tip.
 *
 * Usage:
 * ```html
 * <less-callout type="info" label="Note">
 *   This is an informational callout.
 * </less-callout>
 * ```
 *
 * Technical: Uses private _type/_title + requestUpdate() pattern
 * because Rolldown does not correctly transpile @property() decorators.
 */
import { css, html } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-callout';

const TYPE_CONFIG: Record<string, { borderColor: string; bgColor: string; icon: string }> = {
  info: {
    borderColor: 'var(--less-brand, #534AB7)',
    bgColor: 'var(--less-brand-subtle, rgba(83,74,183,0.06))',
    icon: 'ℹ️',
  },
  warning: {
    borderColor: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.06)',
    icon: '⚠',
  },
  danger: {
    borderColor: '#EF4444',
    bgColor: 'rgba(239,68,68,0.06)',
    icon: '✕',
  },
  tip: {
    borderColor: '#22C55E',
    bgColor: 'rgba(34,197,94,0.06)',
    icon: '✓',
  },
};

export class LessCallout extends DsdLitElement {
  private _type: 'info' | 'warning' | 'danger' | 'tip' = 'info';
  private _label = '';

  static override styles = [
    lessDesignTokens,
    css`
      :host {
        display: block;
      }
      .callout {
        padding: 1rem 1.25rem;
        margin: 1rem 0;
        border-left: 3px solid var(--less-brand, #534AB7);
        background: var(--less-brand-subtle, rgba(83,74,183,0.06));
        border-radius: 0 var(--less-radius-md, 8px) var(--less-radius-md, 8px) 0;
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
        color: var(--less-text-primary);
      }
      .callout-body {
        font-size: 0.9375rem;
        line-height: 1.75;
        color: var(--less-text-secondary);
      }
      .callout-body ::slotted(p) {
        margin: 0;
      }
    `,
  ];

  /** Callout type — determines color scheme and icon */
  get type(): 'info' | 'warning' | 'danger' | 'tip' {
    return this._type;
  }
  set type(val: 'info' | 'warning' | 'danger' | 'tip') {
    this._type = val;
    this.requestUpdate();
  }

  /** Optional label text (callout heading) */
  get label(): string {
    return this._label;
  }
  set label(val: string) {
    this._label = val;
    this.requestUpdate();
  }

  override render() {
    const config = TYPE_CONFIG[this._type] || TYPE_CONFIG.info;
    return html`
      <div
        class="callout"
        style="border-left-color: ${config.borderColor}; background: ${config.bgColor};"
      >
        ${this._label
          ? html`
            <div class="callout-header">
              <span class="callout-icon">${config.icon}</span>
              <span class="callout-title">${this._label}</span>
            </div>
          `
          : ''}
        <div class="callout-body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) {
  customElements.define(tagName, LessCallout);
}

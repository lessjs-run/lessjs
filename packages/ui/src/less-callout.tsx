/** @jsxImportSource @lessjs/core */
/**
 * @lessjs/ui - LessCallout Component
 *
 * Callout/notice box for inline documentation alerts.
 * Supports 4 types: info, warning, danger, tip.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
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

import { DsdElement } from '@lessjs/core';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { _esc } from './shared/escape.js';

export const tagName = 'less-callout';

const TYPE_CONFIG: Record<string, { borderColor: string; bgColor: string; icon: string }> = {
  info: {
    borderColor: 'var(--brand)',
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

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }
  .callout {
    padding: var(--size-3) var(--size-4);
    margin: var(--size-3) 0;
    border-left: var(--border-size-2) solid var(--brand);
    background: rgba(83,74,183,0.06);
    border-radius: 0 var(--radius-2) var(--radius-2) 0;
  }
  .callout-header {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    margin-bottom: var(--size-1);
  }
  .callout-icon {
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-1);
    flex-shrink: 0;
  }
  .callout-title {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-6);
    color: var(--gray-9);
  }
  .callout-body {
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-4);
    color: var(--gray-7);
  }
  .callout-body ::slotted(p) {
    margin: 0;
  }
`);

export class LessCallout extends DsdElement {
  static override styles = [sheet];
  static override observedAttributes = ['type', 'label'];

  override render(): ReturnType<typeof DsdElement.prototype.render> {
    const type = this.getAttribute('type') || 'info';
    const label = this.getAttribute('label') || '';
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

    return (
      <div
        className='callout'
        part='container'
        style={`border-left-color:${config.borderColor};background:${config.bgColor};`}
      >
        {label && (
          <div className='callout-header'>
            <span className='callout-icon' part='icon'>{config.icon}</span>
            <span className='callout-title'>{this._esc(label)}</span>
          </div>
        )}
        <div className='callout-body' part='content'>
          <slot></slot>
        </div>
      </div>
    );
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM(): void {
    this.update();
  }

  private _esc = _esc;
}

export default LessCallout;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessCallout);
}

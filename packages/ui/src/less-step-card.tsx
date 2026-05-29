/**
 * @lessjs/ui - LessStepCard Component
 *
 * Step card with numbered indicator and label.
 * Used in Quick Start sections and Getting Started guides.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart container -The step card wrapper
 * @csspart indicator -The step number circle
 * @csspart title -The step label heading
 * @csspart description -The step description paragraph
 * @csspart content -The slot content area
 *
 * Usage:
 * ```html
 * <less-step-card step="1" label="Create">
 *   deno run -A jsr:@lessjs/create my-app
 * </less-step-card>
 * ```
 */

import { DsdElement } from '@lessjs/core';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { _esc } from './shared/escape.js';

export const tagName = 'less-step-card';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }
  .step-card {
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2, 8px);
    padding: 1.25rem;
    background: var(--gray-1);
    position: relative;
    border-top: 2px solid var(--brand, #534AB7);
  }
  .step-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .step-number {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-round);
    background: var(--brand, #534AB7);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--gray-5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .step-body {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--gray-9);
  }
  .step-body ::slotted(code) {
    font-family: var(--font-mono, "SF Mono", "Fira Code", Consolas, monospace);
    font-size: 12.5px;
    color: var(--gray-9);
  }
`);

export class LessStepCard extends DsdElement {
  static override styles = [sheet];
  static override observedAttributes = ['step', 'label', 'description', 'status'];

  override render(): ReturnType<typeof DsdElement.prototype.render> {
    const step = parseInt(this.getAttribute('step') || '1', 10);
    const label = this.getAttribute('label') || '';
    const description = this.getAttribute('description') || '';

    return (
      <div className='step-card' part='container'>
        <div className='step-header'>
          <span className='step-number' part='indicator'>{step}</span>
          <span className='step-label' part='title'>{this._esc(label)}</span>
        </div>
        {description && (
          <p
            part='description'
            style='margin:0 0 10px;color:var(--gray-7);font-size:0.875rem;'
          >
            {this._esc(description)}
          </p>
        )}
        <div className='step-body' part='content'>
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

export default LessStepCard;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessStepCard);
}

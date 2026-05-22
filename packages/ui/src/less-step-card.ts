/**
 * @lessjs/ui - LessStepCard Component
 *
 * Step card with numbered indicator and label.
 * Used in Quick Start sections and Getting Started guides.
 *
 * Usage:
 * ```html
 * <less-step-card step="1" label="Create">
 *   deno run -A jsr:@lessjs/create my-app
 * </less-step-card>
 * ```
 *
 * Technical: Uses private _step/_label + requestUpdate() pattern
 * because Rolldown does not correctly transpile @property() decorators.
 */
import { css, html, type CSSResultGroup } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-step-card';

export class LessStepCard extends DsdLitElement {
  private _step = 1;
  private _label = '';

  static override styles: CSSResultGroup = [
    lessDesignTokens,
    css`
      :host {
        display: block;
      }
      .step-card {
        border: 0.5px solid var(--less-border);
        border-radius: var(--less-radius-md, 8px);
        padding: 1.25rem;
        background: var(--less-bg-surface);
        position: relative;
        border-top: 2px solid var(--less-brand, #534ab7);
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
        border-radius: var(--less-radius-full, 9999px);
        background: var(--less-brand, #534ab7);
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
        color: var(--less-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .step-body {
        font-size: 0.9375rem;
        line-height: 1.6;
        color: var(--less-text-primary);
      }
      .step-body ::slotted(code) {
        font-family: var(--less-font-mono, "SF Mono", "Fira Code", Consolas, monospace);
        font-size: 12.5px;
        color: var(--less-text-primary);
      }
    `,
  ];

  /** Step number */
  get step(): number {
    return this._step;
  }
  set step(val: number) {
    this._step = val;
    this.requestUpdate();
  }

  /** Step label text */
  get label(): string {
    return this._label;
  }
  set label(val: string) {
    this._label = val;
    this.requestUpdate();
  }

  override render(): unknown {
    return html`
      <div class="step-card">
        <div class="step-header">
          <span class="step-number">${this._step}</span>
          <span class="step-label">${this._label}</span>
        </div>
        <div class="step-body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) {
  customElements.define(tagName, LessStepCard);
}

/**
 * Counter Island - Interactive Component
 *
 * I 约束演示：
 * - Shadow DOM 封装
 * - 客户端升级
 * - 独立 JS bundle
 */
import { css, html, LitElement } from 'lit';

export const tagName = 'counter-island';

export default class CounterIsland extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .counter {
      display: inline-flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--border, #ddd);
      border-radius: var(--radius, 8px);
      overflow: hidden;
      background: var(--bg-base, #fff);
    }
    .count {
      font-size: 1.5rem;
      font-weight: 700;
      min-width: 3.5rem;
      text-align: center;
      color: var(--text-primary, inherit);
      padding: 0.35rem 0.75rem;
      border-left: 1px solid var(--border, #ddd);
      border-right: 1px solid var(--border, #ddd);
      background: var(--bg-surface, #f5f5f5);
    }
    button {
      background: transparent;
      color: var(--text-secondary, #666);
      border: none;
      border-radius: 0;
      padding: 0.4rem 0.85rem;
      font-size: 1.15rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      line-height: 1;
      min-width: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button:hover {
      background: var(--brand-subtle, #f0f0f0);
      color: var(--text-primary, inherit);
    }
    button:active {
      background: var(--bg-hover, #e8e8e8);
      transform: scale(0.97);
    }
  `;

  static override properties = {
    count: { type: Number },
  };

  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  override render() {
    return html`
      <div class="counter">
        <button aria-label="Decrease count" @click="${() => this.count--}">−</button>
        <span class="count">${this.count}</span>
        <button aria-label="Increase count" @click="${() => this.count++}">+</button>
      </div>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, CounterIsland);
} catch { /* already defined */ }

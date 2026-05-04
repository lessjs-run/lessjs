/**
 * Counter Island — Interactive Component
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
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .count {
      font-size: 2rem;
      font-weight: 700;
      min-width: 3rem;
      text-align: center;
      color: var(--kiss-text-primary, inherit);
    }
    button {
      background: var(--kiss-bg-elevated, #111);
      color: var(--kiss-text-primary, #fff);
      border: 1px solid var(--kiss-border, transparent);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    button:hover {
      opacity: 0.85;
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
  `;

  static override properties = {
    count: { type: Number },
  };

  count = 0;

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

customElements.define(tagName, CounterIsland);

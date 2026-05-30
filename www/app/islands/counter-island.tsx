/**
 * Counter Island — DsdElement + Signals (v0.21 Reactive DSD)
 *
 * The simplest possible Reactive DSD demo:
 * zero framework runtime, pure DSD + Signals.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Replaced LitElement with DsdElement:
 *   - Styles: StyleSheet (SSR-safe, adoptedStyleSheets)
 *   - Template: JSX from @lessjs/core
 *   - State: signal() from @lessjs/signals
 *   - Events: onClick declarative bindings
 */
import { DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';

export const tagName = 'counter-island';

const counterStyles = new StyleSheet();
counterStyles.replaceSync(`
  :host {
    display: block;
  }
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 0;
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-3);
    overflow: hidden;
    background: var(--gray-0);
  }
  .count {
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-7);
    min-width: 3.5rem;
    text-align: center;
    color: var(--text-primary);
    padding: var(--size-1) var(--size-3);
    border-left: var(--border-size-1) solid var(--gray-3);
    border-right: var(--border-size-1) solid var(--gray-3);
    background: var(--gray-1);
  }
  button {
    background: transparent;
    color: var(--text-secondary);
    border: none;
    border-radius: 0;
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    line-height: var(--font-lineheight-1);
    min-width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  button:hover {
    background: var(--gray-2);
    color: var(--text-primary);
  }
  button:active {
    background: var(--gray-3);
    transform: scale(0.97);
  }
`);

export default class CounterIsland extends DsdElement {
  static override styles = counterStyles;

  #count = signal(0);

  override render() {
    return (
      <div className='counter'>
        <button type='button' aria-label='Decrease count' onClick={() => this.#count.value--}>
          −
        </button>
        <span className='count'>{this.#count}</span>
        <button type='button' aria-label='Increase count' onClick={() => this.#count.value++}>
          +
        </button>
      </div>
    );
  }
}

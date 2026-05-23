/**
 * Reactive DSD Showcase — DsdElement + Signals (v0.21)
 *
 * Demonstrates three core Reactive DSD patterns:
 *   1. Counter with signal() — fine-grained reactivity
 *   2. Theme toggle with signal() — attribute/property binding
 *   3. Live filter with signal() — computed display
 *
 * Zero framework runtime — pure DSD + Signals.
 * Replaces Lit Island pattern with Ocean (DsdElement) reactivity.
 */
import { computed, DsdElement, html, signal, StyleSheet } from '@lessjs/core';

export const tagName = 'reactive-showcase';

const showcaseStyles = new StyleSheet();
showcaseStyles.replaceSync(`
  :host { display: block; }
  .showcase { display: flex; flex-direction: column; gap: var(--size-4); }
  .card {
    padding: var(--size-4);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
  }
  .card h3 { margin: 0 0 var(--size-2); font-size: var(--font-size-1); }
  .card p { margin: 0 0 var(--size-2); color: var(--gray-6); font-size: var(--font-size-00); }

  /* Counter */
  .counter-row { display: inline-flex; align-items: center; gap: var(--size-2); }
  .counter-row span { font-size: var(--font-size-3); font-weight: 700; min-width: 3rem; text-align: center; }
  .counter-row button {
    width: 2.5rem; height: 2.5rem; border: 1px solid var(--gray-4); border-radius: var(--radius-round);
    background: var(--gray-0); font-size: var(--font-size-2); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: background 0.15s;
  }
  .counter-row button:hover { background: var(--gray-2); }

  /* Theme */
  .theme-preview {
    padding: var(--size-4); border-radius: var(--radius-2); transition: 0.3s;
  }
  .theme-preview.light { background: #fff; color: #111; border: 1px solid #ddd; }
  .theme-preview.dark  { background: #1a1a2e; color: #eee; border: 1px solid #333; }
  .theme-preview button {
    padding: var(--size-1) var(--size-3); border: none; border-radius: var(--radius-1);
    cursor: pointer; font-size: var(--font-size-00); font-weight: 600;
  }
  .theme-preview.light button { background: #111; color: #fff; }
  .theme-preview.dark  button { background: #eee; color: #111; }

  /* Filter */
  .filter-input {
    width: 100%; padding: var(--size-2) var(--size-3); border: 1px solid var(--gray-4);
    border-radius: var(--radius-1); font-size: var(--font-size-00); box-sizing: border-box;
  }
  .filter-input:focus { outline: 2px solid var(--brand, #3b82f6); outline-offset: -1px; }
  .item-list { margin-top: var(--size-2); display: flex; flex-direction: column; gap: var(--size-1); }
  .item-list div {
    padding: var(--size-1) var(--size-2); border-radius: var(--radius-1);
    background: var(--gray-1); font-size: var(--font-size-00);
  }
`);

const FRAMEWORKS = [
  'LessJS',
  'Astro',
  'Fresh',
  'Next.js',
  'Nuxt',
  'SvelteKit',
  'Remix',
  'Qwik',
  'SolidStart',
  'Enhance',
  'Hono',
  'Eleventy',
];

export default class ReactiveShowcase extends DsdElement {
  static override styles = showcaseStyles;

  #count = signal(0);
  #isDark = signal(false);
  #filter = signal('');
  #filtered = computed(() =>
    FRAMEWORKS.filter((f) => f.toLowerCase().includes(this.#filter.value.toLowerCase()))
  );

  override render() {
    return html`
      <div class="showcase">
        <!-- Counter: signal + fine-grained binding -->
        <div class="card">
          <h3>Signal Counter</h3>
          <p>A single <code>signal(0)</code> drives this counter. No Lit, no React, no framework.</p>
          <div class="counter-row">
            <button @click="${() => this.#count.value--}">−</button>
            <span>${this.#count}</span>
            <button @click="${() => this.#count.value++}">+</button>
          </div>
        </div>

        <!-- Theme: signal + conditional binding -->
        <div class="card">
          <h3>Theme Preview</h3>
          <p>
            One <code>signal(false)</code> controls the entire component theme. Reactive attribute
            binding.
          </p>
          <div class="theme-preview ${this.#isDark}">
            <p>Current theme: <strong>${this.#isDark}</strong></p>
            <button @click="${() => this.#isDark.value = !this.#isDark.value}">
              Toggle ${this.#isDark}
            </button>
          </div>
        </div>

        <!-- Filter: signal + computed -->
        <div class="card">
          <h3>Live Filter (<code>computed</code>)</h3>
          <p>A <code>computed()</code> signal filters a list in real-time. Zero DOM diffing overhead.</p>
          <input
            class="filter-input"
            placeholder="Type to filter frameworks..."
            .value="${this.#filter}"
            @input="${(e) => this.#filter.value = e.target.value}"
          >
          <div class="item-list">
            ${this.#filtered.value.map((f) =>
              html`
                <div>${f}</div>
              `
            )}
          </div>
        </div>
      </div>
    `;
  }
}

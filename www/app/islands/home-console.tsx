import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { effect, signal } from '@lessjs/signals';
import { consumeContext } from '@lessjs/core';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { THEME_CTX } from '@lessjs/ui/less-layout';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .panel { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: var(--radius-2); overflow: hidden; }
  .rp-header { display: flex; align-items: center; justify-content: space-between; padding: var(--size-2) var(--size-3); background: var(--bg-surface); border-bottom: 0.5px solid var(--border); }
  .rp-title { font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-7); color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
  .pane { padding: var(--size-6) var(--size-4); }
  .pane.hidden { display: none; }
  .counter-row { display: flex; align-items: center; justify-content: center; gap: var(--size-4); }
  .counter-btn {
    display: flex; align-items: center; justify-content: center;
    width: var(--size-8); height: var(--size-8);
    border: 0.5px solid var(--border); border-radius: var(--radius-2);
    background: var(--bg-surface); color: var(--text-muted);
    font-size: var(--font-size-3); font-weight: var(--font-weight-6);
    cursor: pointer; transition: all var(--ease-3) var(--duration-2);
    display: flex; align-items: center; justify-content: center;
  }
  .counter-btn:hover { color: var(--text-primary); background: var(--bg-hover); border-color: var(--brand); }
  .counter-value {
    padding: 0 var(--size-7);
    font-size: var(--font-size-5); font-weight: var(--font-weight-9);
    color: var(--text-primary); font-variant-numeric: tabular-nums;
    min-width: 60px; text-align: center;
  }
  .counter-caption {
    font-family: var(--font-mono); font-size: var(--font-size-00);
    color: var(--text-muted); text-align: center; margin-top: var(--size-4);
  }
  .counter-caption b { color: var(--brand); font-weight: var(--font-weight-7); }
  @media (max-width: 640px) {
    .rp-tab { padding: var(--size-1) var(--size-3); font-size: var(--font-size-00); }
  }
`);

export default class HomeConsole extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];
  #count = signal(42);

  override connectedCallback() {
    super.connectedCallback();
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));

    // v0.27 (ADR-0065): Signal→DOM binding via framework effect API.
    // DSD hydration (_walkAndBind inside effectScope) creates effects
    // that need to survive the scope. This direct binding guarantees
    // the counter textContent updates when the signal changes.
    effect(() => {
      const el = this.shadowRoot?.querySelector('.counter-value');
      if (el) (el as HTMLElement).textContent = String(this.#count.value);
    });
  }

  override render() {
    return (
      <div class='panel'>
        <div class='rp-header'>
          <span class='rp-title'>HYPER-GRAPH ENGINE</span>
        </div>
        <div class='pane'>
          <div class='counter-row'>
            <button
              type='button'
              class='counter-btn'
              onClick={() => this.#count.value = this.#count.value - 1}
            >
              -
            </button>
            <span class='counter-value' textContent={this.#count}></span>
            <button
              type='button'
              class='counter-btn'
              onClick={() => this.#count.value = this.#count.value + 1}
            >
              +
            </button>
          </div>
          <p class='counter-caption'>
            <b>METRICS</b> — packages verified: <b textContent={this.#count}></b>
          </p>
        </div>
      </div>
    );
  }
}

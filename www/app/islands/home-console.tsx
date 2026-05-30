/**
 * Home Console Island — Signal-driven Graph/Counter panel.
 *
 * Showcases LessJS framework: signal(), effect(), DSD hydration, Open Props.
 * Zero hardcoded CSS — all layout, typography, spacing via Open Props tokens.
 */
import { DsdElement } from '@lessjs/core';
import { computed, signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { consumeContext } from '@lessjs/core/signal-context';
import { THEME_CTX } from '@lessjs/ui/less-layout';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

export const tagName = 'home-console';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .panel {
    border: var(--border-size-1) solid var(--border-bright);
    border-radius: var(--radius-3);
    background: var(--bg-panel);
    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .rp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--size-3) var(--size-5);
    background: var(--bg-panel);
    border-bottom: var(--border-size-1) solid var(--border-bright);
  }
  .rp-title { font-size: var(--font-size-0); font-weight: var(--font-weight-9); color: var(--text-primary); }
  .rp-tabs { display: flex; gap: var(--size-2); }
  .rp-tab {
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-round);
    border: var(--border-size-1) solid transparent;
    background: transparent;
    color: var(--brand-neon);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    cursor: pointer;
    transition: all var(--ease-3) var(--duration-2);
  }
  .rp-tab.active {
    background: var(--brand-neon); color: var(--gray-12);
    border-color: var(--brand-neon);
    box-shadow: 0 0 12px var(--brand-glow);
  }
  .rp-tab:hover:not(.active) { border-color: var(--brand-neon); }
  .pane { padding: var(--size-4) var(--size-5); }
  .pane.hidden { display: none; }
  .island-badge {
    display: inline-flex; align-items: center; gap: var(--size-2);
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-1);
    border: var(--border-size-1) solid rgba(0,255,135,0.2);
    background: rgba(0,255,135,0.08);
    margin-bottom: var(--size-4);
  }
  .island-dot {
    width: 6px; height: 6px;
    background: var(--cyber-green);
    border-radius: var(--radius-round);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 0.6; box-shadow: 0 0 4px var(--cyber-green); }
    50% { opacity: 1; box-shadow: 0 0 10px var(--cyber-green); }
  }
  .island-label {
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    color: var(--cyber-green);
  }
  .counter-body {
    display: flex; flex-direction: column; align-items: center;
    gap: var(--size-4);
  }
  .counter-box {
    display: inline-flex; align-items: center;
    border: var(--border-size-2) solid var(--brand-neon);
    border-radius: var(--radius-round);
    background: var(--bg-base);
    box-shadow: 0 0 16px var(--brand-glow);
    overflow: hidden;
  }
  .counter-btn {
    width: 40px; height: 40px; border: none;
    background: var(--gray-1); color: var(--text-muted);
    font-size: var(--font-size-3); font-weight: var(--font-weight-8);
    cursor: pointer; transition: color var(--ease-3) var(--duration-2);
    border-radius: var(--radius-round);
    display: flex; align-items: center; justify-content: center;
  }
  .counter-btn:hover { color: var(--text-primary); }
  .counter-value {
    padding: 0 var(--size-7);
    font-size: var(--font-size-5); font-weight: var(--font-weight-9);
    color: var(--text-primary); font-variant-numeric: tabular-nums;
    min-width: 60px; text-align: center;
  }
  .counter-caption {
    font-family: var(--font-mono); font-size: var(--font-size-00);
    color: var(--text-muted); text-align: center;
  }
  .counter-caption b { color: var(--brand-neon); font-weight: var(--font-weight-7); }
  @media (max-width: 640px) {
    .rp-tab { padding: var(--size-1) var(--size-3); font-size: var(--font-size-00); }
  }
`);

export default class HomeConsole extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];
  #activeTab = signal<'graph' | 'counter'>('graph');
  #count = signal(42);

  // v0.26.1 (ADR-0058/0059): Computed signals replace effect()+update().
  // applyProps detects signal-valued props; renderToDom binds signal children.
  #graphPaneClass = computed(() => `pane${this.#activeTab.value === 'graph' ? '' : ' hidden'}`);
  #counterPaneClass = computed(() => `pane${this.#activeTab.value === 'counter' ? '' : ' hidden'}`);
  #graphTabClass = computed(() => `rp-tab${this.#activeTab.value === 'graph' ? ' active' : ''}`);
  #counterTabClass = computed(() =>
    `rp-tab${this.#activeTab.value === 'counter' ? ' active' : ''}`
  );
  #tabTitle = computed(() =>
    this.#activeTab.value === 'graph' ? 'HYPER-GRAPH ENGINE' : 'LIVE COMPONENT PREVIEW'
  );

  override connectedCallback() {
    super.connectedCallback();
    // SignalContext: auto-sync theme from less-layout provider
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));
    // v0.26.1: effect()+update() removed — computed signals handled by
    // applyProps (class) + renderToDom (text children) auto-binding.
  }

  override render() {
    return (
      <div class='panel'>
        <div class='rp-header'>
          <span class='rp-title'>{this.#tabTitle}</span>
          <div class='rp-tabs'>
            <span
              class={this.#graphTabClass}
              onClick={() => this.#activeTab.value = 'graph'}
            >
              LIVE MAP
            </span>
            <span
              class={this.#counterTabClass}
              onClick={() => this.#activeTab.value = 'counter'}
            >
              METRICS
            </span>
          </div>
        </div>
        <div class={this.#graphPaneClass}>
          <svg
            viewBox='0 0 432 220'
            xmlns='http://www.w3.org/2000/svg'
            style='display:block;width:100%;height:auto;border:var(--border-size-1) solid var(--border-futuristic);border-radius:var(--radius-2);background:var(--bg-terminal)'
          >
            <rect width='432' height='220' rx='6' fill='var(--bg-terminal)' />
            <circle
              cx='216'
              cy='110'
              r='28'
              fill='none'
              stroke='#7C6FF5'
              stroke-width='2'
              opacity='0.9'
            />
            <circle cx='216' cy='110' r='28' fill='rgba(124,111,245,0.12)' />
            <text
              x='216'
              y='114'
              font-family='JetBrains Mono,monospace'
              font-weight='900'
              font-size='11'
              fill='#FFFFFF'
              text-anchor='middle'
            >
              @core
            </text>
            <circle
              cx='216'
              cy='110'
              r='75'
              fill='none'
              stroke='rgba(124,111,245,0.08)'
              stroke-width='1.5'
              stroke-dasharray='4 8'
            />
            <circle cx='216' cy='35' r='16' fill='#05070B' stroke='#60EFFF' stroke-width='1.5' />
            <text
              x='216'
              y='39'
              font-family='JetBrains Mono,monospace'
              font-weight='700'
              font-size='8.5'
              fill='#E9ECEF'
              text-anchor='middle'
            >
              rt
            </text>
            <line
              x1='216'
              y1='51'
              x2='216'
              y2='82'
              stroke='rgba(96,239,255,0.4)'
              stroke-width='1'
              stroke-dasharray='2 2'
            />
            <circle cx='141' cy='110' r='16' fill='#05070B' stroke='#00FF87' stroke-width='1.5' />
            <text
              x='141'
              y='114'
              font-family='JetBrains Mono,monospace'
              font-weight='700'
              font-size='8.5'
              fill='#E9ECEF'
              text-anchor='middle'
            >
              sig
            </text>
            <line
              x1='157'
              y1='110'
              x2='188'
              y2='110'
              stroke='rgba(0,255,135,0.4)'
              stroke-width='1'
            />
            <circle cx='291' cy='110' r='16' fill='#05070B' stroke='#7C6FF5' stroke-width='1.5' />
            <text
              x='291'
              y='114'
              font-family='JetBrains Mono,monospace'
              font-weight='700'
              font-size='8.5'
              fill='#E9ECEF'
              text-anchor='middle'
            >
              css
            </text>
            <line
              x1='275'
              y1='110'
              x2='244'
              y2='110'
              stroke='rgba(124,111,245,0.4)'
              stroke-width='1'
            />
            <circle cx='216' cy='185' r='16' fill='#05070B' stroke='#FB7185' stroke-width='1.5' />
            <text
              x='216'
              y='189'
              font-family='JetBrains Mono,monospace'
              font-weight='700'
              font-size='8.5'
              fill='#E9ECEF'
              text-anchor='middle'
            >
              vite
            </text>
            <line
              x1='216'
              y1='169'
              x2='216'
              y2='138'
              stroke='rgba(251,113,133,0.4)'
              stroke-width='1'
            />
            <rect
              x='12'
              y='12'
              width='100'
              height='34'
              rx='4'
              fill='#05070B'
              fill-opacity='0.8'
              stroke='rgba(124,111,245,0.16)'
              stroke-width='1'
            />
            <text x='20' y='24' font-family='JetBrains Mono,monospace' font-size='9' fill='#8E92A2'>
              GRAPH NODES
            </text>
            <text
              x='20'
              y='39'
              font-family='SF Pro Display,system-ui,sans-serif'
              font-weight='800'
              font-size='13'
              fill='#00FF87'
            >
              18 NODES
            </text>
            <rect
              x='320'
              y='12'
              width='100'
              height='34'
              rx='4'
              fill='#05070B'
              fill-opacity='0.8'
              stroke='rgba(124,111,245,0.16)'
              stroke-width='1'
            />
            <text
              x='328'
              y='24'
              font-family='JetBrains Mono,monospace'
              font-size='9'
              fill='#8E92A2'
            >
              CYCLES GATE
            </text>
            <text
              x='328'
              y='39'
              font-family='SF Pro Display,system-ui,sans-serif'
              font-weight='800'
              font-size='13'
              fill='#00FF87'
            >
              0 CYCLES
            </text>
          </svg>
        </div>
        <div class={this.#counterPaneClass}>
          <div class='island-badge'>
            <span class='island-dot'></span>
            <span class='island-label'>ISLAND: ACTIVE</span>
          </div>
          <div class='counter-body'>
            <div class='counter-box'>
              <button type='button' class='counter-btn' onClick={() => this.#count.value--}>
                −
              </button>
              <span class='counter-value'>{this.#count}</span>
              <button type='button' class='counter-btn' onClick={() => this.#count.value++}>
                +
              </button>
            </div>
            <p class='counter-caption'>
              State mutated via <b>signal.value</b>. Renders: 1
            </p>
          </div>
        </div>
      </div>
    );
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, HomeConsole);

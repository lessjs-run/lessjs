/**
 * Home Console Island — Signal-driven Graph/Counter panel.
 *
 * Showcases: signal(), effect(), DSD hydration, island architecture.
 * Pure DsdElement + @lessjs/signals. Zero vanilla DOM.
 */
import { DsdElement } from '@lessjs/core';
import { effect, signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

export const tagName = 'home-console';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .panel {
    border: 0.5px solid var(--border-bright, rgba(124,111,245,0.4));
    border-radius: 10px; background: var(--bg-panel, #090B11); overflow: hidden;
    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  }
  .rp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; background: var(--bg-panel, #090B11);
    border-bottom: 0.5px solid var(--border-bright, rgba(124,111,245,0.4));
  }
  .rp-title { font-size: 0.8rem; font-weight: 900; color: var(--text-primary, #FFFFFF); }
  .rp-tabs { display: flex; gap: 6px; }
  .rp-tab {
    padding: 5px 14px; border-radius: 14px; border: 0.5px solid transparent;
    background: transparent; color: var(--brand-neon, #7C6FF5);
    font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
  }
  .rp-tab.active {
    background: var(--brand-neon, #7C6FF5); color: #FFFFFF;
    border-color: var(--brand-neon, #7C6FF5); box-shadow: 0 0 12px rgba(124,111,245,0.3);
  }
  .rp-tab:hover:not(.active) { border-color: var(--brand-neon, #7C6FF5); }
  .rp-graph { padding: 16px 20px; }
  .rp-graph.hidden { display: none; }
  .counter-pane { padding: 20px; }
  .counter-pane.hidden { display: none; }
  .island-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px;
    border-radius: 4px; border: 0.5px solid rgba(0,255,135,0.2);
    background: rgba(0,255,135,0.08); margin-bottom: 16px;
  }
  .island-dot {
    width: 6px; height: 6px; background: var(--cyber-green, #00FF87);
    border-radius: 50%; animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 0.6; box-shadow: 0 0 4px var(--cyber-green, #00FF87); }
    50% { opacity: 1; box-shadow: 0 0 10px var(--cyber-green, #00FF87); }
  }
  .island-label {
    font-family: "JetBrains Mono", monospace; font-size: 0.6rem;
    font-weight: 700; color: var(--cyber-green, #00FF87);
  }
  .counter-body { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .counter-box {
    display: inline-flex; align-items: center; gap: 0;
    border: 2px solid var(--brand-neon, #7C6FF5); border-radius: 30px;
    background: #080A0F; box-shadow: 0 0 16px rgba(124,111,245,0.2); overflow: hidden;
  }
  .counter-btn {
    width: 40px; height: 40px; border: none; background: #12151D;
    color: var(--text-muted, #515466); font-size: 1.2rem; font-weight: 800;
    cursor: pointer; transition: color 0.2s ease; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .counter-btn:hover { color: var(--text-primary, #FFFFFF); }
  .counter-value {
    padding: 0 28px; font-size: 1.6rem; font-weight: 900;
    color: var(--text-primary, #FFFFFF); font-variant-numeric: tabular-nums;
    min-width: 60px; text-align: center;
  }
  .counter-caption {
    font-family: "JetBrains Mono", monospace; font-size: 0.68rem;
    color: var(--text-muted, #515466); text-align: center;
  }
  .counter-caption b { color: var(--brand-neon, #7C6FF5); font-weight: 700; }
  @media (max-width: 640px) {
    .rp-tab { padding: 4px 12px; font-size: 0.65rem; }
  }
`);

export default class HomeConsole extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  #activeTab = signal<'graph' | 'counter'>('graph');
  #count = signal(42);

  override connectedCallback() {
    super.connectedCallback();
    effect(() => {
      void this.#activeTab.value;
      void this.#count.value;
      this.update();
    });
  }

  private _switchTab(tab: 'graph' | 'counter') {
    this.#activeTab.value = tab;
  }
  private _inc() {
    this.#count.value++;
  }
  private _dec() {
    this.#count.value--;
  }

  override render() {
    const activeTab = this.#activeTab.value;
    const count = this.#count.value;

    return (
      <div class='panel'>
        <div class='rp-header'>
          <span class='rp-title'>
            {activeTab === 'graph' ? 'HYPER-GRAPH ENGINE' : 'LIVE COMPONENT PREVIEW'}
          </span>
          <div class='rp-tabs'>
            <span
              class={`rp-tab${activeTab === 'graph' ? ' active' : ''}`}
              onClick={() => this._switchTab('graph')}
            >
              LIVE MAP
            </span>
            <span
              class={`rp-tab${activeTab === 'counter' ? ' active' : ''}`}
              onClick={() => this._switchTab('counter')}
            >
              METRICS
            </span>
          </div>
        </div>

        <div class={`rp-graph${activeTab === 'graph' ? '' : ' hidden'}`}>
          <svg
            viewBox='0 0 432 220'
            xmlns='http://www.w3.org/2000/svg'
            style='display:block;width:100%;height:auto;border:0.5px solid rgba(124,111,245,0.16);border-radius:8px;background:#010204'
          >
            <rect width='432' height='220' rx='6' fill='#010204' />
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

        <div class={`counter-pane${activeTab === 'counter' ? '' : ' hidden'}`}>
          <div class='island-badge'>
            <span class='island-dot'></span>
            <span class='island-label'>ISLAND: ACTIVE</span>
          </div>
          <div class='counter-body'>
            <div class='counter-box'>
              <button class='counter-btn' onClick={() => this._dec()}>−</button>
              <span class='counter-value'>{count}</span>
              <button class='counter-btn' onClick={() => this._inc()}>+</button>
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

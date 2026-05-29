/**
 * Homepage — Neo-Swiss Hyper-Dark v0.26.
 *
 * Showcases LessJS framework: DSD rendering, Signal reactivity,
 * Island architecture. Pure DsdElement + @lessjs/signals.
 */
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from '@lessjs/content/nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';
import '../../islands/less-search.tsx';
import '../../islands/home-console.tsx';

export const tagName = 'docs-home';

const heroSheet = new StyleSheet();
heroSheet.replaceSync(`
  .swiss-grid {
    min-height: 100vh;
    background: linear-gradient(180deg, #040508 0%, #0B0D13 100%);
    color: #FFFFFF;
  }
  .swiss-grid::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 100px);
  }
  .hero { position: relative; z-index: 1; }
  .hero-inner {
    max-width: 1200px; margin: 0 auto; padding: 32px 80px 0;
    display: grid; grid-template-columns: 1fr 480px; gap: 40px; align-items: start;
  }
  .hero-left { padding-top: 40px; }
  .eyebrow {
    font-family: "JetBrains Mono", monospace; font-size: 0.625rem; font-weight: 700;
    color: var(--cyber-green, #00FF87); letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 24px;
  }
  .giant-headline {
    margin: 0; font-family: "SF Pro Display", -apple-system, sans-serif;
    font-weight: 900; font-size: clamp(3.5rem, 8vw, 5.5rem); line-height: 0.92; letter-spacing: -0.05em; color: #FFFFFF;
  }
  .glow-line {
    background: linear-gradient(135deg, #7C6FF5, #B166FA);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: core-glow 3s ease-in-out infinite alternate;
  }
  @keyframes core-glow {
    0% { filter: drop-shadow(0 0 12px rgba(124,111,245,0.3)); }
    100% { filter: drop-shadow(0 0 28px rgba(124,111,245,0.6)); }
  }
  .hero-desc {
    margin: 28px 0 0; max-width: 520px; font-size: 0.95rem;
    line-height: 1.72; color: var(--text-secondary, #8E92A2);
  }
  .laser-line {
    margin: 28px 0 0; height: 3px;
    background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(96,239,255,0.5) 40%, rgba(96,239,255,0.5) 60%, rgba(255,255,255,0.06));
    border-radius: 2px; position: relative;
  }
  .laser-dot {
    position: absolute; right: 40%; top: -3px; width: 8px; height: 8px;
    background: var(--laser-cyan, #60EFFF); border-radius: 50%;
    box-shadow: 0 0 12px rgba(96,239,255,0.6); animation: laser-pulse 2s infinite;
  }
  @keyframes laser-pulse {
    0%,100% { box-shadow: 0 0 8px rgba(96,239,255,0.4); }
    50% { box-shadow: 0 0 20px rgba(96,239,255,0.8); }
  }
  .laser-label {
    margin-top: 6px; font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem; color: var(--cyber-green, #00FF87); text-align: right;
  }
  .terminal {
    margin-top: 28px; border: 0.5px solid var(--border-futuristic, rgba(124,111,245,0.16));
    border-radius: 8px; background: var(--bg-terminal, #010204); overflow: hidden; max-width: 520px;
  }
  .terminal-head {
    display: flex; align-items: center; gap: 6px; padding: 10px 14px;
    background: #080A0E; border-bottom: 0.5px solid rgba(124,111,245,0.12);
    font-family: "JetBrains Mono", monospace; font-size: 0.65rem; color: var(--text-muted, #515466);
  }
  .term-dot { width: 8px; height: 8px; border-radius: 50%; }
  .term-dot.r { background: #EF4444; }
  .term-dot.y { background: #F59E0B; }
  .term-dot.g { background: #10B981; }
  .terminal-body {
    padding: 16px; font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem; line-height: 1.7; color: var(--text-secondary, #8E92A2);
  }
  .term-line { display: flex; white-space: pre; }
  .term-prefix { color: #7C6FF5; }
  .term-cmd { color: #E9ECEF; }
  .term-info { color: #8E92A2; }
  .term-ok { color: #00FF87; text-shadow: 0 0 6px rgba(0,255,135,0.3); }
  .term-gate { color: #60EFFF; }
  .right-panel {
    border: 0.5px solid var(--border-bright, rgba(124,111,245,0.4));
    border-radius: 10px; background: var(--bg-panel, #090B11); overflow: hidden;
    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  }
  .rp-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; background: var(--bg-panel, #090B11);
    border-bottom: 0.5px solid var(--border-bright, rgba(124,111,245,0.4));
  }
  .rp-title { font-size: 0.8rem; font-weight: 900; color: #FFFFFF; }
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
  .counter-btn:hover { color: #FFFFFF; }
  .counter-value {
    padding: 0 28px; font-size: 1.6rem; font-weight: 900;
    color: #FFFFFF; font-variant-numeric: tabular-nums; min-width: 60px; text-align: center;
  }
  .counter-caption {
    font-family: "JetBrains Mono", monospace; font-size: 0.68rem;
    color: var(--text-muted, #515466); text-align: center;
  }
  .counter-caption b { color: var(--brand-neon, #7C6FF5); font-weight: 700; }
  .features { max-width: 1200px; margin: 0 auto; padding: 64px 80px 80px; position: relative; z-index: 1; }
  .features-head { margin-bottom: 32px; }
  .features-head p {
    font-size: 0.625rem; font-weight: 800; color: var(--cyber-green, #00FF87);
    text-transform: uppercase; letter-spacing: 0.25em; margin: 0 0 8px;
  }
  .features-head h2 { margin: 0; font-size: 2rem; font-weight: 900; letter-spacing: -0.03em; color: #FFFFFF; max-width: 600px; line-height: 1.1; }
  .feature-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5px;
    border: 0.5px solid var(--border-futuristic, rgba(124,111,245,0.16)); border-radius: 10px; overflow: hidden;
  }
  .ft-card { padding: 28px; background: rgba(255,255,255,0.015); transition: background 0.3s ease; }
  .ft-card:nth-child(6n+4), .ft-card:nth-child(6n+5), .ft-card:nth-child(6n+6) { background: rgba(124,111,245,0.04); }
  .ft-card:hover { background: rgba(124,111,245,0.08); }
  .ft-icon { font-size: 1.4rem; margin-bottom: 12px; display: block; }
  .ft-card h3 { margin: 0 0 6px; font-size: 0.95rem; font-weight: 800; color: #FFFFFF; }
  .ft-card p { margin: 0; font-size: 0.82rem; line-height: 1.55; color: var(--text-muted, #515466); }
  .cta-bar { display: flex; gap: 12px; margin-top: 32px; }
  .btn-primary {
    display: inline-flex; align-items: center; padding: 12px 24px; border-radius: 8px; border: none;
    background: var(--brand-neon, #7C6FF5); color: #FFFFFF; font-size: 0.85rem;
    font-weight: 700; text-decoration: none; letter-spacing: 0.02em; transition: all 0.2s ease;
    box-shadow: 0 0 18px rgba(124,111,245,0.2);
  }
  .btn-primary:hover { box-shadow: 0 0 30px rgba(124,111,245,0.35); transform: translateY(-1px); }
  .btn-secondary {
    display: inline-flex; align-items: center; padding: 12px 24px; border-radius: 8px;
    border: 0.5px solid var(--border-futuristic, rgba(124,111,245,0.16)); background: transparent;
    color: var(--text-secondary, #8E92A2); font-size: 0.85rem; font-weight: 700;
    text-decoration: none; letter-spacing: 0.02em; transition: all 0.2s ease;
  }
  .btn-secondary:hover { color: #FFFFFF; border-color: var(--brand-neon, #7C6FF5); }
  @media (max-width: 1024px) {
    .hero-inner { grid-template-columns: 1fr; padding: 24px 24px 0; gap: 32px; }
    .right-panel { max-width: 520px; }
    .feature-grid { grid-template-columns: 1fr 1fr; }
    .features { padding: 48px 24px 64px; }
  }
  @media (max-width: 640px) {
    .hero-inner { padding: 16px 16px 0; }
    .hero-left { padding-top: 16px; }
    .features { padding: 40px 16px 56px; }
    .feature-grid { grid-template-columns: 1fr; }
    .giant-headline { font-size: 2.8rem; }
    .rp-tab { padding: 4px 12px; font-size: 0.65rem; }
  }
`);

export class DocsHome extends DsdElement {
  static override styles = [openPropsTokenSheet, heroSheet];

  override connectedCallback() {
    super.connectedCallback();
    // Sync data-theme from document so CSS variables cascade into shadow DOM
    this._syncTheme();
    globalThis.addEventListener?.('less:theme-change', this._onThemeChange);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    globalThis.removeEventListener?.('less:theme-change', this._onThemeChange);
  }

  private _onThemeChange = (e: Event) => {
    const theme = (e as CustomEvent).detail?.theme;
    if (theme) this.setAttribute('data-theme', theme);
  };

  private _syncTheme() {
    const t = document.documentElement?.dataset?.theme;
    if (t) this.setAttribute('data-theme', t);
  }

  override render() {
    const isZh = this._getLocale('en') === 'zh';

    return (
      <less-layout locale='en' locales='["en","zh"]' nav-items={JSON.stringify(navSections)} header-nav={JSON.stringify(headerNav)} current-path="/" full-width>
        <div class='swiss-grid'>
          <section class='hero'>
            <div class='hero-inner'>
              {/* Left: Giant Typography */}
              <div class='hero-left'>
                <p class='eyebrow'>[ DEEP RUNTIME ENGINE V0.26 ]</p>
                <h1 class='giant-headline'>
                  LESS IS<br />
                  <span class='glow-line'>THE CORE.</span>
                </h1>
                <p class='hero-desc'>
                  {isZh
                    ? '高性能 Declarative Shadow DOM 编译器。零 Virtual-DOM reconciliation。微秒级 Signal 响应式更新。通过形式化架构门禁验证的确定性编译。'
                    : 'High-performance Declarative Shadow DOM compiler. Zero Virtual-DOM reconciliation. Microsecond Signal reactive update. Deterministic compilation validated via formal architecture gates.'}
                </p>
                <div class='laser-line'><span class='laser-dot'></span></div>
                <p class='laser-label'>SIGNAL CORRELATION: 99.82%</p>

                <div class='terminal'>
                  <div class='terminal-head'>
                    <span class='term-dot r'></span><span class='term-dot y'></span><span class='term-dot g'></span>
                    lessjs-compile-stream
                  </div>
                  <div class='terminal-body'>
                    <div class='term-line'><span class='term-prefix'>➜  less-app</span><span class='term-cmd'>  deno task build:docs</span></div>
                    <div class='term-line'><span class='term-info'>[info]</span><span>   Scanning routes folder… 35 routes mapped.</span></div>
                    <div class='term-line'><span class='term-info'>[info]</span><span>   i18n expansion active: [en, zh]</span></div>
                    <div class='term-line'><span class='term-ok'>[info]   DSD pre-render OK → dist/client/ in 43ms (budget: 100ms)</span></div>
                    <div class='term-line'><span class='term-gate'>[gate]  Package graph verified: 18 nodes, 0 cycles. [PASS]</span></div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Island component — signal-driven via @lessjs/signals */}
              <home-console></home-console>
            </div>
          </section>

          <section class='features'>
            <div class='features-head'>
              <p>{isZh ? '为什么选择 LESSJS' : 'Why LESSJS'}</p>
              <h2>{isZh ? '零运行时 DSD。微秒级信号。无包循环。' : 'Zero-runtime DSD. Microsecond signals. No package cycles.'}</h2>
            </div>
            <div class='feature-grid'>
              <div class='ft-card'><span class='ft-icon'>⚡</span><h3>DSD-First</h3><p>{isZh ? '声明式 Shadow DOM 在 HTML 中序列化，浏览器原生解析，零 JS 成本。' : 'Declarative Shadow DOM in HTML. Browser-native parsing. Zero JS cost.'}</p></div>
              <div class='ft-card'><span class='ft-icon'>🏝️</span><h3>Island Architecture</h3><p>{isZh ? 'load, idle, visible, only — 四种升级策略，精确控制 JS 交付。' : 'load, idle, visible, only — four upgrade strategies. Precise JS delivery control.'}</p></div>
              <div class='ft-card'><span class='ft-icon'>📡</span><h3>Signal Reactivity</h3><p>{isZh ? 'alien-signals 驱动，微秒级 DOM 更新。自动依赖追踪，零订阅模板。' : 'alien-signals powered. Microsecond DOM updates. Auto dependency tracking.'}</p></div>
              <div class='ft-card'><span class='ft-icon'>📦</span><h3>18 Packages, 0 Cycles</h3><p>{isZh ? '图门禁在每次发布前验证。零循环依赖，确定性构建顺序。' : 'Graph gate validates before every publish. Zero cycles. Deterministic build order.'}</p></div>
              <div class='ft-card'><span class='ft-icon'>🔬</span><h3>Architecture Gates</h3><p>{isZh ? '943 tests, DSD conformance check, SSG smoke test — 每次 push 都在 CI 中验证。' : '943 tests, DSD conformance, SSG smoke — verified on every push.'}</p></div>
              <div class='ft-card'><span class='ft-icon'>🌐</span><h3>Zero Bundler Dev</h3><p>{isZh ? 'deno task dev:fast — Deno 原生 serve，~100ms 冷启动，无 Vite。' : 'deno task dev:fast — Deno native serve. ~100ms cold start. No Vite required.'}</p></div>
            </div>
            <div class='cta-bar'>
              <a href='/guide/getting-started' class='btn-primary'>{isZh ? '开始构建 →' : 'Start building →'}</a>
              <a href='/architecture/architecture' class='btn-secondary'>{isZh ? '阅读架构' : 'Read architecture'}</a>
            </div>
          </section>
        </div>
      </less-layout>
    );
  }
}

customElements.define('docs-home', DocsHome);
export default DocsHome;

/**
 * Homepage — Neo-Swiss Hyper-Dark v0.26.
 *
 * Showcases LessJS framework: DSD rendering, Signal reactivity,
 * Island architecture. Pure DsdElement + @lessjs/signals.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { consumeContext } from '@lessjs/core/signal-context';
import { THEME_CTX } from '@lessjs/ui/less-layout';
import '@lessjs/ui/less-layout';
import '../../islands/less-search.tsx';
import '../../islands/home-console.tsx';

export const tagName = 'docs-home';

const heroSheet = new StyleSheet();
heroSheet.replaceSync(`
  :host { display: block; }
  .swiss-grid {
    min-height: 100vh;
    background: linear-gradient(180deg, var(--gray-0) 0%, var(--gray-1) 100%);
    color: var(--text-primary);
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
    max-width: 1200px; margin: 0 auto; padding: var(--size-8) var(--size-10) 0;
    display: grid; grid-template-columns: 1fr 480px; gap: var(--size-10); align-items: start;
  }
  .hero-left { padding-top: var(--size-10); }
  .eyebrow {
    font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-7);
    color: var(--cyber-green); letter-spacing: var(--font-letterspacing-5); text-transform: uppercase;
    margin-bottom: var(--size-6);
  }
  .giant-headline {
    margin: 0; font-family: var(--font-sans);
    font-weight: var(--font-weight-9); font-size: clamp(3.5rem, 8vw, 5.5rem);
    line-height: var(--font-lineheight-1); letter-spacing: var(--font-letterspacing-0); color: var(--text-primary);
  }
  .glow-line {
    background: linear-gradient(135deg, var(--brand), var(--brand-light));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: core-glow 3s ease-in-out infinite alternate;
  }
  @keyframes core-glow {
    0% { filter: drop-shadow(0 0 12px var(--brand-glow)); }
    100% { filter: drop-shadow(0 0 28px var(--brand-neon)); }
  }
  .hero-desc {
    margin-top: var(--size-7); max-width: 520px;
    font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-secondary);
  }
  .laser-line {
    margin-top: var(--size-7); height: 3px;
    background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(96,239,255,0.5) 40%, rgba(96,239,255,0.5) 60%, rgba(255,255,255,0.06));
    border-radius: var(--radius-2); position: relative;
  }
  .laser-dot {
    position: absolute; right: 40%; top: -3px; width: var(--size-2); height: var(--size-2);
    background: var(--laser-cyan); border-radius: var(--radius-round);
    box-shadow: 0 0 12px rgba(96,239,255,0.6); animation: laser-pulse 2s infinite;
  }
  @keyframes laser-pulse {
    0%,100% { box-shadow: 0 0 8px rgba(96,239,255,0.4); }
    50% { box-shadow: 0 0 20px rgba(96,239,255,0.8); }
  }
  .laser-label {
    margin-top: var(--size-2);
    font-family: var(--font-mono); font-size: var(--font-size-00); color: var(--brand); text-align: right;
  }
  .terminal {
    margin-top: var(--size-7);
    border: var(--border-size-1) solid var(--border-futuristic);
    border-radius: var(--radius-2); background: var(--bg-terminal); overflow: hidden; max-width: 520px;
  }
  .terminal-head {
    display: flex; align-items: center; gap: var(--size-2); padding: var(--size-3) var(--size-4);
    background: var(--gray-1); border-bottom: var(--border-size-1) solid var(--border-futuristic);
    font-family: var(--font-mono); font-size: var(--font-size-00); color: var(--text-muted);
  }
  .term-dot { width: var(--size-2); height: var(--size-2); border-radius: var(--radius-round); }
  .term-dot.r { background: var(--red-5); }
  .term-dot.y { background: var(--yellow-5); }
  .term-dot.g { background: var(--green-5); }
  .terminal-body {
    padding: var(--size-4);
    font-family: var(--font-mono); font-size: var(--font-size-0); line-height: var(--font-lineheight-4); color: var(--text-secondary);
  }
  .term-line { display: flex; white-space: pre; }
  .term-prefix { color: var(--brand-neon); }
  .term-cmd { color: var(--gray-12); }
  .term-info { color: var(--text-secondary); }
  .term-ok { color: var(--cyber-green); text-shadow: 0 0 6px var(--cyber-green-glow); }
  .term-gate { color: var(--laser-cyan); }
  .features { max-width: 1200px; margin: 0 auto; padding: var(--size-10) var(--size-10) var(--size-10); position: relative; z-index: 1; }
  .features-head { margin-bottom: var(--size-8); }
  .features-head p {
    font-size: var(--font-size-00); font-weight: var(--font-weight-8); color: var(--brand);
    text-transform: uppercase; letter-spacing: var(--font-letterspacing-5); margin: 0 0 var(--size-2);
  }
  .features-head h2 {
    margin: 0; font-size: var(--font-size-6); font-weight: var(--font-weight-9);
    letter-spacing: var(--font-letterspacing-0); color: var(--text-primary); max-width: 600px; line-height: var(--font-lineheight-1);
  }
  .feature-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border: var(--border-size-1) solid var(--border-futuristic);
    border-radius: var(--radius-3); overflow: hidden;
  }
  .ft-card {
    padding: var(--size-7); background: rgba(255,255,255,0.015);
    transition: background 0.3s ease;
  }
  .ft-card:nth-child(6n+4), .ft-card:nth-child(6n+5), .ft-card:nth-child(6n+6) { background: var(--brand-glow); }
  .ft-card:hover { background: rgba(124,111,245,0.08); }
  .ft-icon { font-size: var(--font-size-4); margin-bottom: var(--size-3); display: block; }
  .ft-card h3 { margin: 0 0 var(--size-2); font-size: var(--font-size-1); font-weight: var(--font-weight-8); color: var(--text-primary); }
  .ft-card p { margin: 0; font-size: var(--font-size-0); line-height: var(--font-lineheight-3); color: var(--text-muted); }
  .cta-bar { display: flex; gap: var(--size-3); margin-top: var(--size-8); }
  .btn-primary {
    display: inline-flex; align-items: center;
    padding: var(--size-3) var(--size-6); border-radius: var(--radius-2); border: none;
    background: var(--brand-neon); color: var(--gray-12);
    font-size: var(--font-size-0); font-weight: var(--font-weight-7);
    text-decoration: none; letter-spacing: var(--font-letterspacing-2);
    transition: all 0.2s ease;
    box-shadow: 0 0 18px var(--brand-glow);
  }
  .btn-primary:hover { box-shadow: 0 0 30px var(--brand-neon); transform: translateY(-1px); }
  .btn-secondary {
    display: inline-flex; align-items: center;
    padding: var(--size-3) var(--size-6); border-radius: var(--radius-2);
    border: var(--border-size-1) solid var(--border-futuristic); background: transparent;
    color: var(--text-secondary); font-size: var(--font-size-0); font-weight: var(--font-weight-7);
    text-decoration: none; letter-spacing: var(--font-letterspacing-2);
    transition: all 0.2s ease;
  }
  .btn-secondary:hover { color: var(--text-primary); border-color: var(--brand-neon); }
  @media (max-width: 1024px) {
    .hero-inner { grid-template-columns: 1fr; padding: var(--size-6) var(--size-6) 0; gap: var(--size-8); }
    .feature-grid { grid-template-columns: 1fr 1fr; }
    .features { padding: var(--size-8) var(--size-6) var(--size-8); }
  }
  @media (max-width: 640px) {
    .hero-inner { padding: var(--size-4) var(--size-4) 0; }
    .hero-left { padding-top: var(--size-4); }
    .features { padding: var(--size-8) var(--size-4) var(--size-8); }
    .feature-grid { grid-template-columns: 1fr; }
    .giant-headline { font-size: 2.8rem; }
  }
`);

export class DocsHome extends DsdElement {
  static override styles = [openPropsTokenSheet, heroSheet];

  override connectedCallback() {
    super.connectedCallback();
    // SignalContext: auto-tracks theme from less-layout provider
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));
  }

  override render() {
    const isZh = this._getLocale('en') === 'zh';

    return (
      <less-layout full-width>
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
              <div class='ft-card'><span class='ft-icon'>⚡</span><h3>DSD-first</h3><p>{isZh ? '声明式 Shadow DOM 在 HTML 中序列化，浏览器原生解析，零 JS 成本。' : 'Declarative Shadow DOM in HTML. Browser-native parsing. Zero JS cost.'}</p></div>
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

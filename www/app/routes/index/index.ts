/**
 * Homepage — v8 redesign
 *
 * Three-act rhythm: Dark Hero → Light Narrative → Warm-gray Footer
 * 6 sections: Hero → Code Strip → Benchmark → Multi-framework → Bento → Quick Start
 *
 * v8 Redesign key changes:
 * - Hero: Display-level typography, enhanced gradient glow, brand-shadow buttons
 * - Multi-framework: Real interactive showcase panel (not just code tabs)
 * - Quick Start: less-step-card components
 * - Bento hierarchy with WC Engine dominant card, sec-divider-free transitions
 */
import { css, html } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { headerNav, navSections } from 'virtual:less-nav';
import { lessDesignTokens } from '@lessjs/ui/design-tokens';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '@lessjs/ui/less-callout';
import '@lessjs/ui/less-step-card';
import '../../islands/less-search.js';
import '../../islands/less-term.js';
import '../../islands/less-showcase-panel.js';
import type { ShowcaseTab } from '../../islands/less-showcase-panel.js';

export const tagName = 'docs-home';

const CODE_COMPONENT = `// app/routes/index.ts
import { html, LitElement } from 'lit';

export class Home extends LitElement {
  render() {
    return html\`<h1>hello world</h1>
  <my-counter></my-counter>\`;
  }
}
customElements.define('page-home', Home);`;

const CODE_DSD = `<page-home>
  <template shadowrootmode="open">
    <h1>hello world</h1>
    <my-counter>
      <template shadowrootmode="open">
        <!-- button -, span 0, button + -->
      </template>
    </my-counter>
  </template>
</page-home>`;

const CODE_LIT = `// Lit island — app/islands/counter.ts
import { LitElement, html } from 'lit';
export class MyCounter extends LitElement {
  @state() count = 0;
  render() {
    return html\`<button @click=\${() => this.count--}>−</button>
      <span>\${this.count}</span>
      <button @click=\${() => this.count++}>+</button>\`;
  }
}`;

const CODE_REACT = `// React island — app/islands/hello.tsx
export default function Hello({ name }) {
  return <h1>Hello, {name}!</h1>;
}
// ReactDOMServer → DSD, zero-config SSR`;

const CODE_VANILLA = `// Vanilla island — app/islands/player.ts
import { WithDsdHydration } from '@lessjs/adapter-vanilla';
class MediaPlayer extends WithDsdHydration(HTMLElement) {
  connectedCallback() { /* upgrade logic */ }
}
customElements.define('media-player', MediaPlayer);`;

/** Showcase tab configuration for the multi-framework section */
const SHOWCASE_TABS_ZH: ShowcaseTab[] = [
  {
    label: 'Shoelace',
    tag: 'Lit',
    tagColor: '#e6f1fb',
    islandTag: 'shoelace-showcase',
    code: CODE_LIT,
    codeLabel: 'counter.ts — lit adapter',
    adapterDesc: '@lessjs/adapter-lit — Lit 组件通过 DSD 管道原生渲染',
    installCmd: 'npm i @lessjs/adapter-lit',
  },
  {
    label: 'React 19',
    tag: 'React',
    tagColor: '#e1f0ff',
    islandTag: 'react-showcase',
    code: CODE_REACT,
    codeLabel: 'hello.tsx — react adapter',
    adapterDesc: '@lessjs/adapter-react — ReactDOMServer → Declarative Shadow DOM',
    installCmd: 'npm i @lessjs/adapter-react',
  },
  {
    label: 'Media Chrome',
    tag: 'Vanilla',
    tagColor: '#e1f5ee',
    islandTag: 'media-chrome-showcase',
    code: CODE_VANILLA,
    codeLabel: 'player.ts — vanilla adapter',
    adapterDesc: '@lessjs/adapter-vanilla — 原生 Web Components 客户端升级',
    installCmd: 'npm i @lessjs/adapter-vanilla',
  },
];

const SHOWCASE_TABS_EN: ShowcaseTab[] = [
  {
    label: 'Shoelace',
    tag: 'Lit',
    tagColor: '#e6f1fb',
    islandTag: 'shoelace-showcase',
    code: CODE_LIT,
    codeLabel: 'counter.ts — lit adapter',
    adapterDesc: '@lessjs/adapter-lit — Lit components render natively through DSD pipeline',
    installCmd: 'npm i @lessjs/adapter-lit',
  },
  {
    label: 'React 19',
    tag: 'React',
    tagColor: '#e1f0ff',
    islandTag: 'react-showcase',
    code: CODE_REACT,
    codeLabel: 'hello.tsx — react adapter',
    adapterDesc: '@lessjs/adapter-react — ReactDOMServer → Declarative Shadow DOM',
    installCmd: 'npm i @lessjs/adapter-react',
  },
  {
    label: 'Media Chrome',
    tag: 'Vanilla',
    tagColor: '#e1f5ee',
    islandTag: 'media-chrome-showcase',
    code: CODE_VANILLA,
    codeLabel: 'player.ts — vanilla adapter',
    adapterDesc: '@lessjs/adapter-vanilla — native Web Components client-side upgrade',
    installCmd: 'npm i @lessjs/adapter-vanilla',
  },
];

export default class DocsHome extends DsdLitElement {
  private _mfaTab = 0;

  static override styles = [
    lessDesignTokens,
    css`
    :host {
      display: block;
    }
    less-layout {
      min-height: 100vh;
    }

    /* ── I. Hero — dark immersive opening ── */
    .hero {
      background: linear-gradient(170deg, var(--less-brand-deep, #26215C) 0%, #111127 50%, var(--less-brand-deep, #26215C) 100%);
      color: #fff;
      width: 100vw;
      margin-left: calc(-50vw + 50%);
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -30%;
      width: 80%;
      height: 80%;
      background:
        radial-gradient(ellipse, var(--less-brand-glow, rgba(83,74,183,0.25)) 0%, transparent 70%),
        radial-gradient(ellipse at 70% 30%, rgba(83,74,183,0.08) 0%, transparent 50%);
      pointer-events: none;
      animation: heroGlow 8s ease-in-out infinite;
    }
    .hero::after {
      content: '';
      position: absolute;
      bottom: -20%;
      right: -10%;
      width: 50%;
      height: 50%;
      background: radial-gradient(ellipse, rgba(83,74,183,0.15) 0%, transparent 60%);
      pointer-events: none;
    }
    @keyframes heroGlow {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .hero-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 4rem 1.5rem 3rem;
      position: relative;
    }
    .hero-lockup {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }
    .hero-lockup svg {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
    }
    .hero-lockup span {
      font-size: 17px;
      font-weight: 500;
      color: #f4f4f5;
      letter-spacing: -0.01em;
    }
    .hero h1 {
      font-size: var(--less-font-size-display, clamp(3rem, 7vw, 5rem));
      font-weight: 800;
      color: #fff;
      line-height: 1.05;
      letter-spacing: -0.035em;
      margin: 0 0 12px;
    }
    .hero h1 em {
      font-style: normal;
      background: linear-gradient(135deg, var(--less-brand, #534AB7), var(--less-brand-light, #6D5CE8), var(--less-brand-pale, #8B7CF6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-desc {
      color: var(--less-text-secondary, rgba(255,255,255,0.55));
      font-size: 15px;
      line-height: 1.75;
      max-width: 520px;
      margin: 0 0 24px;
    }
    .hero-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .hero-actions a {
      display: inline-flex;
      align-items: center;
      height: 40px;
      padding: 0 22px;
      border-radius: var(--less-radius-md, 8px);
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: transform var(--less-duration-micro, 150ms) var(--less-easing-default, ease-out),
                  box-shadow var(--less-duration-micro, 150ms) var(--less-easing-default, ease-out);
    }
    .hero-actions a:hover {
      transform: translateY(-1px);
    }
    .hero-pri {
      background: linear-gradient(135deg, var(--less-brand, #534ab7), var(--less-brand-light, #6d5ce8));
      color: #fff;
      box-shadow: var(--less-shadow-brand-md, 0 4px 20px rgba(83,74,183,0.3));
    }
    .hero-pri:hover {
      box-shadow: var(--less-shadow-brand-lg, 0 8px 32px rgba(83,74,183,0.4));
    }
    .hero-sec {
      border: 1px solid rgba(255,255,255,0.15);
      color: #d4d4d8;
      background: rgba(255,255,255,0.04);
    }
    .hero-sec:hover {
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.08);
    }
    /* ── II. Code Strip — dark code comparison ── */
    .code-strip {
      background: linear-gradient(180deg, var(--less-brand-deep, #26215C) 0%, #0f0f1a 100%);
      width: 100vw;
      margin-left: calc(-50vw + 50%);
      padding: 3rem 0;
    }
    .code-strip-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .code-strip-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .code-strip-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--less-brand, #534AB7);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .code-strip-arrow {
      font-size: 14px;
      color: var(--less-brand, #534AB7);
      animation: arrowPulse 2s ease-in-out infinite;
    }
    @keyframes arrowPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .zero-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 10px;
      background: rgba(83,74,183,0.2);
      border: 1px solid rgba(83,74,183,0.4);
      font-size: 11px;
      font-weight: 600;
      color: var(--less-brand-pale, #8b7cf6);
      letter-spacing: 0.02em;
    }
    .code-compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #0d0d12;
      border-radius: var(--less-radius-xl, 16px);
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: var(--less-shadow-brand-sm, 0 2px 12px rgba(83,74,183,0.2));
    }
    .code-pane {
      background: #0d0d12;
      padding: 14px 16px;
    }
    .code-bar {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
    }
    .code-bar i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .code-bar .r { background: #ff5f57; }
    .code-bar .y { background: #febc2e; }
    .code-bar .g { background: #28c840; }
    .code-bar span {
      color: var(--less-text-muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-left: 5px;
    }
    .code-pane less-code-block {
      background: transparent !important;
    }
    .code-pane pre {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .code-pane code {
      font-family: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace !important;
      font-size: 12px !important;
      line-height: 1.8 !important;
      color: #f4f4f5 !important;
      background: transparent !important;
    }

    /* ── Section shared (light narrative) ── */
    .sec {
      padding: 3.5rem 0 0;
      margin: 0 auto;
      max-width: 960px;
    }
        .sec-lbl {
      font-size: 11px;
      font-weight: 600;
      color: var(--less-brand, #534ab7);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin: 0 1.5rem 6px;
    }
    .sec-title {
      font-size: 1.25rem;
      font-weight: 650;
      color: var(--less-text-primary);
      margin: 0 1.5rem 18px;
      line-height: 1.4;
    }
    .sec-bd {
      padding: 0 1.5rem;
    }

    /* ── QS leading to Footer: full-width gradient bridge ── */
    .sec-qs-last {
      max-width: none;
      width: 100vw;
      margin-left: calc(-50vw + 50%);
      padding-bottom: 0;
      background: linear-gradient(180deg, var(--less-bg-base, #ffffff) 0%, #F1EFE8 100%);
    }
    .sec-qs-last .sec-lbl,
    .sec-qs-last .sec-title,
    .sec-qs-last .sec-bd {
      max-width: 960px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    /* ── Transition lines ── */
    .turn-line { width:100vw;margin-left:calc(-50vw+50%);height:1px;background:linear-gradient(90deg,transparent,var(--less-brand,#534AB7) 50%,transparent);opacity:0.3;border:none }
    .turn-glow { width:100vw;margin-left:calc(-50vw+50%);height:1px;background:radial-gradient(ellipse at 50% 50%,var(--less-brand-glow,rgba(83,74,183,0.25)),transparent 70%);border:none }
    .card-dominant { grid-column:1/-1;background:linear-gradient(135deg,rgba(83,74,183,0.06),rgba(83,74,183,0.02));border-left:3px solid var(--less-brand,#534AB7);border-top:1px solid rgba(83,74,183,0.1);border-right:1px solid rgba(83,74,183,0.1);border-bottom:1px solid rgba(83,74,183,0.1) }
    .card-dominant:hover { border-left-color:var(--less-brand-light,#6D5CE8);box-shadow:0 0 20px var(--less-brand-glow,rgba(83,74,183,0.15)) inset,var(--less-shadow-brand-sm,0 2px 12px rgba(83,74,183,0.2)) }
    .card-pills { display:flex;gap:6px;margin-top:12px }
    .card-pill { display:inline-flex;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:500;color:var(--less-brand,#534AB7);background:rgba(83,74,183,0.08);border:1px solid rgba(83,74,183,0.15) }

    /* ── Bento Grid (three pillars) ── */
    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 2rem;
    }
    
    .card {
      border: 1px solid var(--less-border);
      border-radius: var(--less-radius-lg, 12px);
      padding: 1.5rem;
      background: var(--less-bg-surface);
      transition: border-color var(--less-duration-fast, 200ms) var(--less-easing-default, ease-out),
                  box-shadow var(--less-duration-fast, 200ms) var(--less-easing-default, ease-out),
                  transform var(--less-duration-fast, 200ms) var(--less-easing-default, ease-out);
    }
    .card:hover {
      border-color: var(--less-border-hover);
      box-shadow: var(--less-shadow-brand-sm, 0 2px 12px rgba(83,74,183,0.2));
      transform: translateY(-2px);
    }
    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .card h3 {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 650;
      color: var(--less-text-primary);
    }
    .card p {
      margin: 0;
      font-size: 13px;
      color: var(--less-text-secondary);
      line-height: 1.7;
    }

    /* ── Benchmark — horizontal bar chart ── */
    .bench {
      margin-bottom: 2rem;
    }
    .bench-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 10px;
    }
    .bench-lbl {
      width: 90px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--less-text-primary);
      text-align: right;
      flex-shrink: 0;
    }
    .bench-track {
      flex: 1;
      height: 32px;
      border-radius: var(--less-radius-sm, 6px);
      background: var(--less-bg-surface, #f1f1f3);
      overflow: hidden;
      position: relative;
    }
    .bench-fill {
      height: 100%;
      border-radius: var(--less-radius-sm, 6px);
      display: flex;
      align-items: center;
      padding-left: 12px;
      font-size: 12px;
      font-weight: 600;
      transition: width 0.6s var(--less-easing-default, ease-out);
    }
    .bench-fill.brand {
      background: linear-gradient(135deg, var(--less-brand, #534AB7), var(--less-brand-light, #6D5CE8));
      color: #fff;
      width: 2%;
      min-width: 56px;
    }
    .bench-fill.muted {
      background: #d1d5db;
      color: #4b5563;
    }
    .bench-fill.warn {
      background: #9ca3af;
      color: #374151;
    }
    .bench-note {
      font-size: 12px;
      color: var(--less-text-muted);
      margin-top: 12px;
      line-height: 1.6;
    }
    .bench-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 18px;
    }
    .bench-stat {
      border: 1px solid var(--less-border);
      border-radius: var(--less-radius-md, 10px);
      padding: 1rem 1.25rem;
      background: var(--less-bg-surface);
    }
    .bench-stat h4 {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--less-text-primary);
    }
    .bench-stat p {
      margin: 0;
      font-size: 12px;
      color: var(--less-text-secondary);
      line-height: 1.5;
    }
    .bench-stat .brand {
      color: var(--less-brand, #534AB7);
      font-weight: 600;
    }

    /* ── Quick start (vertical timeline) ── */
    .qs {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 32px;
      margin-bottom: 2rem;
    }
    .qs::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--less-brand, #534AB7);
    }
    .qs-step-card {
      margin-bottom: 16px;
      position: relative;
    }
    .qs-step-card::before {
      content: '';
      position: absolute;
      left: -26px;
      top: 8px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--less-brand, #534AB7);
      box-shadow: 0 0 8px var(--less-brand-glow, rgba(83,74,183,0.35));
    }
    .qs-desc { font-size:12px;color:var(--less-text-muted);margin:4px 0 0;line-height:1.5 }
    .qs-cta { text-align:center;margin-top:12px }
    .qs-cta a { display:inline-flex;align-items:center;height:40px;padding:0 24px;border-radius:var(--less-radius-md,8px);font-size:14px;font-weight:600;text-decoration:none;color:#fff;background:linear-gradient(135deg,var(--less-brand,#534AB7),var(--less-brand-light,#6D5CE8));box-shadow:var(--less-shadow-brand-md,0 4px 20px rgba(83,74,183,0.3));transition:transform var(--less-duration-micro,150ms) var(--less-easing-default,ease-out),box-shadow var(--less-duration-micro,150ms) var(--less-easing-default,ease-out) }
    .qs-cta a:hover { transform:translateY(-1px);box-shadow:var(--less-shadow-brand-lg,0 8px 32px rgba(83,74,183,0.4)) }

    /* ── III. Site Footer — warm-gray quiet landing ── */
    .site-footer {
      background: #F1EFE8;
      border-top: 2px solid var(--less-brand, #534AB7);
      padding: 3rem 2rem 1.5rem;
      width: 100vw;
      margin-left: calc(-50vw + 50%);
    }
    .site-footer-inner {
      max-width: 960px;
      margin: 0 auto;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .footer-brand code {
      font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--less-brand-dark, #26215C);
    }
    .footer-brand span {
      font-size: 0.8125rem;
      color: #888780;
    }
    .footer-sep {
      border: none;
      border-top: 0.5px solid #D3D1C7;
      margin: 0 0 1.5rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1.2fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .footer-col-title {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--less-brand, #534AB7);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.5rem;
    }
    .footer-col a {
      display: block;
      font-size: 0.75rem;
      color: #888780;
      text-decoration: none;
      padding: 0.2rem 0;
      transition: color var(--less-duration-micro, 150ms) var(--less-easing-default, ease-out);
    }
    .footer-col a:hover {
      color: #444441;
    }
    .footer-terminal {
      background: var(--less-brand-deep, #26215C);
      border: 0.5px solid #3C3489;
      border-radius: var(--less-radius-md, 8px);
      padding: 0.75rem 1rem;
      font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 0.6875rem;
      line-height: 1.7;
      color: #AFA9EC;
    }
    .footer-terminal .prompt {
      color: #7F77DD;
    }
    .footer-terminal .success {
      color: #AFA9EC;
    }
    .footer-bottom {
      border-top: 0.5px solid #D3D1C7;
      padding-top: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-bottom span {
      font-size: 0.6875rem;
      color: #B4B2A9;
    }
    .footer-bottom a {
      font-size: 0.6875rem;
      color: #B4B2A9;
      text-decoration: none;
    }
    .footer-bottom a:hover {
      color: var(--less-brand, #534AB7);
    }
    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }

    /* ── Focus visible ── */
    :focus-visible {
      outline: 2px solid var(--less-brand);
      outline-offset: 2px;
    }

    /* ── Reduced motion ── */
    @media (prefers-reduced-motion: reduce) {
      .hero::before { animation: none; }
      .card { transition: none; }
      .site-footer a { transition: none; }
      .hero-actions a { transition: none; }
      .code-strip-arrow { animation: none; }
      .bench-fill { transition: none; }
    }

    /* ── Responsive ── */
    @media (max-width: 760px) {
      .hero-inner {
        padding: 2rem 1.25rem 1.5rem;
      }
      .hero h1 {
        font-size: clamp(2rem, 8vw, 3rem);
      }
      .code-strip {
        padding: 1.5rem 0;
      }
      .code-strip-inner {
        padding: 0 1.25rem;
      }
      .code-compare {
        grid-template-columns: 1fr;
      }
      .cards { grid-template-columns:1fr 1fr }
      .card-dominant { grid-column:1/-1 }
      .qs {
        padding-left: 28px;
      }
      .stats {
        gap: 16px;
      }
      .sec {
        padding: 2.5rem 0 0;
      }
      .sec-lbl {
        margin: 0 1.25rem 6px;
      }
      .sec-title {
        margin: 0 1.25rem 14px;
      }
      .sec-bd {
        padding: 0 1.25rem;
      }
      .bench-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 480px) {
      .hero h1 {
        font-size: 1.75rem;
      }
      .hero-desc {
        font-size: 13px;
      }
      .stat strong {
        font-size: 14px;
      }
      .bench-row {
        gap: 8px;
      }
      .cards { grid-template-columns:1fr }
      .bench-lbl {
        width: 70px;
        font-size: 11px;
      }
    }
  `];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/" home>
        <less-search slot="header-actions"></less-search>

        <!-- ═══ I. Hero — 暗色沉浸式开场 ═══ -->
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36">
                <g transform="translate(20,17)">
                  <path d="M5 106L95 53 5 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="107" cy="53" r="5" fill="#fff" />
                </g>
              </svg>
              <span>LessJS</span>
            </div>
            <h1>全栈框架 · <em>零 JS 首屏</em> · <em>多框架共存</em></h1>
            <p class="hero-desc">DSD 原生渲染，浏览器零 JS 看到完整页面</p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">开始使用 →</a>
              <a class="hero-sec" href="/guide/positioning">理解定位</a>
            </div>
          </div>
        </section>

        <!-- ═══ II. Code Strip — 代码对比 ═══ -->
        <div class="code-strip">
          <div class="code-strip-inner">
            <div class="code-strip-header">
              <span class="code-strip-label">你的组件</span>
              <span class="code-strip-arrow">→</span>
              <span class="code-strip-label">SSG 输出</span>
              <span class="zero-badge">0 KB JS</span>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar">
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>你的组件</span>
                </div>
                <less-code-block><pre><code>${CODE_COMPONENT}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar">
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>SSG 输出 (DSD)</span>
                </div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
          </div>
        </div>

        <hr class="turn-line">


        <!-- ═══ III. Benchmark — 水平条形图 ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">性能</h2>
          <p class="sec-title">首屏 JS 体积——零就是零</p>
          <div class="sec-bd">
            <div class="bench">
              <div class="bench-row">
                <div class="bench-lbl">LessJS</div>
                <div class="bench-track"><div class="bench-fill brand">0 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Astro</div>
                <div class="bench-track"><div class="bench-fill brand" style="min-width:56px;">0 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Fresh</div>
                <div class="bench-track"><div class="bench-fill muted" style="width:25%;">~23 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Next.js</div>
                <div class="bench-track"><div class="bench-fill warn" style="width:100%;">~90 KB</div></div>
              </div>
              <div class="bench-grid">
                <div class="bench-stat">
                  <h4><span class="brand">DSD 一等公民</span> vs Preact-only</h4>
                  <p>浏览器原生解析 Shadow DOM，其他框架只能模拟</p>
                </div>
                <div class="bench-stat">
                  <h4><span class="brand">内建 Registry Hub</span></h4>
                  <p>组件发现 + 兼容性验证 + 一键安装，竞品均无</p>
                </div>
              </div>
              <p class="bench-note">Island-only JS：负载随组件复杂度增长，不随页面数量增长。零 JS 首屏是浏览器原生能力，无法通过工程优化追平。</p>
            </div>
          </div>
        </div>


        <!-- ═══ IV. Multi-framework — 交互展示 ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">多框架</h2>
          <p class="sec-title">任意框架，同一个 island</p>
          <div class="sec-bd">
            <less-showcase-panel .tabs="${SHOWCASE_TABS_ZH}" .activeTab="${0}"></less-showcase-panel>
          </div>
        </div>


        
        <hr class="turn-glow">


        <!-- ═══ V. Bento Grid — 三支柱 ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">三支柱</h2>
          <p class="sec-title">框架 · 引擎 · Hub——一个产品，三重能力</p>
          <div class="sec-bd">
            <div class="cards">
              <div class="card card-dominant">
                <div class="card-icon" style="background:var(--less-brand-subtle, #EEEDFE);color:var(--less-brand, #534AB7);">D</div>
                <h3>WC 渲染引擎</h3>
                <p>DSD 零 JS 首屏，Lit/React/Vanilla 适配器共存。</p>
                <div class="card-pills">
                  <span class="card-pill">DSD</span>
                  <span class="card-pill">Island</span>
                  <span class="card-pill">Multi-adapter</span>
                </div>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
                <h3>全栈框架</h3>
                <p>文件约定路由 + Hono API Route + Serverless 部署。</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
                <h3>Registry Hub</h3>
                <p>Web Component 发现、验证、一键安装。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ VI. Quick Start — 纵向时间轴 ═══ -->
        <div class="sec sec-qs-last">
          <h2 class="sec-lbl">快速开始</h2>
          <p class="sec-title">三步上手，零摩擦</p>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-step-card">
                <less-step-card step="1" label="创建"><code>deno run -A jsr:@lessjs/create my-app</code></less-step-card>
                <p class="qs-desc">脚手架包含：路由 + SSG + Island 示例</p>
              </div>
              <div class="qs-step-card">
                <less-step-card step="2" label="开发"><code>cd my-app &amp;&amp; deno task dev</code></less-step-card>
                <p class="qs-desc">热更新 + DSD 实时预览 → localhost:5173</p>
              </div>
              <div class="qs-step-card">
                <less-step-card step="3" label="构建"><code>deno task build → dist/</code></less-step-card>
                <p class="qs-desc">纯静态文件，部署到任何 Serverless 平台</p>
              </div>
            </div>
            <div class="qs-cta">
              <a href="/guide/getting-started">查看完整文档 →</a>
            </div>
          </div>
        </div>
        <!-- ═══ Footer — 暖灰安静谢幕 ═══ -->
        <footer class="site-footer">
          <div class="site-footer-inner">
            <div class="footer-brand">
              <code>&lt;less/&gt;</code>
              <span>— 重量更轻，能力更强的 Web</span>
            </div>
            <hr class="footer-sep">
            <div class="footer-grid">
              <div class="footer-col">
                <div class="footer-col-title">框架</div>
                <a href="/guide/getting-started">快速开始</a>
                <a href="/guide/routing">路由</a>
                <a href="/guide/ssg">SSG 渲染</a>
              </div>
              <div class="footer-col">
                <div class="footer-col-title">引擎</div>
                <a href="/engine/architecture">架构</a>
                <a href="/engine/dsd">DSD 渲染</a>
                <a href="/engine/islands">岛屿升级</a>
              </div>
              <div class="footer-col">
                <div class="footer-col-title">社区</div>
                <a href="https://github.com/lessjs-run/lessjs" target="_blank" rel="noopener">GitHub</a>
                <a href="/blog">博客</a>
                <a href="/registry">组件库</a>
              </div>
              <div class="footer-terminal">
                <span class="prompt">$</span> npx create-less<br>
                <span class="success">  ✓ 已生成脚手架</span><br>
                <span class="success">  → npm run dev</span>
              </div>
            </div>
            <div class="footer-bottom">
              <span>MIT License · Made with less</span>
              <a href="/guide/getting-started">开始使用 →</a>
            </div>
          </div>
        </footer>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout locale="${this.locale || 'en'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/" home>
        <less-search slot="header-actions"></less-search>

        <!-- ═══ I. Hero — dark immersive opening ═══ -->
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36">
                <g transform="translate(20,17)">
                  <path d="M5 106L95 53 5 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="107" cy="53" r="5" fill="#fff" />
                </g>
              </svg>
              <span>LessJS</span>
            </div>
            <h1>Full-stack · <em>Zero-JS First Paint</em> · <em>Multi-framework</em></h1>
            <p class="hero-desc">DSD 原生渲染，浏览器零 JS 看到完整页面</p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">get started →</a>
              <a class="hero-sec" href="/guide/positioning">why lessjs</a>
            </div>
          </div>
        </section>

        <!-- ═══ II. Code Strip — code comparison ═══ -->
        <div class="code-strip">
          <div class="code-strip-inner">
            <div class="code-strip-header">
              <span class="code-strip-label">your component</span>
              <span class="code-strip-arrow">→</span>
              <span class="code-strip-label">SSG output</span>
              <span class="zero-badge">0 KB JS</span>
            </div>
            <div class="code-compare">
              <div class="code-pane">
                <div class="code-bar">
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>your component</span>
                </div>
                <less-code-block><pre><code>${CODE_COMPONENT}</code></pre></less-code-block>
              </div>
              <div class="code-pane">
                <div class="code-bar">
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>SSG output (DSD)</span>
                </div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
          </div>
        </div>

        <hr class="turn-line">


        <!-- ═══ III. Benchmark — horizontal bars ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">performance</h2>
          <p class="sec-title">JS at first paint — zero means zero</p>
          <div class="sec-bd">
            <div class="bench">
              <div class="bench-row">
                <div class="bench-lbl">LessJS</div>
                <div class="bench-track"><div class="bench-fill brand">0 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Astro</div>
                <div class="bench-track"><div class="bench-fill brand" style="min-width:56px;">0 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Fresh</div>
                <div class="bench-track"><div class="bench-fill muted" style="width:25%;">~23 KB</div></div>
              </div>
              <div class="bench-row">
                <div class="bench-lbl">Next.js</div>
                <div class="bench-track"><div class="bench-fill warn" style="width:100%;">~90 KB</div></div>
              </div>
              <div class="bench-grid">
                <div class="bench-stat">
                  <h4><span class="brand">DSD first-class</span> vs Preact-only</h4>
                  <p>Browser-native Shadow DOM parsing — other frameworks can only simulate</p>
                </div>
                <div class="bench-stat">
                  <h4><span class="brand">Built-in Registry Hub</span></h4>
                  <p>Component discovery + compat validation + one-click install — competitors have none</p>
                </div>
              </div>
              <p class="bench-note">Island-only JS: payload scales with component complexity, not page count. Zero-JS first paint is a browser-native capability — no engineering optimization can match it.</p>
            </div>
          </div>
        </div>


        <!-- ═══ IV. Multi-framework — interactive showcase ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">multi-framework</h2>
          <p class="sec-title">Any framework, same island</p>
          <div class="sec-bd">
            <less-showcase-panel .tabs="${SHOWCASE_TABS_EN}" .activeTab="${0}"></less-showcase-panel>
          </div>
        </div>


        
        <hr class="turn-glow">


        <!-- ═══ V. Bento Grid — three pillars ═══ -->
        <div class="sec">
          <h2 class="sec-lbl">three pillars</h2>
          <p class="sec-title">Framework · Engine · Hub — one product, three capabilities</p>
          <div class="sec-bd">
            <div class="cards">
              <div class="card card-dominant">
                <div class="card-icon" style="background:var(--less-brand-subtle, #EEEDFE);color:var(--less-brand, #534AB7);">D</div>
                <h3>wc rendering engine</h3>
                <p>DSD zero-JS first paint. Lit/React/Vanilla adapters coexist.</p>
                <div class="card-pills">
                  <span class="card-pill">DSD</span>
                  <span class="card-pill">Island</span>
                  <span class="card-pill">Multi-adapter</span>
                </div>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
                <h3>full-stack framework</h3>
                <p>File-convention routing + Hono API routes + serverless deploy.</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
                <h3>registry hub</h3>
                <p>Web Component discovery, validation, one-click install.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ VI. Quick Start — vertical timeline ═══ -->
        <div class="sec sec-qs-last">
          <h2 class="sec-lbl">quick start</h2>
          <p class="sec-title">Three steps, zero friction</p>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-step-card">
                <less-step-card step="1" label="scaffold"><code>deno run -A jsr:@lessjs/create my-app</code></less-step-card>
                <p class="qs-desc">Includes: routing + SSG + island example</p>
              </div>
              <div class="qs-step-card">
                <less-step-card step="2" label="develop"><code>cd my-app &amp;&amp; deno task dev</code></less-step-card>
                <p class="qs-desc">HMR + DSD live preview → localhost:5173</p>
              </div>
              <div class="qs-step-card">
                <less-step-card step="3" label="build"><code>deno task build → dist/</code></less-step-card>
                <p class="qs-desc">Pure static files, deploy to any serverless platform</p>
              </div>
            </div>
            <div class="qs-cta">
              <a href="/guide/getting-started">View full docs →</a>
            </div>
          </div>
        </div>
<!-- ═══ Footer — warm-gray quiet landing ═══ -->
        <footer class="site-footer">
          <div class="site-footer-inner">
            <div class="footer-brand">
              <code>&lt;less/&gt;</code>
              <span>— Web that weighs less, does more</span>
            </div>
            <hr class="footer-sep">
            <div class="footer-grid">
              <div class="footer-col">
                <div class="footer-col-title">Framework</div>
                <a href="/en/guide/getting-started">Quick start</a>
                <a href="/en/guide/routing">Routing</a>
                <a href="/en/guide/ssg">SSG rendering</a>
              </div>
              <div class="footer-col">
                <div class="footer-col-title">Engine</div>
                <a href="/en/engine/architecture">Architecture</a>
                <a href="/en/engine/dsd">DSD rendering</a>
                <a href="/en/engine/islands">Island upgrade</a>
              </div>
              <div class="footer-col">
                <div class="footer-col-title">Community</div>
                <a href="https://github.com/lessjs-run/lessjs" target="_blank" rel="noopener">GitHub</a>
                <a href="/en/blog">Blog</a>
                <a href="/registry">Registry</a>
              </div>
              <div class="footer-terminal">
                <span class="prompt">$</span> npx create-less<br>
                <span class="success">  ✓ scaffolded</span><br>
                <span class="success">  → npm run dev</span>
              </div>
            </div>
            <div class="footer-bottom">
              <span>MIT License · Made with less</span>
              <a href="/en/guide/getting-started">Get started →</a>
            </div>
          </div>
        </footer>
      </less-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

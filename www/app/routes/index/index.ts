/**
 * Homepage — v5 design
 *
 * @lessjs/app + @lessjs/ui components. less-code-block for syntax.
 * Mockup v5: dark hero, code comparison, feature cards, benchmark,
 * dark demo cards, quick start, footer CTA.
 */
import { css, html } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { headerNav, navSections } from 'virtual:less-nav';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';
import '../../islands/less-search.js';
import '../../islands/less-term.js';
import '../../islands/shoelace-showcase.js';
import '../../islands/react-showcase.js';
import '../../islands/media-chrome-showcase.js';

export const tagName = 'docs-home';

const CODE_COMPONENT = `// app/routes/index.ts
import { html, LitElement } from 'lit';

export class Home extends LitElement {
  render() {
    return html\`<h1>hello world</h1>
  <my-counter></my-counter>\`;
  }
}
customElements.define('page-home', Home);
// ...just lit + custom elements`;

const CODE_DSD = `<page-home>
  <template shadowrootmode="open">
    <h1>hello world</h1>
    <my-counter>
      <template shadowrootmode="open">
        <!-- button -, span 0, button + -->
      </template>
    </my-counter>
  </template>
</page-home>
<!-- no js needed for first paint -->`;

const COUNTER_RAW =
  `<my-counter><template shadowrootmode="open"><button>−</button><span>0</span><button>+</button></template></my-counter>`;

export default class DocsHome extends DsdLitElement {
  private _mfaTab = 0;

  static override styles = css`
    :host {
      display: block;
    }
    less-layout {
      min-height: 100vh;
    }

    /* ── Hero ── */
    .hero {
      background: linear-gradient(170deg, #09090b 0%, #111127 50%, #0d0d1a 100%);
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
      background: radial-gradient(ellipse, rgba(83,74,183,0.12) 0%, transparent 70%);
      pointer-events: none;
      animation: heroGlow 8s ease-in-out infinite;
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
      font-size: clamp(2.6rem, 6vw, 3rem);
      font-weight: 800;
      color: #fff;
      line-height: 1.08;
      letter-spacing: -0.035em;
      margin: 0 0 12px;
    }
    .hero h1 em {
      font-style: normal;
      background: linear-gradient(135deg, #534AB7, #6d5ce8, #8b7cf6);
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
      margin-bottom: 24px;
    }
    .hero-actions a {
      display: inline-flex;
      align-items: center;
      height: 40px;
      padding: 0 22px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .hero-actions a:hover {
      transform: translateY(-1px);
    }
    .hero-pri {
      background: linear-gradient(135deg, #534ab7, #6d5ce8);
      color: #fff;
      box-shadow: 0 2px 12px rgba(83,74,183,0.35);
    }
    .hero-pri:hover {
      box-shadow: 0 4px 20px rgba(83,74,183,0.5);
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

    /* ── Code comparison (full-width dark strip) ── */
    .code-strip {
      background: linear-gradient(180deg, #09090b 0%, #0f0f1a 100%);
      width: 100vw;
      margin-left: calc(-50vw + 50%);
      padding: 3rem 0;
    }
    .code-strip-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .code-compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: #0d0d12;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
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
    .code-bar .r {
      background: #ff5f57;
    }
    .code-bar .y {
      background: #febc2e;
    }
    .code-bar .g {
      background: #28c840;
    }
    .code-bar span {
      color: var(--less-text-muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-left: 5px;
    }
    .code-pane less-code-block {
      --code-bg: transparent !important;
      --code-border: none !important;
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

    /* ── Stats ── */
    .stats {
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
    }
    .stat {
      display: flex;
      flex-direction: column;
    }
    .stat strong {
      color: var(--less-brand, #534AB7);
      font-size: 18px;
      font-weight: 500;
    }
    .stat span {
      color: var(--less-text-tertiary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* ── Section titles ── */
    .sec {
      padding: 4rem 0 0;
      margin: 0 auto;
      max-width: 960px;
    }
    h2.sec-lbl {
      margin: 0 1.5rem 14px;
    }
    .sec-lbl {
      font-size: 11px;
      font-weight: 600;
      color: var(--less-brand, #534ab7);
      text-transform: uppercase;
      letter-spacing: 0.14em;
      margin: 0 1.5rem 14px;
    }
    .sec-bd {
      padding: 0 1.5rem;
    }

    /* ── Feature cards ── */
    .cards {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 2.5rem;
    }
    .card:first-child {
      grid-row: 1/3;
    }
    .card {
      border: 1px solid var(--less-border);
      border-radius: 12px;
      padding: 1.5rem;
      background: var(--less-bg-surface);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .card:hover {
      border-color: var(--less-border-hover);
      box-shadow: 0 4px 16px rgba(83,74,183,0.08);
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

    /* ── Use cases (brand icons) ── */
    .uses {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-top: 0.5px solid var(--less-border);
      border-bottom: 0.5px solid var(--less-border);
      margin-bottom: 2rem;
    }
    .use {
      padding: 1.5rem 1rem;
      border-right: 0.5px solid var(--less-border);
      text-align: center;
    }
    .use:last-child {
      border-right: 0;
    }
    .use .icon {
      font-size: 22px;
      margin-bottom: 6px;
    }
    .use h3 {
      margin: 0 0 3px;
      font-size: 13px;
      font-weight: 600;
      color: var(--less-text-primary);
    }
    .use p {
      margin: 0;
      font-size: 12px;
      color: var(--less-text-secondary);
    }

    /* ── Benchmark table ── */
    .bench {
      margin-bottom: 2.5rem;
      overflow-x: auto;
    }
    .bench table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .bench th {
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid var(--less-border);
      color: var(--less-text-secondary);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .bench td {
      padding: 11px 14px;
      border-bottom: 0.5px solid var(--less-bg-surface);
      color: var(--less-text-secondary);
    }
    .bench td:first-child {
      font-weight: 500;
      color: var(--less-text-primary);
    }
    .bench .win {
      color: var(--less-brand, #534AB7);
      font-weight: 500;
    }
    .bench .lose {
      color: var(--less-text-muted);
      font-weight: 500;
    }
    .bench-foot {
      font-size: 11px;
      color: var(--less-text-muted);
      margin-top: 8px;
      line-height: 1.6;
    }

    /* ── Architecture SVG ── */
    .arch {
      margin-bottom: 2.5rem;
    }
    .arch svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .arch text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10px;
    }

    /* ── Dark demo cards ── */
    .demo {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 2.5rem;
    }
    .demo-card {
      background: #18181b;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #27272a;
      transition: border-color 0.2s;
    }
    .demo-card h4 {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--less-text-primary);
      letter-spacing: 0.02em;
    }
    .demo-card pre {
      background: #101012 !important;
      border: 0.5px solid #27272a !important;
      border-radius: 6px;
      padding: 10px 12px !important;
      margin: 0 !important;
      font-size: 11px !important;
      line-height: 1.7 !important;
      color: #a1a1aa !important;
      overflow-x: auto;
      max-width: 100%;
      box-sizing: border-box;
    }
    .demo-card pre code {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .demo-card .note {
      font-size: 11px;
      color: var(--less-text-muted);
      margin-top: 10px;
      line-height: 1.5;
    }
    .demo-card.combined {
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: none;
    }
    .demo-card.combined:hover {
      border-color: transparent;
    }
    .demo-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .demo-half {
      min-width: 0;
    }
    .counter {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .counter button {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      border: 0.5px solid var(--less-border, #3f3f46);
      background: var(--less-bg-surface, #27272a);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--less-text-primary, #f4f4f5);
    }
    .counter button:hover {
      background: #3f3f46;
    }
    .counter span {
      font-size: 20px;
      font-weight: 500;
      color: #f4f4f5;
      min-width: 24px;
      text-align: center;
    }

    /* ── Bundle size bars (inside demo card) ── */
    .bundle {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 0.5px solid #27272a;
    }
    .bundle h4 {
      font-size: 12px;
      font-weight: 600;
      color: #d4d4d8;
      margin-bottom: 8px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .bar-lbl {
      width: 70px;
      font-size: 12px;
      font-weight: 600;
      color: #d4d4d8;
      text-align: right;
      flex-shrink: 0;
    }
    .bar-track {
      flex: 1;
      height: 26px;
      border-radius: 5px;
      background: #27272a;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 5px;
      display: flex;
      align-items: center;
      padding-left: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .bar-fill.g {
      background: #1d9e75;
      color: #fff;
      width: 2%;
      min-width: 50px;
    }
    .bar-fill.r {
      background: #d85a30;
      color: #fff;
      width: 100%;
    }
    .bundle-note {
      font-size: 11px;
      color: #71717a;
      margin-top: 8px;
      line-height: 1.5;
    }

    /* ── Terminal (less-term-demo island) ── */
    less-term-demo {
      display: block;
      margin-bottom: 2.5rem;
    }

    /* ── Quick start (vertical timeline) ── */
    .qs {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 32px;
      margin-bottom: 2.5rem;
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
    .qs-card {
      border: 0.5px solid var(--less-border);
      border-radius: 10px;
      padding: 1.25rem;
      background: var(--less-bg-surface);
      position: relative;
      margin-bottom: 16px;
    }
    .qs-card::before {
      content: '';
      position: absolute;
      left: -26px;
      top: 8px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--less-brand, #534AB7);
    }
    .qs-step {
      font-size: 11px;
      font-weight: 600;
      color: var(--less-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .qs-card code {
      font-family: "JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 12.5px;
      color: var(--less-text-primary);
      line-height: 1.6;
      white-space: nowrap;
    }

    /* ── Site Footer ── */
    .site-footer {
      background: #F1EFE8;
      border-top: 2px solid #534AB7;
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
      color: #26215C;
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
      color: #534AB7;
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
      transition: color 0.15s;
    }
    .footer-col a:hover {
      color: #444441;
    }
    .footer-terminal {
      background: #26215C;
      border: 0.5px solid #3C3489;
      border-radius: 8px;
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
      color: #534AB7;
    }
    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }

    /* ── Counter web component ── */
    .live-counter {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .live-counter button {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      border: 0.5px solid var(--less-border, #3f3f46);
      background: var(--less-bg-surface, #27272a);
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--less-text-primary, #f4f4f5);
    }
    .live-counter button:hover {
      background: #3f3f46;
    }
    .live-counter .val {
      font-size: 22px;
      font-weight: 500;
      color: #f4f4f5;
      min-width: 30px;
      text-align: center;
    }

    /* ── Multi-framework tabs ── */
    .mfa {
      margin-bottom: 2.5rem;
    }
    .mfa-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 1rem;
    }
    .mfa-tab {
      padding: 8px 16px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      color: var(--less-text-tertiary, #71717a);
      font-size: 13px;
      font-weight: 500;
      transition: border-color 0.2s, color 0.2s;
    }
    .mfa-tab[active] {
      border-bottom-color: var(--less-brand, #534AB7);
      color: var(--less-brand, #534AB7);
    }
    .mfa-panel {
      display: none;
    }
    .mfa-panel.active {
      display: block;
    }
    .mfa-card {
      border: 1px solid var(--less-border);
      border-radius: 12px;
      padding: 1.5rem;
      background: var(--less-bg-surface);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .mfa-card:hover {
      border-color: var(--less-border-hover);
      box-shadow: 0 4px 16px rgba(83,74,183,0.08);
      transform: translateY(-2px);
    }
    .mfa-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .mfa-tag.lit {
      background: #e6f1fb;
      color: #185fa5;
    }
    .mfa-tag.react {
      background: #e1f0ff;
      color: #0d6efd;
    }
    .mfa-tag.vanilla {
      background: #e1f5ee;
      color: #0f6e56;
    }
    .mfa-card h4 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--less-text-primary);
    }
    .mfa-card p {
      margin: 0;
      font-size: 12px;
      color: var(--less-text-secondary);
      line-height: 1.5;
    }
    .mfa-card .lib-name {
      font-weight: 600;
      color: var(--less-text-primary);
    }
    .mfa-live {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .mfa-live-card {
      background: var(--less-bg-surface);
      border-radius: 10px;
      padding: 1.25rem;
      min-width: 0;
      min-height: 200px;
      display: flex;
      flex-direction: column;
    }
    .mfa-live-card > :last-child {
      flex: 1;
    }
    .mfa-live-card h5 {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 600;
      color: var(--less-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
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
      .mfa-tab { transition: none; }
      .mfa-panel { transition: none; }
      .site-footer a { transition: none; }
      .hero-actions a { transition: none; }
    }

    @media (max-width: 760px) {
      .hero-inner {
        padding: 2rem 1.25rem 1.5rem;
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
      .cards {
        grid-template-columns: 1fr;
      }
      .card:first-child {
        grid-row: auto;
      }
      .uses {
        grid-template-columns: repeat(2, 1fr);
      }
      .use:nth-child(2) {
        border-right: 0;
      }
      .demo-row {
        grid-template-columns: 1fr;
      }
      .qs {
        padding-left: 28px;
      }
      .hero h1 {
        font-size: clamp(2rem, 8vw, 2.6rem);
      }
      .stats {
        gap: 16px;
      }
      .bench {
        overflow-x: auto;
      }
      .bench table {
        font-size: 11px;
        min-width: 480px;
      }
      .bench th, .bench td {
        padding: 8px 10px;
      }
      .sec {
        padding: 1.5rem 0 0;
      }
      h2.sec-lbl {
        margin: 0 1.25rem 10px;
      }
      .sec-lbl {
        margin: 0 1.25rem 10px;
      }
      .sec-bd {
        padding: 0 1.25rem;
      }
      .doc-link {
        padding: 0.75rem;
      }
      .mfa-tabs {
        flex-wrap: wrap;
      }
      .mfa-live {
        grid-template-columns: 1fr;
      }
      .cta-btns {
        flex-direction: column;
        align-items: center;
      }
    }
    @media (max-width: 480px) {
      .hero h1 {
        font-size: 1.75rem;
      }
      .uses {
        grid-template-columns: 1fr;
      }
      .use {
        border-right: 0;
        border-bottom: 0.5px solid var(--less-border);
      }
      .use:last-child {
        border-bottom: 0;
      }
      .hero-desc {
        font-size: 13px;
      }
      .stat strong {
        font-size: 14px;
      }
    }
  `;

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  /* ── counterState helper: used in render to create interactive counter ── */
  private _counter(initial = 0) {
    return html`
      <div class="live-counter" @click="${this._onCounterClick}">
        <button data-delta="-1">−</button>
        <span class="val">${initial}</span>
        <button data-delta="1">+</button>
      </div>
    `;
  }

  private _onCounterClick(e: Event) {
    const btn = (e.target as HTMLElement).closest('[data-delta]') as HTMLElement | null;
    if (!btn) return;
    const delta = parseInt(btn.dataset.delta || '0');
    const val = btn.parentElement!.querySelector('.val') as HTMLElement;
    if (val) val.textContent = String(Number(val.textContent) + delta);
  }

  private _onMfaClick(idx: number) {
    this._mfaTab = idx;
    this.requestUpdate();
  }

  private _renderZh() {
    return html`
      <less-layout locale="${this.locale || 'zh'}" .locales="${['en', 'zh']}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/" home>
        <less-search slot="header-actions"></less-search>
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36">
                <g transform="translate(20,17)">
                  <path
                    d="M5 106L95 53 5 0"
                    fill="none"
                    stroke="#fff"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="107" cy="53" r="5" fill="#fff" />
                </g>
              </svg>
              <span>LessJS</span>
            </div>
            <h1>全栈框架 <em>+</em> WC 渲染引擎 <em>+</em> Registry Hub</h1>
            <p class="hero-desc">
              Declarative Shadow DOM 零 JS 首屏。Island 架构按需升级交互。Hono API Route 提供后端能力。Registry Hub 一键发现安装 WC 组件。SSG / ISR / SSR 同一套渲染引擎。
            </p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">开始使用 →</a>
              <a class="hero-sec" href="/guide/positioning">理解定位</a>
            </div>
            <less-term-demo></less-term-demo>
            <div class="stats">
              <div class="stat"><strong>v0.19.0</strong><span>最新版本</span></div>
              <div class="stat"><strong>681</strong><span>测试通过</span></div>
              <div class="stat"><strong>13</strong><span>个包</span></div>
              <div class="stat"><strong>1</strong><span>运行时依赖 (core)</span></div>
            </div>
          </div>
        </section>

        <div class="code-strip">
          <div class="code-strip-inner">
            <div
              style="font-size:11px;font-weight:600;color:var(--less-brand,#534AB7);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:12px;"
            >
              你的组件 → SSG 输出
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
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>SSG 输出 (DSD HTML)</span>
                </div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">三支柱</h2>
          <div class="sec-bd">
            <div class="cards">
              <div class="card">
                <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
                <h3>全栈框架</h3>
                <p>文件约定路由 + Hono API Route + Serverless 部署。SSG/ISR/SSR 同一套渲染引擎，按需选择渲染时机。</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div>
                <h3>WC 渲染引擎</h3>
                <p>Declarative Shadow DOM 零 JS 首屏。Lit/React/Vanilla 多框架适配器共存。渲染时机无关——build-time、ISR、request-time 同一套引擎。</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
                <h3>Registry Hub</h3>
                <p>Web Component 发现、兼容性验证、一键安装。Playwright 渲染真实组件预览。安装即渲染，验证即分层。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">适用场景</h2>
          <div class="sec-bd">
            <div class="uses">
              <div class="use">
                <div class="icon">📄</div>
                <h3>文档站点</h3>
                <p>本网站由 LessJS 构建</p>
              </div>
              <div class="use">
                <div class="icon">✍️</div>
                <h3>博客 &amp; 内容</h3>
                <p>Markdown + frontmatter，自动 Sitemap</p>
              </div>
              <div class="use">
                <div class="icon">🏢</div>
                <h3>营销页面</h3>
                <p>多语言 + i18n，自动导航</p>
              </div>
              <div class="use">
                <div class="icon">⚡</div>
                <h3>轻量 API</h3>
                <p>Hono 路由，Deno / Workers 部署</p>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">对比</h2>
          <div class="sec-bd">
            <div class="bench">
              <table>
                <thead>
                  <tr>
                    <th style="width:140px;">指标</th>
                    <th style="width:100px;">LessJS</th>
                    <th>Fresh</th>
                    <th>Astro</th>
                    <th>Next.js</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>定位</td>
                    <td class="win">全栈+引擎+Hub</td>
                    <td>全栈 (Preact)</td>
                    <td>全栈 (多框架)</td>
                    <td>全栈 (React)</td>
                  </tr>
                  <tr>
                    <td>首屏 JS</td>
                    <td class="win">0 KB</td>
                    <td class="lose">~23 KB</td>
                    <td class="win">0 KB</td>
                    <td class="lose">~90 KB</td>
                  </tr>
                  <tr>
                    <td>WC 原生</td>
                    <td class="win">DSD 一等公民</td>
                    <td>Preact-only</td>
                    <td>当普通元素</td>
                    <td>❌</td>
                  </tr>
                  <tr>
                    <td>跨框架</td>
                    <td class="win">Lit/React/Vanilla</td>
                    <td>Preact</td>
                    <td>任意框架</td>
                    <td>React</td>
                  </tr>
                  <tr>
                    <td>Registry</td>
                    <td class="win">内建 Hub</td>
                    <td>❌</td>
                    <td>❌</td>
                    <td>❌</td>
                  </tr>
                </tbody>
              </table>
              <div class="bench-foot">
                LessJS 的核心差异：DSD 零 JS 首屏 + WC 跨框架渲染引擎 + Registry Hub。这是浏览器原生能力，其他框架无法通过工程优化追平。
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">包架构</h2>
          <div class="sec-bd">
            <div class="arch">
              <svg viewBox="0 0 600 74" fill="none">
                <rect
                  x="230"
                  y="2"
                  width="140"
                  height="22"
                  rx="4"
                  fill="#EEEDFE"
                  stroke="#CECBF6"
                  stroke-width="0.5"
                />
                <text x="300" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">
                  @lessjs/app (统一入口)
                </text>
                <path d="M300 24 L300 30 L150 30 L150 38" stroke="#bbb" stroke-width="0.5" />
                <path d="M300 24 L300 30 L300 38" stroke="#bbb" stroke-width="0.5" />
                <path d="M300 24 L300 30 L450 30 L450 38" stroke="#bbb" stroke-width="0.5" />
                <rect
                  x="90"
                  y="39"
                  width="120"
                  height="22"
                  rx="4"
                  fill="#E6F1FB"
                  stroke="#B5D4F4"
                  stroke-width="0.5"
                />
                <text x="150" y="54" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">
                  adapter-vite
                </text>
                <rect
                  x="230"
                  y="39"
                  width="140"
                  height="22"
                  rx="4"
                  fill="#FAEEDA"
                  stroke="#FAC775"
                  stroke-width="0.5"
                />
                <text x="300" y="54" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">
                  content + i18n
                </text>
                <rect
                  x="390"
                  y="39"
                  width="120"
                  height="22"
                  rx="4"
                  fill="#FAECE7"
                  stroke="#F5C4B3"
                  stroke-width="0.5"
                />
                <text x="450" y="54" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">
                  adapter-lit / ui
                </text>
                <text x="300" y="70" text-anchor="middle" fill="#5F5E5A" font-size="10">
                  @lessjs/core — 纯运行时，1 个依赖 (parse5)
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">多框架共存</h2>
          <div class="sec-bd">
            <div class="mfa">
              <div class="mfa-tabs" role="tablist">
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 0}" aria-selected="${this._mfaTab === 0}" @click="${() => this._onMfaClick(0)}">Shoelace · Lit</div>
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 1}" aria-selected="${this._mfaTab === 1}" @click="${() => this._onMfaClick(1)}">React 19</div>
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 2}" aria-selected="${this._mfaTab === 2}" @click="${() => this._onMfaClick(2)}">Media Chrome · Vanilla</div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 0 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag lit">Lit Adapter</span>
                  <h4>Shoelace</h4>
                  <p>
                    <span class="lib-name">Shoelace</span> — 80+ 精美 Lit 组件，企业级 Web Components 库
                  </p>
                </div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 1 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag react">React Adapter</span>
                  <h4>React 19</h4>
                  <p>
                    <span class="lib-name">React</span> — ReactDOMServer → Declarative Shadow DOM，零配置
                    SSR 渲染
                  </p>
                </div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 2 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag vanilla">Vanilla Adapter</span>
                  <h4>Media Chrome</h4>
                  <p><span class="lib-name">Media Chrome</span> — 纯原生 Web Components 媒体播放器控件</p>
                </div>
              </div>
              <div class="mfa-live">
                <div class="mfa-live-card">
                  <h5>Shoelace · Lit</h5>
                  <shoelace-showcase></shoelace-showcase>
                </div>
                <div class="mfa-live-card">
                  <h5>React 19 · React Adapter</h5>
                  <react-showcase></react-showcase>
                </div>
                <div class="mfa-live-card">
                  <h5>Media Chrome · Vanilla</h5>
                  <media-chrome-showcase></media-chrome-showcase>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">实际效果</h2>
          <div class="sec-bd">
            <div class="demo-card combined">
              <div class="demo-row">
                <div class="demo-half">
                  <h4>交互式 Counter — 点击按钮</h4>
                  ${this._counter(0)}
                  <div class="note">以原生 Custom Element 运行。零框架 JS 加载。</div>
                </div>
                <div class="demo-half">
                  <h4>浏览器解析的内容</h4>
                  <pre><code>${COUNTER_RAW}</code></pre>
                  <div class="note">DSD 模板由浏览器原生解析 — 无 hydration 开销。</div>
                </div>
              </div>
              <div class="bundle">
                <h4>首屏 JS 对比</h4>
                <div class="bar-row">
                  <div class="bar-lbl">LessJS</div>
                  <div class="bar-track"><div class="bar-fill g">0 kb</div></div>
                </div>
                <div class="bar-row">
                  <div class="bar-lbl">Next.js</div>
                  <div class="bar-track"><div class="bar-fill r">~90 kb react</div></div>
                </div>
                <div class="bundle-note">Island-only JS: 负载随组件复杂度增长，不随页面数量增长。</div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">快速开始</h2>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-card">
                <div class="qs-step">1. 创建</div><code>deno run -A jsr:@lessjs/create my-app</code>
              </div>
              <div class="qs-card">
                <div class="qs-step">2. 开发</div><code>cd my-app &amp;&amp; deno task dev</code>
              </div>
              <div class="qs-card">
                <div class="qs-step">3. 构建</div><code>deno task build → dist/</code>
              </div>
            </div>
          </div>
        </div>

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
      <less-layout locale="${this.locale || 'en'}" .locales="${[
        'en',
        'zh',
      ]}" .navItems="${navSections}" .headerNav="${headerNav}" current-path="/en/" home>
        <less-search slot="header-actions"></less-search>
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-lockup">
              <svg viewBox="0 0 140 140" width="36" height="36">
                <g transform="translate(20,17)">
                  <path
                    d="M5 106L95 53 5 0"
                    fill="none"
                    stroke="#fff"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="107" cy="53" r="5" fill="#fff" />
                </g>
              </svg>
              <span>LessJS</span>
            </div>
            <h1>full-stack <em>+</em> wc engine <em>+</em> registry hub</h1>
            <p class="hero-desc">
              Declarative Shadow DOM zero-JS first paint. Island architecture for on-demand interactivity.
              Hono API routes for backend. Registry Hub for one-click WC discovery. SSG/ISR/SSR — same rendering engine.
            </p>
            <div class="hero-actions">
              <a class="hero-pri" href="/guide/getting-started">get started →</a>
              <a class="hero-sec" href="/guide/positioning">why lessjs</a>
            </div>
            <less-term-demo></less-term-demo>
            <div class="stats">
              <div class="stat"><strong>v0.19.0</strong><span>latest release</span></div>
              <div class="stat"><strong>681</strong><span>tests passing</span></div>
              <div class="stat"><strong>13</strong><span>packages</span></div>
              <div class="stat"><strong>1</strong><span>runtime dep (core)</span></div>
            </div>
          </div>
        </section>

        <div class="code-strip">
          <div class="code-strip-inner">
            <div
              style="font-size:11px;font-weight:600;color:var(--less-brand,#534AB7);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:12px;"
            >
              your component → ssg output
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
                  <i class="r"></i><i class="y"></i><i class="g"></i><span>ssg output (dsd html)</span>
                </div>
                <less-code-block><pre><code>${CODE_DSD}</code></pre></less-code-block>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">three pillars</h2>
          <div class="sec-bd">
            <div class="cards">
              <div class="card">
                <div class="card-icon" style="background:#E6F1FB;color:#185FA5;">F</div>
                <h3>full-stack framework</h3>
                <p>File-convention routing + Hono API routes + serverless deploy. SSG/ISR/SSR — same rendering engine, choose your timing.</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#EEEDFE;color:#534AB7;">D</div>
                <h3>wc rendering engine</h3>
                <p>Declarative Shadow DOM zero-JS first paint. Lit/React/Vanilla adapters coexist. Rendering-timing-agnostic — build-time, ISR, request-time, same engine.</p>
              </div>
              <div class="card">
                <div class="card-icon" style="background:#E1F5EE;color:#0F6E56;">I</div>
                <h3>registry hub</h3>
                <p>Web Component discovery, compatibility validation, one-click install. Playwright-rendered real component previews. Install-to-render, validate-to-tier.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">built for</h2>
          <div class="sec-bd">
            <div class="uses">
              <div class="use">
                <div class="icon">📄</div>
                <h3>documentation sites</h3>
                <p>this website runs on lessjs</p>
              </div>
              <div class="use">
                <div class="icon">✍️</div>
                <h3>blogs &amp; content</h3>
                <p>markdown + frontmatter, auto sitemap</p>
              </div>
              <div class="use">
                <div class="icon">🏢</div>
                <h3>marketing pages</h3>
                <p>multi-language with i18n, auto nav</p>
              </div>
              <div class="use">
                <div class="icon">⚡</div>
                <h3>lightweight apis</h3>
                <p>hono routes on deno / workers</p>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">how it compares</h2>
          <div class="sec-bd">
            <div class="bench">
              <table>
                <thead>
                  <tr>
                    <th style="width:140px;">metric</th>
                    <th style="width:100px;">lessjs</th>
                    <th>fresh</th>
                    <th>astro</th>
                    <th>next.js</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>positioning</td>
                    <td class="win">full-stack+engine+hub</td>
                    <td>full-stack (preact)</td>
                    <td>full-stack (multi)</td>
                    <td>full-stack (react)</td>
                  </tr>
                  <tr>
                    <td>js at first paint</td>
                    <td class="win">0 kb</td>
                    <td class="lose">~23 kb</td>
                    <td class="win">0 kb</td>
                    <td class="lose">~90 kb</td>
                  </tr>
                  <tr>
                    <td>wc native</td>
                    <td class="win">dsd first-class</td>
                    <td>preact-only</td>
                    <td>plain elements</td>
                    <td>❌</td>
                  </tr>
                  <tr>
                    <td>cross-framework</td>
                    <td class="win">lit/react/vanilla</td>
                    <td>preact</td>
                    <td>any framework</td>
                    <td>react</td>
                  </tr>
                  <tr>
                    <td>registry</td>
                    <td class="win">built-in hub</td>
                    <td>❌</td>
                    <td>❌</td>
                    <td>❌</td>
                  </tr>
                </tbody>
              </table>
              <div class="bench-foot">
                lessjs core differentiation: dsd zero-js first paint + wc cross-framework engine + registry hub.
                this is a browser-native capability — other frameworks cannot match it through engineering optimization.
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">package architecture</h2>
          <div class="sec-bd">
            <div class="arch">
              <svg viewBox="0 0 600 74" fill="none">
                <rect
                  x="230"
                  y="2"
                  width="140"
                  height="22"
                  rx="4"
                  fill="#EEEDFE"
                  stroke="#CECBF6"
                  stroke-width="0.5"
                />
                <text x="300" y="17" text-anchor="middle" fill="#534AB7" font-size="11" font-weight="500">
                  @lessjs/app (umbrella)
                </text>
                <path d="M300 24 L300 30 L150 30 L150 38" stroke="#bbb" stroke-width="0.5" />
                <path d="M300 24 L300 30 L300 38" stroke="#bbb" stroke-width="0.5" />
                <path d="M300 24 L300 30 L450 30 L450 38" stroke="#bbb" stroke-width="0.5" />
                <rect
                  x="90"
                  y="39"
                  width="120"
                  height="22"
                  rx="4"
                  fill="#E6F1FB"
                  stroke="#B5D4F4"
                  stroke-width="0.5"
                />
                <text x="150" y="54" text-anchor="middle" fill="#185FA5" font-size="11" font-weight="500">
                  adapter-vite
                </text>
                <rect
                  x="230"
                  y="39"
                  width="140"
                  height="22"
                  rx="4"
                  fill="#FAEEDA"
                  stroke="#FAC775"
                  stroke-width="0.5"
                />
                <text x="300" y="54" text-anchor="middle" fill="#854F0B" font-size="11" font-weight="500">
                  content + i18n
                </text>
                <rect
                  x="390"
                  y="39"
                  width="120"
                  height="22"
                  rx="4"
                  fill="#FAECE7"
                  stroke="#F5C4B3"
                  stroke-width="0.5"
                />
                <text x="450" y="54" text-anchor="middle" fill="#993C1D" font-size="11" font-weight="500">
                  adapter-lit / ui
                </text>
                <text x="300" y="70" text-anchor="middle" fill="#5F5E5A" font-size="10">
                  @lessjs/core — pure runtime, 1 dep (parse5)
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">multi-framework coexistence</h2>
          <div class="sec-bd">
            <div class="mfa">
              <div class="mfa-tabs" role="tablist">
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 0}" aria-selected="${this._mfaTab === 0}" @click="${() => this._onMfaClick(0)}">Shoelace · Lit</div>
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 1}" aria-selected="${this._mfaTab === 1}" @click="${() => this._onMfaClick(1)}">React 19</div>
                <div class="mfa-tab" role="tab" ?active="${this._mfaTab === 2}" aria-selected="${this._mfaTab === 2}" @click="${() => this._onMfaClick(2)}">Media Chrome · Vanilla</div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 0 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag lit">Lit Adapter</span>
                  <h4>Shoelace</h4>
                  <p>
                    <span class="lib-name">Shoelace</span> — 80+ polished Lit components, enterprise-grade
                    Web Components
                  </p>
                </div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 1 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag react">React Adapter</span>
                  <h4>React 19</h4>
                  <p>
                    <span class="lib-name">React</span> — ReactDOMServer → Declarative Shadow DOM,
                    zero-config SSR rendering
                  </p>
                </div>
              </div>
              <div class="mfa-panel ${this._mfaTab === 2 ? 'active' : ''}" role="tabpanel">
                <div class="mfa-card">
                  <span class="mfa-tag vanilla">Vanilla Adapter</span>
                  <h4>Media Chrome</h4>
                  <p>
                    <span class="lib-name">Media Chrome</span> — pure vanilla Web Components for media
                    player controls
                  </p>
                </div>
              </div>
              <div class="mfa-live">
                <div class="mfa-live-card">
                  <h5>Shoelace · Lit</h5>
                  <shoelace-showcase></shoelace-showcase>
                </div>
                <div class="mfa-live-card">
                  <h5>React 19 · React Adapter</h5>
                  <react-showcase></react-showcase>
                </div>
                <div class="mfa-live-card">
                  <h5>Media Chrome · Vanilla</h5>
                  <media-chrome-showcase></media-chrome-showcase>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">live demo</h2>
          <div class="sec-bd">
            <div class="demo-card combined">
              <div class="demo-row">
                <div class="demo-half">
                  <h4>interactive counter — click the buttons</h4>
                  ${this._counter(0)}
                  <div class="note">runs as native custom element. zero framework js loaded.</div>
                </div>
                <div class="demo-half">
                  <h4>what the browser parses</h4>
                  <pre><code>${COUNTER_RAW}</code></pre>
                  <div class="note">dsd template parsed natively — no hydration cost.</div>
                </div>
              </div>
              <div class="bundle">
                <h4>js at first paint</h4>
                <div class="bar-row">
                  <div class="bar-lbl">LessJS</div>
                  <div class="bar-track"><div class="bar-fill g">0 kb</div></div>
                </div>
                <div class="bar-row">
                  <div class="bar-lbl">Next.js</div>
                  <div class="bar-track"><div class="bar-fill r">~90 kb react</div></div>
                </div>
                <div class="bundle-note">
                  island-only js: payload scales with component complexity, not page count.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <h2 class="sec-lbl">quick start</h2>
          <div class="sec-bd">
            <div class="qs">
              <div class="qs-card">
                <div class="qs-step">1. scaffold</div><code>deno run -A jsr:@lessjs/create my-app</code>
              </div>
              <div class="qs-card">
                <div class="qs-step">2. develop</div><code>cd my-app &amp;&amp; deno task dev</code>
              </div>
              <div class="qs-card">
                <div class="qs-step">3. build</div><code>deno task build → dist/</code>
              </div>
            </div>
          </div>
        </div>

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

import { css, html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static styles = css`
    :host { display: block; }

    .hero {
      background: #000;
      margin: 0 0 2.5rem;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 320px;
      background: #f8f8f8;
      transform: rotate(25deg);
      opacity: 0.06;
    }
    .hero-inner {
      max-width: 720px;
      margin: 0 auto;
      padding: 2.5rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      position: relative;
      z-index: 1;
    }
    .hero-brand { display: flex; flex-direction: column; gap: 2px; }
    .hero-kiss {
      font-size: 36px;
      font-weight: 500;
      color: #fff;
      letter-spacing: -1px;
      line-height: 1;
    }
    .hero-tagline {
      font-size: 9px;
      color: #555;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .hero-term { display: flex; align-items: center; gap: 12px; }

    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      margin-bottom: 2rem;
    }
    .feature {
      padding: 1rem 0;
      border-top: 0.5px solid var(--kiss-border);
    }
    .feature:nth-child(-n+2) { border-top: none; }
    .feature h3 {
      font-size: 12px;
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 4px;
    }
    .feature p {
      font-size: 11px;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.6;
    }
    .links {
      display: flex;
      gap: 0;
      border-top: 0.5px solid var(--kiss-border);
    }
    .link-item {
      flex: 1;
      text-align: center;
      font-size: 11px;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      padding: 0.75rem 0;
      transition: all 0.15s;
    }
    .link-item + .link-item { border-left: 0.5px solid var(--kiss-border); }
    .link-item:hover { color: var(--kiss-text-primary); background: var(--kiss-bg-surface); }

    @media (max-width: 640px) {
      .hero-inner { flex-direction: column; align-items: flex-start; gap: 12px; padding: 2rem 1.5rem; }
      .hero-kiss { font-size: 28px; }
      .features { grid-template-columns: 1fr; }
      .feature:nth-child(2) { border-top: 0.5px solid var(--kiss-border); }
      .content { padding: 0 1.5rem 3rem; }
    }
  `;

  override render() {
    return html`
      <kiss-layout home>
        <div class="hero">
          <div class="hero-inner">
            <div class="hero-brand">
              <div class="hero-kiss">KISS</div>
              <div class="hero-tagline">keep it simple, stupid</div>
            </div>
            <div class="hero-term">
              <hero-ping></hero-ping>
            </div>
          </div>
        </div>

        <div class="content">
          <div class="features">
            <div class="feature"><h3>Web standards first</h3><p>HTTP via Fetch API, UI via Web Components, modules via ESM.</p></div>
            <div class="feature"><h3>Islands architecture</h3><p>Only interactive components load JS. Static pages ship zero.</p></div>
            <div class="feature"><h3>Type-safe RPC</h3><p>End-to-end types via Hono RPC — no code generation.</p></div>
            <div class="feature"><h3>SSG + DSD</h3><p>Build-time static generation with instant client hydration.</p></div>
          </div>
          <div class="links">
            <a class="link-item" href="/guide/getting-started">Getting started →</a>
            <a class="link-item" href="/demo">Live demo →</a>
            <a class="link-item" href="https://github.com/SisyphusZheng/kiss">GitHub →</a>
            <a class="link-item" href="https://jsr.io/@kissjs/core">JSR →</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define('docs-home', DocsHome);

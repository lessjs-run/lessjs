import { css, html, LitElement } from '@kissjs/core';
import '@kissjs/ui/kiss-layout';

export const tagName = 'docs-home';

export default class DocsHome extends LitElement {
  static styles = css`
    :host { display: block; }

    .hero {
      background: #000;
      margin: 0 0 3rem;
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
      padding: 3rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      position: relative;
      z-index: 1;
    }
    .hero-brand { display: flex; flex-direction: column; gap: 4px; }
    .hero-kiss {
      font-size: 2.25rem;
      font-weight: 500;
      color: #fff;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }
    .hero-tagline {
      font-size: 0.75rem;
      color: #666;
      letter-spacing: 0.12em;
    }
    .hero-term { display: flex; align-items: center; gap: 12px; }

    .content {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }

    .intro {
      margin-bottom: 3rem;
    }
    .intro h2 {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 0.75rem;
    }
    .intro p {
      font-size: 0.875rem;
      color: var(--kiss-text-secondary);
      line-height: 1.7;
      margin: 0;
    }

    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      margin-bottom: 2.5rem;
    }
    .feature {
      padding: 1.25rem 0;
      border-top: 0.5px solid var(--kiss-border);
    }
    .feature:nth-child(-n+2) { border-top: none; }
    .feature h3 {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      margin: 0 0 4px;
    }
    .feature p {
      font-size: 0.75rem;
      color: var(--kiss-text-tertiary);
      margin: 0;
      line-height: 1.6;
    }

    .stats {
      display: flex;
      gap: 0;
      border-top: 0.5px solid var(--kiss-border);
      padding-top: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .stat { flex: 1; text-align: center; }
    .stat + .stat { border-left: 0.5px solid var(--kiss-border); }
    .stat-val {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--kiss-text-primary);
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 0.625rem;
      color: var(--kiss-text-muted);
      letter-spacing: 0.1em;
    }

    .links {
      display: flex;
      gap: 0;
      border-top: 0.5px solid var(--kiss-border);
    }
    .link-item {
      flex: 1;
      text-align: center;
      font-size: 0.75rem;
      color: var(--kiss-text-secondary);
      text-decoration: none;
      padding: 0.875rem 0;
      transition: all 0.15s;
    }
    .link-item + .link-item { border-left: 0.5px solid var(--kiss-border); }
    .link-item:hover { color: var(--kiss-text-primary); background: var(--kiss-bg-surface); }

    @media (max-width: 640px) {
      .hero-inner { flex-direction: column; align-items: flex-start; gap: 12px; padding: 2rem 1.5rem; }
      .features { grid-template-columns: 1fr; }
      .feature:nth-child(2) { border-top: 0.5px solid var(--kiss-border); }
      .stats { flex-wrap: wrap; }
      .stat { flex: 1 1 50%; padding: 0.5rem 0; }
      .stat:nth-child(2) { border-left: none; }
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
          <div class="intro">
            <h2>A framework built on web standards</h2>
            <p>
              KISS is a Jamstack framework that uses the platform directly —
              HTTP through the Fetch API, UI through Web Components, modules through ESM.
              No custom abstractions, no runtime lock-in. Just HTML, CSS, and JavaScript
              as the browser intended.
            </p>
          </div>

          <div class="features">
            <div class="feature">
              <h3>Web standards first</h3>
              <p>HTTP via Fetch API, UI via Web Components, modules via ESM. No abstractions.</p>
            </div>
            <div class="feature">
              <h3>Islands architecture</h3>
              <p>Only interactive components load JS. Static pages ship zero JavaScript.</p>
            </div>
            <div class="feature">
              <h3>Type-safe RPC</h3>
              <p>End-to-end types via Hono RPC — server and client share types without code generation.</p>
            </div>
            <div class="feature">
              <h3>SSG + DSD</h3>
              <p>Build-time static generation with Declarative Shadow DOM that hydrates instantly on the client.</p>
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-val">&lt;20KB</div>
              <div class="stat-label">runtime payload</div>
            </div>
            <div class="stat">
              <div class="stat-val">0KB</div>
              <div class="stat-label">static pages</div>
            </div>
            <div class="stat">
              <div class="stat-val">4</div>
              <div class="stat-label">runtimes</div>
            </div>
            <div class="stat">
              <div class="stat-val">100%</div>
              <div class="stat-label">web std</div>
            </div>
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

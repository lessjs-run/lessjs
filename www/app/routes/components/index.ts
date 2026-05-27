/**
 * Components landing page - v0.23 artifact-first.
 *
 * LessJS UI design system surface: gallery, tokens, CSS Parts, anatomy, states.
 */
export const meta = { section: 'Quick Start', label: 'Components', order: 2 };
export const tagName = 'page-components';

import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { headerNav, navSections } from 'virtual:less-nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    --ink: #14151d;
    --muted: #626676;
    --border: rgba(20,24,36,0.12);
    --accent: #5148b8;
    --success: #13795b;
  }

  .shell { max-width: 1120px; margin: 0 auto; padding: 44px 24px 72px; }

  h1 {
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
  }

  .lede {
    max-width: 680px;
    margin: 18px 0 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.75;
  }

  .grid {
    margin-top: 38px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  .card {
    border: 1px solid var(--border);
    border-radius: 8px;
    background: #fff;
    padding: 22px;
    text-decoration: none;
    color: inherit;
  }

  .card:hover { border-color: rgba(81,72,184,0.28); }
  .card h2 { margin: 0 0 8px; color: var(--ink); font-size: 17px; }
  .card p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    margin-bottom: 12px;
    padding: 0 8px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 750;
    color: var(--accent);
    border: 1px solid rgba(81,72,184,0.22);
    background: rgba(81,72,184,0.06);
  }

  @media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .shell { padding: 32px 16px 56px; } }
`);

export class ComponentsPage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/components"
        full-width
      >
        <div class="shell">
          <h1>Components</h1>
          <p class="lede">
            LessJS UI is a Web Components design system built on Open Props
            design tokens, CSS Custom Properties, and Lit SSR.
          </p>
          <div class="grid">
            <a class="card" href="/engine/design-system">
              <span class="chip">Design tokens</span>
              <h2>UI Gallery</h2>
              <p>less-layout, less-code-block, less-callout, less-dialog, and more.</p>
            </a>
            <a class="card" href="/engine/design-system">
              <span class="chip">Tokens</span>
              <h2>Design Tokens</h2>
              <p>Open Props color, size, radius, shadow, font, and easing scales.</p>
            </a>
            <a class="card" href="/engine/reference/core">
              <span class="chip">Anatomy</span>
              <h2>Component Anatomy</h2>
              <p>DsdElement lifecycle, render() contract, signal integration, and island upgrade.</p>
            </a>
            <a class="card" href="/engine/dsd">
              <span class="chip">States</span>
              <h2>Rendering States</h2>
              <p>SSR output, DSD hydration, island upgrade, loading, error, and empty states.</p>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-components', ComponentsPage);
export default ComponentsPage;

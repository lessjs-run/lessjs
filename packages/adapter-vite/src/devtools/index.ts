/**
 * @openelement/adapter-vite - DSD DevTools Plugin
 *
 * Injects a <less-devtool> custom element in dev mode for debugging
 * DSD rendering, hydration status, and island configuration.
 *
 * Only active in development (NODE_ENV !== 'production').
 * Zero runtime overhead in production builds.
 */

import type { Plugin } from 'vite';

/**
 * Vite plugin that injects the DSD DevTools panel in dev mode.
 * The panel is injected as an inline script to avoid additional requests.
 * Panel code is tree-shaken in production (plugin doesn't run).
 */
export function devtoolsPlugin(): Plugin {
  return {
    name: 'less:devtools',
    enforce: 'post',
    apply: 'serve', // Only in dev server mode

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: CLIENT_PANEL_CODE,
        },
        {
          tag: 'less-devtool',
          children: '',
        },
      ];
    },
  };
}

// --- Client-side DevTools Panel code ------------------------------
// This is injected as an inline <script type="module"> in dev mode.
// It defines the <less-devtool> custom element that provides:
//   - A floating toggle button (bottom-right corner)
//   - DSD Tree View showing component shadow roots
//   - Hydration status indicators
//   - Island information

const CLIENT_PANEL_CODE = `
// LessJS DevTools -DSD Debug Panel
(function() {
  const STYLES = \`
    <style>
      less-devtool { all: initial; font-family: system-ui, sans-serif; font-size: 13px; }
      less-devtool * { box-sizing: border-box; }
      .ljt-toggle {
        position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
        width: 40px; height: 40px; border-radius: 50%;
        background: #1a1a2e; color: #e0e0e0; border: 1px solid #333;
        cursor: pointer; font-size: 18px; display: flex; align-items: center;
        justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      }
      .ljt-toggle:hover { transform: scale(1.1); }
      .ljt-panel {
        position: fixed; bottom: 64px; right: 16px; z-index: 2147483647;
        width: 360px; max-height: 480px; overflow-y: auto;
        background: #1a1a2e; color: #e0e0e0; border: 1px solid #333;
        border-radius: 8px; padding: 12px; font-size: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        display: none; font-family: 'SF Mono', 'Consolas', monospace;
      }
      .ljt-panel.open { display: block; }
      .ljt-header { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #7ec8e3; }
      .ljt-section { margin: 6px 0; padding: 6px; background: #16213e; border-radius: 4px; }
      .ljt-row { display: flex; justify-content: space-between; padding: 2px 0; }
      .ljt-label { color: #888; }
      .ljt-value { color: #a8d8ea; }
      .ljt-badge {
        display: inline-block; padding: 1px 6px; border-radius: 3px;
        font-size: 10px; margin-left: 4px;
      }
      .ljt-badge.ok { background: #1b5e20; color: #a5d6a7; }
      .ljt-badge.warn { background: #e65100; color: #ffcc80; }
      .ljt-badge.info { background: #0d47a1; color: #90caf9; }
      .ljt-tree { list-style: none; padding-left: 16px; margin: 4px 0; }
      .ljt-tree li { position: relative; padding: 1px 0; }
      .ljt-tree li::before {
        content: ''; position: absolute; left: -12px; top: 0; bottom: 50%;
        border-left: 1px solid #333;
      }
      .ljt-tree li:last-child::before { border-left: none; }
      .ljt-tag { color: #f0a500; }
      .ljt-status { font-size: 10px; }
    </style>
  \`;

  class LessDevTool extends HTMLElement {
    private _panel: HTMLDivElement | null = null;

    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      if (!this.shadowRoot) return;
      this.shadowRoot.innerHTML = STYLES + \`
        <button class="ljt-toggle" id="toggle">🔧</button>
        <div class="ljt-panel" id="panel">
          <div class="ljt-header">LessJS DSD Inspector</div>
          <div id="ljt-content">Scanning page...</div>
        </div>
      \`;

      const toggle = this.shadowRoot.querySelector('#toggle')!;
      const panel = this.shadowRoot.querySelector('#panel') as HTMLDivElement;
      this._panel = panel;

      toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) this._scan();
      });

      // v0.14.10: Panel starts closed - scan only on explicit toggle open.
      // Avoids full querySelectorAll('*') on every page load in dev mode.
    }

    private _scan(): void {
      const content = this.shadowRoot?.getElementById('ljt-content');
      if (!content) return;

      const allElements = document.querySelectorAll('*');
      const ceList: Array<{ tag: string; hasShadow: boolean; hydrated: boolean }> = [];

      allElements.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (!tag.includes('-')) return; // Only custom elements

        const hasShadow = el.shadowRoot !== null;
        const hydrated = hasShadow && (el as Record<string, unknown>)._dsdHydrated === true;

        ceList.push({ tag, hasShadow, hydrated });
      });

      if (ceList.length === 0) {
        content.innerHTML = '<div class="ljt-section">No Custom Elements found on this page</div>';
        return;
      }

      const dsdCount = ceList.filter((c) => c.hasShadow).length;
      const hydratedCount = ceList.filter((c) => c.hydrated).length;
      const islandCount = ceList.filter((c) => c.hasShadow && !c.hydrated).length;

      let html = \`
        <div class="ljt-section">
          <div class="ljt-row"><span class="ljt-label">Custom Elements</span><span class="ljt-value">\${ceList.length}</span></div>
          <div class="ljt-row"><span class="ljt-label">DSD Shadow Roots</span><span class="ljt-value">\${dsdCount}</span></div>
          <div class="ljt-row"><span class="ljt-label">Hydrated (skipped)</span><span class="ljt-value">\${hydratedCount}</span></div>
          <div class="ljt-row"><span class="ljt-label">Pure Islands</span><span class="ljt-value">\${islandCount}</span></div>
        </div>
        <div class="ljt-section">
          <div class="ljt-header">Component Tree</div>
          <ul class="ljt-tree">
      \`;

      // Build tree from document body (simplified: show top-level CEs)
      const bodyCEs: Array<{ tag: string; hasShadow: boolean; hydrated: boolean }> = [];
      document.body.querySelectorAll(':scope > *').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag.includes('-')) {
          const ce = ceList.find((c) => c.tag === tag);
          if (ce) bodyCEs.push(ce);
        }
      });

      // Show all CEs sorted by tag
      ceList.sort((a, b) => a.tag.localeCompare(b.tag)).forEach((ce) => {
        const status = ce.hydrated
          ? '<span class="ljt-badge ok">skip</span>'
          : ce.hasShadow
            ? '<span class="ljt-badge info">DSD</span>'
            : '<span class="ljt-badge warn">pending</span>';
        html += \`<li><span class="ljt-tag">&lt;\${ce.tag}&gt;</span> \${status}</li>\`;
      });

      html += '</ul></div>';

      // Add runtime checks
      html += \`
        <div class="ljt-section">
          <div class="ljt-header">Runtime Checks</div>
          <div class="ljt-row">
            <span class="ljt-label">DSD Polyfill</span>
            <span class="ljt-value">\${typeof HTMLTemplateElement.prototype.shadowRootMode !== 'undefined' ? '✓ Native' : '⚠ Polyfill'}</span>
          </div>
          <div class="ljt-row">
            <span class="ljt-label">Navigation API</span>
            <span class="ljt-value">\${'navigation' in window ? '✓ Supported' : '⚠ History API fallback'}</span>
          </div>
        </div>
      \`;

      content.innerHTML = html;
    }
  }

  customElements.define('less-devtool', LessDevTool);
})();
`;

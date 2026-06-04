/**
 * @openelement/adapter-vite - DSD DevTools Plugin
 *
 * Injects a <open-devtool> custom element in dev mode for debugging
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
    name: 'open:devtools',
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
          tag: 'open-devtool',
          children: '',
        },
      ];
    },
  };
}

// --- Client-side DevTools Panel code ------------------------------
// This is injected as an inline <script type="module"> in dev mode.
// It defines the <open-devtool> custom element that provides:
//   - A floating toggle button (bottom-right corner)
//   - DSD Tree View showing component shadow roots
//   - Hydration status indicators
//   - Island information

const CLIENT_PANEL_CODE = `
// openElement DevTools -DSD Debug Panel
(function() {
  const STYLES = \`
    <style>
      open-devtool { all: initial; font-family: system-ui, sans-serif; font-size: 13px; }
      open-devtool * { box-sizing: border-box; }
      .oed-toggle {
        position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
        width: 40px; height: 40px; border-radius: 50%;
        background: #1a1a2e; color: #e0e0e0; border: 1px solid #333;
        cursor: pointer; font-size: 18px; display: flex; align-items: center;
        justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      }
      .oed-toggle:hover { transform: scale(1.1); }
      .oed-panel {
        position: fixed; bottom: 64px; right: 16px; z-index: 2147483647;
        width: 360px; max-height: 480px; overflow-y: auto;
        background: #1a1a2e; color: #e0e0e0; border: 1px solid #333;
        border-radius: 8px; padding: 12px; font-size: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        display: none; font-family: 'SF Mono', 'Consolas', monospace;
      }
      .oed-panel.open { display: block; }
      .oed-header { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #7ec8e3; }
      .oed-section { margin: 6px 0; padding: 6px; background: #16213e; border-radius: 4px; }
      .oed-row { display: flex; justify-content: space-between; padding: 2px 0; }
      .oed-label { color: #888; }
      .oed-value { color: #a8d8ea; }
      .oed-badge {
        display: inline-block; padding: 1px 6px; border-radius: 3px;
        font-size: 10px; margin-left: 4px;
      }
      .oed-badge.ok { background: #1b5e20; color: #a5d6a7; }
      .oed-badge.warn { background: #e65100; color: #ffcc80; }
      .oed-badge.info { background: #0d47a1; color: #90caf9; }
      .oed-tree { list-style: none; padding-left: 16px; margin: 4px 0; }
      .oed-tree li { position: relative; padding: 1px 0; }
      .oed-tree li::before {
        content: ''; position: absolute; left: -12px; top: 0; bottom: 50%;
        border-left: 1px solid #333;
      }
      .oed-tree li:last-child::before { border-left: none; }
      .oed-tag { color: #f0a500; }
      .oed-status { font-size: 10px; }
    </style>
  \`;

  class OpenDevTool extends HTMLElement {
    private _panel: HTMLDivElement | null = null;

    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      if (!this.shadowRoot) return;
      this.shadowRoot.innerHTML = STYLES + \`
        <button class="oed-toggle" id="toggle">DSD</button>
        <div class="oed-panel" id="panel">
          <div class="oed-header">openElement DSD Inspector</div>
          <div id="oed-content">Scanning page...</div>
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
      const content = this.shadowRoot?.getElementById('oed-content');
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
        content.innerHTML = '<div class="oed-section">No Custom Elements found on this page</div>';
        return;
      }

      const dsdCount = ceList.filter((c) => c.hasShadow).length;
      const hydratedCount = ceList.filter((c) => c.hydrated).length;
      const islandCount = ceList.filter((c) => c.hasShadow && !c.hydrated).length;

      let html = \`
        <div class="oed-section">
          <div class="oed-row"><span class="oed-label">Custom Elements</span><span class="oed-value">\${ceList.length}</span></div>
          <div class="oed-row"><span class="oed-label">DSD Shadow Roots</span><span class="oed-value">\${dsdCount}</span></div>
          <div class="oed-row"><span class="oed-label">Hydrated (skipped)</span><span class="oed-value">\${hydratedCount}</span></div>
          <div class="oed-row"><span class="oed-label">Pure Islands</span><span class="oed-value">\${islandCount}</span></div>
        </div>
        <div class="oed-section">
          <div class="oed-header">Component Tree</div>
          <ul class="oed-tree">
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
          ? '<span class="oed-badge ok">skip</span>'
          : ce.hasShadow
            ? '<span class="oed-badge info">DSD</span>'
            : '<span class="oed-badge warn">pending</span>';
        html += \`<li><span class="oed-tag">&lt;\${ce.tag}&gt;</span> \${status}</li>\`;
      });

      html += '</ul></div>';

      // Add runtime checks
      html += \`
        <div class="oed-section">
          <div class="oed-header">Runtime Checks</div>
          <div class="oed-row">
            <span class="oed-label">DSD Polyfill</span>
            <span class="oed-value">\${typeof HTMLTemplateElement.prototype.shadowRootMode !== 'undefined' ? 'Native' : 'Polyfill'}</span>
          </div>
          <div class="oed-row">
            <span class="oed-label">Navigation API</span>
            <span class="oed-value">\${'navigation' in window ? 'Supported' : 'History API fallback'}</span>
          </div>
        </div>
      \`;

      content.innerHTML = html;
    }
  }

  customElements.define('open-devtool', OpenDevTool);
})();
`;

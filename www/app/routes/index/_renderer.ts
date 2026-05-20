/**
 * _renderer.ts — Layout renderer for the index/homepage section.
 *
 * Injects DSD for the LessShowcasePanel and other islands that need
 * declarative shadow DOM hydration.
 *
 * @see {@link ../../packages/core/src/types.ts} for LessRenderer interface
 */

import type { LessRenderer } from '@lessjs/core';

// DSD for LessShowcasePanel — Lit renders the full content, DSD provides styles
// This ensures the showcase panel hydrates properly on the client side.
const SHOWCASE_PANEL_DSD = '<less-showcase-panel><template shadowrootmode="open"><style>:host{display:block}.tab-bar{display:flex;gap:4px;border-bottom:1px solid var(--less-border);margin-bottom:16px}.tab-item{padding:10px 18px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;color:var(--less-text-tertiary,#71717a);font-size:13px;font-weight:500;transition:border-color 200ms ease-out,color 200ms ease-out;display:flex;align-items:center;gap:8px;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit}.tab-item:hover{color:var(--less-text-secondary)}.tab-item[active]{border-bottom-color:var(--less-brand,#534AB7);color:var(--less-brand,#534AB7)}.tab-tag{display:inline-block;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding:2px 8px;border-radius:4px}.tab-tag.lit{background:#e6f1fb;color:#185fa5}.tab-tag.react{background:#e1f0ff;color:#0d6efd}.tab-tag.vanilla{background:#e1f5ee;color:#0f6e56}.showcase-content{display:grid;grid-template-columns:1fr 1fr;gap:16px}.showcase-left{background:var(--less-bg-surface);border:1px solid var(--less-border);border-radius:12px;padding:1.25rem;min-height:200px;display:flex;flex-direction:column}.showcase-right{background:#0d0d12;border-radius:12px;border:1px solid rgba(255,255,255,0.06);overflow:hidden}.code-bar{display:flex;align-items:center;gap:5px;padding:10px 16px 0}.code-bar i{width:8px;height:8px;border-radius:50%;display:inline-block}.code-bar .r{background:#ff5f57}.code-bar .y{background:#febc2e}.code-bar .g{background:#28c840}.code-bar span{color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-left:5px}.showcase-footer{margin-top:14px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--less-border)}.adapter-desc{font-size:12px;color:var(--less-text-secondary)}.install-cmd{font-family:"JetBrains Mono","SF Mono","Fira Code",Consolas,monospace;font-size:12px;color:var(--less-text-primary);background:var(--less-code-bg);padding:4px 10px;border-radius:4px;border:0.5px solid var(--less-code-border)}@media(max-width:760px){.showcase-content{grid-template-columns:1fr}.tab-bar{flex-wrap:wrap;gap:0}}</style></template></less-showcase-panel>';

const renderer: LessRenderer = {
  wrap(html: string) {
    // Inject DSD for LessShowcasePanel into the HTML
    // This enables proper hydration on the client side
    const showcasePanelOpen = html.indexOf('<less-showcase-panel');
    if (showcasePanelOpen >= 0) {
      const closeGt = html.indexOf('>', showcasePanelOpen);
      if (closeGt > 0) {
        html = html.slice(0, closeGt + 1) +
          SHOWCASE_PANEL_DSD +
          html.slice(closeGt + 1);
      }
    }

    return html;
  },
};

export default renderer;

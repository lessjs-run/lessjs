/**
 * /guide/architecture — kept for E2E compatibility.
 *
 * The canonical architecture page is at /architecture.
 * This page renders a minimal DSD layout so that SSG post-processing
 * properly injects view-transition and speculation rules meta tags.
 */
export const meta = { section: 'Quick Start', label: 'Architecture', order: 10 };
export const tagName = 'guide-architecture';

import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; }
  .shell { max-width:900px; margin:0 auto; padding:44px var(--size-6) 72px; }
  h1 { color:var(--gray-10); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  p { color:var(--gray-7); font-size:var(--font-size-4); line-height:var(--font-lineheight-4); }
  a { color:var(--indigo-5); font-weight:var(--font-weight-7); }
`);

export class GuideArchitecturePage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return (
      
        <div class='shell'>
          <h1>Architecture</h1>
          <p>{isZh
            ? '架构文档已迁移到新的<a href="/architecture">Architecture 分区</a>。'
            : 'The architecture documentation has moved to the new <a href="/architecture">Architecture section</a>.'}</p>
          <p>{isZh
            ? 'openElement v0.36.4 的当前架构是 20 包分层：protocols、runtime kernel、product facades、SSG engine、build adapters、feature packages。@openelement/ssg 拥有 route scanning、entry generation 和 generated data resolution；adapter-vite 只保留 Vite orchestration。'
            : 'openElement v0.36.4 is a 20-package layered architecture: protocols, runtime kernel, product facades, SSG engine, build adapters, and feature packages. @openelement/ssg owns route scanning, entry generation, and generated data resolution; adapter-vite keeps Vite orchestration.'}</p>
        </div>
      
    );
  }
}

customElements.define('guide-architecture', GuideArchitecturePage);
export default GuideArchitecturePage;

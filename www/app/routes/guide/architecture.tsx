/**
 * /guide/architecture — kept for E2E compatibility.
 *
 * The canonical architecture page is at /architecture (v0.23 redesign).
 * This page renders a minimal DSD layout so that SSG post-processing
 * properly injects view-transition and speculation rules meta tags.
 */
export const meta = { section: 'Quick Start', label: 'Architecture', order: 10 };
export const tagName = 'guide-architecture';

import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { headerNav, navSections } from '@lessjs/content/nav';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import '@lessjs/ui/less-layout';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display:block; }
  .shell { max-width:900px; margin:0 auto; padding:44px var(--size-6) 72px; }
  h1 { color:var(--text-primary); font-size:clamp(2.2rem,6vw,4rem); line-height:0.95; }
  p { color:var(--text-secondary); font-size:var(--font-size-4); line-height:var(--font-lineheight-4); }
  a { color:var(--brand); font-weight:var(--font-weight-7); }
`);

export class GuideArchitecturePage extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  override render() {
    const isZh = this._getLocale('zh') === 'zh';
    return `
      <less-layout
        locale="${this._getLocale('en')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/guide/architecture"
      >
        <div class="shell">
          <h1>Architecture</h1>
          <p>${
      isZh
        ? '架构文档已迁移到新的<a href="/architecture">Architecture 分区</a>（v0.23 重新设计）。'
        : 'The architecture documentation has moved to the new <a href="/architecture">Architecture section</a> (v0.23 redesign).'
    }</p>
          <p>${
      isZh
        ? 'LessJS v0.23.0 实现了分层包架构：protocols、runtime kernel、product facades、build adapters、feature packages。每次发布前机械检查包图。无向后兼容——旧路径移除而非桥接。WC Package Protocol。六阶段愿景。无 webpack。Registry Hub。'
        : 'LessJS v0.23.0 implements a layered package architecture: protocols, runtime kernel, product facades, build adapters, and feature packages. The package graph is checked mechanically before every publish. No backward compatibility — old paths removed, not bridged. WC Package Protocol. Six-Phase Vision. No webpack. Registry Hub.'
    }</p>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('guide-architecture', GuideArchitecturePage);
export default GuideArchitecturePage;

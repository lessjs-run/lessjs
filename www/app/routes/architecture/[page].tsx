/**
 * Architecture Page - Thin MD Content Loader
 *
 * Single dynamic route for all architecture pages.
 * Reads MD content from www/content/architecture/{locale}/{page}.md.
 * Replaces 9 individual TSX files.
 * ADR-0063 / SOP-003 Phase 3.
 */
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'page-architecture';

/** All architecture page slugs for SSG path discovery */
export function getStaticPaths(): Array<Record<string, string>> {
  return [
    { page: 'architecture' },
    { page: 'comparison' },
    { page: 'dsd' },
    { page: 'islands' },
    { page: 'islands-deep' },
    { page: 'package-compatibility' },
    { page: 'standards-registry' },
    { page: 'benchmark' },
    { page: 'design-system' },
  ];
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .doc-content h2 { margin-top: var(--size-10); }
    .doc-content h3 { margin-top: var(--size-8); }
    .doc-content p { margin: var(--size-3) 0; }
    .doc-content ul, .doc-content ol { padding-left: var(--size-6); margin: var(--size-3) 0; }
    .doc-content li { margin: 0.375rem 0; }
    .doc-content a { color: var(--brand); text-decoration: underline; }
    .not-found { text-align: center; padding: var(--size-12) var(--size-4); color: var(--text-muted); }
    .step { margin: var(--size-6) 0 var(--size-8); }
    .step h2 { margin-top: 0; }
  `,
);

function parseAndRender(raw: string): { meta: Record<string, unknown>; html: string } {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, html: raw };

  const yamlBlock = fmMatch[1];
  const content = fmMatch[2];
  const meta: Record<string, unknown> = {};

  for (const line of yamlBlock.split('\n')) {
    const kv = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      let value: unknown = kv[2].trim();
      if (/^\d+$/.test(value as string)) {
        value = parseInt(value as string);
      } else if ((value as string).startsWith('"') || (value as string).startsWith("'")) {
        value = (value as string).slice(1, -1);
      }
      meta[key] = value;
    }
  }

  return { meta, html: content };
}

export default class ArchitecturePage extends DsdElement {
  page = '';

  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    const locale = this._getLocale('zh');
    const page = this.page;
    if (!page) {
      return this._render404(locale);
    }

    const data = this._loadPage(locale, page);
    if (!data) {
      return this._render404(locale);
    }

    return this._renderPage(locale, page, data.html);
  }

  private _loadPage(locale: string, page: string): { meta: Record<string, unknown>; html: string } | null {
    try {
      const raw = Deno.readTextFileSync(
        `www/content/architecture/${locale}/${page}.md`,
      );
      return parseAndRender(raw);
    } catch {
      return null;
    }
  }

  private _renderPage(locale: string, page: string, html: string) {
    const localePrefix = locale === 'en' ? '/en' : '';
    return `
      <less-layout
        locale="${locale}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="${localePrefix}/architecture/${page}"
      >
        <div class="container">
          <div class="doc-content">
            ${html}
          </div>
        </div>
      </less-layout>`;
  }

  private _render404(locale: string) {
    const localePrefix = locale === 'en' ? '/en' : '';
    return `
      <less-layout
        locale="${locale}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="${localePrefix}/architecture"
      >
        <div class="container">
          <div class="not-found">
            <h1>404</h1>
            <p>${locale === 'en' ? 'Page not found' : '页面未找到'}: ${this.page}</p>
            <a href="${localePrefix}/architecture/architecture">
              ${locale === 'en' ? '← Back to Architecture' : '← 返回架构'}
            </a>
          </div>
        </div>
      </less-layout>`;
  }
}

customElements.define(tagName, ArchitecturePage);

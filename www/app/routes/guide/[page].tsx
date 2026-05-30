/**
 * Guide Page - Thin MD Content Loader
 *
 * Single dynamic route for all guide pages.
 * Reads MD content from www/content/guide/{locale}/{page}.md.
 * Replaces 9 individual TSX files with _renderEn()/_renderZh() patterns.
 * ADR-0063 / SOP-003 Phase 3.
 */
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'page-guide';

/** All guide page slugs for SSG path discovery */
export function getStaticPaths(): Array<Record<string, string>> {
  return [
    { page: 'getting-started' },
    { page: 'core-concepts' },
    { page: 'routing-and-data' },
    { page: 'islands-and-ssr' },
    { page: 'api' },
    { page: 'deployment' },
    { page: 'configuration' },
    { page: 'error-handling' },
    { page: 'testing' },
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

/**
 * Parse YAML frontmatter and render markdown to HTML (synchronous for SSG).
 */
function parseAndRender(raw: string): { meta: Record<string, unknown>; html: string } {
  // Parse frontmatter
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

  // The content is already HTML (from TSX extraction), so we pass through directly
  return { meta, html: content };
}

export default class GuidePage extends DsdElement {
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
        `www/content/guide/${locale}/${page}.md`,
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
        current-path="${localePrefix}/guide/${page}"
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
        current-path="${localePrefix}/guide"
      >
        <div class="container">
          <div class="not-found">
            <h1>404</h1>
            <p>${locale === 'en' ? 'Page not found' : '页面未找到'}: ${this.page}</p>
            <a href="${localePrefix}/guide/getting-started">
              ${locale === 'en' ? '← Back to Getting Started' : '← 返回快速开始'}
            </a>
          </div>
        </div>
      </less-layout>`;
  }
}

customElements.define(tagName, GuidePage);

/**
 * Changelog Page - LessJS Framework Version History
 *
 * Reads CHANGELOG.md at build time. Single source of truth —
 * edit CHANGELOG.md, the page updates automatically.
 *
 * Uses a self-contained markdown renderer (no npm deps) so it
 * works in the SSR bundle without external package resolution.
 */
export const meta = { section: '', label: 'Changelog', order: 20 };
import { headerNav, navSections } from '@lessjs/content/nav';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../components/page-styles.js';
const pageSheet = new StyleSheet();
pageSheet.replaceSync(pageStyles);
import '@lessjs/ui/less-layout';
import '../islands/less-search.tsx';

const routeSheet = new StyleSheet();

routeSheet.replaceSync(`
      .changelog-content h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 2rem 0 0 0;
        padding: 1.5rem 1.5rem 0.25rem 1.5rem;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-bottom: none;
        border-radius: 6px 6px 0 0;
      }
      .changelog-content h2 + blockquote {
        margin: 0;
        padding: 0 1.5rem 0.75rem 1.5rem;
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .changelog-content h3 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--brand);
        margin: 0;
        padding: 0.75rem 1.5rem 0.25rem 1.5rem;
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
      }
      .changelog-content h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        padding: 0.5rem 1.5rem 0 1.5rem;
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
      }
      .changelog-content ul {
        list-style: none;
        padding: 0.25rem 1.5rem 0.5rem 2.5rem;
        margin: 0;
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
      }
      .changelog-content li {
        padding: 0.375rem 0 0.375rem 1.25rem;
        position: relative;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
      .changelog-content li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--text-muted);
      }
      .changelog-content p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin: 0;
        padding: 0.25rem 1.5rem;
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
      }
      .changelog-content blockquote {
        margin: 0;
        padding: 0.5rem 1.5rem;
        border-left: 3px solid var(--brand);
        background: var(--bg-surface);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      .changelog-content code {
        font-family: var(--font-mono, monospace);
        font-size: 0.8125rem;
        background: var(--bg-elevated);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
      }
      .changelog-content pre {
        background: var(--bg-elevated);
        padding: 1rem;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.8125rem;
        margin: 0.5rem 0;
      }
      .changelog-content pre code {
        background: none;
        padding: 0;
      }
      .changelog-content hr {
        border: none;
        border-top: 0.5px solid var(--border);
        margin: 1.5rem 0;
      }
      .changelog-content strong {
        color: var(--text-primary);
      }
      .changelog-content .suffix {
        background: var(--bg-surface);
        border-left: 0.5px solid var(--border);
        border-right: 0.5px solid var(--border);
        border-bottom: 0.5px solid var(--border);
        border-radius: 0 0 6px 6px;
        padding: 0 1.5rem 1.5rem 1.5rem;
        height: 1rem;
      }
      .nav-row {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 0.5px solid var(--border);
      }
      .nav-link {
        color: var(--brand);
        text-decoration: none;
        font-size: 0.875rem;
      }
      .nav-link:hover {
        text-decoration: underline;
      }
    `);

/**
 * Self-contained markdown renderer for CHANGELOG.md.
 * Only handles the patterns actually used: h2, h3, h4, ul, li, code, blockquote, p, hr, strong.
 */
function renderChangelog(md: string): string {
  let html = '';
  let inSection = false;

  for (const raw of md.split('\n')) {
    const line = raw;

    // h2: ## vX.Y.Z — description (date)
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      if (inSection) html += '<div class="suffix"></div>\n';
      inSection = true;
      // Split version number from rest: "v0.24.3 — description"
      const title = h2[1];
      const dashIdx = title.indexOf(' — ');
      if (dashIdx > 0) {
        const ver = title.slice(0, dashIdx);
        const desc = title.slice(dashIdx + 3);
        html += `<h2><span style="margin-right:0.75rem">${
          esc(ver)
        }</span><span style="font-weight:400;font-size:0.875rem;color:var(--text-muted)">${
          esc(desc)
        }</span></h2>\n`;
      } else {
        html += `<h2>${esc(title)}</h2>\n`;
      }
      continue;
    }

    // h3: ### Title
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      html += `<h3>${esc(h3[1])}</h3>\n`;
      continue;
    }

    // h4: #### Title
    const h4 = line.match(/^#### (.+)$/);
    if (h4) {
      html += `<h4>${esc(h4[1])}</h4>\n`;
      continue;
    }

    // hr: ---
    if (line.match(/^---+$/)) {
      html += '<hr>\n';
      continue;
    }

    // blockquote: > text
    const bq = line.match(/^> ?(.+)$/);
    if (bq) {
      html += `<blockquote>${renderInline(bq[1])}</blockquote>\n`;
      continue;
    }

    // unordered list: - item or * item
    const li = line.match(/^[-*] (.+)$/);
    if (li) {
      html += `<ul><li>${renderInline(li[1])}</li></ul>\n`;
      continue;
    }

    // paragraph (non-empty, non-blank)
    if (line.trim()) {
      // Skip link refs like [Keep a Changelog]: ...
      if (line.match(/^\[.+\]: /)) continue;
      html += `<p>${renderInline(line)}</p>\n`;
    }
  }

  if (inSection) html += '<div class="suffix"></div>\n';
  return html;
}

/** Render inline markdown: **bold**, `code`, [link](url) */
function renderInline(text: string): string {
  return esc(text)
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // `code`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // [link](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/** Escape HTML special chars */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export class ChangelogPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageSheet, routeSheet];

  override render() {
    const changelogPath = new URL('../../../../CHANGELOG.md', import.meta.url);
    let renderedHtml: string;
    try {
      const changelogMd = Deno.readTextFileSync(changelogPath);
      renderedHtml = renderChangelog(changelogMd);
    } catch {
      renderedHtml =
        '<p>无法加载更新日志。请查看 <a href="https://github.com/lessjs-run/lessjs/blob/main/CHANGELOG.md">GitHub</a>。</p>';
    }

    return `
      <less-layout
        locale="${this._getLocale('zh')}"
        locales='${JSON.stringify(['en', 'zh'])}'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/changelog"
        full-width
      >
        <div class="container">
          <h1>更新日志</h1>
          <p class="subtitle">
            LessJS 的所有重要变更都记录在这里。
          </p>

          <p>
            格式基于
            <a href="https://keepachangelog.com/zh-CN/1.0.0/" target="_blank"
            >Keep a Changelog</a>，本项目遵循
            <a href="https://semver.org/lang/zh-CN/" target="_blank">语义化版本 2.0.0</a>。
            历史条目保留当时术语；当前文档统一把 LessJS 的客户端模型称为 Island Upgrade。
          </p>

          <div class="changelog-content">
            ${renderedHtml}
          </div>

          <div class="nav-row">
            <a href="/roadmap" class="nav-link">&larr; 开发计划</a>
            <a href="/guide/getting-started" class="nav-link">快速上手 &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-changelog', ChangelogPage);
export default ChangelogPage;
export const tagName = 'page-changelog';

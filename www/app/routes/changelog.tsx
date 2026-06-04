/**
 * Changelog Page - openElement Framework Version History
 *
 * Reads CHANGELOG.md at build time via marked. Single source of truth.
 * v0.27.0: Replaced 98-line manual markdown renderer with marked.
 */
export const meta = { section: '', label: 'Changelog', order: 20 };
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import { pageStyles } from '../components/page-styles.js';
import { marked } from 'marked';
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'npm:sanitize-html@^2.17.4';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host { display: block; }
` + pageStyles);

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host { display: block; }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: var(--size-10) var(--size-6) var(--size-16);
  }

  h1 {
    font-size: var(--font-size-7);
    font-weight: var(--font-weight-9);
    margin: 0 0 var(--size-3);
    color: var(--gray-10);
    line-height: var(--font-lineheight-1);
  }

  .subtitle {
    color: var(--gray-6);
    margin-bottom: var(--size-12);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-3);
  }

  p {
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-4);
    color: var(--gray-10);
    margin: var(--size-2) 0;
  }

  a { color: var(--indigo-5); }

  .changelog-content {
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-4);
    color: var(--gray-10);
  }
  .changelog-content h2 {
    font-size: var(--font-size-5);
    font-weight: var(--font-weight-7);
    color: var(--gray-10);
    margin: var(--size-10) 0 var(--size-4);
    border-bottom: 0.5px solid var(--gray-3);
    padding-bottom: var(--size-4);
  }
  .changelog-content h3 {
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-6);
    color: var(--gray-10);
    margin: var(--size-6) 0 var(--size-2);
  }
  .changelog-content h4 {
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    color: var(--gray-7);
    margin: var(--size-4) 0 var(--size-2);
  }
  .changelog-content ul {
    padding-left: var(--size-5);
    color: var(--gray-7);
    line-height: var(--font-lineheight-4);
    font-size: var(--font-size-1);
  }
  .changelog-content li { margin: var(--size-1) 0; }
  .changelog-content code {
    font-family: var(--font-mono);
    background: var(--gray-2);
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    color: var(--gray-7);
    border: 0.5px solid var(--code-border);
  }
  .changelog-content pre {
    background: var(--gray-2);
    color: var(--gray-7);
    padding: var(--size-5) var(--size-6);
    border-radius: var(--radius-3);
    overflow-x: auto;
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-4);
    margin: var(--size-4) 0;
    border: 0.5px solid var(--code-border);
  }
  .changelog-content pre code {
    background: none;
    padding: 0;
    border: none;
    font-size: inherit;
  }
  .changelog-content hr {
    border: none;
    border-top: 0.5px solid var(--gray-3);
    margin: var(--size-6) 0;
  }
  .changelog-content strong { color: var(--gray-10); }
  .changelog-content blockquote {
    border-left: 3px solid var(--indigo-5);
    background: var(--gray-1);
    padding: var(--size-3) var(--size-5);
    margin: var(--size-4) 0;
    border-radius: 0 var(--radius-3) var(--radius-3) 0;
    color: var(--gray-7);
    font-size: var(--font-size-0);
  }

  .nav-row {
    display: flex;
    justify-content: space-between;
    margin-top: var(--size-8);
    padding-top: var(--size-4);
    border-top: 0.5px solid var(--gray-3);
  }
  .nav-link {
    color: var(--indigo-5);
    text-decoration: none;
    font-size: var(--font-size-1);
  }
  .nav-link:hover { text-decoration: underline; }

  @media (max-width: 900px) {
    .container { padding: var(--size-8) var(--size-5) var(--size-12); }
    h1 { font-size: var(--font-size-6); }
    .changelog-content h2 { font-size: var(--font-size-4); }
  }
  @media (max-width: 480px) {
    .container { padding: var(--size-6) var(--size-4) var(--size-10); }
    h1 { font-size: var(--font-size-5); }
    .changelog-content h2 { font-size: var(--font-size-3); }
    p { font-size: var(--font-size-0); }
  }
`);

export class ChangelogPage extends DsdElement {
  static override styles = [openPropsTokenSheet, pageSheet, routeSheet];

  override render() {
    const changelogPath = new URL('../../../../CHANGELOG.md', import.meta.url);
    let html: string;
    try {
      const md = Deno.readTextFileSync(changelogPath);
      const raw = marked.parse(md, { async: false }) as string;
      html = sanitizeHtml(raw, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h2', 'h3', 'h4', 'img']),
        allowedAttributes: { a: ['href', 'target', 'rel'] },
      });
    } catch {
      html =
        '<p>无法加载更新日志。请查看 <a href="https://github.com/open-element/open-element/blob/main/CHANGELOG.md">GitHub</a>。</p>';
    }

    return (
      
        <div class='container'>
          <h1>更新日志</h1>
          <p class='subtitle'>LessJS 的所有重要变更都记录在这里。</p>
          <p>
            格式基于{' '}
            <a href='https://keepachangelog.com/zh-CN/1.0.0/' target='_blank'>Keep a Changelog</a>，本项目遵循{' '}
            <a href='https://semver.org/lang/zh-CN/' target='_blank'>语义化版本 2.0.0</a>。
            历史条目保留当时术语；当前文档统一把 LessJS 的客户端模型称为 Island Upgrade。
          </p>
          <div class='changelog-content' innerHTML={html} trustedHtml={true} />
          <div class='nav-row'>
            <a href='/roadmap' class='nav-link'>&larr; 开发计划</a>
            <a href='/guide/getting-started' class='nav-link'>快速上手 &rarr;</a>
          </div>
        </div>
      
    );
  }
}

customElements.define('page-changelog', ChangelogPage);
export default ChangelogPage;
export const tagName = 'page-changelog';

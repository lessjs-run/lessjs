/**
 * Contributing Page - LessJS Framework Contribution Guide
 */
export const meta = { section: '', label: 'Contributing', order: 30 };
import { headerNav, navSections } from 'virtual:less-nav';
import { DsdElement, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';
import '@lessjs/ui/less-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      .layer-diagram {
        padding: 1.25rem;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 6px;
        margin: 1.5rem 0;
        font-size: 0.8125rem;
        line-height: 1.8;
        font-family: "SF Mono", monospace;
        white-space: pre;
        overflow-x: auto;
        color: var(--text-secondary);
      }
      .commit-types {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .commit-type {
        padding: 0.75rem 1rem;
        background: var(--bg-surface);
        border: 0.5px solid var(--border);
        border-radius: 4px;
        font-size: 0.875rem;
      }
      .commit-type code {
        color: var(--brand);
        font-weight: 600;
      }
    `,
);

export class ContributingPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return `<less-layout locale="${this._getLocale('zh')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(navSections)}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/contributing" home><div class="container">
    <h1>Contributing to LessJS</h1>
    <p class="subtitle">感谢你对 LessJS 框架的兴趣！</p>
    <h2>开发环境设置</h2>
    <less-code-block><pre><code>git clone https://github.com/lessjs-run/LessJS.git
cd lessjs
deno install
deno task test
deno task docs:dev</code></pre></less-code-block>
    <h2>Deno-first 工具链</h2>
    <p>LessJS 的 core CLI、SSG、Serverless API、测试、发布和文档站任务都以 Deno 2.7+ 为默认运行环境。</p>
    <h2>开发规范</h2>
    <ul><li>代码风格：deno fmt + deno lint</li><li>提交规范：Conventional Commits（feat/fix/docs/refactor/test/chore）</li><li>分层原则：在添加新功能前，检查是否可以用更低层级解决（L0 HTML -> L1 CSS -> L2 Browser API -> L3 Hono/Vite/Lit -> L4 自研代码）</li></ul>
    <h2>发布流程</h2>
    <ol><li>更新版本号（packages/*/deno.json）</li><li>更新 changelog</li><li>运行测试</li><li>发布到 JSR</li><li>创建 GitHub Release</li></ol>
    <div class="nav-row"><a href="/changelog" class="nav-link">&larr; Changelog</a><a href="/roadmap" class="nav-link">Roadmap &rarr;</a></div>
  </div></less-layout>`;
  }

  private _renderEn() {
    return `<less-layout locale="${this._getLocale('en')}" locales='${
      JSON.stringify(['en', 'zh'])
    }' nav-items='${JSON.stringify(navSections)}' header-nav='${
      JSON.stringify(headerNav)
    }' current-path="/en/contributing" home><div class="container">
    <h1>Contributing to LessJS</h1>
    <p class="subtitle">Thank you for your interest in the LessJS framework!</p>
    <h2>Development Setup</h2>
    <less-code-block><pre><code>git clone https://github.com/lessjs-run/LessJS.git
cd lessjs
deno install
deno task test
deno task docs:dev</code></pre></less-code-block>
    <h2>Deno-first Toolchain</h2>
    <p>LessJS core CLI, SSG, serverless API, tests, publishing, and docs site tasks all use Deno 2.7+ as the default runtime. Vite 8 runs via <span class="inline-code">deno run -A npm:vite</span> - no <span class="inline-code">npm</span> or <span class="inline-code">npx</span> needed for the main workflow.</p>
    <h2>Development Conventions</h2>
    <ul><li><strong>Code style</strong>: Use <span class="inline-code">deno fmt</span> + <span class="inline-code">deno lint</span></li><li><strong>Commits</strong>: Conventional Commits (<span class="inline-code">feat</span>/<span class="inline-code">fix</span>/<span class="inline-code">docs</span>/<span class="inline-code">refactor</span>/<span class="inline-code">test</span>/<span class="inline-code">chore</span>)</li><li><strong>Layering</strong>: Before adding a new feature, check if it can be solved at a lower level (L0 HTML -> L1 CSS -> L2 Browser API -> L3 Hono/Vite/Lit -> L4 Custom code)</li></ul>
    <h2>Release Process</h2>
    <ol><li>Update version numbers (<span class="inline-code">packages/*/deno.json</span>)</li><li>Update changelog</li><li>Run tests: <span class="inline-code">deno task test</span></li><li>Publish to JSR: <span class="inline-code">deno task publish</span></li><li>Create GitHub Release</li></ol>
    <div class="nav-row"><a href="/changelog" class="nav-link">&larr; Changelog</a><a href="/roadmap" class="nav-link">Roadmap &rarr;</a></div>
  </div></less-layout>`;
  }
}

customElements.define('page-contributing', ContributingPage);
export default ContributingPage;
export const tagName = 'page-contributing';

/**
 * Blog: KISS v0.5-alpha1 — 全量架构审计与精准修复
 */
import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '@kissjs/ui/kiss-layout';

export const tagName = 'blog-v0-5-alpha1';

export default class BlogV05Alpha1 extends LitElement {
  static styles = [
    pageStyles,
    css`
      h2 { margin-top: 2rem; }
      h3 { margin-top: 1.5rem; font-size: 1.1rem; }
      .truth {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1.25rem;
        margin: 1.5rem 0;
      }
      .truth-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--kiss-text-primary);
      }
      code {
        background: var(--kiss-code-bg);
        padding: 0.125rem 0.375rem;
        border: 0.5px solid var(--kiss-border);
        border-radius: 3px;
        font-size: 0.8125rem;
      }
      pre {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem;
        overflow-x: auto;
        font-size: 0.8125rem;
      }
      pre code {
        background: none;
        border: none;
        padding: 0;
        font-size: inherit;
      }
      .bug-card {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1.25rem;
        margin: 1.25rem 0;
        border-left: 3px solid var(--kiss-primary);
      }
      .bug-card .bug-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--kiss-primary);
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      .principle {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1.25rem;
        margin: 1rem 0;
      }
      .principle-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: var(--kiss-text-primary);
      }
      .new-badge {
        display: inline-block;
        background: var(--kiss-primary);
        color: #fff;
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        vertical-align: middle;
        margin-left: 0.5rem;
      }
      .phase {
        background: var(--kiss-bg-surface);
        border: 0.5px solid var(--kiss-border);
        border-radius: 4px;
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
      }
      .phase-version {
        font-weight: 700;
        color: var(--kiss-primary);
        font-size: 0.9375rem;
      }
      .phase-goal {
        margin-top: 0.25rem;
        color: var(--kiss-text-secondary);
        font-size: 0.875rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.875rem;
      }
      th, td {
        text-align: left;
        padding: 0.5rem 0.75rem;
        border-bottom: 0.5px solid var(--kiss-border);
      }
      th {
        font-weight: 600;
        color: var(--kiss-text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .good { color: var(--kiss-success, #22c55e); font-weight: 600; }
      .bad { color: var(--kiss-danger, #ef4444); font-weight: 600; }
    `,
  ];

  override render() {
    return html`
      <kiss-layout currentPath="/blog/v0-5-alpha1">
        <div class="container">
          <p class="breadcrumb"><a href="/blog">← Blog</a></p>
          <h1>v0.5-alpha1：全量架构审计与精准修复</h1>
          <p class="subtitle">今日全栈架构审查揭示了关键 Bug 与技术债务——不是修修补补，是根源修复</p>
          <p class="date">2026-05-02</p>

          <p>今天对 KISS Framework 进行了一次端到端的全栈架构审查。结果符合预期——也超出预期。符合预期的是，写出好软件的唯一办法就是反复审查；超出预期的是，找到的不是表面 Bug，而是设计层面的系统性缺口。</p>

          <h2>今日修复的三个关键 Bug</h2>

          <div class="bug-card">
            <div class="bug-label">Bug #1</div>
            <h3>CSS 注入失败：SSG 页面无样式</h3>
            <p>SSG 生成的页面完全没有 CSS。根因：<code>extractLitStyles()</code> 尝试读取 Lit 3.x 中不存在的 <code>CSSResult.strings</code> 属性。Lit 3.x 使用 <code>cssText</code> 属性作为 CSSResult 的序列化接口，但代码仍然用 Lit 2.x 的 API。</p>
            <p><strong>修复：</strong>直接使用 <code>cssText</code>，删除 42 行无效代码和过时的数据结构构造逻辑。没有变通方案，没有兼容层——就是用对的 API。</p>
          </div>

          <div class="bug-card">
            <div class="bug-label">Bug #2</div>
            <h3>Island Hydration 死锁：API Consumer 卡在 "Contacting server..."</h3>
            <p><code>api-consumer</code> 组件永远卡在 "Contacting server..." 状态。根因：<code>_fetchStatus()</code> 在 <code>connectedCallback()</code> 中同步调用，而 LitElement 的首次 update cycle 尚未完成——reactive property 被设置但 DOM 还没渲染。</p>
            <p><strong>修复：</strong>将初始化逻辑推迟到 <code>updateComplete.then(() => this._fetchStatus())</code>。这是 Lit 的基本规则：connectedCallback 做 setup，updateComplete 做首次状态驱动操作。</p>
          </div>

          <div class="bug-card">
            <div class="bug-label">Bug #3</div>
            <h3>配置地狱：版本漂移</h3>
            <p>多个包同时维护 <code>deno.json</code>、<code>package.json</code>、<code>jsr.json</code> 三份配置文件，5 个包的版本号互不一致。</p>
            <p><strong>决策：</strong>每个包统一为单 <code>deno.json</code>，删除 <code>jsr.json</code> 和不必要的 <code>package.json</code>。Deno 是第一运行时，不假兼容。</p>
          </div>

          <h2>架构审查数据</h2>

          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Lines of Code</th>
                <th>Test Lines</th>
                <th>Test Ratio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>@kissjs/adapter-lit</code></td>
                <td>—</td>
                <td>0</td>
                <td><span class="bad">0%</span></td>
                <td>最危险的缺口（两个 Bug 均出此处）</td>
              </tr>
              <tr>
                <td><code>@kissjs/rpc</code></td>
                <td>—</td>
                <td>—</td>
                <td><span class="good">184%</span></td>
                <td>项目最佳</td>
              </tr>
              <tr>
                <td>全项目</td>
                <td>13,000</td>
                <td>5,500</td>
                <td><span class="good">42%</span></td>
                <td>总体良好，但分布严重不均</td>
              </tr>
            </tbody>
          </table>

          <div class="truth">
            <div class="truth-title">审查发现的关键事实</div>
            <ul>
              <li><strong>@kissjs/adapter-lit: 0 tests。</strong>项目中最危险的覆盖缺口。今天修复的两个 Bug（CSS 注入、Hydration 死锁）都在这个包。如果你不测适配器，适配器就会出 Bug——这是软件工程的必然。</li>
              <li><strong>所有 9 个 Island 都是 eager-loaded。</strong>每个页面加载 67.8KB JS——Lighthouse 性能评分为 30。没有懒加载机制。用户为没有交互的组件支付了全部运行时成本。</li>
              <li><strong><code>@lit-labs/ssr-client</code> 仍在依赖中。</strong>v0.5.0 已经宣布移除，但 <code>deno.json</code> 和 import map 中仍然引用。</li>
              <li><strong>3 份重复的 <code>escapeHtml</code> 实现。</strong>各自用不同编码逻辑——一个用正则、一个用 DOM API、一个手动替换。</li>
            </ul>
          </div>

          <h2>新设计原则</h2>
          <p>审查产出了 10 条设计原则。以下是 6 条新增的（已有 4 条保留）：</p>

          <div class="principle">
            <div class="principle-title">Lit Update Safety <span class="new-badge">New</span></div>
            <p><strong>禁止</strong>在 <code>connectedCallback</code> 中同步设置 reactive property。必须在 <code>updateComplete.then()</code> 之后执行首次状态驱动操作。这条原则直接来自 Bug #2。</p>
          </div>

          <div class="principle">
            <div class="principle-title">Adapter Test Coverage <span class="new-badge">New</span></div>
            <p>每个 adapter 必须有测试——这不是"nice to have"，而是"上线前提"。如果 adapter-lit 有测试，CSS 注入 Bug 和 Hydration 死锁在提交前就会被测出来。</p>
          </div>

          <div class="principle">
            <div class="principle-title">Error Visibility <span class="new-badge">New</span></div>
            <p>构建错误永远不能静默。SSG 页面生成失败时必须有明确的终端输出和构建退出码。用户不应该在浏览器里看到空白页面才能发现构建已经失败。</p>
          </div>

          <div class="principle">
            <div class="principle-title">Island Lazy by Default <span class="new-badge">New</span></div>
            <p>所有 Island 默认懒加载。只有标记为 <code>eager</code> 或在首屏的组件才在初始 Bundle 中包含。67.8KB 的 JS 成本对没有交互的组件来说是不可接受的。</p>
          </div>

          <div class="principle">
            <div class="principle-title">CSS Single Source <span class="new-badge">New</span></div>
            <p>每个组件的 CSS 只有一个来源。不可以在 UI 库和 SSG 管线中重复定义样式提取逻辑。<code>cssText</code> 是 Lit 的序列化接口——用它。</p>
          </div>

          <div class="principle">
            <div class="principle-title">One Config File per Package <span class="new-badge">New</span></div>
            <p>每个包只有一个配置文件：<code>deno.json</code>。不维护 <code>package.json</code> 或 <code>jsr.json</code> 的冗余副本。版本号只有一个真实来源。</p>
          </div>

          <h2>Road to v1.0</h2>
          <p>基于审查结果，我们制定了分阶段 v1.0 路线图：</p>

          <div class="phase">
            <div class="phase-version">v0.5.2 — 修复基础</div>
            <div class="phase-goal">完成 adapter-lit 测试、移除 <code>@lit-labs/ssr-client</code>、解决所有 P0 问题</div>
          </div>

          <div class="phase">
            <div class="phase-version">v0.6.0 — 性能升维</div>
            <div class="phase-goal">Island 懒加载、Lighthouse 90+、去重 escapeHtml/escapeAttr</div>
          </div>

          <div class="phase">
            <div class="phase-version">v0.7.0 — 质量闭环</div>
            <div class="phase-goal">E2E 测试、结构化 inject API、中文错误信息</div>
          </div>

          <div class="phase">
            <div class="phase-version">v0.8.0 — .kiss 编译器 Alpha</div>
            <div class="phase-goal">零基础设施 JS（.kiss 编译器 alpha）</div>
          </div>

          <div class="phase">
            <div class="phase-version">v1.0.0 — API 冻结</div>
            <div class="phase-goal">API 冻结、长期支持</div>
          </div>

          <h2>.kiss 编译器愿景（ADR 0002）</h2>

          <div class="truth">
            <div class="truth-title">消除 Lit 的运行时代价</div>
            <p>Lit 当前需要 58KB gzip 运行时。这个成本在首屏加载时集中出现——即使只有 1 个组件也需要整个运行时。</p>
            <p><strong>.kiss 编译器</strong>的愿景：将 <code>.kiss</code> 模板文件编译为原生 Custom Element——无框架运行时。Lit 作为可选 fallback 保留，供需要 Lit 生态（context protocol、decorators、ReactiveController）的用户选择。</p>
            <p>这不是"替代 Lit"——这是让 Lit 从必选变成可选。零运行时始终是方向。</p>
          </div>

          <h2>v0.5.0 正式版路线</h2>

          <div class="truth">
            <div class="truth-title">P0 — 阻塞发布</div>
            <ul>
              <li><strong>A1 adapter-lit 测试</strong> — extractLitStyles + renderLitToString + installLitAdapter</li>
              <li><strong>A2 移除 @lit-labs/ssr-client</strong> — 从 deno.json 和 client bundle 中彻底清除</li>
              <li><strong>A3 extractLitStyles 错误可见性</strong> — try/catch → console.warn</li>
              <li><strong>A4 CI 全绿</strong> — lint / fmt / test / typecheck 零错误</li>
              <li><strong>A5 版本号最终对齐</strong> — core 0.5.0, rpc 0.3.0, ui 0.5.0, create 0.4.0</li>
              <li><strong>A6 Docs 站验证</strong> — SSG 构建 38 页通过，DSD 含 &lt;style&gt;</li>
            </ul>
          </div>

          <div class="truth">
            <div class="truth-title">P1 — 发布附带</div>
            <ul>
              <li><strong>B1</strong> escapeHtml 统一（3→1） · <strong>B2</strong> escapeAttr 统一（2→1）</li>
              <li><strong>B3-B5</strong> 死代码清理（renderNestedDsd / html-template / @deprecated fns）</li>
              <li><strong>B6</strong> kiss-hero-ping apiUrl 修复 · <strong>B7</strong> create-kiss 模板更新</li>
            </ul>
          </div>

          <div class="truth">
            <div class="truth-title">P2 — v0.5.1+</div>
            <ul>
              <li><strong>C1</strong> Island 懒加载 (IntersectionObserver) · <strong>C2</strong> OpenProps 按需</li>
              <li><strong>C3</strong> JS/CSS minification · <strong>C4</strong> E2E 测试 (Playwright)</li>
              <li><strong>C5</strong> 结构化 inject API · <strong>C6</strong> 无障碍 · <strong>C7</strong> SEO</li>
            </ul>
          </div>

          <div class="nav-row">
            <a href="/blog/v0-5-alpha-0" class="nav-link">&larr; v0.5-alpha-0</a>
            <a href="/roadmap" class="nav-link">路线图 &rarr;</a>
          </div>
        </div>
      </kiss-layout>
    `;
  }
}

customElements.define(tagName, BlogV05Alpha1);
export default BlogV05Alpha1;

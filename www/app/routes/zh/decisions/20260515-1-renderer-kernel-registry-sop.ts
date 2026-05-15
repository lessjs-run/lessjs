export const meta = {
  section: 'Roadmap & Decisions',
  label: '20260515 Renderer SOP',
  order: 30,
};

import { headerNav, navSections } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export const tagName = 'decision-20260515-1-renderer-kernel-registry-sop';

export default class RendererKernelRegistrySopDecision extends LitElement {
  declare locale?: string;

  static override styles = [
    pageStyles,
    css`
      .decision-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0.75rem 0 2rem;
        color: var(--less-text-muted);
        font-size: 0.75rem;
      }
      .badge {
        border: 0.5px solid var(--less-border);
        border-radius: 3px;
        padding: 0.125rem 0.375rem;
        color: var(--less-text-secondary);
      }
      .matrix {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0 2rem;
        font-size: 0.8125rem;
      }
      .matrix th,
      .matrix td {
        padding: 0.625rem 0.75rem;
        border-bottom: 0.5px solid var(--less-border);
        text-align: left;
        vertical-align: top;
      }
      .matrix th {
        background: var(--less-bg-surface);
        color: var(--less-text-muted);
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .steps {
        display: grid;
        gap: 0.75rem;
        margin: 1rem 0 2rem;
      }
      .step {
        border-left: 2px solid var(--less-border-hover);
        padding-left: 1rem;
      }
      .step-title {
        color: var(--less-text-primary);
        font-weight: 600;
      }
      code {
        background: var(--less-code-bg);
        border-radius: 2px;
        padding: 0.125rem 0.375rem;
        font-family: "SF Mono", monospace;
        font-size: 0.8125rem;
      }
    `,
  ];

  override render() {
    return (this.locale || 'zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return html`
      <less-layout
        locale="${this.locale || 'zh'}"
        .locales="${['en', 'zh']}"
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
      >
        <div class="container">
          <h1>ADR 20260515-1: Renderer Kernel, WC Package Protocol, and Registry SOP</h1>
          <p class="subtitle">
            以 2026-05-15 的 <code>origin/main</code> 审查为基线，把 LessJS 的下一阶段收束到可验证的 Web
            Components 渲染协议、包元数据协议和 registry hub 前置 SOP。
          </p>

          <div class="decision-meta">
            <span class="badge">Status: Accepted for roadmap execution</span>
            <span class="badge">Date: 2026-05-15</span>
            <span class="badge">Scope: v0.15-v0.18</span>
          </div>

          <h2>Context</h2>
          <p>
            LessJS 已经具备 <code>renderDSD()</code>、<code>renderNestedCustomElements()</code>、
            <code>RenderAdapter</code>、<code>renderRoute()</code>、SSG pipeline 和
            <code>PackageIslandMeta</code>。这些能力足够支撑一个 Web Components-first 的渲染内核。
          </p>
          <p>
            但当前 main 也暴露出几个不能绕过的事实：源码版本是 <code>0.14.6</code>，registry 最新线仍停在
            <code>0.14.2</code>；<code>@lessjs/create</code> 的远程 JSR 元数据解析不稳；package islands
            目前更像 client upgrade 输入，不是完整 SSR 输入；per-page island manifest 有工具函数但尚未接入
            SSG 输出。
          </p>

          <h2>Decision</h2>
          <p>
            LessJS 不先承诺中心化 marketplace。下一阶段先冻结三个可验证边界：
          </p>
          <table class="matrix">
            <thead>
              <tr>
                <th>Boundary</th>
                <th>Decision</th>
                <th>Done when</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Renderer kernel</td>
                <td>
                  将 DSD rendering、nested CE rendering、route rendering、adapter contract 和 DSD metrics
                  作为公共内核能力整理，而不是只作为 Vite adapter 内部实现。
                </td>
                <td>
                  外部 adapter 可以通过稳定输入/输出/错误模型接入，且 package island SSR 测试通过。
                </td>
              </tr>
              <tr>
                <td>WC package protocol</td>
                <td>
                  在 Custom Elements Manifest 兼容字段之上增加 LessJS 的 <code>ssr</code>、
                  <code>dsd</code>、<code>hydrate</code>、<code>strategy</code> 和 diagnostics 字段。
                </td>
                <td>
                  包可以自描述 tag、module、export、parts、events、slots、tokens、SSR 可渲染性和升级策略。
                </td>
              </tr>
              <tr>
                <td>Registry entry</td>
                <td>
                  先做本地 registry index 和文档索引，再做公共 hub。公共 hub
                  只展示可复现的包元数据和渲染验证结果。
                </td>
                <td>
                  本地 index 能从已安装包生成组件页，并显示 SSR/SSG 结果、bundle cost、测试和文档完整度。
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Roadmap Plan</h2>
          <div class="steps">
            <section class="step">
              <div class="step-title">v0.15 - release parity and renderer-kernel hardening</div>
              <p>
                修复 <code>@lessjs/create</code> 远程版本解析、CLI help/name validation、package island
                SSR 注册、 per-page island manifest 接线和 <code>deno.lock</code> 版本漂移。发布门槛是
                typecheck、test、 scaffold smoke 和 package island SSR integration 全部通过。
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.16 - WC package protocol</div>
              <p>
                定义 CEM-compatible manifest，并补 LessJS runtime 字段。提供 manifest
                validator、示例包和迁移文档。 协议字段必须先被 <code>@lessjs/ui</code> 和一个 synthetic
                external package 证明。
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.17 - local registry index</div>
              <p>
                从 workspace 和已安装包生成本地组件索引。每个组件页展示 tag、module、SSR/DSD
                状态、events、 parts、tokens、bundle cost、可访问性备注和复制可用的安装代码。
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.18 - public hub prototype</div>
              <p>
                将本地 index 的输出发布成静态 hub 原型。先展示验证结果和 package metadata，不开放宽泛
                marketplace 功能，直到治理、审核、安全报告和包来源规则明确。
              </p>
            </section>
          </div>

          <h2>SOP</h2>
          <ol>
            <li>
              每个版本先写 fact sheet：source version、registry version、lockfile status、validation
              command 和已知失败合同。
            </li>
            <li>任何协议字段变更必须先进入 ADR，然后才进入代码和文档。</li>
            <li>每个新协议点至少有一个合成外部包测试，不能只用 <code>@lessjs/ui</code> 自证。</li>
            <li>
              文档只描述已被测试证明的行为；未完成能力必须留在 roadmap 或 ADR 的 planned/deferred 区域。
            </li>
            <li>
              release 前执行 <code>deno task typecheck</code>、<code>deno task test</code>、scaffold
              smoke、publish dry-run。
            </li>
            <li>
              publish 后读取 registry metadata，确认 latest、lockfile、changelog 和 package versions
              对齐。
            </li>
            <li>hub 页面只消费 manifest 和验证产物，不直接相信 README 或营销字段。</li>
          </ol>

          <h2>Consequences</h2>
          <p>
            这个决策会推迟中心化 hub 的表层功能，但会让 LessJS
            的核心叙事更硬：不是又一个组件列表，而是能验证 Web Components 是否可
            SSR/SSG、可升级、可索引、可迁移的基础设施。
          </p>

          <div class="nav-row">
            <a href="/roadmap" class="nav-link">&larr; Roadmap</a>
            <a href="/zh/decisions" class="nav-link">Architecture Decisions &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }

  private _renderEn() {
    return html`
      <less-layout
        locale="${this.locale || 'en'}"
        .locales="${['en', 'zh']}"
        .navItems="${navSections}"
        .headerNav="${headerNav}"
        current-path="/zh/decisions/20260515-1-renderer-kernel-registry-sop"
      >
        <div class="container">
          <h1>ADR 20260515-1: Renderer Kernel, WC Package Protocol, and Registry SOP</h1>
          <p class="subtitle">
            Based on the 2026-05-15 <code>origin/main</code> review, the next LessJS phase is narrowed to
            verifiable Web Components rendering, package metadata, and the SOP that must exist before a
            registry hub.
          </p>

          <div class="decision-meta">
            <span class="badge">Status: Accepted for roadmap execution</span>
            <span class="badge">Date: 2026-05-15</span>
            <span class="badge">Scope: v0.15-v0.18</span>
          </div>

          <h2>Context</h2>
          <p>
            LessJS already has <code>renderDSD()</code>, <code>renderNestedCustomElements()</code>,
            <code>RenderAdapter</code>, <code>renderRoute()</code>, the SSG pipeline, and
            <code>PackageIslandMeta</code>. These are enough to support a Web Components-first rendering
            kernel.
          </p>
          <p>
            The current main branch also exposes blocking gaps: source packages are
            <code>0.14.6</code> while the registry line is still <code>0.14.2</code>;
            <code>@lessjs/create</code> remote metadata resolution is unreliable; package islands are not
            a complete SSR input; and per-page island manifest utilities are not wired into SSG output.
          </p>

          <h2>Decision</h2>
          <p>
            LessJS will not lead with a centralized marketplace promise. The next phase freezes three
            verifiable boundaries first:
          </p>
          <table class="matrix">
            <thead>
              <tr>
                <th>Boundary</th>
                <th>Decision</th>
                <th>Done when</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Renderer kernel</td>
                <td>
                  Treat DSD rendering, nested CE rendering, route rendering, adapter contract, and DSD
                  metrics as public kernel capabilities instead of Vite-adapter internals.
                </td>
                <td>
                  External adapters can use stable input/output/error contracts, and package island SSR
                  integration tests pass.
                </td>
              </tr>
              <tr>
                <td>WC package protocol</td>
                <td>
                  Extend a Custom Elements Manifest-compatible base with LessJS fields for
                  <code>ssr</code>, <code>dsd</code>, <code>hydrate</code>, <code>strategy</code>, and
                  diagnostics.
                </td>
                <td>
                  Packages can describe tags, modules, exports, parts, events, slots, tokens, SSR
                  renderability, and upgrade behavior.
                </td>
              </tr>
              <tr>
                <td>Registry entry</td>
                <td>
                  Build a local registry index and docs index before a public hub. The public hub only
                  shows reproducible metadata and rendering validation results.
                </td>
                <td>
                  The local index can generate component pages from installed packages and show SSR/SSG
                  output, bundle cost, tests, and documentation completeness.
                </td>
              </tr>
            </tbody>
          </table>

          <h2>Roadmap Plan</h2>
          <div class="steps">
            <section class="step">
              <div class="step-title">v0.15 - release parity and renderer-kernel hardening</div>
              <p>
                Fix <code>@lessjs/create</code> remote versions, CLI help/name validation, package island
                SSR registration, per-page island manifest wiring, and
                <code>deno.lock</code> drift. The release gate is typecheck, tests, scaffold smoke, and
                package island SSR integration.
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.16 - WC package protocol</div>
              <p>
                Define the CEM-compatible manifest and LessJS runtime extensions. Ship a validator,
                example package, and migration docs. Every field must be proven by
                <code>@lessjs/ui</code> and a synthetic external package.
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.17 - local registry index</div>
              <p>
                Generate a local component index from workspace and installed packages. Each page shows
                tag, module, SSR/DSD status, events, parts, tokens, bundle cost, accessibility notes, and
                copyable install code.
              </p>
            </section>
            <section class="step">
              <div class="step-title">v0.18 - public hub prototype</div>
              <p>
                Publish the local index output as a static hub prototype. Show validation results and
                package metadata first; defer broad marketplace behavior until governance, review,
                security reporting, and provenance rules are explicit.
              </p>
            </section>
          </div>

          <h2>SOP</h2>
          <ol>
            <li>
              Start each release with a fact sheet: source version, registry version, lockfile status,
              validation commands, and failing contracts.
            </li>
            <li>Any protocol field change must land in an ADR before code and documentation.</li>
            <li>
              Every new protocol point needs at least one synthetic external package test, not only <code
              >@lessjs/ui</code>.
            </li>
            <li>
              Docs describe only tested behavior; unfinished work stays in roadmap or ADR planned/deferred
              sections.
            </li>
            <li>
              Before release, run <code>deno task typecheck</code>, <code>deno task test</code>, scaffold
              smoke, and publish dry-run.
            </li>
            <li>
              After publish, read registry metadata and confirm latest, lockfile, changelog, and package
              versions match.
            </li>
            <li>
              Hub pages consume manifests and validation artifacts; they do not trust README or marketing
              fields directly.
            </li>
          </ol>

          <h2>Consequences</h2>
          <p>
            This delays superficial hub features but strengthens the actual LessJS thesis: not another
            component list, but infrastructure that can verify whether Web Components are SSR/SSG-ready,
            upgradeable, indexable, and migratable.
          </p>

          <div class="nav-row">
            <a href="/en/roadmap" class="nav-link">&larr; Roadmap</a>
            <a href="/en/decisions" class="nav-link">Architecture Decisions &rarr;</a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define(tagName, RendererKernelRegistrySopDecision);

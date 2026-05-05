/**
 * @lessjs/ui —— 设计系统
 * 双色板。零噪音。
 *
 * Dogfooding: 使用实际的 less-button、less-card、less-input 组件。
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

// 导入 LessJS UI 组件用于 dogfooding
import '@lessjs/ui/less-button';
import '@lessjs/ui/less-card';
import '@lessjs/ui/less-input';
import '@lessjs/ui/less-code-block';

export class UIShowcase extends LitElement {
  static override styles = [
    pageStyles,
    css`
      :host {
        display: block;
      }

      /* ─── Section ─── */
      .section {
        margin-bottom: 3.5rem;
      }

      .section-title {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--kiss-text-muted);
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 0.5px solid var(--less-border);
      }

      /* ─── Palettes ─── */
      .palette-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--less-border);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .palette-card {
        padding: 1.5rem;
      }

      .palette-dark {
        background: var(--less-bg-base);
      }

      .palette-light {
        background: #fff;
      }

      .palette-name {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 1rem;
      }

      .palette-dark .palette-name {
        color: var(--kiss-text-muted);
      }

      .palette-light .palette-name {
        color: var(--less-text-secondary);
      }

      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .swatch-item {
        text-align: center;
      }

      .swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 4px;
        margin-bottom: 0.375rem;
      }

      .palette-dark .swatch {
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .palette-light .swatch {
        border: 1px solid rgba(0, 0, 0, 0.08);
      }

      .swatch-label {
        font-size: 0.5625rem;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .palette-dark .swatch-label {
        color: var(--kiss-text-muted);
      }

      .palette-light .swatch-label {
        color: var(--less-text-secondary);
      }

      .palette-desc {
        font-size: 0.75rem;
        line-height: 1.6;
      }

      .palette-dark .palette-desc {
        color: var(--less-text-tertiary);
      }

      .palette-dark .palette-desc strong {
        color: var(--less-text-primary);
      }

      .palette-light .palette-desc {
        color: var(--less-text-secondary);
      }

      .palette-light .palette-desc strong {
        color: var(--less-text-primary);
      }

      /* ─── Typography ─── */
      .type-scale {
        display: flex;
        flex-direction: column;
      }

      .type-row {
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        padding: 0.75rem 0;
        border-bottom: 0.5px solid var(--less-border);
      }

      .type-row:last-child {
        border-bottom: none;
      }

      .type-label {
        min-width: 72px;
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--kiss-text-muted);
      }

      .type-sample {
        color: var(--less-text-primary);
      }

      /* ─── Component Preview ─── */
      .preview-card {
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        overflow: hidden;
      }

      .preview-header {
        padding: 0.875rem 1.25rem;
        border-bottom: 0.5px solid var(--less-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .preview-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--less-text-primary);
      }

      .preview-badge {
        font-size: 0.5625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        background: var(--kiss-accent-subtle);
        color: var(--less-text-secondary);
        border: 0.5px solid var(--less-border);
      }

      .preview-body {
        padding: 1.25rem;
        display: flex;
        gap: 0.625rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }

      /* ─── Cards Grid ─── */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      /* ─── Install ─── */
      .install-section {
        margin-top: 3.5rem;
        padding: 2rem;
        background: var(--less-bg-surface);
        border: 0.5px solid var(--less-border);
        border-radius: 6px;
        text-align: center;
      }

      .install-section h3 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--less-text-primary);
        margin: 0 0 1rem;
      }

      .install-cmd {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 1.25rem;
        background: var(--kiss-bg-elevated);
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        font-family: "SF Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.8125rem;
        color: var(--less-text-primary);
      }

      .install-cmd .prompt {
        color: var(--kiss-text-muted);
      }

      .install-section p {
        font-size: 0.8125rem;
        color: var(--less-text-tertiary);
        margin: 0.75rem 0 0;
      }

      /* ─── Mobile ─── */
      @media (max-width: 900px) {
        .section {
          margin-bottom: 2.5rem;
        }

        .type-row {
          gap: 1rem;
        }

        .preview-body {
          padding: 1rem;
        }

        .install-section {
          padding: 1.5rem 1rem;
        }
      }

      @media (max-width: 640px) {
        .palette-row {
          grid-template-columns: 1fr;
        }

        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .install-cmd {
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
        }
      }
    `,
  ];

  override render() {
    return html`
      <less-layout current-path="/ui">
        <div class="container">
          <h1>设计系统</h1>
          <p class="subtitle">
            <strong>双色板。零噪音。</strong><br>
            深色和浅色。没有别的。
          </p>

          <!-- Palettes -->
          <div class="section">
            <div class="section-title">色板</div>
            <div class="palette-row">
              <div class="palette-card palette-dark">
                <div class="palette-name">深色</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">基底</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#0a0a0a"></div>
                    <div class="swatch-label">表面</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">主色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#999"></div>
                    <div class="swatch-label">次色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#666"></div>
                    <div class="swatch-label">第三色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#444"></div>
                    <div class="swatch-label">静默</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>黑色</strong> 基底。白色强调。灰色分层。
                </p>
              </div>
              <div class="palette-card palette-light">
                <div class="palette-name">浅色</div>
                <div class="swatch-grid">
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fff"></div>
                    <div class="swatch-label">基底</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#fafafa"></div>
                    <div class="swatch-label">表面</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#000"></div>
                    <div class="swatch-label">主色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#555"></div>
                    <div class="swatch-label">次色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#888"></div>
                    <div class="swatch-label">第三色</div>
                  </div>
                  <div class="swatch-item">
                    <div class="swatch" style="background:#aaa"></div>
                    <div class="swatch-label">静默</div>
                  </div>
                </div>
                <p class="palette-desc">
                  <strong>白色</strong> 基底。黑色强调。灰色分层。
                </p>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="section">
            <div class="section-title">字体排版</div>
            <div class="type-scale">
              <div class="type-row">
                <span class="type-label">展示</span>
                <span class="type-sample" style="font-size:2.5rem;font-weight:900;letter-spacing:-0.04em"
                >LessJS UI</span>
              </div>
              <div class="type-row">
                <span class="type-label">H1</span>
                <span class="type-sample" style="font-size:1.75rem;font-weight:800;letter-spacing:-0.03em"
                >一级标题</span>
              </div>
              <div class="type-row">
                <span class="type-label">H2</span>
                <span class="type-sample" style="font-size:1.125rem;font-weight:600">二级标题</span>
              </div>
              <div class="type-row">
                <span class="type-label">正文</span>
                <span class="type-sample" style="font-size:0.9375rem;color:var(--less-text-secondary)"
                >正文段落示例。</span>
              </div>
              <div class="type-row">
                <span class="type-label">说明</span>
                <span
                  class="type-sample"
                  style="font-size:0.6875rem;color:var(--less-text-tertiary);text-transform:uppercase;letter-spacing:0.08em;font-weight:600"
                >说明文字</span>
              </div>
              <div class="type-row">
                <span class="type-label">等宽</span>
                <span
                  class="type-sample"
                  style="font-size:0.8125rem;font-family:'SF Mono','Fira Code','Consolas',monospace;color:var(--less-text-primary)"
                >deno add jsr:@lessjs/ui</span>
              </div>
            </div>
          </div>

          <!-- Buttons (Dogfooding less-button) -->
          <div class="section">
            <div class="section-title">按钮</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">变体</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body">
                <less-button variant="primary">主要按钮</less-button>
                <less-button>默认按钮</less-button>
                <less-button variant="ghost">幽灵按钮</less-button>
              </div>
              <div class="preview-body" style="border-top:0.5px solid var(--less-border)">
                <less-button variant="primary" size="sm">小号</less-button>
                <less-button variant="primary" size="md">中号</less-button>
                <less-button variant="primary" size="lg">大号</less-button>
              </div>
              <div class="preview-body" style="border-top:0.5px solid var(--less-border)">
                <less-button disabled>禁用状态</less-button>
                <less-button href="/" target="_blank">链接按钮</less-button>
              </div>
            </div>
          </div>

          <!-- Cards (Dogfooding less-card) -->
          <div class="section">
            <div class="section-title">卡片</div>
            <div class="cards-grid">
              <less-card>
                <h3 slot="header">Island</h3>
                <p>带客户端升级的交互式组件和 Shadow DOM。</p>
                <div slot="footer">
                  <less-button size="sm">使用</less-button>
                </div>
              </less-card>
              <less-card>
                <h3 slot="header">静态</h3>
                <p>通过 DSD 零 JS 渲染。JS 加载前可见。</p>
                <div slot="footer">
                  <less-button size="sm">使用</less-button>
                </div>
              </less-card>
              <less-card variant="elevated">
                <h3 slot="header">API Route</h3>
                <p>带 Hono RPC 的 Serverless 函数。类型安全。</p>
                <div slot="footer">
                  <less-button size="sm">使用</less-button>
                </div>
              </less-card>
            </div>
          </div>

          <!-- Input (Dogfooding less-input) -->
          <div class="section">
            <div class="section-title">输入框</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">文本输入</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body" style="flex-direction:column;gap:0.75rem">
                <less-input placeholder="输入邮箱..." label="邮箱"></less-input>
                <less-input type="password" placeholder="密码" label="密码" required></less-input>
                <less-input value="hello@kissjs.org" label="只读" disabled></less-input>
              </div>
            </div>
          </div>

          <!-- Code Block (Dogfooding less-code-block) -->
          <div class="section">
            <div class="section-title">代码块</div>
            <div class="preview-card">
              <div class="preview-header">
                <span class="preview-title">带复制按钮</span>
                <span class="preview-badge">可用</span>
              </div>
              <div class="preview-body">
                <less-code-block>
                  <pre>
                    <code>import '@lessjs/ui';

                    // 使用组件
                    &lt;less-button variant="primary"&gt;点我&lt;/less-button&gt;
                    &lt;less-card&gt;
                      &lt;h3 slot="header"&gt;标题&lt;/h3&gt;
                      &lt;p&gt;卡片内容&lt;/p&gt;
                    &lt;/less-card&gt;</code></pre>
                  </less-code-block>
                </div>
              </div>
            </div>

            <!-- Install -->
            <div class="install-section">
              <h3>安装 @lessjs/ui</h3>
              <div class="install-cmd">
                <span class="prompt">$</span> deno add jsr:@lessjs/ui
              </div>
              <p>Deno、Node、Bun。零配置。</p>
            </div>

            <div class="nav-row">
              <a href="/guide/deployment" class="nav-link">&larr; 部署</a>
              <a href="/styling/kiss-ui" class="nav-link">Kiss UI 文档 &rarr;</a>
            </div>
          </div>
        </less-layout>
      `;
    }
  }

  customElements.define('ui-showcase', UIShowcase);

  export default UIShowcase;
  export const tagName = 'ui-showcase';

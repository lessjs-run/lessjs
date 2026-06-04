/**
 * @openelement/ui - Design System
 * Two plates. Zero noise.
 *
 * Dogfooding: uses real less-button, less-card, less-input components.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui\/open-button';
import '@openelement/ui\/open-card';
import '@openelement/ui\/open-input';
import '@openelement/ui\/open-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      :host {
        display: block;
      }
      .section {
        margin-bottom: 3.5rem;
      }
      .section-title {
        font-size: var(--font-size-00);
        font-weight: var(--font-weight-7);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--gray-6);
        margin-bottom: var(--size-6);
        padding-bottom: var(--size-3);
        border-bottom: 0.5px solid var(--gray-3);
      }
      .palette-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--border-size-1);
        background: var(--gray-3);
        border: 0.5px solid var(--gray-3);
        border-radius: var(--radius-2);
        overflow: hidden;
      }
      .palette-card {
        padding: var(--size-6);
      }
      .palette-dark {
        background: var(--gray-0);
      }
      .palette-light {
        background: var(--gray-1);
      }
      .palette-name {
        font-size: var(--font-size-00);
        font-weight: var(--font-weight-7);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: var(--size-4);
      }
      .palette-dark .palette-name {
        color: var(--gray-6);
      }
      .palette-light .palette-name {
        color: var(--gray-7);
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--size-3);
        margin-bottom: var(--size-5);
      }
      .swatch-item {
        text-align: center;
      }
      .swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--radius-1);
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
        font-weight: var(--font-weight-6);
        letter-spacing: 0.04em;
      }
      .palette-dark .swatch-label {
        color: var(--gray-6);
      }
      .palette-light .swatch-label {
        color: var(--gray-7);
      }
      .palette-desc {
        font-size: var(--font-size-0);
        line-height: 1.6;
      }
      .palette-dark .palette-desc {
        color: var(--gray-6);
      }
      .palette-dark .palette-desc strong {
        color: var(--gray-10);
      }
      .palette-light .palette-desc {
        color: var(--gray-7);
      }
      .palette-light .palette-desc strong {
        color: var(--gray-10);
      }
      .type-scale {
        display: flex;
        flex-direction: column;
      }
      .type-row {
        display: flex;
        align-items: baseline;
        gap: var(--size-6);
        padding: var(--size-3) 0;
        border-bottom: 0.5px solid var(--gray-3);
      }
      .type-row:last-child {
        border-bottom: none;
      }
      .type-label {
        min-width: 72px;
        font-size: 0.5625rem;
        font-weight: var(--font-weight-7);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--gray-6);
      }
      .type-sample {
        color: var(--gray-10);
      }
      .preview-card {
        background: var(--gray-1);
        border: 0.5px solid var(--gray-3);
        border-radius: var(--radius-2);
        overflow: hidden;
      }
      .preview-header {
        padding: 0.875rem var(--size-5);
        border-bottom: 0.5px solid var(--gray-3);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .preview-title {
        font-size: var(--font-size-1);
        font-weight: var(--font-weight-6);
        color: var(--gray-10);
      }
      .preview-badge {
        font-size: 0.5625rem;
        font-weight: var(--font-weight-7);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.25rem var(--size-2);
        border-radius: 3px;
        background: var(--indigo-1);
        color: var(--gray-7);
        border: 0.5px solid var(--gray-3);
      }
      .preview-body {
        padding: var(--size-5);
        display: flex;
        gap: 0.625rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .preview-body-col {
        display: flex;
        flex-direction: column;
        gap: var(--size-3);
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--size-4);
      }
      .install-section {
        margin-top: 3.5rem;
        padding: var(--size-8);
        background: var(--gray-1);
        border: 0.5px solid var(--gray-3);
        border-radius: var(--radius-2);
        text-align: center;
      }
      .install-section h3 {
        font-size: 0.9375rem;
        font-weight: var(--font-weight-6);
        color: var(--gray-10);
        margin: 0 0 var(--size-4);
      }
      .install-cmd {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem var(--size-5);
        background: var(--gray-0);
        border: 0.5px solid var(--gray-3);
        border-radius: var(--radius-1);
        font-family: "SF Mono", monospace;
        font-size: var(--font-size-1);
        color: var(--gray-10);
      }
      .install-cmd .prompt {
        color: var(--gray-6);
      }
      .install-section p {
        font-size: var(--font-size-1);
        color: var(--gray-6);
        margin: var(--size-3) 0 0;
      }
      @media (max-width: 900px) {
        .section {
          margin-bottom: 2.5rem;
        }
        .type-row {
          gap: var(--size-4);
        }
        .preview-body {
          padding: var(--size-4);
        }
        .install-section {
          padding: var(--size-6) var(--size-4);
        }
      }
      @media (max-width: 640px) {
        .palette-row {
          grid-template-columns: 1fr;
        }
        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: var(--size-2);
        }
        .install-cmd {
          font-size: var(--font-size-0);
          padding: var(--size-2) var(--size-4);
        }
      }
    `,
);

export class UIShowcase extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      
        <div class='container'>
          <h1>设计系统</h1>
          <p class='subtitle'>
            <strong>双色板。零噪音。</strong>
            <br />深色和浅色。没有别的。
          </p>
          <div class='section'>
            <div class='section-title'>色板</div>
            <div class='palette-row'>
              <div class='palette-card palette-dark'>
                <div class='palette-name'>深色</div>
                <div class='swatch-grid'>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#000'></div>
                    <div class='swatch-label'>基底</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#0a0a0a'></div>
                    <div class='swatch-label'>表面</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fff'></div>
                    <div class='swatch-label'>主色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#999'></div>
                    <div class='swatch-label'>次色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#666'></div>
                    <div class='swatch-label'>第三色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#444'></div>
                    <div class='swatch-label'>静默</div>
                  </div>
                </div>
                <p class='palette-desc'>
                  <strong>黑色</strong> 基底。白色强调。灰色分层。
                </p>
              </div>
              <div class='palette-card palette-light'>
                <div class='palette-name'>浅色</div>
                <div class='swatch-grid'>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fff'></div>
                    <div class='swatch-label'>基底</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fafafa'></div>
                    <div class='swatch-label'>表面</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#000'></div>
                    <div class='swatch-label'>主色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#555'></div>
                    <div class='swatch-label'>次色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#888'></div>
                    <div class='swatch-label'>第三色</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#aaa'></div>
                    <div class='swatch-label'>静默</div>
                  </div>
                </div>
                <p class='palette-desc'>
                  <strong>白色</strong> 基底。黑色强调。灰色分层。
                </p>
              </div>
            </div>
          </div>
          <div class='section'>
            <div class='section-title'>按钮</div>
            <div class='preview-card'>
              <div class='preview-header'>
                <span class='preview-title'>变体</span>
                <span class='preview-badge'>可用</span>
              </div>
              <div class='preview-body'>
                <open-button variant='primary'>主要按钮</open-button>
                <open-button>默认按钮</open-button>
                <open-button variant='ghost'>幽灵按钮</open-button>
              </div>
            </div>
          </div>
          <div class='section'>
            <div class='section-title'>输入框</div>
            <div class='preview-card'>
              <div class='preview-header'>
                <span class='preview-title'>文本输入</span>
                <span class='preview-badge'>可用</span>
              </div>
              <div class='preview-body preview-body-col'>
                <open-input placeholder='输入邮箱...' label='邮箱'></open-input>
                <open-input type='password' placeholder='密码' label='密码' required>
                </open-input>
                <open-input value='hello@openelement.org' label='只读' disabled></open-input>
              </div>
            </div>
          </div>
          <div class='install-section'>
            <h3>安装 @openelement/ui</h3>
            <div class='install-cmd'>
              <span class='prompt'>$</span> deno add jsr:@openelement/ui
            </div>
            <p>Deno、Node、Bun。零配置。</p>
          </div>
          <div class='nav-row'>
            <a href={`/${loc}/architecture/architecture`} class='nav-link'>← Architecture</a>
            <a href={`/${loc}/architecture/reference/core`} class='nav-link'>API Reference →</a>
          </div>
        </div>
      
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      
        <div class='container'>
          <h1>Design System</h1>
          <p class='subtitle'>
            <strong>Two plates. Zero noise.</strong>
            <br />Dark and light. Nothing else.
          </p>
          <div class='section'>
            <div class='section-title'>Palettes</div>
            <div class='palette-row'>
              <div class='palette-card palette-dark'>
                <div class='palette-name'>Dark</div>
                <div class='swatch-grid'>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#000'></div>
                    <div class='swatch-label'>Base</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#0a0a0a'></div>
                    <div class='swatch-label'>Surface</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fff'></div>
                    <div class='swatch-label'>Primary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#999'></div>
                    <div class='swatch-label'>Secondary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#666'></div>
                    <div class='swatch-label'>Tertiary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#444'></div>
                    <div class='swatch-label'>Muted</div>
                  </div>
                </div>
                <p class='palette-desc'>
                  <strong>Black</strong> base. White accent. Gray layers.
                </p>
              </div>
              <div class='palette-card palette-light'>
                <div class='palette-name'>Light</div>
                <div class='swatch-grid'>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fff'></div>
                    <div class='swatch-label'>Base</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#fafafa'></div>
                    <div class='swatch-label'>Surface</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#000'></div>
                    <div class='swatch-label'>Primary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#555'></div>
                    <div class='swatch-label'>Secondary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#888'></div>
                    <div class='swatch-label'>Tertiary</div>
                  </div>
                  <div class='swatch-item'>
                    <div class='swatch' style='background:#aaa'></div>
                    <div class='swatch-label'>Muted</div>
                  </div>
                </div>
                <p class='palette-desc'>
                  <strong>White</strong> base. Black accent. Gray layers.
                </p>
              </div>
            </div>
          </div>
          <div class='section'>
            <div class='section-title'>Buttons</div>
            <div class='preview-card'>
              <div class='preview-header'>
                <span class='preview-title'>Variants</span>
                <span class='preview-badge'>Ready</span>
              </div>
              <div class='preview-body'>
                <open-button variant='primary'>Primary</open-button>
                <open-button>Default</open-button>
                <open-button variant='ghost'>Ghost</open-button>
              </div>
            </div>
          </div>
          <div class='section'>
            <div class='section-title'>Inputs</div>
            <div class='preview-card'>
              <div class='preview-header'>
                <span class='preview-title'>Text Input</span>
                <span class='preview-badge'>Ready</span>
              </div>
              <div class='preview-body preview-body-col'>
                <open-input placeholder='Enter email...' label='Email'></open-input>
                <open-input type='password' placeholder='Password' label='Password' required>
                </open-input>
                <open-input value='hello@openelement.org' label='Read-only' disabled></open-input>
              </div>
            </div>
          </div>
          <div class='install-section'>
            <h3>Install @openelement/ui</h3>
            <div class='install-cmd'>
              <span class='prompt'>$</span> deno add jsr:@openelement/ui
            </div>
            <p>Deno, Node, Bun. Zero config.</p>
          </div>
          <div class='nav-row'>
            <a href={`/${loc}/architecture/architecture`} class='nav-link'>← Architecture</a>
            <a href={`/${loc}/architecture/reference/core`} class='nav-link'>API Reference →</a>
          </div>
        </div>
      
    );
  }
}

customElements.define('ui-showcase', UIShowcase);
export default UIShowcase;
export const tagName = 'ui-showcase';

/**
 * Hero Ping - Ocean component (v0.20.0 Ocean-Island).
 *
 * Calls a real API endpoint and shows a status dot with response info.
 * Pure DsdElement - zero Lit dependency. State changes are reflected
 * by re-rendering the shadow DOM and re-hydrating events.
 *
 * @csspart dot-static  - The static status dot
 * @csspart dot-animated - The animated ping button
 */
import {
  DsdElement,
  html,
  StyleSheet,
  type StyleSheetLike,
  type TemplateResult,
} from '@lessjs/core';
import { openPropsTokenSheet } from './open-props-tokens.js';

export const tagName = 'less-hero-ping';

const styles: StyleSheetLike = new StyleSheet();
styles.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .ping {
    padding: 5px 18px;
    border-radius: 2px;
    border: 0.5px solid #555;
    background: transparent;
    color: #ccc;
    font-size: 10px;
    cursor: pointer;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    transition: all 0.15s;
    font-family: inherit;
    white-space: nowrap;
  }
  .ping:hover {
    background: #1a1a1a;
    color: #fff;
    border-color: #888;
  }
  .ping:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }
  .dot.idle { background: #444; }
  .dot.loading {
    background: #888;
    animation: pulse 0.8s ease-in-out infinite alternate;
  }
  .dot.ok { background: #2ecc40; }
  .dot.err { background: #e74c3c; }
  .info {
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
    font-size: 9px;
    color: #666;
    white-space: nowrap;
  }
  .info .ok { color: #2ecc40; }
  .info .err { color: #e74c3c; }
  @keyframes pulse {
    from { opacity: 0.4; }
    to { opacity: 1; }
  }
`);

export default class HeroPing extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  apiUrl = '';
  _state: 'idle' | 'loading' | 'ok' | 'err' = 'idle';
  _msg = '';
  private _abortController?: AbortController;

  override connectedCallback(): void {
    super.connectedCallback();
    // DsdElement handles shadow root creation + initial render.
    // Fetch after DOM is ready.
    this._fetch();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._abortController?.abort();
  }

  _fetch = async (): Promise<void> => {
    this._abortController?.abort();
    this._abortController = new AbortController();
    this._state = 'loading';
    this._msg = '';
    this._renderToDOM();
    try {
      const url = this.apiUrl || 'https://less-demo-api.sisyphuszheng.deno.net/api';
      const r = await fetch(url, { signal: this._abortController.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      this._state = 'ok';
      this._msg = `${d.framework} v${d.version}  ${d.timestamp.slice(11, 19)}`;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const err = e as Error;
      this._state = 'err';
      this._msg = String(e).includes('HTTP') ? err.message : 'connection failed';
    } finally {
      this._renderToDOM();
    }
  };

  override render(): string | TemplateResult {
    const dotClass = `dot ${this._state}`;
    const loading = this._state === 'loading';
    return html`
      <span class="${dotClass}" part="dot-static"></span>
      <button class="ping" part="dot-animated" ?disabled="${loading}" @click="${this._fetch}">
        ${loading ? 'pinging...' : 'ping server'}
      </button>
      ${this._msg
        ? html`
          <span class="info"><span class="${this._state}">${this._msg}</span></span>
        `
        : ''}
    `;
  }

  /** Re-render shadow DOM and re-hydrate click events. */
  private _renderToDOM(): void {
    if (!this.shadowRoot) return;
    this.update();
  }
}

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, HeroPing);
}

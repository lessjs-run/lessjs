/**
 * Hero Ping Island — interactive serverless call button for homepage hero.
 * Must be a separate Island (not in page template) to ensure client hydration.
 */
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'hero-ping';

export default class HeroPing extends LitElement {
  static styles = css`
    :host { display: inline-flex; align-items: center; gap: 12px; }
    .ping-btn {
      padding: 4px 16px;
      border-radius: 2px;
      border: 0.5px solid #ccc;
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
    .ping-btn:hover { background: #333; color: #fff; border-color: #fff; }
    .ping-btn:disabled { opacity: 0.25; cursor: not-allowed; }
    .result {
      font-family: 'SF Mono','Fira Code','Consolas',monospace;
      font-size: 9px;
      color: #666;
      min-width: 110px;
    }
    .result .r { color: #ccc; }
  `;

  _loading = false;
  _result = '';

  _ping = async () => {
    this._loading = true;
    this._result = '';
    this.requestUpdate();
    try {
      const r = await fetch('https://kiss-demo-api.sisyphuszheng.deno.net/api');
      const d = await r.json();
      this._result = `${d.framework} v${d.version}  ${d.timestamp.slice(11,19)}`;
    } catch {
      this._result = 'failed';
    } finally {
      this._loading = false;
      this.requestUpdate();
    }
  }

  override render() {
    return html`
      <button class="ping-btn" @click=${this._ping} ?disabled=${this._loading}>
        ${this._loading ? 'pinging...' : 'ping server'}
      </button>
      <span class="result">
        ${this._loading ? html`<span>connecting...</span>` : ''}
        ${this._result ? html`<span class="r">${this._result}</span>` : ''}
      </span>
    `;
  }
}

customElements.define(tagName, HeroPing);

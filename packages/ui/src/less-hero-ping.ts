/**
 * Hero Ping Island — calls real Deno Deploy API, shows 🟢/🔴 status dot.
 */
import { css, html, LitElement } from 'lit';

export const tagName = 'less-hero-ping';

export default class HeroPing extends LitElement {
  static override properties = { apiUrl: { type: String, attribute: 'api-url' } };

  static override styles = css`
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
    .dot.idle {
      background: #444;
    }
    .dot.loading {
      background: #888;
      animation: pulse 0.8s ease-in-out infinite alternate;
    }
    .dot.ok {
      background: #2ecc40;
    }
    .dot.err {
      background: #e74c3c;
    }

    .info {
      font-family: "SF Mono", "Fira Code", "Consolas", monospace;
      font-size: 9px;
      color: #666;
      white-space: nowrap;
    }
    .info .ok {
      color: #2ecc40;
    }
    .info .err {
      color: #e74c3c;
    }

    @keyframes pulse {
      from {
        opacity: 0.4;
      }
      to {
        opacity: 1;
      }
    }
  `;

  _state: 'idle' | 'loading' | 'ok' | 'err' = 'idle';
  _msg = '';

  override connectedCallback() {
    super.connectedCallback();
    this._fetch();
  }

  _fetch = async () => {
    this._state = 'loading';
    this._msg = '';
    this.requestUpdate();
    try {
      const r = await fetch('https://kiss-demo-api.sisyphuszheng.deno.net/api');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      this._state = 'ok';
      this._msg = `${d.framework} v${d.version}  ${d.timestamp.slice(11, 19)}`;
    } catch (e: unknown) {
      const err = e as Error;
      this._state = 'err';
      this._msg = String(e).includes('HTTP') ? err.message : 'connection failed';
    } finally {
      this.requestUpdate();
    }
  };

  override render() {
    const dotClass = `dot ${this._state}`;
    return html`
      <span class="${dotClass}"></span>
      <button class="ping" @click="${this._fetch}" ?disabled="${this._state === 'loading'}">
        ${this._state === 'loading' ? 'pinging...' : 'ping server'}
      </button>
      ${this._msg
        ? html`
          <span class="info"><span class="${this._state}">${this._msg}</span></span>
        `
        : ''}
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, HeroPing);
} catch { /* already defined */ }

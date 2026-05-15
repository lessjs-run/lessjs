/**
 * Hero Ping Island — calls real API, shows status dot.
 *
 * Layer 3 (Pure Island): no DSD template.
 * Uses Lit's full reactivity cycle (requestUpdate) for state changes,
 * which requires framework ownership of the shadow root.
 * SSR emits just <less-hero-ping></less-hero-ping>, client creates shadow DOM.
 */
import { css, type CSSResult, html, LitElement } from 'lit';

export const tagName = 'less-hero-ping';

export default class HeroPing extends LitElement {
  /** Pure Island: no DSD template, framework fully owns shadow root */
  declare layer: 'pure-island';

  static override properties = {
    apiUrl: { type: String, attribute: 'api-url' },
  };

  // H-06 fix: Initialize apiUrl as a declared property
  apiUrl = '';

  static override styles: CSSResult = css`
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
  // H-07 fix: Add AbortController to cancel in-flight requests on navigation/disconnect
  private _abortController?: AbortController;

  override connectedCallback() {
    super.connectedCallback();
    this._fetch();
  }

  // H-07 fix: Abort in-flight request when component is disconnected (e.g., SPA navigation)
  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController?.abort();
  }

  _fetch = async (): Promise<void> => {
    // H-07 fix: Cancel any previous in-flight request
    this._abortController?.abort();
    this._abortController = new AbortController();

    this._state = 'loading';
    this._msg = '';
    this.requestUpdate();
    try {
      // H-06 fix: Use apiUrl property if provided, fallback to default
      const url = this.apiUrl || 'https://less-demo-api.sisyphuszheng.deno.net/api';
      const r = await fetch(url, { signal: this._abortController.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      this._state = 'ok';
      this._msg = `${d.framework} v${d.version}  ${d.timestamp.slice(11, 19)}`;
    } catch (e: unknown) {
      // Ignore AbortError (cancelled requests are expected behavior)
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const err = e as Error;
      this._state = 'err';
      this._msg = String(e).includes('HTTP') ? err.message : 'connection failed';
    } finally {
      this.requestUpdate();
    }
  };

  override render(): unknown {
    const dotClass = `dot ${this._state}`;
    return html`
      <span class="${dotClass}"></span>
      <button
        class="ping"
        @click="${this._fetch}"
        ?disabled="${this._state === 'loading'}"
      >
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
if (!customElements.get(tagName)) customElements.define(tagName, HeroPing);

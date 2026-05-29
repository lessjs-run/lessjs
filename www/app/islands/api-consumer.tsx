/**
 * API Consumer Island — JAM Pattern Interactive Demo (v0.26)
 *
 * Migrated from LitElement to DsdElement + JSX + StyleSheet.
 * Calls the LessJS serverless API, rendered as DSD.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';

export const tagName = 'api-consumer';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }

  .card {
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    padding: var(--size-4);
    background: var(--bg-surface);
  }
  .card h3 {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-7);
    margin: 0 0 var(--size-3);
    color: var(--text-primary);
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    font-size: var(--font-size-0);
    color: var(--text-muted);
    margin-bottom: var(--size-3);
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: var(--radius-round);
    display: inline-block;
  }
  .status-dot.loading { background: var(--brand-light); }
  .status-dot.connected { background: #22c55e; }
  .status-dot.error { background: var(--error); }

  .data-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--size-1) var(--size-3);
    font-size: var(--font-size-0);
    margin-bottom: var(--size-3);
  }
  .data-grid .key {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
  }
  .data-grid .val {
    color: var(--text-primary);
    font-weight: var(--font-weight-5);
  }

  .pre-box {
    background: var(--bg-code);
    border: var(--border-size-1) solid var(--code-border);
    border-radius: var(--radius-2);
    padding: var(--size-3) var(--size-3);
    font-size: var(--font-size-00);
    font-family: var(--font-mono);
    color: var(--text-secondary);
    overflow-x: auto;
    margin: var(--size-3) 0;
    line-height: var(--font-lineheight-3);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--size-1);
    padding: var(--size-1) var(--size-3);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-hover); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn.primary { background: var(--brand); color: var(--bg-base); border-color: var(--brand); }
  .btn.primary:hover { opacity: 0.85; }
  .btn.primary:disabled { opacity: 0.25; background: var(--text-muted); border-color: transparent; }

  .divider { border: none; border-top: var(--border-size-1) solid var(--border); margin: var(--size-4) 0; }

  .form-row { display: flex; gap: var(--size-2); align-items: center; margin: var(--size-3) 0; }
  .form-row input {
    flex: 1; padding: var(--size-1) var(--size-3);
    border: var(--border-size-1) solid var(--border); border-radius: var(--radius-2);
    background: var(--bg-card); color: var(--text-primary);
    font-size: var(--font-size-0); outline: none;
  }
  .form-row input:focus { border-color: var(--border-hover); }

  .greeting {
    margin-top: var(--size-2); padding: var(--size-2) var(--size-3);
    border-radius: var(--radius-2); font-size: var(--font-size-1); font-weight: var(--font-weight-5);
    background: color-mix(in srgb, var(--brand) 6%, transparent);
    border: var(--border-size-1) solid color-mix(in srgb, var(--brand) 15%, transparent);
    color: var(--text-primary);
    animation: fadeSlide 0.25s ease;
  }
  .err-msg {
    margin-top: var(--size-2); padding: var(--size-2) var(--size-3);
    border-radius: var(--radius-2); font-size: var(--font-size-0);
    background: color-mix(in srgb, var(--error) 8%, transparent);
    border: var(--border-size-1) solid color-mix(in srgb, var(--error) 20%, transparent);
    color: var(--error);
    animation: fadeSlide 0.25s ease;
  }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`);

export default class ApiConsumer extends DsdElement {
  static override styles = [styles];

  #abortController = new AbortController();
  #apiUrl = '';
  #apiData: Record<string, unknown> | null = null;
  #apiLoading = false;
  #apiError = '';
  #name = '';
  #helloMsg = '';
  #helloLoading = false;
  #helloError = '';

  private get _base(): string {
    return this.#apiUrl || '/api';
  }

  override connectedCallback() {
    super.connectedCallback();
    // Defer fetch until after first render to avoid upgrade races
    queueMicrotask(() => this._fetchStatus());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  private async _fetchStatus() {
    this.#apiLoading = true;
    this.#apiError = '';
    try {
      const res = await fetch(`${this._base}/api`, { signal: this.#abortController.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.#apiData = await res.json() as Record<string, unknown>;
    } catch (e) {
      this.#apiError = String(e);
      this.#apiData = null;
    } finally {
      this.#apiLoading = false;
    }
    this.requestUpdate();
  }

  private async _sayHello() {
    const t = this.#name.trim();
    if (!t) return;
    this.#helloLoading = true;
    this.#helloError = '';
    this.#helloMsg = '';
    try {
      const res = await fetch(
        `${this._base}/api/hello/${encodeURIComponent(t)}`,
        { signal: this.#abortController.signal },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json() as { message: string };
      this.#helloMsg = j.message;
    } catch (e) {
      this.#helloError = String(e);
    } finally {
      this.#helloLoading = false;
    }
    this.requestUpdate();
  }

  private _onInput(e: Event) {
    this.#name = (e.target as HTMLInputElement).value;
  }
  private _onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') this._sayHello();
  }

  override render() {
    const dotClass = this.#apiLoading ? 'loading' : this.#apiError ? 'error' : 'connected';
    const statusText = this.#apiLoading
      ? 'Contacting server...'
      : this.#apiError
      ? 'Connection failed'
      : 'API online';

    return (
      <div class='card'>
        <h3>Server Status</h3>
        <div class='status-row'>
          <span class={`status-dot ${dotClass}`} />
          {statusText}
        </div>

        {this.#apiData && (
          <div class='data-grid'>
            <span class='key'>framework</span>
            <span class='val'>{String(this.#apiData.framework)}</span>
            <span class='key'>version</span>
            <span class='val'>{String(this.#apiData.version)}</span>
            <span class='key'>jamstack</span>
            <span class='val'>{String(this.#apiData.jamstack)}</span>
            <span class='key'>serverless</span>
            <span class='val'>{String(this.#apiData.serverless)}</span>
          </div>
        )}

        {this.#apiLoading && <div class='pre-box'>Loading...</div>}

        {this.#apiData && <div class='pre-box'>{JSON.stringify(this.#apiData, null, 2)}</div>}

        {this.#apiError && <div class='pre-box' style='color:var(--error)'>{this.#apiError}</div>}

        <button
          type='button'
          class='btn'
          onClick={() => this._fetchStatus()}
          disabled={this.#apiLoading}
        >
          ⟳ Refresh
        </button>

        <hr class='divider' />

        <h3>Say Hello</h3>
        <p style='font-size:var(--font-size-0);color:var(--text-muted);margin:0 0 var(--size-3);line-height:var(--font-lineheight-3)'>
          Type your name and the serverless API will greet you back. Calls{' '}
          <code style='font-size:var(--font-size-00)'>GET /api/hello/:name</code> on Deno Deploy.
        </p>

        <div class='form-row'>
          <input
            type='text'
            placeholder='Enter your name...'
            value={this.#name}
            onInput={(e: Event) => this._onInput(e)}
            onKeyDown={(e: KeyboardEvent) => this._onKey(e)}
          />
          <button
            type='button'
            class='btn primary'
            onClick={() => this._sayHello()}
            disabled={this.#helloLoading || !this.#name.trim()}
          >
            {this.#helloLoading ? 'Sending...' : 'Say Hello →'}
          </button>
        </div>

        {this.#helloMsg && <div class='greeting'>{this.#helloMsg}</div>}
        {this.#helloError && <div class='err-msg'>{this.#helloError}</div>}
      </div>
    );
  }
}

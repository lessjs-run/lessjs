/**
 * less-term-demo — Interactive terminal island for the homepage.
 *
 * SSR renders a static terminal look. Client-side JS activates
 * keyboard input and sends commands to /api/term.
 */
import { css, html, LitElement } from 'lit';

const INITIAL_PROMPT = '<span class="prompt">$</span> type <span class="hl">help</span> to get started';

export class LessTermDemo extends LitElement {
  static override styles = css`
    :host { display: block; }
    .term { background: #09090b; border-radius: 10px; overflow: hidden; border: 0.5px solid #27272a; }
    .term-bar { display: flex; align-items: center; gap: 5px; padding: 10px 14px; background: #18181b; border-bottom: 0.5px solid #27272a; }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot.r { background: #ef4444; }
    .dot.y { background: #eab308; }
    .dot.g { background: #22c55e; }
    .term-body { padding: 16px; font-family: "JetBrains Mono","Fira Code","SF Mono",Consolas,monospace; font-size: 12px; line-height: 1.9; color: #a1a1aa; min-height: 280px; }
    .term-body .ok { color: #86efac; }
    .term-body .hl { color: #7dd3fc; }
    .term-body .dim { color: #52525b; }
    .term-body .prompt { color: #fbbf24; }
    .term-body .err { color: #ef4444; }
    .input-line { display: flex; align-items: center; gap: 6px; }
    .input-line .prompt { flex-shrink: 0; }
    .input-line input { flex: 1; background: transparent; border: none; outline: none; color: #f4f4f5; font-family: inherit; font-size: inherit; line-height: inherit; padding: 0; caret-color: #f4f4f5; }
    .cursor { display: inline-block; width: 7px; height: 14px; background: #a1a1aa; animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    .output { white-space: pre-wrap; }
    .ellipsis { animation: dots 1.4s steps(4) infinite; }
    @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
  `;

  private _output: string[] = [];
  private _cmdHistory: string[] = [];
  private _historyIdx = -1;
  private _loading = false;

  override render() {
    return html`
      <div class="term">
        <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
        <div class="term-body" @click=${this._focusInput}>
          <div class="output">
            ${this._output.length === 0 ? html`<div>${INITIAL_PROMPT}</div>` : this._output.map(line => html`<div>${line}</div>`)}
          </div>
          <div class="input-line">
            <span class="prompt">$</span>
            <input
              type="text"
              autocomplete="off"
              spellcheck="false"
              @keydown=${this._onKey}
              .value=${''}
            >
          </div>
        </div>
      </div>
    `;
  }

  private _focusInput() {
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }

  private async _onKey(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      input.value = '';
      this._cmdHistory.push(cmd);
      this._historyIdx = this._cmdHistory.length;
      this._output.push(`<span class="prompt">$</span> ${cmd}`);
      if (cmd.toLowerCase() === 'clear') {
        this._output = [];
        this.requestUpdate();
        return;
      }
      this._loading = true;
      this.requestUpdate();
      try {
        const res = await fetch('/api/term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd }),
        });
        const data = await res.json();
        this._loading = false;
        if (data.output) {
          for (const line of data.output) {
            this._output.push(line);
          }
        }
      } catch {
        this._loading = false;
        this._output.push('<span class="err">error: could not reach api</span>');
      }
      this.requestUpdate();
      // scroll to bottom
      const body = this.shadowRoot?.querySelector('.term-body');
      if (body) body.scrollTop = body.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      if (this._cmdHistory.length > 0) {
        this._historyIdx = Math.max(0, this._historyIdx - 1);
        input.value = this._cmdHistory[this._historyIdx] || '';
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (this._historyIdx < this._cmdHistory.length) {
        this._historyIdx = Math.min(this._cmdHistory.length, this._historyIdx + 1);
        input.value = this._cmdHistory[this._historyIdx] || '';
      }
      e.preventDefault();
    }
  }
}

customElements.define('less-term-demo', LessTermDemo);

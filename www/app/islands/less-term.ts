/**
 * less-term-demo — Interactive terminal for the homepage.
 *
 * Light-DOM based: no shadow root. SSR renders the terminal HTML directly.
 * On upgrade, this element attaches keyboard handlers to the existing DOM.
 */
import { LitElement, html } from 'lit';

const TERM_HTML = `
<div class="term">
  <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
  <div class="term-body">
    <div class="output">
      <div><span style="color:#fbbf24;">$</span> type <span style="color:#7dd3fc;">help</span> to get started</div>
    </div>
    <div class="input-line">
      <span style="color:#fbbf24;">$</span>
      <input type="text" autocomplete="off" spellcheck="false">
    </div>
  </div>
</div>`;

export class LessTermDemo extends LitElement {
  protected createRenderRoot() {
    return this; // light DOM — no shadow root
  }

  override render() {
    return html`${TERM_HTML}`;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Defer to next tick so DOM is ready
    setTimeout(() => this._init(), 0);
  }

  private _cmdHistory: string[] = [];
  private _historyIdx = -1;

  private _init() {
    const input = this.querySelector('input');
    const output = this.querySelector('.output') as HTMLElement;
    if (!input || !output) return;

    this.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        input.value = '';
        this._cmdHistory.push(cmd);
        this._historyIdx = this._cmdHistory.length;
        this._addLine(`<span style="color:#fbbf24;">$</span> ${cmd}`, output);
        if (cmd.toLowerCase() === 'clear') { output.innerHTML = ''; return; }
        try {
          const res = await fetch('/api/term', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd }),
          });
          const data = await res.json();
          if (data.output) for (const line of data.output) this._addLine(line, output);
        } catch {
          this._addLine('<span style="color:#ef4444;">error: could not reach api</span>', output);
        }
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
    });
  }

  private _addLine(htmlStr: string, container: HTMLElement) {
    const div = document.createElement('div');
    div.innerHTML = htmlStr;
    container.appendChild(div);
    const body = container.closest('.term-body');
    if (body) body.scrollTop = body.scrollHeight;
  }
}

customElements.define('less-term-demo', LessTermDemo);

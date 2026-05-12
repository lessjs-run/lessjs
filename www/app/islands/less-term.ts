/**
 * less-term-demo — Interactive terminal for the homepage.
 *
 * Proper LessJS Web Component: DsdLitElement + hydrateEvents.
 * - SSR renders DSD HTML (no JS needed for first paint)
 * - Client upgrades via WithDsdHydration mixin
 * - Event handlers bound declaratively via static hydrateEvents
 * - Dynamic output via direct DOM manipulation (no re-render)
 */
import { css, html, nothing } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';

export class LessTermDemo extends DsdLitElement {
  static override styles = css`
    :host { display: block; }
    .term { background: #09090b; border-radius: 10px; overflow: hidden; border: 0.5px solid #27272a; }
    .term-bar { display: flex; align-items: center; gap: 5px; padding: 10px 14px; background: #18181b; border-bottom: 0.5px solid #27272a; }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot.r { background: #ef4444; }
    .dot.y { background: #eab308; }
    .dot.g { background: #22c55e; }
    .term-body { padding: 16px; font-family: "JetBrains Mono","Fira Code","SF Mono",Consolas,monospace; font-size: 12px; line-height: 1.9; color: #a1a1aa; min-height: 260px; overflow-y: auto; cursor: text; }
    .term-body .prompt { color: #fbbf24; }
    .term-body .hl { color: #7dd3fc; }
    .term-body .err { color: #ef4444; }
    .input-line { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
    .input-line input { flex: 1; background: transparent; border: none; outline: none; color: #f4f4f5; font-family: inherit; font-size: inherit; padding: 0; caret-color: #f4f4f5; }
  `;

  static hydrateEvents = [
    { selector: '.term-body', event: 'click', method: '_focusInput' },
    { selector: 'input', event: 'keydown', method: '_onKey' },
  ];

  private _cmdHistory: string[] = [];
  private _historyIdx = -1;

  override render() {
    if (this._dsdHydrated) return nothing;
    return html`
      <div class="term">
        <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
        <div class="term-body">
          <div class="output">
            <div><span class="prompt">$</span> type <span class="hl">help</span> to get started</div>
          </div>
          <div class="input-line">
            <span class="prompt">$</span>
            <input type="text" autocomplete="off" spellcheck="false">
          </div>
        </div>
      </div>
    `;
  }

  private _focusInput() {
    this.shadowRoot?.querySelector<HTMLInputElement>('input')?.focus();
  }

  private _addLine(htmlStr: string) {
    const out = this.shadowRoot?.querySelector('.output');
    if (!out) return;
    const div = document.createElement('div');
    div.innerHTML = htmlStr;
    out.appendChild(div);
    const body = this.shadowRoot?.querySelector('.term-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  private _localCommands: Record<string, string[]> = {
    help: ['<span class="hl">available commands:</span>',
      '  <span style="color:#fbbf24;">help</span>      show this message',
      '  <span style="color:#fbbf24;">neofetch</span>  display system info',
      '  <span style="color:#fbbf24;">version</span>   show lessjs version',
      '  <span style="color:#fbbf24;">build</span>     simulate ssg build',
      '  <span style="color:#fbbf24;">ls</span>        list project structure',
      '  <span style="color:#fbbf24;">whoami</span>    who are you?',
      '  <span style="color:#fbbf24;">uname</span>     print system info',
      '  <span style="color:#fbbf24;">dsd</span>       what is dsd?',
      '  <span style="color:#fbbf24;">clear</span>     clear terminal'],
    version: ['<span class="hl">v0.13.0</span> — api convergence + phase checks'],
    whoami: ['<span style="color:#a1a1aa;">you are a lessjs developer. welcome.</span>'],
    uname: ['<span class="hl">lessjs</span> <span style="color:#52525b;">deno 2.7+ node 18+ edge</span>'],
    dsd: ['<span class="hl">declarative shadow dom:</span>',
      'ssg renders your lit components into <span style="color:#fbbf24;">&lt;template shadowrootmode&gt;</span>',
      'browsers parse it natively — no js framework needed.',
      'content is visible <span style="color:#86efac;">before</span> javascript downloads.'],
  };

  private async _onKey(e: Event) {
    const ke = e as KeyboardEvent;
    const input = ke.target as HTMLInputElement;

    if (ke.key === 'ArrowUp') {
      if (this._cmdHistory.length) {
        this._historyIdx = Math.max(0, this._historyIdx - 1);
        input.value = this._cmdHistory[this._historyIdx] || '';
      }
      ke.preventDefault();
      return;
    }
    if (ke.key === 'ArrowDown') {
      if (this._historyIdx < this._cmdHistory.length) {
        this._historyIdx = Math.min(this._cmdHistory.length, this._historyIdx + 1);
        input.value = this._cmdHistory[this._historyIdx] || '';
      }
      ke.preventDefault();
      return;
    }
    if (ke.key !== 'Enter') return;

    const cmd = input.value.trim();
    input.value = '';
    this._cmdHistory.push(cmd);
    this._historyIdx = this._cmdHistory.length;
    this._addLine(`<span class="prompt">$</span> ${cmd}`);

    if (cmd.toLowerCase() === 'clear') {
      const out = this.shadowRoot?.querySelector('.output');
      if (out) out.innerHTML = '';
      return;
    }

    // Try local first, fall back to API
    const local = this._localCommands[cmd.toLowerCase()];
    if (local) {
      for (const line of local) this._addLine(line);
      return;
    }

    try {
      const res = await fetch('/api/term', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (data.output) for (const line of data.output) this._addLine(line);
    } catch {
      this._addLine('<span class="err">error: could not reach api. try <span class="hl">help</span> for local commands.</span>');
    }
  }
}

customElements.define('less-term-demo', LessTermDemo);

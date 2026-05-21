/**
 * less-term-demo — Ocean component (v0.20.0 Ocean-Island).
 *
 * Interactive terminal for the homepage. Features:
 * - DSD SSR for first paint (no JS needed)
 * - Client upgrade via DsdElement + hydrateEvents
 * - Command history, local commands, API fallback
 * - Direct DOM manipulation for output (no full re-render)
 *
 * Pure DsdElement — zero Lit dependency.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';
import type { HydrateEventDescriptor } from '@lessjs/core';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
  }
  .term {
    background: #09090b;
    border-radius: 10px;
    overflow: hidden;
    border: 0.5px solid #27272a;
  }
  .term-bar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 14px;
    background: #18181b;
    border-bottom: 0.5px solid #27272a;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; }
  .dot.r { background: #ef4444; }
  .dot.y { background: #eab308; }
  .dot.g { background: #22c55e; }
  .term-body {
    padding: 16px;
    font-family: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
    font-size: 12px;
    line-height: 1.9;
    color: #a1a1aa;
    max-height: 280px;
    overflow-y: auto;
    cursor: text;
    scrollbar-width: thin;
    scrollbar-color: #3f3f46 transparent;
  }
  .term-body::-webkit-scrollbar { width: 4px; }
  .term-body::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
  .term-body::-webkit-scrollbar-track { background: transparent; }
  .term-body .prompt { color: #fbbf24; }
  .term-body .hl { color: #7dd3fc; }
  .term-body .err { color: #ef4444; }
  .input-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
  }
  .input-line input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #f4f4f5;
    font-family: inherit;
    font-size: inherit;
    padding: 0;
    caret-color: #f4f4f5;
  }
`);

export class LessTermDemo extends DsdElement {
  static override styles = styles;

  static override hydrateEvents: HydrateEventDescriptor[] = [
    { selector: '.term-body', event: 'click', method: '_focusInput' },
    { selector: 'input', event: 'keydown', method: '_onKey' },
  ];

  private _abortController = new AbortController();
  private _cmdHistory: string[] = [];
  private _historyIdx = -1;

  private static _escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  override render(): string {
    if (this._dsdHydrated) return '';
    return `
      <div class="term">
        <div class="term-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        </div>
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

  private _focusInput(): void {
    this.shadowRoot?.querySelector<HTMLInputElement>('input')?.focus();
  }

  private _addLine(htmlStr: string): void {
    const out = this.shadowRoot?.querySelector('.output');
    if (!out) return;
    const div = document.createElement('div');
    div.innerHTML = this._sanitizeTermHtml(htmlStr);
    out.appendChild(div);
    const body = this.shadowRoot?.querySelector('.term-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  private _sanitizeTermHtml(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const allowed = temp.querySelectorAll('span');
    const result = document.createElement('div');
    for (const span of allowed) {
      const clone = document.createElement('span');
      if (span.className) clone.className = span.className;
      const style = span.getAttribute('style');
      if (style) clone.setAttribute('style', style);
      clone.textContent = span.textContent;
      result.appendChild(clone);
    }
    return result.innerHTML || LessTermDemo._escapeHtml(html);
  }

  private _localCommands: Record<string, string[]> = {
    help: [
      '<span class="hl">available commands:</span>',
      '  <span style="color:#fbbf24;">help</span>      show this message',
      '  <span style="color:#fbbf24;">neofetch</span>  display system info',
      '  <span style="color:#fbbf24;">version</span>   show lessjs version',
      '  <span style="color:#fbbf24;">build</span>     simulate ssg build',
      '  <span style="color:#fbbf24;">ls</span>        list project structure',
      '  <span style="color:#fbbf24;">whoami</span>    who are you?',
      '  <span style="color:#fbbf24;">uname</span>     print system info',
      '  <span style="color:#fbbf24;">dsd</span>       what is dsd?',
      '  <span style="color:#fbbf24;">clear</span>     clear terminal',
    ],
    version: ['<span class="hl">v0.14.7</span> — security hardening patch'],
    whoami: ['<span style="color:#a1a1aa;">you are a lessjs developer. welcome.</span>'],
    uname: [
      '<span class="hl">lessjs</span> <span style="color:#52525b;">deno 2.7+ node 18+ edge</span>',
    ],
    dsd: [
      '<span class="hl">declarative shadow dom:</span>',
      'ssg renders your lit components into <span style="color:#fbbf24;">&lt;template shadowrootmode&gt;</span>',
      'browsers parse it natively — no js framework needed.',
      'content is visible <span style="color:#86efac;">before</span> javascript downloads.',
    ],
  };

  private async _onKey(e: Event): Promise<void> {
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
    this._addLine(`<span class="prompt">$</span> ${LessTermDemo._escapeHtml(cmd)}`);

    if (cmd.toLowerCase() === 'clear') {
      const out = this.shadowRoot?.querySelector('.output');
      if (out) out.innerHTML = '';
      return;
    }

    const local = this._localCommands[cmd.toLowerCase()];
    if (local) {
      for (const line of local) this._addLine(line);
      return;
    }

    try {
      const res = await fetch('/api/term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
        signal: this._abortController.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (data.output) { for (const line of data.output) this._addLine(line); }
    } catch {
      this._addLine(
        '<span class="err">error: could not reach api. try <span class="hl">help</span> for local commands.</span>',
      );
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._abortController.abort();
  }
}

customElements.define('less-term-demo', LessTermDemo);
export default LessTermDemo;

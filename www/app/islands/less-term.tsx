/**
 * less-term-demo - Ocean component (v0.21.0 Reactive DSD).
 *
 * Interactive terminal for the homepage. Features:
 * - DSD SSR for first paint (no JS needed)
 * - Client upgrade via DsdElement + JSX onClick/onKeyDown
 * - Command history, local commands, API fallback
 * - Direct DOM manipulation for output (no full re-render)
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Pure DsdElement - zero Lit dependency.
 */
import { DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
  }
  .term {
    background: var(--gray-1);
    border-radius: var(--radius-3);
    overflow: hidden;
    border: var(--border-size-1) solid var(--gray-3);
  }
  .term-bar {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    padding: var(--size-2) var(--size-3);
    background: var(--gray-2);
    border-bottom: var(--border-size-1) solid var(--gray-3);
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; }
  .dot.r { background: #ef4444; }
  .dot.y { background: #eab308; }
  .dot.g { background: #22c55e; }
  .term-body {
    padding: var(--size-3);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: var(--font-lineheight-4);
    color: var(--gray-7);
    max-height: 280px;
    overflow-y: auto;
    cursor: text;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-5) transparent;
  }
  .term-body::-webkit-scrollbar { width: var(--size-1); }
  .term-body::-webkit-scrollbar-thumb { background: var(--gray-5); border-radius: var(--size-1); }
  .term-body::-webkit-scrollbar-track { background: transparent; }
  .term-body .prompt { color: #fbbf24; }
  .term-body .hl { color: #7dd3fc; }
  .term-body .err { color: #ef4444; }
  .input-line {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    margin-top: var(--size-1);
  }
  .input-line input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: inherit;
    font-size: inherit;
    padding: 0;
    caret-color: var(--text-primary);
  }
`);

export class LessTermDemo extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  /** Command history (signal for consistency with reactive DSD pattern). */
  #cmdHistory = signal<string[]>([]);
  /** Current position in history navigation (signal for consistency). */
  #historyIdx = signal(-1);

  private _abortController = new AbortController();

  private static _escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  override render() {
    return (
      <div className='term'>
        <div className='term-bar'>
          <span className='dot r'></span>
          <span className='dot y'></span>
          <span className='dot g'></span>
        </div>
        <div className='term-body' onClick={this._focusInput}>
          <div className='output'>
            <div>
              <span className='prompt'>$</span> type <span className='hl'>help</span> to get started
            </div>
          </div>
          <div className='input-line'>
            <span className='prompt'>$</span>
            <input
              type='text'
              autocomplete='off'
              spellcheck='false'
              onKeyDown={this._onKey}
            />
          </div>
        </div>
      </div>
    );
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
    version: ['<span class="hl">v0.14.7</span> - security hardening patch'],
    whoami: ['<span style="color:#a1a1aa;">you are a lessjs developer. welcome.</span>'],
    uname: [
      '<span class="hl">lessjs</span> <span style="color:#52525b;">deno 2.7+ node 18+ edge</span>',
    ],
    dsd: [
      '<span class="hl">declarative shadow dom:</span>',
      'ssg renders your lit components into <span style="color:#fbbf24;">&lt;template shadowrootmode&gt;</span>',
      'browsers parse it natively - no js framework needed.',
      'content is visible <span style="color:#86efac;">before</span> javascript downloads.',
    ],
  };

  private async _onKey(e: Event): Promise<void> {
    const ke = e as KeyboardEvent;
    const input = ke.target as HTMLInputElement;

    if (ke.key === 'ArrowUp') {
      if (this.#cmdHistory.value.length) {
        this.#historyIdx.value = Math.max(0, this.#historyIdx.value - 1);
        input.value = this.#cmdHistory.value[this.#historyIdx.value] || '';
      }
      ke.preventDefault();
      return;
    }
    if (ke.key === 'ArrowDown') {
      if (this.#historyIdx.value < this.#cmdHistory.value.length) {
        this.#historyIdx.value = Math.min(
          this.#cmdHistory.value.length,
          this.#historyIdx.value + 1,
        );
        input.value = this.#cmdHistory.value[this.#historyIdx.value] || '';
      }
      ke.preventDefault();
      return;
    }
    if (ke.key !== 'Enter') return;

    const cmd = input.value.trim();
    input.value = '';
    this.#cmdHistory.value = [...this.#cmdHistory.value, cmd];
    this.#historyIdx.value = this.#cmdHistory.value.length;
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

if (!customElements.get('less-term-demo')) customElements.define('less-term-demo', LessTermDemo);
export default LessTermDemo;

/**
 * @lessjs/docs - Search island
 *
 * Full-text search using FlexSearch.
 * Loads a pre-built search index JSON and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * v0.27: Complete rewrite — zero hand-written DOM. JSX + signals drive everything.
 *   - Overlay rendered via JSX in shadow DOM, not document.createElement
 *   - Search results driven by signals, not innerHTML string concatenation
 *   - Styles live in shadow DOM, not document.adoptedStyleSheets
 *   - Cmd+K listener managed through DsdElement lifecycle
 *
 * @csspart trigger - The search trigger button
 * @csspart icon - The search SVG icon
 * @csspart label - The "Search" text span
 * @csspart shortcut - The keyboard shortcut kbd
 */

import { DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

interface SearchEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

export const tagName = 'less-search';

// -- Shadow DOM styles (trigger button + overlay) --
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; align-items: center; }

  .search-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-6);
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all var(--ease-2) var(--duration-2);
  }
  .search-trigger:hover {
    color: var(--text-primary);
    border-color: var(--brand);
    background: var(--bg-surface);
  }
  .search-trigger kbd {
    font-family: inherit;
    padding: var(--size-1) var(--size-1);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    margin-left: var(--size-1);
  }
  .search-icon { display: none; width: var(--size-4); height: var(--size-4); }
  @media (max-width: 640px) {
    .search-trigger span, .search-trigger kbd { display: none; }
    .search-icon { display: inline-block; }
  }

  /* -- Overlay — rendered in shadow DOM, position:fixed covers viewport -- */
  .overlay {
    position: fixed;
    top: 0; right: 0; bottom: 0; left: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 15vh;
    box-sizing: border-box;
  }
  .panel {
    width: 100%;
    max-width: 560px;
    max-height: 70vh;
    margin: 0 var(--size-4);
    background: var(--bg-elevated);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-2);
    box-shadow: var(--shadow-1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .search-input {
    width: 100%;
    padding: var(--size-3) var(--size-3);
    border: none;
    border-bottom: 0.5px solid var(--border);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-1);
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .results {
    flex: 1;
    overflow-y: auto;
    padding: var(--size-3) 0;
  }
  .item {
    display: block;
    padding: var(--size-3) var(--size-3);
    text-decoration: none;
    color: inherit;
    transition: background var(--ease-2) var(--duration-2);
    cursor: pointer;
  }
  .item:hover { background: var(--bg-hover); }
  .item-section {
    font-size: var(--font-size-00);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
    color: var(--text-muted);
    margin-bottom: var(--size-1);
  }
  .item-title {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--text-primary);
    margin-bottom: var(--size-1);
  }
  .item-text {
    font-size: var(--font-size-0);
    color: var(--text-secondary);
    line-height: var(--font-lineheight-3);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .empty {
    padding: var(--size-9) var(--size-3);
    text-align: center;
    color: var(--gray-5);
    font-size: var(--font-size-0);
  }
`);

export default class LessSearch extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  // Reactive state (signals)
  #open = signal(false);
  #query = signal('');
  #results = signal<SearchEntry[]>([]);

  // Internal data (non-reactive)
  private _index: unknown = null;
  private _entries: SearchEntry[] = [];
  private _loaded = false;
  private _inputRef: HTMLInputElement | null = null;

  // Cmd+K handler — bound/cleaned in lifecycle
  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.#open.value ? this._close() : this._open();
    } else if (e.key === 'Escape' && this.#open.value) {
      this._close();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    globalThis.removeEventListener('keydown', this._onKeydown);
  }

  private _open(): void {
    this.#open.value = true;
    this._loadIndex();
    requestAnimationFrame(() => this._inputRef?.focus());
  }

  private _close(): void {
    this.#open.value = false;
    this.#query.value = '';
    this.#results.value = [];
    this._inputRef = null;
  }

  private _onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.#query.value = target.value;

    if (this.#query.value.length < 2 || !this._index) {
      this.#results.value = [];
    } else {
      const index = this._index as {
        search: (q: string, opts: { limit: number }) => Array<{ field: string; result: string[] }>;
      };
      const paths = new Set<string>();
      for (const field of index.search(this.#query.value, { limit: 10 })) {
        field.result.forEach((p) => paths.add(p));
      }
      this.#results.value = this._entries.filter((entry) => paths.has(entry.path)).slice(0, 10);
    }
  }

  private async _loadIndex(): Promise<void> {
    if (this._loaded) return;
    this._loaded = true;
    try {
      const [res, FlexSearchModule] = await Promise.all([
        fetch('/search-index.json'),
        import('flexsearch') as Promise<{ default: unknown }>,
      ]);
      const FlexSearch = (FlexSearchModule as { default?: unknown }).default || FlexSearchModule;
      this._entries = await res.json() as SearchEntry[];
      this._index = new (FlexSearch as new (opts: Record<string, unknown>) => unknown).Document({
        document: { id: 'path', index: ['title', 'section', 'text'] },
        tokenize: 'forward',
      });
      for (const entry of this._entries) {
        (this._index as Record<string, (entry: SearchEntry) => void>).add(entry);
      }
    } catch {
      this._loaded = false;
    }
  }

  // --- Signal-driven search results (JSX, no innerHTML) ---
  private _renderResults() {
    const results = this.#results.value;
    if (results.length > 0) {
      return results.map((r) => (
        <a href={r.path} class='item' onClick={() => this._close()}>
          <div class='item-section'>{r.section}</div>
          <div class='item-title'>{r.title}</div>
          <div class='item-text'>{r.text}</div>
        </a>
      ));
    }
    if (this.#query.value.length >= 2) {
      return <div class='empty'>No results found for &ldquo;{this.#query.value}&rdquo;</div>;
    }
    return <div class='empty'>Type at least 2 characters to search</div>;
  }

  override render() {
    return (
      <>
        {/* Trigger button — always visible */}
        <button
          type='button'
          class='search-trigger'
          part='trigger'
          aria-label='Search'
          onClick={() => this._open()}
        >
          <svg
            class='search-icon'
            part='icon'
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            stroke-width='1.5'
            stroke-linecap='round'
          >
            <circle cx='7' cy='7' r='4.5' />
            <path d='M10.5 10.5L14 14' />
          </svg>
          <span part='label'>Search</span>
          <kbd part='shortcut'>&#x2318;K</kbd>
        </button>

        {/* Overlay — signal-driven, rendered in shadow DOM */}
        {this.#open.value && (
          <div
            class='overlay'
            onClick={(e: Event) => {
              if (e.target === e.currentTarget) this._close();
            }}
          >
            <div class='panel'>
              <input
                type='text'
                class='search-input'
                placeholder='Search documentation...'
                value={this.#query.value}
                onInput={(e: Event) => this._onInput(e)}
                ref={(el: HTMLInputElement) => {
                  this._inputRef = el;
                }}
              />
              <div class='results'>
                {this._renderResults()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, LessSearch);

/**
 * @lessjs/docs - Search island
 *
 * Full-text search using FlexSearch.
 * Loads a pre-built search index JSON and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * v0.28 (ADR-0068): Zero-effect / zero-createElement / zero-innerHTML implementation.
 *   - Overlay visibility: computed signal → data-signal-attr="class"
 *   - Search results: computed signal → data-signal-html
 *   - All escaping via @lessjs/core escapeHtml/escapeAttr
 *   - All events via data-on-* markers
 *
 * @csspart trigger - The search trigger button
 * @csspart icon - The search SVG icon
 * @csspart label - The "Search" text span
 * @csspart shortcut - The keyboard shortcut kbd
 */

import { defineCustomElement, DsdElement, escapeAttr, escapeHtml } from '@lessjs/core';
import { computed, signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

interface SearchEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

interface FlexSearchDocumentConstructor {
  Document: new (opts: Record<string, unknown>) => unknown;
}

export const tagName = 'less-search';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    contain: none;
  }

  .search-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    border: 0.5px solid var(--gray-3);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--gray-6);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-6);
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all var(--ease-2) var(--duration-2);
  }
  .search-trigger:hover {
    color: var(--gray-10);
    border-color: var(--indigo-5);
    background: var(--gray-1);
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

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 15vh 0 0;
    border: 0;
    color: inherit;
    background: color-mix(in srgb, var(--gray-12) 40%, transparent);
    display: none;
    justify-content: center;
    align-items: flex-start;
    box-sizing: border-box;
  }
  .overlay.open {
    display: flex;
  }
  .panel {
    width: 100%;
    max-width: 560px;
    max-height: 70vh;
    margin: 0 var(--size-4);
    background: var(--gray-0);
    border: 0.5px solid var(--gray-3);
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
    border-bottom: 0.5px solid var(--gray-3);
    background: transparent;
    color: var(--gray-10);
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
  .item:hover { background: var(--gray-2); }
  .item-section {
    font-size: var(--font-size-00);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
    color: var(--gray-6);
    margin-bottom: var(--size-1);
  }
  .item-title {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--gray-10);
    margin-bottom: var(--size-1);
  }
  .item-text {
    font-size: var(--font-size-0);
    color: var(--gray-7);
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

  // ── Signals ──────────────────────────────────────────────────────────────

  #open = signal(false);
  #query = signal('');
  #results = signal<SearchEntry[]>([]);

  /** v0.28: Computed overlay class string for data-signal-attr binding. */
  #overlayClass = computed(() => this.#open.value ? 'overlay open' : 'overlay');

  /** v0.28: Computed results HTML for data-signal-html binding. */
  #resultsHtml = computed(() => this._buildResultsHtml());

  // ── Internal state ───────────────────────────────────────────────────────

  private _index: unknown = null;
  private _entries: SearchEntry[] = [];
  private _loaded = false;
  private _inputRef: HTMLInputElement | null = null;

  constructor() {
    super();
    this.registerSignal('open', this.#open);
    this.registerSignal('query', this.#query);
    this.registerSignal('overlayClass', this.#overlayClass);
    this.registerSignal('resultsHtml', this.#resultsHtml);
  }

  // ── Keyboard shortcut ────────────────────────────────────────────────────

  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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

  // ── Public handlers (bound via data-on-* in render) ──────────────────────

  _open(): void {
    this.#open.value = true;
    this._loadIndex();
    requestAnimationFrame(() => this._inputRef?.focus());
  }

  _close(): void {
    this.#open.value = false;
    this.#query.value = '';
    this.#results.value = [];
    this._inputRef = null;
  }

  _closeOnBackdrop(e: Event): void {
    if (e.target === e.currentTarget) this._close();
  }

  /** Prevent clicks inside the panel from propagating to overlay. */
  __stopPropagation(e: Event): void {
    e.stopPropagation();
  }

  _onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.#query.value = target.value;
    this._runSearch();
  }

  private _runSearch(): void {
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
      this.#results.value = this._entries
        .filter((entry) => paths.has(entry.path))
        .slice(0, 10);
    }
  }

  // ── Index loading ────────────────────────────────────────────────────────

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
      this._index = new (FlexSearch as FlexSearchDocumentConstructor).Document({
        document: { id: 'path', index: ['title', 'section', 'text'] },
        tokenize: 'forward',
      });
      for (const entry of this._entries) {
        (this._index as Record<string, (entry: SearchEntry) => void>).add(entry);
      }
      this._runSearch();
    } catch {
      this._loaded = false;
    }
  }

  // ── Computed HTML builder (v0.28) ────────────────────────────────────────

  /**
   * Build results HTML string from current signals.
   * Called by the #resultsHtml computed signal — zero manual effect,
   * zero document.createElement, zero innerHTML outside hydration.
   */
  private _buildResultsHtml(): string {
    const results = this.#results.value;

    if (results.length > 0) {
      return results.map((r) =>
        `<a href="${escapeAttr(r.path)}" class="result item" data-on-click="_close">` +
        `<div class="item-section">${escapeHtml(r.section)}</div>` +
        `<div class="item-title">${escapeHtml(r.title)}</div>` +
        `<div class="item-text">${escapeHtml(r.text)}</div>` +
        `</a>`
      ).join('');
    }

    if (this.#query.value.length >= 2) {
      return `<div class="empty">No results found for &ldquo;${
        escapeHtml(this.#query.value)
      }&rdquo;</div>`;
    }

    return `<div class="empty">Type at least 2 characters to search</div>`;
  }

  // ── Render (SSR: overlay hidden, results empty; hydration binds signals) ─

  override render() {
    return (
      <>
        <button
          type='button'
          class='search-trigger'
          part='trigger'
          aria-label='Search'
          data-on-click='_open'
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

        {
          /* v0.28: class driven by computed signal via data-signal-attr.
            No effect(), no classList.toggle. */
        }
        <div
          class={this.#overlayClass}
          data-signal='overlayClass'
          data-signal-attr='class'
          data-on-click='_closeOnBackdrop'
        >
          <div class='panel' data-on-click='__stopPropagation'>
            <input
              type='text'
              class='search-input'
              placeholder='Search documentation...'
              data-on-input='_onInput'
              ref={(el: HTMLInputElement) => {
                this._inputRef = el;
              }}
            />
            {
              /* v0.28: innerHTML driven by computed signal via data-signal-html.
                No effect(), no document.createElement, no _renderResultsTo. */
            }
            <div
              class='results'
              data-signal-html='resultsHtml'
              innerHTML={this.#resultsHtml.value}
              rawHtml
            >
            </div>
          </div>
        </div>
      </>
    );
  }
}

defineCustomElement(tagName, LessSearch);

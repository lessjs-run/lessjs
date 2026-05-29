/**
 * @lessjs/docs - Search island
 *
 * Full-text search using FlexSearch.
 * Loads a pre-built search index JSON and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.21.0: Signal migration — _open, _query, _results → #open, #query, #results signals.
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart trigger -The search trigger button
 * @csspart icon -The search SVG icon
 * @csspart label -The "Search" text span
 * @csspart shortcut -The keyboard shortcut kbd
 *
 * Architecture (DsdElement, SPA-safe):
 * - DSD renders only the trigger button via render()
 * - Overlay created imperatively in document.body
 * - All overlay logic is imperative (not reactive)
 * - Component state is reset on connectedCallback() for SPA navigation safety
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

// -- Shadow DOM styles (trigger button) --
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; align-items: center; }

  .search-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--gray-5);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-5);
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  .search-trigger:hover { color: var(--gray-7); border-color: var(--gray-5); }
  .search-trigger kbd {
    font-family: inherit;
    padding: 0.0625rem 0.3125rem;
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: 3px;
    font-size: 0.625rem;
    margin-left: var(--size-1);
  }
  .search-icon { display: none; width: 16px; height: 16px; }
  @media (max-width: 640px) {
    .search-trigger span, .search-trigger kbd { display: none; }
    .search-icon { display: inline-block; }
  }
`);

// -- Overlay styles (document-level, injected into document.adoptedStyleSheets) --
let _overlaySheet: CSSStyleSheet | null = null;
function getOverlaySheet(): CSSStyleSheet {
  if (!_overlaySheet) {
    _overlaySheet = new CSSStyleSheet();
    _overlaySheet.replaceSync(`
  .less-search-overlay {
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
  .less-search-panel {
    width: 100%;
    max-width: 560px;
    max-height: 70vh;
    margin: 0 1rem;
    background: #fff;
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    box-shadow: var(--shadow-3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .less-search-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: none;
    border-bottom: var(--border-size-1) solid var(--gray-3);
    background: transparent;
    color: var(--gray-9);
    font-size: 1rem;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .less-search-results {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }
  .less-search-item {
    display: block;
    padding: 0.625rem 1rem;
    text-decoration: none;
    color: inherit;
    transition: background 0.1s;
    cursor: pointer;
  }
  .less-search-item:hover { background: var(--gray-1); }
  .less-search-section {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--gray-5);
    margin-bottom: 0.125rem;
  }
  .less-search-title {
    font-size: 0.875rem;
    font-weight: var(--font-weight-5);
    color: var(--gray-9);
    margin-bottom: 0.125rem;
  }
  .less-search-text {
    font-size: 0.8125rem;
    color: var(--gray-7);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .less-search-empty {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--gray-5);
    font-size: 0.875rem;
  }
`);
  }
  return _overlaySheet;
}

export default class LessSearch extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];

  // Reactive state (signals)
  #open = signal(false);
  #query = signal('');
  #results = signal<SearchEntry[]>([]);

  // Internal data/state (non-reactive — not used in render())
  private _index: unknown = null;
  private _entries: SearchEntry[] = [];
  private _loaded = false;
  private _overlayEl: HTMLDivElement | null = null;
  private _inputEl: HTMLInputElement | null = null;

  override render() {
    return (
      <button
        type='button'
        className='search-trigger'
        part='trigger'
        aria-label='Search'
        onClick={() => this._handleTriggerClick()}
      >
        <svg
          className='search-icon'
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
        <kbd part='shortcut'>⌘K</kbd>
      </button>
    );
  }

  // Cmd+K handler (bound to document)
  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.#open.value ? this._closeOverlay() : this._handleTriggerClick();
    } else if (e.key === 'Escape' && this.#open.value) {
      this._closeOverlay();
    }
  };

  override connectedCallback(): void {
    // Clean up orphaned overlays from previous SPA pages
    document.querySelectorAll('.less-search-overlay').forEach((el) => el.remove());
    this._resetState();
    super.connectedCallback();
    // Inject overlay stylesheet into document
    const overlaySheet = getOverlaySheet();
    if (!document.adoptedStyleSheets.includes(overlaySheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, overlaySheet];
    }
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    document.removeEventListener('keydown', this._onKeydown);
    this._destroyOverlay();
    super.disconnectedCallback();
  }

  private _resetState(): void {
    this.#open.value = false;
    this.#query.value = '';
    this.#results.value = [];
    this._overlayEl = null;
    this._inputEl = null;
  }

  private _handleTriggerClick(): void {
    this.#open.value = true;
    this._loadIndex();
    this._createOverlay();
    requestAnimationFrame(() => {
      this._inputEl?.focus();
    });
  }

  private _closeOverlay(): void {
    this.#open.value = false;
    this._destroyOverlay();
  }

  /** Create overlay in document.body */
  private _createOverlay(): void {
    if (this._overlayEl) return;

    const overlay = document.createElement('div');
    overlay.className = 'less-search-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeOverlay();
    });

    const panel = document.createElement('div');
    panel.className = 'less-search-panel';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'less-search-input';
    input.placeholder = 'Search documentation...';
    input.addEventListener('input', (e) => this._onInput(e));
    this._inputEl = input;

    const results = document.createElement('div');
    results.className = 'less-search-results';
    results.innerHTML = this._getResultsHtml();

    panel.appendChild(input);
    panel.appendChild(results);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlayEl = overlay;
  }

  private _destroyOverlay(): void {
    this._overlayEl?.remove();
    this._overlayEl = null;
    this._inputEl = null;
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
    this._updateResults();
  }

  /** Update search results DOM imperatively (overlay lives in document.body, not shadow DOM). */
  private _updateResults(): void {
    const resultsDiv = this._overlayEl?.querySelector('.less-search-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = this._getResultsHtml();
      resultsDiv.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => this._closeOverlay());
      });
    }
  }

  private _getResultsHtml(): string {
    if (this.#results.value.length > 0) {
      return this.#results.value.map((r) =>
        `<a href="${this._escapeAttr(r.path)}" class="less-search-item" data-path="${
          this._escapeAttr(r.path)
        }">` +
        `<div class="less-search-section">${this._escapeHtml(r.section)}</div>` +
        `<div class="less-search-title">${this._escapeHtml(r.title)}</div>` +
        `<div class="less-search-text">${this._escapeHtml(r.text)}</div>` +
        `</a>`
      ).join('');
    }
    if (this.#query.value.length >= 2) {
      return `<div class="less-search-empty">No results found for "${
        this._escapeHtml(this.#query.value)
      }"</div>`;
    }
    return `<div class="less-search-empty">Type at least 2 characters to search</div>`;
  }

  private _escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private _escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;');
  }

  private async _loadIndex(): Promise<void> {
    if (this._loaded) return;
    this._loaded = true;
    try {
      const [res, FlexSearchModule] = await Promise.all([
        fetch('/search-index.json'),
        // deno-lint-ignore no-explicit-any
        import('flexsearch') as Promise<any>,
      ]);
      const FlexSearch = FlexSearchModule.default || FlexSearchModule;
      this._entries = await res.json() as SearchEntry[];
      this._index = new FlexSearch.Document({
        document: { id: 'path', index: ['title', 'section', 'text'] },
        tokenize: 'forward',
      });
      for (const entry of this._entries) {
        // deno-lint-ignore no-explicit-any
        (this._index as any).add(entry);
      }
    } catch {
      this._loaded = false;
    }
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, LessSearch);

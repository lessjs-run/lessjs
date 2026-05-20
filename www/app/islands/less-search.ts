/**
 * @lessjs/docs - Search island
 *
 * Full-text search using FlexSearch.
 * Loads a pre-built search index JSON and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * Architecture:
 * - DSD provides the button HTML with native onclick handler calling open()
 * - Lit provides the overlay panel
 * - Lit render() returns nothing when closed — DSD handles the button
 */

import { LitElement, html, nothing } from 'lit';
import { live } from 'lit-html/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';

interface SearchEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

export const tagName = 'less-search';

export default class LessSearch extends LitElement {
  private _open = false;
  private _query = '';
  private _results: SearchEntry[] = [];
  private _index: unknown = null;
  private _entries: SearchEntry[] = [];
  private _loaded = false;
  private _boundKeydown: (e: KeyboardEvent) => void;

  constructor() {
    super();
    this._boundKeydown = this._onKeydown.bind(this);
  }

  static styles = `
    :host {
      display: inline-flex;
      align-items: center;
    }

    /* Overlay */
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      padding-top: 15vh;
    }
    .panel {
      width: 100%;
      max-width: 560px;
      max-height: 60vh;
      background: var(--less-bg-base, #fff);
      border: 0.5px solid var(--less-border);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .search-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: none;
      border-bottom: 0.5px solid var(--less-border);
      background: transparent;
      color: var(--less-text-primary);
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
    }
    .search-input::placeholder {
      color: var(--less-text-tertiary);
    }
    .results {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }
    .result-item {
      display: block;
      padding: 0.625rem 1rem;
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;
    }
    .result-item:hover {
      background: var(--less-bg-surface, #f5f5f5);
    }
    .result-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--less-text-primary);
      margin-bottom: 0.125rem;
    }
    .result-section {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--less-text-tertiary);
      margin-bottom: 0.125rem;
    }
    .result-text {
      font-size: 0.8125rem;
      color: var(--less-text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .no-results {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--less-text-tertiary);
      font-size: 0.875rem;
    }
  `;

  /** Public API: open the search overlay */
  open() {
    this._open = true;
    this._loadIndex();
    this.requestUpdate();
    requestAnimationFrame(() => {
      this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._boundKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._boundKeydown);
  }

  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (this._open) {
        this._open = false;
      } else {
        this.open();
      }
      this.requestUpdate();
    }
    if (e.key === 'Escape' && this._open) {
      this._open = false;
      this.requestUpdate();
    }
  };

  private async _loadIndex() {
    if (this._loaded) return;
    this._loaded = true;
    try {
      const [res, FlexSearchModule] = await Promise.all([
        fetch('/search-index.json'),
        import('flexsearch'),
      ]);
      // deno-lint-ignore no-explicit-any
      const FlexSearch = (FlexSearchModule as any).default || FlexSearchModule;
      this._entries = await res.json() as SearchEntry[];
      this._index = new FlexSearch.Document({
        document: {
          id: 'path',
          index: ['title', 'section', 'text'],
        },
        tokenize: 'forward',
      });
      for (const entry of this._entries) {
        (this._index as { add: (e: SearchEntry) => void }).add(entry);
      }
    } catch {
      this._loaded = false;
    }
  }

  private _onInput = (e: InputEvent) => {
    this._query = (e.target as HTMLInputElement).value;
    if (this._query.length < 2 || !this._index) {
      this._results = [];
    } else {
      const index = this._index as {
        search: (q: string, opts: { limit: number }) => Array<{ field: string; result: string[] }>;
      };
      const raw = index.search(this._query, { limit: 10 });
      const paths = new Set<string>();
      for (const field of raw) {
        for (const path of field.result) {
          paths.add(path);
        }
      }
      this._results = this._entries
        .filter((e) => paths.has(e.path))
        .slice(0, 10);
    }
    this.requestUpdate();
  };

  private _onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      this._open = false;
      this.requestUpdate();
    }
  };

  private _onResultClick = () => {
    this._open = false;
    this.requestUpdate();
  };

  /** Lit render: only renders the overlay. Button is provided by DSD. */
  override render() {
    if (!this._open) return nothing;

    return html`
      <div class="overlay" @click="${this._onOverlayClick}">
        <div class="panel">
          <input
            class="search-input"
            type="text"
            placeholder="Search documentation..."
            .value="${live(this._query)}"
            @input="${this._onInput}"
          >
          <div class="results">
            ${this._results.length > 0
              ? repeat(
                  this._results,
                  (r) => r.path,
                  (r) => html`
                    <a class="result-item" href="${r.path}" @click="${this._onResultClick}">
                      <div class="result-section">${r.section}</div>
                      <div class="result-title">${r.title}</div>
                      <div class="result-text">${r.text}</div>
                    </a>
                  `,
                )
              : this._query.length >= 2
              ? html`<div class="no-results">No results found for "${this._query}"</div>`
              : html`<div class="no-results">Type at least 2 characters to search</div>`}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define(tagName, LessSearch);

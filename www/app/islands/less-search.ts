/**
 * @lessjs/docs - Search island
 *
 * Full-text search using FlexSearch.
 * Loads a pre-built search index JSON and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * Architecture (DsdLitElement, SPA-safe):
 * - Uses DsdLitElement for proper DSD hydration
 * - Overlay is ALWAYS appended to document.body with inline styles
 *   for maximum reliability across all browsers and devices
 * - Lit render() only produces the trigger button
 * - SPA navigation: Component state is reset in connectedCallback()
 */

import { css, html, nothing } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';

interface SearchEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

export const tagName = 'less-search';

/** Inline styles for overlay - all CSS inline for zero dependency on shadow DOM */
const OVERLAY_STYLES = `
  position:fixed;
  top:0;right:0;bottom:0;left:0;
  z-index:9999;
  background:rgba(0,0,0,0.4);
  display:flex;
  justify-content:center;
  align-items:flex-start;
  padding-top:15vh;
  box-sizing:border-box;
`;
const PANEL_STYLES = `
  width:100%;
  max-width:560px;
  max-height:70vh;
  margin:0 1rem;
  background:#fff;
  border:0.5px solid #e5e5e5;
  border-radius:8px;
  box-shadow:0 8px 32px rgba(0,0,0,0.12);
  display:flex;
  flex-direction:column;
  overflow:hidden;
`;
const INPUT_STYLES = `
  width:100%;
  padding:0.875rem 1rem;
  border:none;
  border-bottom:0.5px solid #e5e5e5;
  background:transparent;
  color:#111;
  font-size:1rem;
  outline:none;
  box-sizing:border-box;
  font-family:inherit;
`;
const RESULTS_STYLES = `
  flex:1;
  overflow-y:auto;
  padding:0.5rem 0;
`;
const RESULT_ITEM_STYLES = `
  display:block;
  padding:0.625rem 1rem;
  text-decoration:none;
  color:inherit;
  transition:background 0.1s;
  cursor:pointer;
`;
const RESULT_SECTION_STYLES = `
  font-size:0.6875rem;
  text-transform:uppercase;
  letter-spacing:0.05em;
  color:#999;
  margin-bottom:0.125rem;
`;
const RESULT_TITLE_STYLES = `
  font-size:0.875rem;
  font-weight:500;
  color:#111;
  margin-bottom:0.125rem;
`;
const RESULT_TEXT_STYLES = `
  font-size:0.8125rem;
  color:#666;
  line-height:1.5;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
`;
const NO_RESULTS_STYLES = `
  padding:2rem 1rem;
  text-align:center;
  color:#999;
  font-size:0.875rem;
`;

export default class LessSearch extends DsdLitElement {
  /** Declarative event bindings for DSD hydration */
  static hydrateEvents = [
    { selector: 'button.search-trigger', event: 'click', method: '_handleTriggerClick' },
  ];

  static override styles = css`
    :host { display: inline-flex; align-items: center; }

    .search-trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--less-size-2, 0.375rem);
      padding: var(--less-size-2, 0.375rem) var(--less-size-3, 0.5rem);
      border: 0.5px solid var(--less-border);
      border-radius: var(--less-radius-md, 6px);
      background: transparent;
      color: var(--less-text-muted);
      font-size: var(--less-font-size-xs, 0.6875rem);
      font-weight: var(--less-font-weight-medium, 500);
      letter-spacing: var(--less-letter-spacing-wide, 0.02em);
      cursor: pointer;
      transition: color var(--less-transition-normal), border-color var(--less-transition-normal);
    }
    .search-trigger:hover { color: var(--less-text-secondary); border-color: var(--less-border-hover); }
    .search-trigger kbd {
      font-family: inherit;
      padding: 0.0625rem 0.3125rem;
      border: 0.5px solid var(--less-border);
      border-radius: 3px;
      font-size: 0.625rem;
      margin-left: var(--less-size-1, 0.25rem);
    }
    .search-icon { display: none; width: 16px; height: 16px; }
    @media (max-width: 640px) {
      .search-trigger span, .search-trigger kbd { display: none; }
      .search-icon { display: inline-block; }
    }
  `;

  // State
  private _open = false;
  private _query = '';
  private _results: SearchEntry[] = [];
  private _index: unknown = null;
  private _entries: SearchEntry[] = [];
  private _loaded = false;
  /** Reference to overlay in document.body */
  private _overlayEl: HTMLDivElement | null = null;
  /** Reference to input element for focus management */
  private _inputEl: HTMLInputElement | null = null;

  // Bound handlers
  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this._open ? this._closeOverlay() : this._handleTriggerClick();
    } else if (e.key === 'Escape' && this._open) {
      this._closeOverlay();
    }
  };

  /** Clean up any orphaned overlay from previous page instance */
  override connectedCallback() {
    document.querySelectorAll('.less-search-overlay').forEach((el) => el.remove());
    this._resetState();
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
    this._destroyOverlay();
    super.disconnectedCallback();
  }

  private _resetState() {
    this._open = false;
    this._query = '';
    this._results = [];
    this._overlayEl = null;
    this._inputEl = null;
  }

  /** Handle search trigger click */
  private _handleTriggerClick() {
    this._open = true;
    this._loadIndex();
    this._createOverlay();

    requestAnimationFrame(() => {
      this._inputEl?.focus();
    });
  }

  private _closeOverlay() {
    this._open = false;
    this._destroyOverlay();
  }

  /** Create overlay in document.body */
  private _createOverlay() {
    if (this._overlayEl) return;

    const overlay = document.createElement('div');
    overlay.className = 'less-search-overlay';
    overlay.style.cssText = OVERLAY_STYLES;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeOverlay();
    });

    const panel = document.createElement('div');
    panel.style.cssText = PANEL_STYLES;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search documentation...';
    input.style.cssText = INPUT_STYLES;
    input.addEventListener('input', (e) => this._onInput(e));
    this._inputEl = input;

    const results = document.createElement('div');
    results.style.cssText = RESULTS_STYLES;
    results.innerHTML = this._getResultsHtml();

    panel.appendChild(input);
    panel.appendChild(results);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this._overlayEl = overlay;
  }

  private _destroyOverlay() {
    this._overlayEl?.remove();
    this._overlayEl = null;
    this._inputEl = null;
  }

  private _onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this._query = target.value;

    if (this._query.length < 2 || !this._index) {
      this._results = [];
    } else {
      const index = this._index as {
        search: (q: string, opts: { limit: number }) => Array<{ field: string; result: string[] }>;
      };
      const paths = new Set<string>();
      for (const field of index.search(this._query, { limit: 10 })) {
        field.result.forEach((p) => paths.add(p));
      }
      this._results = this._entries.filter((entry) => paths.has(entry.path)).slice(0, 10);
    }

    this._updateResults();
  }

  private _updateResults() {
    const resultsDiv = this._overlayEl?.querySelector('div > div:last-child');
    if (resultsDiv) {
      resultsDiv.innerHTML = this._getResultsHtml();
      // Rebind click handlers
      resultsDiv.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => this._closeOverlay());
      });
    }
  }

  private _getResultsHtml() {
    if (this._results.length > 0) {
      return this._results.map((r) =>
        `<a href="${this._escapeAttr(r.path)}" style="${RESULT_ITEM_STYLES}" data-path="${this._escapeAttr(r.path)}">` +
        `<div style="${RESULT_SECTION_STYLES}">${this._escapeHtml(r.section)}</div>` +
        `<div style="${RESULT_TITLE_STYLES}">${this._escapeHtml(r.title)}</div>` +
        `<div style="${RESULT_TEXT_STYLES}">${this._escapeHtml(r.text)}</div>` +
        `</a>`
      ).join('');
    }
    if (this._query.length >= 2) {
      return `<div style="${NO_RESULTS_STYLES}">No results found for "${this._escapeHtml(this._query)}"</div>`;
    }
    return `<div style="${NO_RESULTS_STYLES}">Type at least 2 characters to search</div>`;
  }

  private _escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private _escapeAttr(str: string) {
    return str.replace(/"/g, '&quot;');
  }

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

  override render() {
    // DSD mode: skip render, all overlay logic handled imperatively
    if (this._dsdHydrated) return nothing;

    // Fresh mode: render trigger button only
    return html`
      <button class="search-trigger">
        <svg class="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
        </svg>
        <span>Search</span><kbd>⌘K</kbd>
      </button>
    `;
  }
}

customElements.define(tagName, LessSearch);

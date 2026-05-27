/**
 * Table of Contents - Ocean component (v0.20.0 Ocean-Island).
 *
 * Client-side TOC: reads h2/h3 from the page content and renders
 * a right sidebar with IntersectionObserver for active tracking.
 * Pure DsdElement - zero Lit dependency.
 *
 * v0.21.0: Signal migration — _headings, _activeId → #headings, #activeId signals.
 *   render() uses html tagged template with @click bindings.
 *   _updateDOM() removed; signals auto-trigger re-render via _patchBindings().
 */
import { DsdElement, html, signal, StyleSheet } from '@lessjs/runtime';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

export const tagName = 'less-toc';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
    position: sticky;
    top: 5rem;
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    font-size: 0.8125rem;
    scrollbar-width: thin;
  }
  .toc-title {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }
  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 0.5px solid var(--border);
  }
  .toc-link {
    display: block;
    padding: 0.25rem 0.75rem;
    color: var(--text-muted);
    text-decoration: none;
    border-left: 1px solid transparent;
    margin-left: -1px;
    transition: color 0.15s, border-color 0.15s;
    line-height: 1.5;
  }
  .toc-link:hover {
    color: var(--text-primary);
  }
  .toc-link.active {
    color: var(--text-primary);
    border-left-color: var(--text-primary);
  }
  .toc-link.h3 {
    padding-left: 1.5rem;
    font-size: 0.75rem;
  }
  @media (max-width: 1100px) {
    :host {
      display: none;
    }
  }
`);

export default class LessToc extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  /** Reactive headings list. Signal writes trigger _patchBindings() → re-render. */
  #headings = signal<Array<{ level: number; id: string; text: string }>>([]);
  /** Reactive active heading ID. Observer callback writes → re-render. */
  #activeId = signal('');

  private _observer: IntersectionObserver | null = null;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    requestAnimationFrame(() => this._scanHeadings());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    if (this._retryTimer !== null) clearTimeout(this._retryTimer);
  }

  private _scanHeadings(): void {
    const parent = this.parentElement;
    if (!parent) return;
    const contentCol = parent.querySelector(':scope > div:first-child');
    if (!contentCol) return;

    this._extractHeadings(contentCol);
    if (this.#headings.value.length === 0) {
      this._retryTimer = setTimeout(() => this._extractHeadings(contentCol), 100);
    }
  }

  private _extractHeadings(container: Element): void {
    const headings = container.querySelectorAll('h2, h3');
    const usedIds = new Set<string>();

    headings.forEach((h) => {
      if (!h.id || usedIds.has(h.id)) {
        const base = h.textContent?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
        let id = base;
        let i = 1;
        while (usedIds.has(id)) id = `${base}-${i++}`;
        h.id = id;
      }
      usedIds.add(h.id);
    });

    const newHeadings: Array<{ level: number; id: string; text: string }> = [];
    headings.forEach((h) => {
      newHeadings.push({
        level: h.tagName === 'H2' ? 2 : 3,
        id: h.id,
        text: h.textContent || '',
      });
    });

    this.#headings.value = newHeadings;

    if (newHeadings.length >= 2) {
      this.style.display = 'block';
    }

    // IntersectionObserver for active tracking — writes to #activeId signal
    this._observer?.disconnect();
    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.#activeId.value = entry.target.id;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    headings.forEach((h) => this._observer!.observe(h));
  }

  private _onClick(e: Event, id: string): void {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  }

  override render() {
    const headings = this.#headings.value;
    const activeId = this.#activeId.value;

    if (headings.length < 2) return '';

    return html`
      <div class="toc-title">On this page</div>
      <nav class="toc-list">
        ${headings.map((h) => {
          const cls = ['toc-link'];
          if (h.level === 3) cls.push('h3');
          if (activeId === h.id) cls.push('active');
          return html`
            <a class="${cls.join(' ')}" href="#${h.id}" @click="${(e: Event) =>
              this._onClick(e, h.id)}">${h.text}</a>
          `;
        })}
      </nav>
    `;
  }
}

customElements.define(tagName, LessToc);

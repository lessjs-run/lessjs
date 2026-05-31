/**
 * Table of Contents - Ocean component (v0.20.0 Ocean-Island).
 *
 * Client-side TOC: reads h2/h3 from the page content and renders
 * a right sidebar with IntersectionObserver for active tracking.
 * Pure DsdElement - zero Lit dependency.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 * v0.28: G6 fix — data-signal markers for signal-driven DOM updates.
 *   G4 fix — onClick uses data-on-click + dataset instead of closure.
 *
 * Reactive DSD: #headings and #activeId signals auto-trigger re-render.
 */
import { defineCustomElement, DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

export const tagName = 'less-toc';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
    position: sticky;
    top: var(--header-offset, 5rem);
    max-height: calc(100vh - 8rem);
    overflow-y: auto;
    font-size: var(--font-size-0);
    scrollbar-width: thin;
    padding-left: var(--size-3);
  }
  .toc-title {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
    color: var(--text-primary);
    margin-bottom: var(--size-3);
    padding-top: var(--size-1);
  }
  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .toc-link {
    display: block;
    padding: var(--size-1) 0 var(--size-1) var(--size-3);
    color: var(--text-muted);
    text-decoration: none;
    border-left: var(--border-size-2) solid transparent;
    transition: color var(--ease-2) var(--duration-2), border-color var(--ease-2) var(--duration-2);
    line-height: var(--font-lineheight-3);
    font-size: var(--font-size-0);
  }
  .toc-link:hover {
    color: var(--text-secondary);
    border-left-color: color-mix(in srgb, var(--brand-neon) 30%, transparent);
  }
  .toc-link.active {
    color: var(--brand-neon);
    border-left-color: var(--brand-neon);
    font-weight: var(--font-weight-6);
  }
  .toc-link.h3 {
    padding-left: var(--size-7);
    font-size: var(--font-size-00);
  }
  @media (max-width: 1100px) {
    :host {
      display: none;
    }
  }
`);

export default class LessToc extends DsdElement {
  static override styles = [openPropsTokenSheet, styles];

  /** Reactive headings list. Signal writes trigger re-render. */
  #headings = signal<Array<{ level: number; id: string; text: string }>>([]);
  /** Reactive active heading ID. Observer callback writes → re-render. */
  #activeId = signal('');

  private _observer: IntersectionObserver | null = null;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    // v0.28: Signals registered for requestReactiveUpdate() path — TOC re-renders
    // via update() when activeId/headings change, not via data-signal hydration.
    this.registerSignal('activeId', this.#activeId);
  }

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
    // v0.28: Trigger re-render after headings change so active class updates.
    this.requestReactiveUpdate();

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
            // v0.28: Trigger re-render so active class updates on the correct link.
            this.requestReactiveUpdate();
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    headings.forEach((h) => this._observer!.observe(h));
  }

  /**
   * TOC link click handler — smooth scroll to heading.
   * v0.28.1: Regular method (not arrow). _bindEvents() in DsdElement handles
   * both DSD hydration and CSR re-render paths via .bind(this) + addEventListener.
   */
  _onClick(e: Event): void {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const id = target.dataset.tocId;
    if (id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      }
    }
  }

  override render() {
    const headings = this.#headings.value;
    const activeId = this.#activeId.value;

    if (headings.length < 2) return '';

    return (
      <>
        <div className='toc-title'>On this page</div>
        <nav className='toc-list'>
          {headings.map((h) => {
            const cls = ['toc-link'];
            if (h.level === 3) cls.push('h3');
            if (activeId === h.id) cls.push('active');
            return (
              <a
                className={cls.join(' ')}
                href={`#${h.id}`}
                data-on-click='_onClick'
                data-toc-id={h.id}
              >
                {h.text}
              </a>
            );
          })}
        </nav>
      </>
    );
  }
}

defineCustomElement(tagName, LessToc);

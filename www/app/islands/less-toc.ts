/**
 * @lessjs/docs - Table of Contents island
 *
 * Client-side TOC: reads h2/h3 from the page content and renders
 * a right sidebar with IntersectionObserver for active tracking.
 * Show/hide via CSS media query on the flex container.
 */

import { css, html, LitElement } from 'lit';

export const tagName = 'less-toc';

export default class LessToc extends LitElement {
  static override styles = css`
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
      color: var(--less-text-tertiary);
      margin-bottom: 0.75rem;
    }
    .toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
      border-left: 0.5px solid var(--less-border);
    }
    .toc-link {
      display: block;
      padding: 0.25rem 0.75rem;
      color: var(--less-text-tertiary);
      text-decoration: none;
      border-left: 1px solid transparent;
      margin-left: -1px;
      transition: color 0.15s, border-color 0.15s;
      line-height: 1.5;
    }
    .toc-link:hover {
      color: var(--less-text-primary);
    }
    .toc-link.active {
      color: var(--less-text-primary);
      border-left-color: var(--less-text-primary);
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
  `;

  private _headings: Array<{ level: number; id: string; text: string }> = [];
  private _observer: IntersectionObserver | null = null;
  private _activeId = '';

  override connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => this._scanHeadings());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  private _scanHeadings() {
    // Find headings in the sibling flex-child (the content column)
    const parent = this.parentElement;
    if (!parent) return;
    const contentCol = parent.querySelector(':scope > div:first-child');
    if (!contentCol) return;

    // Wait for DSD to settle — retry once if needed
    this._extractHeadings(contentCol);
    if (this._headings.length === 0) {
      setTimeout(() => this._extractHeadings(contentCol), 100);
    }
  }

  private _extractHeadings(container: Element) {
    const headings = container.querySelectorAll('h2, h3');

    // Ensure unique IDs
    const usedIds = new Set<string>();
    headings.forEach((h) => {
      if (!h.id || usedIds.has(h.id)) {
        const base =
          h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
        let id = base;
        let i = 1;
        while (usedIds.has(id)) id = `${base}-${i++}`;
        h.id = id;
      }
      usedIds.add(h.id);
    });

    this._headings = [];
    headings.forEach((h) => {
      this._headings.push({
        level: h.tagName === 'H2' ? 2 : 3,
        id: h.id,
        text: h.textContent || '',
      });
    });

    this.requestUpdate();

    if (this._headings.length >= 2) {
      // Show via style since :host display is toggled by the parent flex
      this.style.display = 'block';
    }

    // IntersectionObserver for active tracking
    this._observer?.disconnect();
    this._observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this._activeId = entry.target.id;
            this.requestUpdate();
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    headings.forEach((h) => this._observer!.observe(h));
  }

  private _onClick(e: MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  }

  override render() {
    if (this._headings.length < 2) return null;

    return html`
      <div class="toc-title">On this page</div>
      <nav class="toc-list">
        ${this._headings.map(
          (h) =>
            html`
              <a
                class="toc-link ${h.level === 3 ? 'h3' : ''} ${this._activeId === h.id
                  ? 'active'
                  : ''}"
                href="#${h.id}"
                @click="${(e: MouseEvent) => this._onClick(e, h.id)}"
              >${h.text}</a>
            `,
        )}
      </nav>
    `;
  }
}

customElements.define(tagName, LessToc);

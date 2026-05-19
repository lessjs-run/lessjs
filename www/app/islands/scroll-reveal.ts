import { css, html, LitElement } from 'lit';

export const tagName = 'scroll-reveal';

export default class ScrollReveal extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    .reveal {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal {
        opacity: 1;
        transform: none;
        transition: none;
      }
    }
  `;

  private _observer: IntersectionObserver | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add('visible');
            this._observer?.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );
  }

  override firstUpdated() {
    const reveal = this.shadowRoot?.querySelector('.reveal');
    if (reveal && this._observer) {
      this._observer.observe(reveal);
    }
  }

  override disconnectedCallback() {
    this._observer?.disconnect();
    this._observer = null;
    super.disconnectedCallback();
  }

  override render() {
    return html`<div class="reveal"><slot></slot></div>`;
  }
}

customElements.define(tagName, ScrollReveal);

/**
 * ScrollReveal — Ocean component (v0.20.0 Ocean-Island).
 *
 * Wraps slotted content with a reveal animation triggered by
 * IntersectionObserver. Pure DsdElement — zero Lit dependency.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/core';

export const tagName = 'scroll-reveal';

const styles = new StyleSheet();
styles.replaceSync(`
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
`);

export default class ScrollReveal extends DsdElement {
  static override styles = styles;

  private _observer: IntersectionObserver | null = null;

  override connectedCallback(): void {
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
      { threshold: 0.2 },
    );
    // Observe the reveal element after shadow root is created
    const reveal = this.shadowRoot?.querySelector('.reveal');
    if (reveal && this._observer) {
      this._observer.observe(reveal);
    }
  }

  override disconnectedCallback(): void {
    this._observer?.disconnect();
    this._observer = null;
    super.disconnectedCallback();
  }

  override render(): string {
    return '<div class="reveal"><slot></slot></div>';
  }
}

customElements.define(tagName, ScrollReveal);

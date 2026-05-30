/**
 * ScrollReveal - Ocean component (v0.20.0 Ocean-Island).
 *
 * Wraps slotted content with a reveal animation triggered by
 * IntersectionObserver. Pure DsdElement - zero Lit dependency.
 *
 * v0.27: Migrated render() from string to JSX.
 */
import { DsdElement } from '@lessjs/core';
import { StyleSheet } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';

export const tagName = 'scroll-reveal';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
  }
  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity var(--duration-4) var(--ease-3), transform var(--duration-4) var(--ease-3);
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
  static override styles = [openPropsTokenSheet, styles];

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

  override render() {
    return (
      <div class='reveal'>
        <slot></slot>
      </div>
    );
  }
}

if (!customElements.get(tagName)) customElements.define(tagName, ScrollReveal);

/**
 * SSR-safe custom element registration helper.
 */

export function defineCustomElement(
  tag: string,
  ctor: CustomElementConstructor,
): void {
  if (typeof globalThis.customElements === 'undefined') return;
  if (!globalThis.customElements.get(tag)) {
    globalThis.customElements.define(tag, ctor);
  }
}

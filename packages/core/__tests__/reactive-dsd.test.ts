import { assertEquals } from 'jsr:@std/assert@1';
import { Window } from 'happy-dom';

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  customElements: window.customElements,
  ShadowRoot: window.ShadowRoot,
  CSSStyleSheet: window.CSSStyleSheet,
  AbortController: window.AbortController,
  MutationObserver: window.MutationObserver,
});

const { DsdElement } = await import('../src/dsd-element.ts');
const { html } = await import('../src/template.ts');
const { signal } = await import('../../signals/src/framework.ts');

Deno.test({
  name: 'DsdElement TemplateResult binds events and rerenders after signal writes',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const tagName = `reactive-counter-${Math.random().toString(36).slice(2, 7)}`;

    class ReactiveCounter extends DsdElement {
      count = signal(0);

      override render() {
        return html`
          <button @click="${() => this.count.value++}">Count: ${this.count}</button>
        `;
      }
    }

    customElements.define(tagName, ReactiveCounter);
    const el = document.createElement(tagName) as ReactiveCounter;
    document.body.appendChild(el);

    assertEquals(el.shadowRoot?.textContent?.trim(), 'Count: 0');
    const click = new window.Event('click') as unknown as Event;
    el.shadowRoot?.querySelector('button')?.dispatchEvent(click);
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(el.shadowRoot?.textContent?.trim(), 'Count: 1');
    document.body.removeChild(el);
  },
});

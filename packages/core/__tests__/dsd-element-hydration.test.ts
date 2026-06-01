import { assertEquals, assertExists } from 'jsr:@std/assert@1';
import { Window } from 'happy-dom';

const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  customElements: window.customElements,
  HTMLElement: window.HTMLElement,
  Element: window.Element,
  ShadowRoot: window.ShadowRoot,
  Event: window.Event,
  MouseEvent: window.MouseEvent,
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
});

const { DsdElement } = await import('../src/dsd-element.ts');
const { signal } = await import('../../signals/src/index.ts');

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

Deno.test({
  name: 'DsdElement: data-signal-html binds subtree events once per rendered subtree',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const tagName = `test-html-events-${crypto.randomUUID()}`;
    const html = signal('<button data-on-click="_hit">first</button>');
    let calls = 0;

    class HtmlEventElement extends DsdElement {
      constructor() {
        super();
        this.registerSignal('html', html);
      }
      _hit() {
        calls++;
      }
      override render(): string {
        return '<div data-signal-html="html"></div>';
      }
    }

    customElements.define(tagName, HtmlEventElement);
    const el = document.createElement(tagName) as HtmlEventElement;
    const shadow = el.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div data-signal-html="html"></div>';
    document.body.appendChild(el);

    const first = shadow.querySelector('button') as HTMLButtonElement | null;
    assertExists(first);
    first.click();
    assertEquals(calls, 1);

    html.value = '<button data-on-click="_hit">second</button>';
    await nextTick();
    const second = shadow.querySelector('button') as HTMLButtonElement | null;
    assertExists(second);
    second.click();
    assertEquals(calls, 2);

    document.body.removeChild(el);
  },
});

Deno.test({
  name: 'DsdElement: data-signal-html does not recursively hydrate nested data-signal markers',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const tagName = `test-html-signal-scope-${crypto.randomUUID()}`;
    const html = signal('<span data-signal="nested">raw subtree</span>');
    const nested = signal('outer signal');

    class HtmlSignalScopeElement extends DsdElement {
      constructor() {
        super();
        this.registerSignal('html', html);
        this.registerSignal('nested', nested);
      }
      override render(): string {
        return '<div data-signal-html="html"></div>';
      }
    }

    customElements.define(tagName, HtmlSignalScopeElement);
    const el = document.createElement(tagName) as HtmlSignalScopeElement;
    const shadow = el.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div data-signal-html="html"></div>';
    document.body.appendChild(el);

    const span = shadow.querySelector('span');
    assertExists(span);
    assertEquals(span.textContent, 'raw subtree');

    nested.value = 'changed';
    await nextTick();
    assertEquals(span.textContent, 'raw subtree');

    document.body.removeChild(el);
  },
});

Deno.test({
  name: 'DsdElement: render/hydrate errors use onRenderError fallback',
  sanitizeOps: false,
  sanitizeResources: false,
  fn() {
    const tagName = `test-render-error-${crypto.randomUUID()}`;

    class ThrowingElement extends DsdElement {
      override render(): string {
        throw new Error('boom');
      }
      protected override onRenderError(error: unknown): string {
        return `<p class="fallback">${error instanceof Error ? error.message : String(error)}</p>`;
      }
    }

    customElements.define(tagName, ThrowingElement);
    const el = document.createElement(tagName) as ThrowingElement;
    document.body.appendChild(el);

    assertEquals(el.shadowRoot?.innerHTML, '<p class="fallback">boom</p>');
    document.body.removeChild(el);
  },
});

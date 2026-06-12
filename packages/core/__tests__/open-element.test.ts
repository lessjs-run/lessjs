import { assertEquals, assertInstanceOf } from 'jsr:@std/assert@1';
import { DsdElement, OpenElement } from '../src/index.ts';
import { jsx } from '../src/jsx-runtime.ts';
import type { VNode } from '../src/vnode.ts';

const hasDOM = typeof customElements !== 'undefined';

Deno.test('OpenElement is the product-facing DsdElement subclass', () => {
  const el = new OpenElement();
  assertInstanceOf(el, OpenElement);
  assertInstanceOf(el, DsdElement);
});

Deno.test('OpenElement keeps explicit light DOM opt-in behavior', () => {
  if (!hasDOM) return;

  const tagName = `test-open-element-light-${Math.random().toString(36).slice(2, 7)}`;
  class LightOpenElement extends OpenElement {
    static override renderMode = 'light' as const;

    override render(): VNode | null {
      return jsx('span', { children: 'open light' });
    }
  }
  customElements.define(tagName, LightOpenElement);

  const el = document.createElement(tagName) as LightOpenElement;
  document.body.appendChild(el);

  assertEquals(el.shadowRoot, null);
  assertEquals(el.innerHTML, '<span>open light</span>');

  document.body.removeChild(el);
});

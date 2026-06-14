import { assertEquals, assertInstanceOf } from 'jsr:@std/assert@1';
import { OpenElement } from '@openelement/element';
import { jsx } from '@openelement/core/jsx-runtime';
import type { VNode } from '@openelement/core';

const hasDOM = typeof customElements !== 'undefined';

Deno.test('OpenElement is instantiable', () => {
  const el = new OpenElement();
  assertInstanceOf(el, OpenElement);
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

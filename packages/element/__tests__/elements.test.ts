import { assertEquals, assertInstanceOf } from 'jsr:@std/assert@1';
import { DsdElement } from '@openelement/core';
import { OpenElement } from '../src/index.ts';

Deno.test('@openelement/element exports OpenElement facade', () => {
  const element = new OpenElement();

  assertInstanceOf(element, OpenElement);
  assertInstanceOf(element, DsdElement);
});

Deno.test('@openelement/element preserves light DOM opt-in static contract', () => {
  class LightElement extends OpenElement {
    static override renderMode = 'light' as const;
  }

  assertEquals(LightElement.renderMode, 'light');
});

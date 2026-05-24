import { assertEquals } from 'jsr:@std/assert@1';
import { DsdElement, html, renderDSD, renderDSDStream, unsafeHTML } from '../src/index.ts';

Deno.test('core stable API exports v0.21 rendering and authoring primitives', () => {
  assertEquals(typeof renderDSD, 'function');
  assertEquals(typeof renderDSDStream, 'function');
  assertEquals(typeof DsdElement, 'function');
  assertEquals(typeof html, 'function');
  assertEquals(typeof unsafeHTML, 'function');
});

Deno.test('core html authoring API keeps unsafeHTML explicit', () => {
  const result = html`
    <p>${unsafeHTML('<strong>trusted</strong>')}</p>
  `;
  const rawValue = result.values[0] as { kind?: string };

  assertEquals(result.kind, 'less:template-result');
  assertEquals(rawValue.kind, 'less:unsafe-html');
});

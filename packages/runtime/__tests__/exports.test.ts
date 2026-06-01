import { assertEquals } from 'jsr:@std/assert@1';
import * as runtime from '../src/index.ts';

Deno.test('@lessjs/runtime exports the component authoring facade', () => {
  for (
    const key of [
      'DsdElement',
      'Fragment',
      'jsx',
      'jsxs',
      'signal',
      'computed',
      'effect',
      'StyleSheet',
      'renderToDom',
      'renderToString',
      'escapeHtml',
    ]
  ) {
    assertEquals(key in runtime, true, `missing runtime export: ${key}`);
  }
});

Deno.test('@lessjs/runtime does not expose server DSD rendering entry points', () => {
  assertEquals('renderDsd' in runtime, false);
  assertEquals('renderDsdByName' in runtime, false);
});

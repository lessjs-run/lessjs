import { assertEquals } from 'jsr:@std/assert@1';
import * as runtime from '../src/index.ts';

Deno.test('@openelement/runtime exports the component authoring facade', () => {
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
      'renderDsdTree',
      'escapeHtml',
    ]
  ) {
    assertEquals(key in runtime, true, `missing runtime export: ${key}`);
  }
});

Deno.test('@openelement/runtime does not expose server DSD rendering entry points', () => {
  assertEquals('renderDsd' in runtime, false);
  assertEquals('renderDsdByName' in runtime, false);
});

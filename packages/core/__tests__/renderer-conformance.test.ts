import { assertEquals } from 'jsr:@std/assert@1';
import { runRendererConformance } from '@openelement/protocols/conformance';
import type { RendererProtocol } from '@openelement/protocols/renderer';
import { jsx } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/render-ir.ts';

Deno.test('core renderer satisfies baseline renderer protocol conformance', async () => {
  const renderer: RendererProtocol = {
    name: 'core-render-dsd-tree',
    isTemplate: (value) => typeof value === 'object' && value !== null,
    render: (value) => renderDsdTree(value),
  };

  const results = await runRendererConformance(renderer, {
    tagName: 'open-baseline',
    template: jsx('span', { children: ['ok'] }),
    expectedHtml: '<span>ok</span>',
  });

  assertEquals(results.every((result) => result.passed), true);
});

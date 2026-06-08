import { assertEquals } from 'jsr:@std/assert@^1.0.0';

Deno.test('SSG bridge: adapter-vite compatibility exports delegate to @openelement/ssg', async () => {
  const adapter = await import('../src/cli/ssg-render.ts');
  const ssg = await import('@openelement/ssg');

  assertEquals(adapter.resolveDynamicRoutePath, ssg.resolveDynamicRoutePath);
  assertEquals(typeof adapter.ssgRender, 'function');
  assertEquals(typeof adapter.createSsgRenderEvidence, 'function');
});

Deno.test('SSG bridge: adapter-vite postprocess re-exports @openelement/ssg helpers', async () => {
  const adapter = await import('../src/ssg-postprocess.ts');
  const ssg = await import('@openelement/ssg');

  assertEquals(adapter.buildIslandChunkMap, ssg.buildIslandChunkMap);
  assertEquals(adapter.buildSpeculationRulesJson, ssg.buildSpeculationRulesJson);
  assertEquals(adapter.injectDsdPolyfill, ssg.injectDsdPolyfill);
});

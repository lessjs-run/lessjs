import { assertEquals } from 'jsr:@std/assert@^1.0.0';

Deno.test('SSG bridge: adapter-vite compatibility exports delegate to internal SSG helpers', async () => {
  const adapter = await import('../src/cli/ssg-render.ts');
  const ssg = await import('../src/ssg/index.ts');

  assertEquals(adapter.resolveDynamicRoutePath, ssg.resolveDynamicRoutePath);
  assertEquals(typeof adapter.ssgRender, 'function');
  assertEquals(typeof adapter.createSsgRenderEvidence, 'function');
});

Deno.test('SSG bridge: adapter-vite postprocess re-exports internal SSG helpers', async () => {
  const adapter = await import('../src/ssg/index.ts');
  const ssg = await import('../src/ssg/index.ts');

  assertEquals(adapter.buildIslandChunkMap, ssg.buildIslandChunkMap);
  assertEquals(adapter.buildSpeculationRulesJson, ssg.buildSpeculationRulesJson);
  assertEquals(adapter.injectDsdPolyfill, ssg.injectDsdPolyfill);
});

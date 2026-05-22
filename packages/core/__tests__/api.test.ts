import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createLessApiContext } from '../src/api.ts';

Deno.test('createLessApiContext returns stable API route context', () => {
  const request = new Request('https://example.com/api/items/1');
  const platform = { runtime: 'test' };

  const ctx = createLessApiContext(request, {
    params: { id: '1' },
    env: { MODE: 'test' },
    platform,
  });

  assertEquals(ctx.request, request);
  assertEquals(ctx.params, { id: '1' });
  assertEquals(ctx.env, { MODE: 'test' });
  assertEquals(ctx.platform, platform);
});

Deno.test('createLessApiContext defaults optional fields', () => {
  const request = new Request('https://example.com/api/health');
  const ctx = createLessApiContext(request);

  assertEquals(ctx.request, request);
  assertEquals(ctx.params, {});
  assertEquals(ctx.env, {});
  assertEquals(ctx.platform, undefined);
});

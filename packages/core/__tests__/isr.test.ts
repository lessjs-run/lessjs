import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createIsrCacheKey, FileIsrCache, isIsrRouteConfig, MemoryIsrCache } from '../src/isr.ts';

Deno.test('createIsrCacheKey sorts and encodes params', () => {
  assertEquals(
    createIsrCacheKey('/blog/:slug', { slug: 'hello world', locale: 'en' }),
    'openelement:isr:/blog/:slug?locale=en&slug=hello%20world',
  );
});

Deno.test('isIsrRouteConfig accepts positive finite revalidate seconds', () => {
  assertEquals(isIsrRouteConfig({ revalidate: 60 }), true);
  assertEquals(isIsrRouteConfig({ revalidate: 0 }), false);
  assertEquals(isIsrRouteConfig({ revalidate: Number.POSITIVE_INFINITY }), false);
  assertEquals(isIsrRouteConfig({}), false);
});

Deno.test('MemoryIsrCache reports miss, hit, stale, and delete', () => {
  const cache = new MemoryIsrCache();
  const key = '/docs';
  const createdAt = 1_000;

  assertEquals(cache.get(key, createdAt), { state: 'miss' });

  cache.set(key, { html: '<h1>Docs</h1>', createdAt, revalidate: 60 });

  assertEquals(cache.get(key, createdAt + 10_000).state, 'hit');
  assertEquals(cache.get(key, createdAt + 60_000).state, 'stale');

  cache.delete(key);
  assertEquals(cache.get(key, createdAt + 70_000), { state: 'miss' });
});

Deno.test('FileIsrCache persists entries and reports hit, stale, and delete', async () => {
  const cacheDir = await Deno.makeTempDir({ prefix: 'openelement-file-isr-' });
  try {
    const cache = new FileIsrCache(cacheDir);
    const key = createIsrCacheKey('/docs/:slug', { slug: 'hello world' });
    const createdAt = 1_000;

    assertEquals(await cache.get(key, createdAt), { state: 'miss' });

    await cache.set(key, {
      html: '<h1>Docs</h1>',
      createdAt,
      revalidate: 60,
      headers: { 'content-type': 'text/html' },
    });

    const reloaded = new FileIsrCache(cacheDir);
    const hit = await reloaded.get(key, createdAt + 10_000);
    assertEquals(hit.state, 'hit');
    assertEquals(hit.entry?.html, '<h1>Docs</h1>');
    assertEquals(hit.entry?.headers?.['content-type'], 'text/html');

    const stale = await reloaded.get(key, createdAt + 60_000);
    assertEquals(stale.state, 'stale');

    await reloaded.delete(key);
    assertEquals(await reloaded.get(key, createdAt + 70_000), { state: 'miss' });
  } finally {
    await Deno.remove(cacheDir, { recursive: true });
  }
});

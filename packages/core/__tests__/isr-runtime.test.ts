import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createIsrCacheKey, MemoryIsrCache } from '../src/isr.ts';
import {
  findIsrManifestEntry,
  type IsrRuntimeRenderContext,
  renderIsrResponse,
} from '../src/isr-runtime.ts';

const manifest = [
  {
    path: '/docs/:slug',
    params: { locale: 'en', slug: 'intro' },
    revalidate: 60,
    cacheKey: createIsrCacheKey('/docs/:slug', { locale: 'en', slug: 'intro' }),
  },
];

Deno.test('findIsrManifestEntry matches path and sorted params', () => {
  const entry = findIsrManifestEntry(manifest, '/docs/:slug', {
    slug: 'intro',
    locale: 'en',
  });

  assertEquals(entry?.cacheKey, manifest[0].cacheKey);
  assertEquals(findIsrManifestEntry(manifest, '/docs/:slug', { slug: 'missing' }), undefined);
});

Deno.test('renderIsrResponse returns 404 when manifest entry is absent', async () => {
  const result = await renderIsrResponse('/missing', {}, {
    manifest,
    cache: new MemoryIsrCache(),
    render: () => ({ html: '<h1>unused</h1>' }),
  });

  assertEquals(result.state, 'not-found');
  assertEquals(result.response.status, 404);
});

Deno.test('renderIsrResponse renders and stores cache on miss', async () => {
  const cache = new MemoryIsrCache();
  let renderCount = 0;

  const result = await renderIsrResponse('/docs/:slug', { locale: 'en', slug: 'intro' }, {
    manifest,
    cache,
    now: () => 1_000,
    render: (_path: string, context: IsrRuntimeRenderContext) => {
      renderCount++;
      return {
        html: `<h1>${context.entry.params.slug}</h1>`,
        headers: { 'cache-control': 's-maxage=60' },
      };
    },
  });

  assertEquals(result.state, 'miss');
  assertEquals(result.response.headers.get('x-openelement-isr'), 'miss');
  assertEquals(result.response.headers.get('cache-control'), 's-maxage=60');
  assertEquals(await result.response.text(), '<h1>intro</h1>');
  assertEquals(renderCount, 1);

  const cached = cache.get(manifest[0].cacheKey, 1_001);
  assertEquals(cached.state, 'hit');
  assertEquals(cached.entry?.html, '<h1>intro</h1>');
});

Deno.test('renderIsrResponse serves cache hit without rendering', async () => {
  const cache = new MemoryIsrCache();
  cache.set(manifest[0].cacheKey, {
    html: '<h1>cached</h1>',
    createdAt: 1_000,
    revalidate: 60,
  });

  const result = await renderIsrResponse('/docs/:slug', { locale: 'en', slug: 'intro' }, {
    manifest,
    cache,
    now: () => 2_000,
    render: () => {
      throw new Error('render should not run for cache hits');
    },
  });

  assertEquals(result.state, 'hit');
  assertEquals(result.response.headers.get('x-openelement-isr'), 'hit');
  assertEquals(await result.response.text(), '<h1>cached</h1>');
});

Deno.test('renderIsrResponse refreshes stale entries in blocking mode', async () => {
  const cache = new MemoryIsrCache();
  cache.set(manifest[0].cacheKey, {
    html: '<h1>old</h1>',
    createdAt: 1_000,
    revalidate: 60,
  });

  const result = await renderIsrResponse('/docs/:slug', { locale: 'en', slug: 'intro' }, {
    manifest,
    cache,
    now: () => 62_000,
    render: () => ({ html: '<h1>fresh</h1>' }),
  });

  assertEquals(result.state, 'stale');
  assertEquals(result.response.headers.get('x-openelement-isr'), 'stale');
  assertEquals(await result.response.text(), '<h1>fresh</h1>');
});

Deno.test('renderIsrResponse serves stale entry and schedules background refresh', async () => {
  const cache = new MemoryIsrCache();
  cache.set(manifest[0].cacheKey, {
    html: '<h1>old</h1>',
    createdAt: 1_000,
    revalidate: 60,
  });
  const tasks: Promise<void>[] = [];

  const result = await renderIsrResponse('/docs/:slug', { locale: 'en', slug: 'intro' }, {
    manifest,
    cache,
    now: () => 62_000,
    regenerate: 'background',
    schedule: (task) => tasks.push(task),
    render: () => ({ html: '<h1>fresh</h1>' }),
  });

  assertEquals(result.state, 'stale');
  assertEquals(await result.response.text(), '<h1>old</h1>');
  assertEquals(tasks.length, 1);
  await tasks[0];
  assertEquals(cache.get(manifest[0].cacheKey, 62_001).entry?.html, '<h1>fresh</h1>');
});

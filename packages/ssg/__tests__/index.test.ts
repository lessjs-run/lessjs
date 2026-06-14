/**
 * @openelement/ssg - Core engine smoke tests.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import type { SsgPageInput } from '@openelement/protocol/ssg-contracts';
import { renderParallel, renderSequential, resolveDynamicRoutePath } from '@openelement/ssg';

Deno.test('renderSequential renders pages in order', async () => {
  const pages: SsgPageInput[] = [
    { path: '/a' },
    { path: '/b' },
    { path: '/c' },
  ];
  const result = await renderSequential({
    pages,
    renderPage: async (page: SsgPageInput) =>
      await Promise.resolve(`<html><body>${page.path}</body></html>`),
  });

  assertEquals(result.successCount, 3);
  assertEquals(result.errorCount, 0);
  assertEquals(result.pages.map((p: { path: string }) => p.path), ['/a', '/b', '/c']);
  assertEquals(result.pages[0].html, '<html><body>/a</body></html>');
});

Deno.test('renderSequential records errors without throwing', async () => {
  const result = await renderSequential({
    pages: [{ path: '/ok' }, { path: '/fail' }],
    renderPage: async (page: SsgPageInput) => {
      if (page.path === '/fail') return await Promise.reject(new Error('render failed'));
      return await Promise.resolve('ok');
    },
  });

  assertEquals(result.successCount, 1);
  assertEquals(result.errorCount, 1);
  assertEquals(result.pages[1].error, 'render failed');
});

Deno.test('renderParallel respects concurrency', async () => {
  let maxConcurrent = 0;
  let current = 0;
  const result = await renderParallel({
    pages: Array.from({ length: 6 }, (_, i) => ({ path: `/${i}` })),
    concurrency: 2,
    renderPage: async () => {
      current++;
      maxConcurrent = Math.max(maxConcurrent, current);
      await new Promise((r) => setTimeout(r, 10));
      current--;
      return 'html';
    },
  });

  assertEquals(result.successCount, 6);
  assertEquals(result.errorCount, 0);
  assertEquals(maxConcurrent, 2);
});

Deno.test('resolveDynamicRoutePath expands params', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'hello' }),
    '/blog/hello',
  );
});

Deno.test('resolveDynamicRoutePath throws on missing param', () => {
  let threw = false;
  try {
    resolveDynamicRoutePath('/blog/:slug', ['slug'], {});
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

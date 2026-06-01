import { assertEquals, assertStrictEquals } from 'jsr:@std/assert@1';
import { defineRoutes, toHono, toURLPattern } from '../src/mod.ts';
import type { RouteConfig } from '../src/mod.ts';

Deno.test('defineRoutes returns the route array unchanged', () => {
  const routes: RouteConfig[] = [
    {
      pattern: '/guide/:slug',
      component: () => Promise.resolve({ default: class GuidePage extends HTMLElement {} }),
      meta: { section: 'guide', label: 'Guide', order: 1, dynamic: true },
    },
  ];

  assertStrictEquals(defineRoutes(routes), routes);
});

Deno.test('toHono converts URLPattern regex groups to Hono regex groups', () => {
  assertEquals(toHono('/users/:id(\\d+)'), '/users/:id{\\d+}');
  assertEquals(toHono('/plain/:slug'), '/plain/:slug');
});

Deno.test('toURLPattern preserves LessJS route patterns', () => {
  assertEquals(toURLPattern('/blog/:slug'), '/blog/:slug');
});

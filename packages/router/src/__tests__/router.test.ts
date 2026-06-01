import { assertEquals } from 'jsr:@std/assert@1';
import { defineRoutes, Router, toHono, toURLPattern } from '../mod.ts';

const DummyElement = class {} as unknown as CustomElementConstructor;

class FakeElement {
  shadowRoot = null;
  #attrs = new Map<string, string>();

  getAttribute(name: string): string | null {
    return this.#attrs.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.#attrs.set(name, value);
  }
}

function router(attrs: Record<string, string> = {}): Router {
  const el = new FakeElement();
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return new Router(el as unknown as HTMLElement);
}

const staticPatterns = [
  '/',
  '/guide',
  '/guide/getting-started',
  '/blog',
  '/blog/archive',
  '/registry',
  '/registry/package/component',
  '/api/search',
  '/zh/guide',
  '/en/blog/post',
];

for (const pattern of staticPatterns) {
  Deno.test(`router: toURLPattern preserves static pattern ${pattern}`, () => {
    assertEquals(toURLPattern(pattern), pattern);
  });
}

const honoCases: Array<[string, string]> = [
  ['/blog/:slug([a-z0-9-]+)', '/blog/:slug{[a-z0-9-]+}'],
  ['/user/:id(\\d+)', '/user/:id{\\d+}'],
  ['/docs/:lang(en|zh)/:slug([a-z-]+)', '/docs/:lang{en|zh}/:slug{[a-z-]+}'],
  ['/files/:name([^/]+)', '/files/:name{[^/]+}'],
  ['/plain/:slug', '/plain/:slug'],
];

for (const [input, expected] of honoCases) {
  Deno.test(`router: toHono converts regex groups for ${input}`, () => {
    assertEquals(toHono(input), expected);
  });
}

for (let i = 0; i < 35; i++) {
  Deno.test(`router: defineRoutes preserves route order ${i}`, () => {
    const routes = defineRoutes([
      { pattern: `/page-${i}`, component: () => Promise.resolve({ default: DummyElement }) },
      { pattern: `/page-${i}/child`, component: () => Promise.resolve({ default: DummyElement }) },
    ]);
    assertEquals(routes.map((route) => route.pattern), [`/page-${i}`, `/page-${i}/child`]);
  });
}

const localeCases: Array<[string, string, string]> = [
  ['["en","zh"]', 'en', '/zh/guide'],
  ['["en","zh"]', 'zh', '/en/guide'],
  ['["en","fr"]', 'en', '/fr/guide'],
  ['["ja","en"]', 'ja', '/en/guide'],
];

for (const [locales, locale, expected] of localeCases) {
  Deno.test(`router: switchPath changes locale ${locale} with ${locales}`, () => {
    const r = router({ locales, locale, 'current-path': '/guide' });
    assertEquals(r.switchPath(), expected);
  });
}

for (const loc of ['en', 'zh', 'fr', 'ja', 'de']) {
  Deno.test(`router: localize prefixes unlocalized path for ${loc}`, () => {
    const r = router({ locales: JSON.stringify([loc, 'en']), locale: loc });
    assertEquals(r.localize('/guide'), `/${loc}/guide`);
  });
}

for (const loc of ['en', 'zh', 'fr', 'ja', 'de']) {
  Deno.test(`router: localize keeps already localized path for ${loc}`, () => {
    const r = router({ locales: JSON.stringify([loc, 'en']), locale: loc });
    assertEquals(r.localize(`/${loc}/guide`), `/${loc}/guide`);
  });
}

for (const href of ['https://example.com/docs', 'http://example.com/docs']) {
  Deno.test(`router: localize keeps external href ${href}`, () => {
    assertEquals(router({ locales: '["en","zh"]' }).localize(href), href);
  });
}

for (let i = 0; i < 38; i++) {
  Deno.test(`router: route metadata remains attached ${i}`, () => {
    const routes = defineRoutes([
      {
        pattern: `/meta-${i}`,
        component: () => Promise.resolve({ default: DummyElement }),
        meta: { section: 'Guide', label: `Page ${i}`, order: i, dynamic: i % 2 === 0 },
      },
    ]);
    assertEquals(routes[0].meta?.order, i);
    assertEquals(routes[0].meta?.dynamic, i % 2 === 0);
  });
}

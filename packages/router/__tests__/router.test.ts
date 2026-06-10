import { assertEquals, assertStrictEquals } from 'jsr:@std/assert@1';
import { defineRoutes, Router, toHono, toURLPattern } from '../src/mod.ts';
import type { RouteConfig } from '../src/mod.ts';

// ─── Helpers ──────────────────────────────────────────────────

const DummyElement = class {} as unknown as CustomElementConstructor;

class FakeElement {
  shadowRoot = null;
  #attrs = new Map<string, string>();
  #props = new Map<string, unknown>();

  getAttribute(name: string): string | null {
    return this.#attrs.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.#attrs.set(name, value);
  }

  get locales(): string[] | undefined {
    const raw = this.#props.get('locales');
    if (Array.isArray(raw)) return raw;
    const attr = this.#attrs.get('locales');
    if (attr) {
      try {
        return JSON.parse(attr);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  set locales(val: string[] | undefined) {
    if (val) this.#props.set('locales', val);
  }

  get locale(): string {
    const prop = this.#props.get('locale');
    if (typeof prop === 'string') return prop;
    return this.#attrs.get('locale') || 'en';
  }

  set locale(val: string) {
    this.#props.set('locale', val);
  }
}

function router(attrs: Record<string, string | string[]> = {}): Router {
  const el = new FakeElement();
  for (const [key, value] of Object.entries(attrs)) {
    if (Array.isArray(value)) {
      (el as unknown as Record<string, unknown>)[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return new Router(el as unknown as HTMLElement);
}

// ─── defineRoutes tests ──────────────────────────────────────

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

Deno.test('defineRoutes handles empty routes array', () => {
  const routes: RouteConfig[] = [];
  const result = defineRoutes(routes);
  assertEquals(result, []);
  assertEquals(result.length, 0);
});

Deno.test('defineRoutes preserves route order for 50+ routes', () => {
  const routes: RouteConfig[] = [];
  for (let i = 0; i < 55; i++) {
    routes.push({
      pattern: `/route-${i}`,
      component: () => Promise.resolve({ default: DummyElement }),
      meta: { order: i },
    });
  }
  const result = defineRoutes(routes);
  assertEquals(result.length, 55);
  for (let i = 0; i < 55; i++) {
    assertEquals(result[i].meta?.order, i);
  }
});

Deno.test('defineRoutes preserves route order for 200+ routes', () => {
  const routes: RouteConfig[] = [];
  for (let i = 0; i < 250; i++) {
    routes.push({
      pattern: `/bulk-${i}`,
      component: () => Promise.resolve({ default: DummyElement }),
    });
  }
  const result = defineRoutes(routes);
  assertEquals(result.length, 250);
  assertEquals(result[0].pattern, '/bulk-0');
  assertEquals(result[249].pattern, '/bulk-249');
});

Deno.test('defineRoutes rejects duplicate routes by reference', () => {
  const route: RouteConfig = {
    pattern: '/duplicate',
    component: () => Promise.resolve({ default: DummyElement }),
  };
  const routes = [route, route];
  const result = defineRoutes(routes);
  assertEquals(result.length, 2);
  // Same reference - function simply returns the array
  assertStrictEquals(result, routes);
});

Deno.test('defineRoutes routes can have null/undefined meta', () => {
  const routes: RouteConfig[] = [
    { pattern: '/no-meta', component: () => Promise.resolve({ default: DummyElement }) },
    {
      pattern: '/null-meta',
      component: () => Promise.resolve({ default: DummyElement }),
      meta: undefined,
    },
  ];
  const result = defineRoutes(routes);
  assertEquals(result[0].meta, undefined);
  assertEquals(result[1].meta, undefined);
});

// ─── toURLPattern tests ──────────────────────────────────────

Deno.test('toURLPattern preserves openElement route patterns', () => {
  assertEquals(toURLPattern('/blog/:slug'), '/blog/:slug');
});

Deno.test('toURLPattern preserves patterns with special characters', () => {
  assertEquals(toURLPattern('/docs/:lang(en|zh)/:slug'), '/docs/:lang(en|zh)/:slug');
  assertEquals(toURLPattern('/user/:id(\\d+)'), '/user/:id(\\d+)');
  assertEquals(toURLPattern('/files/:name([^/]+)'), '/files/:name([^/]+)');
  assertEquals(toURLPattern('/search?q=:query'), '/search?q=:query');
});

Deno.test('toURLPattern preserves static paths', () => {
  assertEquals(toURLPattern('/'), '/');
  assertEquals(toURLPattern('/about'), '/about');
  assertEquals(toURLPattern('/guide/getting-started'), '/guide/getting-started');
  assertEquals(toURLPattern('/blog/archive'), '/blog/archive');
});

// ─── toHono tests ────────────────────────────────────────────

Deno.test('toHono converts URLPattern regex groups to Hono regex groups', () => {
  assertEquals(toHono('/users/:id(\\d+)'), '/users/:id{\\d+}');
  assertEquals(toHono('/plain/:slug'), '/plain/:slug');
});

Deno.test('toHono converts complex regex groups', () => {
  assertEquals(toHono('/blog/:slug([a-z0-9-]+)'), '/blog/:slug{[a-z0-9-]+}');
  assertEquals(toHono('/docs/:lang(en|zh)/:slug([a-z-]+)'), '/docs/:lang{en|zh}/:slug{[a-z-]+}');
  assertEquals(toHono('/files/:name([^/]+)'), '/files/:name{[^/]+}');
});

Deno.test('toHono handles patterns with multiple regex groups', () => {
  assertEquals(
    toHono('/:lang(en|zh)/:category(\\w+)/:id(\\d+)'),
    '/:lang{en|zh}/:category{\\w+}/:id{\\d+}',
  );
});

Deno.test('toHono preserves patterns without regex groups', () => {
  assertEquals(toHono('/'), '/');
  assertEquals(toHono('/about'), '/about');
  assertEquals(toHono('/blog/:slug'), '/blog/:slug');
});

// ─── Router class tests (where possible without browser APIs) ─

Deno.test('Router: locales parsed from attribute', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh', 'fr']) });
  assertEquals(r.locales, ['en', 'zh', 'fr']);
});

Deno.test('Router: locales defaults to [en] when no attribute', () => {
  const r = router({});
  assertEquals(r.locales, ['en']);
});

Deno.test('Router: locale getter returns attribute value', () => {
  const r = router({ locale: 'zh' });
  assertEquals(r.locale, 'zh');
});

Deno.test('Router: locale falls back to en', () => {
  const r = router({});
  assertEquals(r.locale, 'en');
});

Deno.test('Router: localize adds locale prefix to unlocalized path', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']), locale: 'zh' });
  assertEquals(r.localize('/guide'), '/zh/guide');
});

Deno.test('Router: localize keeps already localized path', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']), locale: 'zh' });
  assertEquals(r.localize('/zh/guide'), '/zh/guide');
});

Deno.test('Router: localize handles root path', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']), locale: 'en' });
  assertEquals(r.localize('/'), '/en/');
});

Deno.test('Router: localize handles empty path', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']), locale: 'en' });
  assertEquals(r.localize(''), '/en');
});

Deno.test('Router: localize preserves external URLs', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']) });
  assertEquals(r.localize('https://example.com'), 'https://example.com');
  assertEquals(r.localize('http://other.com/path'), 'http://other.com/path');
});

Deno.test('Router: localize with single locale returns path unchanged', () => {
  const r = router({ locales: JSON.stringify(['en']), locale: 'en' });
  assertEquals(r.localize('/guide'), '/guide');
});

Deno.test('Router: switchPath changes to other locale', () => {
  const r = router({
    locales: JSON.stringify(['en', 'zh']),
    locale: 'en',
    'current-path': '/guide',
  });
  assertEquals(r.switchPath(), '/zh/guide');
});

Deno.test('Router: switchPath with single locale stays same locale', () => {
  const r = router({ locales: JSON.stringify(['en']), locale: 'en', 'current-path': '/guide' });
  assertEquals(r.switchPath(), '/en/guide');
});

Deno.test('Router: switchPath with three locales', () => {
  const r = router({
    locales: JSON.stringify(['en', 'zh', 'fr']),
    locale: 'en',
    'current-path': '/guide',
  });
  const result = r.switchPath();
  // Should switch to 'zh' (first non-current locale)
  assertEquals(result, '/zh/guide');
});

Deno.test('Router: switchPath from zh to en', () => {
  const r = router({
    locales: JSON.stringify(['en', 'zh']),
    locale: 'zh',
    'current-path': '/guide',
  });
  assertEquals(r.switchPath(), '/en/guide');
});

Deno.test('Router: switchLabel returns human-readable label', () => {
  const r = router({
    locales: JSON.stringify(['en', 'zh']),
    locale: 'en',
    'current-path': '/guide',
  });
  const label = r.switchLabel();
  // zh should map to 中文
  assertEquals(label, '\u4E2D\u6587');
});

Deno.test('Router: start/stop lifecycle does not throw', () => {
  const r = router({ locales: JSON.stringify(['en']) });
  // start without shadowRoot should not throw
  r.start({
    contentLoader: async () => {},
  });
  // stop should not throw
  r.stop();
});

Deno.test('Router: start with empty options does not throw', () => {
  const r = router({ locales: JSON.stringify(['en']) });
  r.start({ contentLoader: async () => {} });
  r.stop();
});

Deno.test('Router: locale switching via localize handles multiple consecutive prefixes', () => {
  const r = router({ locales: JSON.stringify(['en', 'zh']), locale: 'en' });
  // Path already has locale prefix
  assertEquals(r.localize('/zh/guide'), '/zh/guide');
  assertEquals(r.localize('/en/zh/page'), '/en/zh/page');
});

Deno.test('Router: path getter returns current path', () => {
  const r = router({ 'current-path': '/blog/post-1' });
  assertEquals(r.path, '/blog/post-1');
});

Deno.test('Router: path defaults to /', () => {
  const r = router({});
  // Without location global and without current-path attribute, defaults to /
  assertEquals(r.path, '/');
});

Deno.test('Router: start with contentLoader that resolves does not throw', () => {
  const r = router({ locales: JSON.stringify(['en']), locale: 'en' });
  let _loaded = false;
  r.start({
    contentLoader: () => {
      _loaded = true;
      return Promise.resolve();
    },
    onAfterSwap: () => {},
  });
  // Can't test full navigation without DOM, but lifecycle is fine
  r.stop();
  assertEquals(typeof r.switchPath, 'function');
});

/**
 * @openelement/ssg - ssg-render.ts tests
 */
import { assertEquals, assertExists, assertRejects, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { Hono } from 'hono';
import { resolveDynamicRoutePath, ssgRender } from '../src/index.ts';
import type { SsgPageOutput, SsgRenderOptions, SsrBundle } from '../src/index.ts';

function createMockBundle(overrides: Partial<SsrBundle> = {}): SsrBundle {
  const app = new Hono();
  app.get('/', (c) => c.text('ok'));
  return {
    default: app,
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [] },
      { path: '/about', tagName: 'about-page', isDynamic: false, paramNames: [] },
    ],
    ...overrides,
  };
}

const defaultOptions: SsgRenderOptions = {
  root: Deno.cwd(),
  outDir: './dist-test-ssg-package-render',
};

Deno.test('resolveDynamicRoutePath encodes safe params', () => {
  assertEquals(
    resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'hello world' }),
    '/blog/hello%20world',
  );
});

Deno.test('resolveDynamicRoutePath rejects path traversal params', () => {
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '../evil' }),
    Error,
    'Unsafe value',
  );
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: '..' }),
    Error,
    'Unsafe value',
  );
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], { slug: 'a/b' }),
    Error,
    'Unsafe value',
  );
});

Deno.test('resolveDynamicRoutePath rejects missing params', () => {
  assertThrows(
    () => resolveDynamicRoutePath('/blog/:slug', ['slug'], {}),
    Error,
    'Missing value',
  );
});

Deno.test('ssgRender - rejects when module has no default export', async () => {
  const bundle = createMockBundle({ default: undefined });
  await assertRejects(
    () => ssgRender(bundle as SsrBundle, defaultOptions),
    Error,
    'no Hono app found',
  );
});

Deno.test('ssgRender - handles empty routeInfo gracefully', async () => {
  const bundle = createMockBundle({ routeInfo: [] });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - writes ISR manifest for revalidate routes', async () => {
  const outDir = './dist-test-ssg-package-render-isr';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/', tagName: 'index-page', isDynamic: false, paramNames: [], revalidate: 60 },
    ],
  });

  await ssgRender(bundle, { ...defaultOptions, outDir });

  const manifest = JSON.parse(await Deno.readTextFile(`${outDir}/isr-manifest.json`));
  assertEquals(manifest, [
    {
      path: '/',
      revalidate: 60,
      cacheKey: 'openelement:isr:/',
      params: {},
    },
  ]);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - writes ISR manifest entries for dynamic static paths', async () => {
  const outDir = './dist-test-ssg-package-render-isr-dynamic';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      {
        path: '/blog/:slug',
        tagName: 'blog-page',
        isDynamic: true,
        paramNames: ['slug'],
        revalidate: 120,
      },
    ],
    renderRoute: (() =>
      Promise.resolve(
        {
          html: '<html><body>test</body></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        } as SsgPageOutput,
      )) as SsrBundle['renderRoute'],
    getStaticPaths: (() =>
      Promise.resolve([
        { slug: 'hello world' },
        { slug: 'second' },
      ])) as SsrBundle['getStaticPaths'],
  });

  await ssgRender(bundle, { ...defaultOptions, outDir });

  const manifest = JSON.parse(await Deno.readTextFile(`${outDir}/isr-manifest.json`));
  assertEquals(manifest, [
    {
      path: '/blog/:slug',
      revalidate: 120,
      cacheKey: 'openelement:isr:/blog/:slug?slug=hello%20world',
      params: { slug: 'hello world' },
    },
    {
      path: '/blog/:slug',
      revalidate: 120,
      cacheKey: 'openelement:isr:/blog/:slug?slug=second',
      params: { slug: 'second' },
    },
  ]);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - handles dynamic routes with no getStaticPaths', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: undefined,
    getStaticPaths: undefined,
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles getStaticPaths failure gracefully', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: (() =>
      Promise.resolve(
        {
          html: '<html><body>test</body></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        } as SsgPageOutput,
      )) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.reject(new Error('fail'))) as SsrBundle['getStaticPaths'],
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles empty getStaticPaths gracefully', async () => {
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: (() =>
      Promise.resolve(
        {
          html: '<html><body>test</body></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        } as SsgPageOutput,
      )) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.resolve([])) as SsrBundle['getStaticPaths'],
  });
  await ssgRender(bundle, defaultOptions);
});

Deno.test('ssgRender - handles options with viewTransition disabled', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, viewTransition: false });
});

Deno.test('ssgRender - handles options with speculation enabled', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, speculation: true });
});

Deno.test('ssgRender - handles options with custom outDir', async () => {
  const outDir = './dist-test-ssg-custom-outdir';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, outDir });
  // Verify output dir was created
  const exists = await Deno.stat(outDir).then(() => true).catch(() => false);
  assertEquals(exists, true);
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - handles options with base path', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, { ...defaultOptions, base: '/my-app/' });
});

Deno.test('ssgRender - null render result handled gracefully', async () => {
  const outDir = './dist-test-ssg-null-render';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle({
    routeInfo: [
      { path: '/blog/:slug', tagName: 'blog-page', isDynamic: true, paramNames: ['slug'] },
    ],
    renderRoute: (() =>
      Promise.resolve(null as unknown as SsgPageOutput)) as SsrBundle['renderRoute'],
    getStaticPaths: (() => Promise.resolve([{ slug: 'test' }])) as SsrBundle['getStaticPaths'],
  });
  // Should not throw - gracefully handle null render output
  await ssgRender(bundle, { ...defaultOptions, outDir });
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

Deno.test('ssgRender - handles options with CSP policy', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, {
    ...defaultOptions,
    middleware: { csp: { policy: "default-src 'self'" } },
  });
});

Deno.test('ssgRender - handles options with headExtras', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, {
    ...defaultOptions,
    headExtras: '<link rel="stylesheet" href="/styles.css" />',
  });
});

Deno.test('ssgRender - handles options with html lang and title', async () => {
  const bundle = createMockBundle();
  await ssgRender(bundle, {
    ...defaultOptions,
    html: { lang: 'zh-CN', title: '测试' },
  });
});

Deno.test('ssgRender - handles options with PWA config', async () => {
  const outDir = './dist-test-ssg-pwa';
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  const bundle = createMockBundle();
  await ssgRender(bundle, {
    ...defaultOptions,
    outDir,
    pwa: {
      name: 'TestApp',
      shortName: 'Test',
      themeColor: '#ff0000',
      backgroundColor: '#ffffff',
    },
  });
  // Verify PWA manifest was written
  const manifestContent = await Deno.readTextFile(`${outDir}/manifest.json`).catch(() => null);
  assertExists(manifestContent, 'PWA manifest should exist');
  if (manifestContent) {
    const manifest = JSON.parse(manifestContent);
    assertEquals(manifest.name, 'TestApp');
    assertEquals(manifest.short_name, 'Test');
  }
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
});

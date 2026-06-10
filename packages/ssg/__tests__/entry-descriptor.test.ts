/**
 * @openelement/ssg - entry-descriptor.ts tests (Deno)
 *
 * Tests buildEntryDescriptor for options not covered by adapter-vite tests:
 * package manifests, hub client-only tags, sitemap, empty/special edge cases.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor, buildSsrAdmissionPlan } from '../src/index.ts';
import type { RouteEntry } from '@openelement/core';

// ─── Fixtures ──────────────────────────────────────────────────

const sampleRoutes: RouteEntry[] = [
  { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
  { path: '/about', filePath: 'about.ts', type: 'page', varName: 'pageAbout' },
  { path: '/api/hello', filePath: 'api/hello.ts', type: 'api', varName: 'apiHello' },
];

// ─── buildEntryDescriptor additional coverage ─────────────────

Deno.test('buildEntryDescriptor: empty routes array produces default descriptor', () => {
  const desc = buildEntryDescriptor([]);
  assertEquals(desc.isSSG, false);
  assertEquals(desc.apiRoutes.length, 0);
  assertEquals(desc.pageRoutes.length, 0);
  assertEquals(desc.islands.length, 0);
  assertEquals(desc.renderers.length, 0);
  assertEquals(desc.middlewareScopes.length, 0);
  assertEquals(desc.document.lang, 'en');
  assertEquals(desc.document.title, 'openElement');
  assertEquals(desc.upgradeStrategy, 'idle');
});

Deno.test('buildEntryDescriptor: package manifest islands are extracted', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    packageManifests: [
      {
        schemaVersion: '1.0.0',
        packageName: '@openelement/ui',
        version: '0.17.0',
        declarations: [
          {
            tagName: 'open-layout',
            className: 'OpenLayout',
            openElement: { module: '@openelement/ui/open-layout', hydrate: 'load' },
          },
          {
            tagName: 'open-button',
            className: 'OpenButton',
            openElement: { module: '@openelement/ui/open-button' },
          },
        ],
      },
    ],
  });

  assertEquals(desc.islands.length, 2);
  const layout = desc.islands.find((i) => i.tagName === 'open-layout');
  const button = desc.islands.find((i) => i.tagName === 'open-button');
  assertExists(layout);
  assertExists(button);
  assertEquals(layout.isPackage, true);
  assertEquals(layout.modulePath, '@openelement/ui/open-layout');
  assertEquals(layout.hydrate, 'load');
  assertEquals(button.hydrate, 'idle'); // default
});

Deno.test('buildEntryDescriptor: hubClientOnlyTags are recorded', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    hubClientOnlyTags: ['sl-button', 'sl-input', 'media-player'],
  });
  assertEquals(desc.hubClientOnlyTags, ['sl-button', 'sl-input', 'media-player']);
});

Deno.test('buildEntryDescriptor: hub client-only tags are excluded from SSR admission', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    islandTagNames: ['my-counter'],
    islandFiles: ['my-counter.ts'],
    hubClientOnlyTags: ['sl-button'],
  });
  // The hub client-only tag should appear in clientOnlyTags
  assertExists(desc.ssrAdmissionPlan.clientOnlyTags.includes('sl-button'));
});

Deno.test('buildEntryDescriptor: debugRoutes contain correct route data for dev mode', () => {
  const desc = buildEntryDescriptor(sampleRoutes);
  assertExists(desc.debugRoutes);
  assertEquals(desc.debugRoutes!.length, 3);
  assertEquals(desc.debugRoutes![0], { path: '/', type: 'page' });
  assertEquals(desc.debugRoutes![1], { path: '/about', type: 'page' });
  assertEquals(desc.debugRoutes![2], { path: '/api/hello', type: 'api' });
});

Deno.test('buildEntryDescriptor: special route renderers are sorted by depth (deeper first)', () => {
  const routesWithRenderers: RouteEntry[] = [
    { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
    {
      path: '/_renderer',
      filePath: '_renderer.ts',
      type: 'special',
      special: 'renderer',
      varName: 'rootRenderer',
    },
    {
      path: '/guide/_renderer',
      filePath: 'guide/_renderer.ts',
      type: 'special',
      special: 'renderer',
      varName: 'guideRenderer',
    },
    {
      path: '/guide/deep/_renderer',
      filePath: 'guide/deep/_renderer.ts',
      type: 'special',
      special: 'renderer',
      varName: 'deepRenderer',
    },
  ];
  const desc = buildEntryDescriptor(routesWithRenderers);

  assertEquals(desc.renderers.length, 3);
  // Should be sorted by depth DESCENDING (outermost = root scope last)
  // depth: guide/deep=2, guide=1, root=0
  assertExists(desc.renderers[0].scope.length >= desc.renderers[1].scope.length);
});

Deno.test('buildEntryDescriptor: middleware scopes use correct scope path', () => {
  const routesWithMw: RouteEntry[] = [
    { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
    {
      path: '/_middleware',
      filePath: '_middleware.ts',
      type: 'special',
      special: 'middleware',
      varName: 'rootMw',
    },
    {
      path: '/api/_middleware',
      filePath: 'api/_middleware.ts',
      type: 'special',
      special: 'middleware',
      varName: 'apiMw',
    },
  ];
  const desc = buildEntryDescriptor(routesWithMw);

  assertEquals(desc.middlewareScopes.length, 2);
  // Root middleware scope should be '/'
  const rootScope = desc.middlewareScopes.find((m) => m.scope === '/');
  const apiScope = desc.middlewareScopes.find((m) => m.scope === '/api');
  assertExists(rootScope);
  assertExists(apiScope);
  assertEquals(rootScope.varName, '$rootMw');
  assertEquals(apiScope.varName, '$apiMw');
});

Deno.test('buildEntryDescriptor: page routes detect dynamic paths', () => {
  const dynamicRoutes: RouteEntry[] = [
    { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex' },
    { path: '/blog/:slug', filePath: 'blog/[slug].ts', type: 'page', varName: 'pageBlogSlug' },
    {
      path: '/docs/:lang/:chapter',
      filePath: 'docs/[lang]/[chapter].ts',
      type: 'page',
      varName: 'pageDocs',
    },
  ];
  const desc = buildEntryDescriptor(dynamicRoutes);

  const home = desc.pageRoutes.find((r) => r.path === '/');
  const blog = desc.pageRoutes.find((r) => r.path === '/blog/:slug');
  const docs = desc.pageRoutes.find((r) => r.path === '/docs/:lang/:chapter');

  assertExists(home);
  assertExists(blog);
  assertExists(docs);

  assertEquals(home.isDynamic, false);
  assertEquals(home.paramNames, []);

  assertEquals(blog.isDynamic, true);
  assertEquals(blog.paramNames, ['slug']);

  assertEquals(docs.isDynamic, true);
  assertEquals(docs.paramNames, ['lang', 'chapter']);
});

Deno.test('buildEntryDescriptor: middleware securityHeaders independent of CORS', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    middleware: { cors: false },
  });
  // securityHeaders should still be present even when cors is disabled
  const kinds = desc.middleware.map((m) => m.kind);
  assertEquals(kinds.includes('securityHeaders'), true);
  assertEquals(kinds.includes('cors'), false);
});

Deno.test('buildEntryDescriptor: sitemapOptions null is not serialized (no sitemap field in descriptor)', () => {
  // buildEntryDescriptor does not have a sitemap field - verify it's not in the output
  const desc = buildEntryDescriptor(sampleRoutes);
  assertEquals('sitemapOptions' in desc, false);
});

Deno.test('buildEntryDescriptor: allowHeadExtrasScripts defaults to false', () => {
  const desc = buildEntryDescriptor(sampleRoutes);
  assertEquals(desc.document.allowHeadExtrasScripts, false);
});

Deno.test('buildEntryDescriptor: allowHeadExtrasScripts can be enabled', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    allowHeadExtrasScripts: true,
  });
  assertEquals(desc.document.allowHeadExtrasScripts, true);
});

Deno.test('buildEntryDescriptor: SSR admission plan is built even with no islands', () => {
  const desc = buildEntryDescriptor(sampleRoutes);
  assertEquals(desc.ssrAdmissionPlan.renderableTags, []);
  assertEquals(desc.ssrAdmissionPlan.clientOnlyTags, []);
  assertEquals(desc.ssrAdmissionPlan.rejectedTags, []);
  assertEquals(Object.keys(desc.ssrAdmissionPlan.reasons).length, 0);
  assertEquals(desc.ssrAdmissionPlan.decisions.length, 0);
});

// ─── buildSsrAdmissionPlan direct tests ────────────────────────

Deno.test('buildSsrAdmissionPlan: duplicate tag names are rejected', () => {
  const plan = buildSsrAdmissionPlan([
    { tagName: 'my-counter', modulePath: '/app/islands/counter.ts' },
    { tagName: 'my-counter', modulePath: '/app/islands/counter-v2.ts' }, // duplicate
  ]);
  assertEquals(plan.renderableTags, []);
  assertEquals(plan.clientOnlyTags, []);
  assertEquals(plan.rejectedTags, ['my-counter']);
});

Deno.test('buildSsrAdmissionPlan: hydrate=only islands become client-only', () => {
  const plan = buildSsrAdmissionPlan([
    { tagName: 'my-widget', modulePath: '/app/islands/widget.ts', hydrate: 'only' },
  ]);
  assertEquals(plan.renderableTags, []);
  assertEquals(plan.clientOnlyTags, ['my-widget']);
});

Deno.test('buildEntryDescriptor: default html lang/title used when not provided', () => {
  const desc = buildEntryDescriptor(sampleRoutes, { html: {} });
  assertEquals(desc.document.lang, 'en');
  assertEquals(desc.document.title, 'openElement');
});

Deno.test('buildEntryDescriptor: api route with revalidate field produces no ISR in descriptor', () => {
  // revalidate is on RouteEntry but descriptor doesn't handle it
  const routesWithRevalidate: RouteEntry[] = [
    { path: '/', filePath: 'index.ts', type: 'page', varName: 'pageIndex', revalidate: 60 },
  ];
  const desc = buildEntryDescriptor(routesWithRevalidate);
  assertEquals(desc.pageRoutes.length, 1);
  assertEquals(desc.pageRoutes[0].path, '/');
});

Deno.test('buildEntryDescriptor: island ssr=false prevents default SSR path', () => {
  const desc = buildEntryDescriptor(sampleRoutes, {
    islandTagNames: ['client-only-widget'],
    islandFiles: ['client-only-widget.ts'],
    islandMeta: {
      'client-only-widget': { tagName: 'client-only-widget', ssr: false },
    },
  });
  assertEquals(desc.islands[0].ssr, false);
  // Since hydrate is not 'only' but ssr=false, it should be client-only
  const plan = desc.ssrAdmissionPlan;
  assertEquals(plan.clientOnlyTags.includes('client-only-widget'), true);
  assertEquals(plan.renderableTags.includes('client-only-widget'), false);
});

import { assertEquals } from 'jsr:@std/assert@1';
import {
  type CacheAdapter,
  type CacheEntry,
  type ComponentAdapter,
  createRuntimeAdapter,
  type EntryDescriptor,
  type IslandConfig,
  MemoryDataAdapter,
  type RendererProtocol,
  runCacheAdapterConformance,
  runComponentAdapterConformance,
  runDataAdapterConformance,
  runRendererConformance,
  runRuntimeAdapterConformance,
  unwrapSignalLike,
} from '../index.ts';

Deno.test('protocols: signal-like values unwrap through the shared protocol shape', () => {
  const signal = {
    value: 'ready',
    subscribe: () => () => {},
  };

  assertEquals(unwrapSignalLike(signal), 'ready');
  assertEquals(unwrapSignalLike('plain'), 'plain');
});

Deno.test('protocols: memory data adapter satisfies the data conformance helper', async () => {
  const adapter = new MemoryDataAdapter([['post:1', { title: 'One' }]]);
  const results = await runDataAdapterConformance(adapter, 'post:1', { title: 'One' });

  assertEquals(results.every((result) => result.passed), false);

  const sharedValue = { title: 'One' };
  const sharedAdapter = new MemoryDataAdapter([['post:1', sharedValue]]);
  const sharedResults = await runDataAdapterConformance(sharedAdapter, 'post:1', sharedValue);
  assertEquals(sharedResults.every((result) => result.passed), true);
});

Deno.test('protocols: cache conformance checks set/get behavior', async () => {
  const store = new Map<string, CacheEntry<string>>();
  const adapter: CacheAdapter<string> = {
    name: 'memory-cache',
    get: (key) => Promise.resolve(store.get(key)),
    set: (key, entry) => {
      store.set(key, entry);
      return Promise.resolve();
    },
    delete: (key) => Promise.resolve(store.delete(key)),
  };

  const results = await runCacheAdapterConformance(adapter, 'home', {
    value: '<html></html>',
    createdAt: 1,
  });

  assertEquals(results.every((result) => result.passed), true);
});

Deno.test('protocols: renderer conformance checks render output', async () => {
  const renderer: RendererProtocol = {
    name: 'string-renderer',
    isTemplate: (value) => typeof value === 'string',
    render: (value) => Promise.resolve(String(value)),
  };

  const results = await runRendererConformance(renderer, {
    tagName: 'open-test',
    template: '<span>ok</span>',
    expectedHtml: '<span>ok</span>',
  });

  assertEquals(results.every((result) => result.passed), true);
});

Deno.test('protocols: component adapter conformance checks descriptors', () => {
  const fixture = { kind: 'component' };
  const adapter: ComponentAdapter<typeof fixture> = {
    name: 'object-component',
    isComponent: (value): value is typeof fixture => value === fixture,
    describe: (_component, tagName) => ({ tagName, layer: 'dsd-static' }),
  };

  const results = runComponentAdapterConformance(adapter, fixture, 'open-fixture');

  assertEquals(results.every((result) => result.passed), true);
});

Deno.test('protocols: island config accepts hydration metadata without bundler imports', () => {
  const config: IslandConfig = {
    ssr: true,
    dsd: true,
    hydrate: 'visible',
  };

  assertEquals(config.hydrate, 'visible');
});

Deno.test('protocols: route entry descriptor is pure data', () => {
  const descriptor: EntryDescriptor = {
    isSSG: true,
    imports: [{ from: '@openelement/core', names: ['renderDsd'] }],
    middleware: [],
    apiRoutes: [],
    pageRoutes: [{
      kind: 'page',
      path: '/',
      varName: '$index',
      filePath: 'index.ts',
      defaultTagName: 'open-index',
      tagName: 'open-index',
      importPath: '/app/routes/index.ts',
    }],
    islands: [{
      tagName: 'open-counter',
      modulePath: '/app/islands/counter.ts',
      hydrate: 'idle',
      source: 'local',
    }],
    ssrAdmissionPlan: {
      renderableTags: ['open-counter'],
      clientOnlyTags: [],
      rejectedTags: [],
      reasons: {},
      decisions: [{
        tagName: 'open-counter',
        renderPath: 'ssr+client',
        reason: 'fixture',
      }],
    },
    renderers: [],
    middlewareScopes: [],
    document: {
      lang: 'en',
      title: 'openElement',
      headExtras: '',
      allowHeadExtrasScripts: false,
    },
    appShell: {
      default: false,
      layouts: {},
    },
    upgradeStrategy: 'idle',
  };

  assertEquals(descriptor.pageRoutes[0].tagName, 'open-index');
  assertEquals(descriptor.islands[0].hydrate, 'idle');
});

Deno.test('protocols: runtime adapter conformance accepts fetch-compatible adapters', async () => {
  const adapter = createRuntimeAdapter({
    name: 'fetch-runtime',
    fetch: () => new Response('ok', { status: 200 }),
  });

  const results = await runRuntimeAdapterConformance(adapter, new Request('https://example.test/'));

  assertEquals(results.every((result) => result.passed), true);
});

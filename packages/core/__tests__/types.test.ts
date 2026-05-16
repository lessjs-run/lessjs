/**
 * @lessjs/core - types.ts tests (Deno)
 *
 * Tests type exports and interface structure (compile-time checks).
 */
import { assertExists } from 'jsr:@std/assert@^1.0.0';
import type {
  FrameworkOptions,
  LessMiddleware,
  LessPackageManifest,
  LessRenderer,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from '../src/types.ts';

// Compile-time type existence checks (lint compliance: consume the imported types)
type _LessMiddleware = LessMiddleware;
type _LessRenderer = LessRenderer;
type _SpecialFileType = SpecialFileType;

// These are compile-time assertions — if the types don't exist or have
// wrong shapes, this file won't compile.

Deno.test('types: FrameworkOptions has expected shape', () => {
  const opts: FrameworkOptions = {};
  assertExists(opts);

  const optsWithAll: FrameworkOptions = {
    routesDir: 'app/routes',
    islandsDir: 'app/islands',
    componentsDir: 'app/components',
    headExtras: '<link />',
    html: { title: 'Test', lang: 'en' },
    island: { upgradeStrategy: 'lazy' },
    middleware: { corsOrigin: '*' },
    packageIslands: ['@lessjs/ui'],
    ssr: { noExternal: [/^lit/] },
  };
  assertExists(optsWithAll);
});

Deno.test('types: RouteEntry has required fields', () => {
  const route: RouteEntry = {
    path: '/about',
    filePath: 'about.ts',
    type: 'page',
    varName: 'Route_About',
  };
  assertEquals(route.path, '/about');
  assertEquals(route.type, 'page');

  const apiRoute: RouteEntry = {
    path: '/api/data',
    filePath: 'api/data.ts',
    type: 'api',
    varName: 'apiData',
  };
  assertEquals(apiRoute.type, 'api');

  const specialRoute: RouteEntry = {
    path: '/_renderer',
    filePath: '_renderer.ts',
    type: 'special',
    special: 'renderer',
    varName: 'specialRenderer',
  };
  assertEquals(specialRoute.special, 'renderer');
});

Deno.test('types: LessPackageManifest has required fields', () => {
  const manifest: LessPackageManifest = {
    schemaVersion: '1.0.0',
    packageName: '@test/ui',
    version: '0.1.0',
    declarations: [
      {
        tagName: 'test-button',
        less: {
          ssr: true,
          dsd: true,
          module: '@test/ui/test-button',
          hydrate: 'eager',
        },
      },
    ],
  };
  assertEquals(manifest.packageName, '@test/ui');
  assertEquals(manifest.declarations[0].tagName, 'test-button');
});

Deno.test('types: SsrContext has expected properties', () => {
  // SsrContext is created by createSsrContext() — just verify the type exists
  type _Check = SsrContext extends { route: RouteEntry; url: URL; params: Record<string, string> }
    ? true
    : never;
  const check: _Check = true;
  assertExists(check);
});

function assertEquals<T>(a: T, b: T) {
  if (a !== b) throw new Error(`${a} !== ${b}`);
}

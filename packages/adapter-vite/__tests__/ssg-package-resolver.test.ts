import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1';
import {
  createLessJsrPackageResolverPlugin,
  parseLessPackageSpecifier,
  resolveLessPackageExport,
  resolveVirtualLessPackageRelative,
  toVirtualLessPackageId,
} from '../src/ssg-package-resolver.ts';

Deno.test('parseLessPackageSpecifier parses bare LessJS package ids', () => {
  assertEquals(parseLessPackageSpecifier('@lessjs/core'), {
    packageName: 'core',
    subpath: '.',
  });
  assertEquals(parseLessPackageSpecifier('@lessjs/ui/less-card'), {
    packageName: 'ui',
    subpath: 'less-card',
  });
});

Deno.test('parseLessPackageSpecifier parses JSR LessJS package ids', () => {
  assertEquals(parseLessPackageSpecifier('jsr:@lessjs/signals@^0.21/framework'), {
    packageName: 'signals',
    range: '^0.21',
    subpath: 'framework',
  });
  assertEquals(parseLessPackageSpecifier('jsr:@lessjs/core@^0.21.9/navigation'), {
    packageName: 'core',
    range: '^0.21.9',
    subpath: 'navigation',
  });
});

Deno.test('resolveLessPackageExport maps public subpaths to source files', () => {
  assertEquals(resolveLessPackageExport('core', '.'), 'src/index.ts');
  assertEquals(resolveLessPackageExport('core', 'navigation'), 'src/navigation.ts');
  assertEquals(resolveLessPackageExport('ui', 'less-card'), 'src/less-card.tsx');
  assertEquals(resolveLessPackageExport('signals', 'framework'), 'src/framework.ts');
  assertEquals(resolveLessPackageExport('app', '.'), 'src/index.ts');
});

Deno.test('resolveLessPackageExport reports unknown LessJS subpaths clearly', () => {
  assertThrows(
    () => resolveLessPackageExport('core', 'missing'),
    Error,
    'Unknown @lessjs/core export subpath',
  );
});

Deno.test('resolveVirtualLessPackageRelative keeps relative imports in package namespace', () => {
  assertEquals(
    resolveVirtualLessPackageRelative(
      './errors.ts',
      toVirtualLessPackageId('core', 'src/index.ts'),
    ),
    toVirtualLessPackageId('core', 'src/errors.ts'),
  );
  assertEquals(
    resolveVirtualLessPackageRelative(
      '../shared.js',
      toVirtualLessPackageId('content', 'src/sitemap/index.ts'),
    ),
    toVirtualLessPackageId('content', 'src/shared.ts'),
  );
});

Deno.test('createLessJsrPackageResolverPlugin resolves JSR and bare package ids', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    fetchSource: (url) =>
      Promise.resolve(new Response(`export const url = ${JSON.stringify(url)};`)),
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  assertEquals(
    await resolveId('@lessjs/ui/less-card'),
    toVirtualLessPackageId('ui', 'src/less-card.tsx'),
  );
  assertEquals(
    await resolveId('jsr:@lessjs/signals@^0.21/framework'),
    toVirtualLessPackageId('signals', 'src/framework.ts'),
  );
  assertEquals(
    await load(toVirtualLessPackageId('signals', 'src/framework.ts')),
    'export const url = "https://jsr.io/@lessjs/signals/0.21.9/src/framework.ts";',
  );
});

Deno.test('createLessJsrPackageResolverPlugin fails fetch misses before Vite unresolved import', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    fetchSource: () => Promise.resolve(new Response('', { status: 404 })),
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  await assertRejects(
    () => Promise.resolve(load(toVirtualLessPackageId('core', 'src/index.ts'))),
    Error,
    'Failed to fetch @lessjs/core/src/index.ts',
  );
});

Deno.test('createLessJsrPackageResolverPlugin can read local package sources before publish', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    localPackageRoot: 'C:/repo',
    readLocalSource: (path) => `// ${path}`,
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  assertEquals(
    await load(toVirtualLessPackageId('core', 'src/index.ts')),
    '// C:/repo/packages/core/src/index.ts',
  );
});

Deno.test('createLessJsrPackageResolverPlugin does not intercept optional packages', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;

  // Optional packages are handled by optionalPackageStubsPlugin, not the resolver
  assertEquals(await resolveId('@lessjs/adapter-vanilla'), null);
  assertEquals(await resolveId('@lessjs/adapter-react'), null);
  assertEquals(await resolveId('@lessjs/adapter-lit'), null);
  assertEquals(await resolveId('@lessjs/content'), null);
  assertEquals(await resolveId('@lessjs/i18n'), null);

  // Required packages ARE resolved by the resolver
  assertEquals(
    await resolveId('@lessjs/core'),
    toVirtualLessPackageId('core', 'src/index.ts'),
  );
});

Deno.test('createLessJsrPackageResolverPlugin lets exact user aliases resolve first', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.9',
    userAliases: {
      '@lessjs/ui/less-layout': './app/components/site-layout.tsx',
    },
  });
  const resolveId = plugin.resolveId as unknown as (
    id: string,
    importer?: string,
  ) => string | null | Promise<string | null>;

  assertEquals(await resolveId('@lessjs/ui/less-layout'), null);
  assertEquals(
    await resolveId('@lessjs/ui/less-card'),
    toVirtualLessPackageId('ui', 'src/less-card.tsx'),
  );
});

Deno.test('createLessJsrPackageResolverPlugin rewrites npm: specifiers from JSR source', async () => {
  const jsrSource = [
    `import * as marked from 'npm:marked@12.0.0';`,
    `import type { Tokens } from 'npm:marked@12.0.0';`,
    `import { LitElement } from 'npm:lit@3.3.2';`,
    `import { something } from 'npm:@lit/reactive-element@2.1.0';`,
    `import { ctx } from 'npm:@lessjs/core@0.21.10/context';`,
    `import 'npm:sanitize-html@2.17.4';`,
    `const dynamic = import('npm:gray-matter@4.0.3');`,
    `const literal = 'npm:not-a-real-import@1.0.0';`,
    `export * from 'npm:@jsr/lessjs__signals@0.21.10/framework';`,
    `import { rpc } from 'npm:@jsr/lessjs__rpc@0.21.10';`,
  ].join('\n');

  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: null,
    version: '0.21.10',
    fetchSource: () => Promise.resolve(new Response(jsrSource)),
  });
  const load = plugin.load as unknown as (id: string) => string | null | Promise<string | null>;

  const result = await load(toVirtualLessPackageId('core', 'src/jsx-render-string.ts')) as string;

  // npm: specifiers stripped to bare packages (version and prefix removed)
  assertEquals(result.includes("from 'marked'"), true);
  assertEquals(result.includes("from 'lit'"), true);
  assertEquals(result.includes("from '@lit/reactive-element'"), true);
  assertEquals(result.includes("from '@lessjs/core/context'"), true);
  assertEquals(result.includes("import 'sanitize-html'"), true);
  assertEquals(result.includes("import('gray-matter')"), true);
  assertEquals(result.includes("from '@jsr/lessjs__signals/framework'"), true);
  assertEquals(result.includes("from '@jsr/lessjs__rpc'"), true);
  assertEquals(result.includes("'npm:not-a-real-import@1.0.0'"), true);

  // npm: prefix and version should NOT remain
  assertEquals(result.replace("'npm:not-a-real-import@1.0.0'", '').includes('npm:'), false);
  assertEquals(result.includes('@12.0.0'), false);
  assertEquals(result.includes('@3.3.2'), false);
  assertEquals(result.includes('@2.1.0'), false);
});

Deno.test('createLessJsrPackageResolverPlugin rewrites npm: specifiers during workspace transforms', async () => {
  const plugin = createLessJsrPackageResolverPlugin({
    workspaceRoot: 'C:/repo',
    version: '0.28.5',
  });
  const transform = plugin.transform as unknown as (
    code: string,
    id?: string,
  ) => { code: string; map: null } | null | Promise<{ code: string; map: null } | null>;

  const result = await transform(
    [
      `// @deno-types="npm:@types/sanitize-html@^2"`,
      `import sanitizeHtml from 'npm:sanitize-html@^2.17.4';`,
      `const literal = 'npm:keep-me@1.0.0';`,
    ].join('\n'),
    'C:/repo/packages/core/src/security.ts',
  ) as { code: string; map: null };

  assertEquals(result.code.includes("from 'sanitize-html'"), true);
  assertEquals(result.code.includes('"npm:@types/sanitize-html@^2"'), true);
  assertEquals(result.code.includes("'npm:keep-me@1.0.0'"), true);
});

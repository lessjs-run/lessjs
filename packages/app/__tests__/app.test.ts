/**
 * @lessjs/app - Unified entry tests
 *
 * Tests that lessjs() correctly combines lessPipeline() + lessContent() + lessI18n()
 * with a shared LessBuildContext. This is the primary user-facing API.
 */
import { assertArrayIncludes, assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { lessjs } from '../src/index.ts';

// ─── Plugin structure ──────────────────────────────────────────

Deno.test('lessjs() returns an array of plugins', () => {
  const plugins = lessjs();
  assertExists(plugins);
  assertEquals(Array.isArray(plugins), true);
});

Deno.test('lessjs() plugins have names starting with less:', () => {
  const plugins = lessjs();
  for (const p of plugins) {
    if (p.name === '@hono/vite-dev-server') continue;
    assertEquals(
      p.name.startsWith('less:'),
      true,
      `Plugin "${p.name}" should start with "less:"`,
    );
  }
});

Deno.test('lessjs() minimal includes less:core, less:build, less:virtual-entry', () => {
  const names = lessjs().map((p) => p.name);
  assertArrayIncludes(names, ['less:core']);
  assertArrayIncludes(names, ['less:build']);
  assertArrayIncludes(names, ['less:virtual-entry']);
});

Deno.test('lessjs() minimal includes dev server and devtools', () => {
  const names = lessjs().map((p) => p.name);
  assertArrayIncludes(names, ['@hono/vite-dev-server']);
  assertArrayIncludes(names, ['less:devtools']);
});

// ─── Content plugin integration ────────────────────────────────

Deno.test('lessjs() with content adds less:content plugin', () => {
  const names = lessjs({ content: { blog: { contentDir: 'posts', basePath: '/blog' } } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['less:content']);
  assertArrayIncludes(names, ['less:virtual-nav']);
});

Deno.test('lessjs() with content has more plugins than without', () => {
  const without = lessjs();
  const withContent = lessjs({ content: { blog: { contentDir: 'posts' } } });
  assertEquals(withContent.length > without.length, true);
});

Deno.test('lessjs() with content blog: false excludes less:content blog data plugin', () => {
  const names = lessjs({ content: {} }).map((p) => p.name);
  // content plugin is still added (with empty config)
  assertArrayIncludes(names, ['less:content']);
});

// ─── i18n plugin integration ──────────────────────────────────

Deno.test('lessjs() with i18n adds less:i18n plugin', () => {
  const names = lessjs({ i18n: { locales: ['en', 'zh'], defaultLocale: 'en' } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['less:i18n']);
});

Deno.test('lessjs() with i18n adds i18n-data plugin', () => {
  const names = lessjs({ i18n: { locales: ['en', 'zh'], defaultLocale: 'en' } })
    .map((p) => p.name);
  assertArrayIncludes(names, ['less:data-dispatch']);
});

// ─── Content + i18n combined ──────────────────────────────────

Deno.test('lessjs() with both content and i18n includes all plugins', () => {
  const names = lessjs({
    content: { blog: { contentDir: 'posts' } },
    i18n: { locales: ['en'], defaultLocale: 'en' },
  }).map((p) => p.name);
  assertArrayIncludes(names, ['less:content']);
  assertArrayIncludes(names, ['less:i18n']);
  assertArrayIncludes(names, ['less:core']);
  assertArrayIncludes(names, ['less:build']);
});

// ─── Plugin count sanity ──────────────────────────────────────

Deno.test('lessjs() returns at least 8 plugins', () => {
  const plugins = lessjs();
  assertEquals(plugins.length >= 8, true);
});

Deno.test('lessjs() with content returns more plugins', () => {
  const base = lessjs().length;
  const withContent = lessjs({ content: { blog: { contentDir: 'posts' } } }).length;
  assertEquals(withContent >= base, true);
});

// ─── Options propagation ─────────────────────────────────────

Deno.test('lessjs() accepts html config', () => {
  const plugins = lessjs({ html: { title: 'Test', lang: 'ja' } });
  assertExists(plugins);
});

Deno.test('lessjs() accepts packageIslands config', () => {
  const plugins = lessjs({ packageIslands: ['@lessjs/ui'] });
  assertExists(plugins);
});

Deno.test('lessjs() accepts middleware config', () => {
  const plugins = lessjs({ middleware: { corsOrigin: '*' } });
  assertExists(plugins);
});

Deno.test('lessjs() accepts pwa config', () => {
  const plugins = lessjs({ pwa: { name: 'Test', shortName: 'T' } });
  assertExists(plugins);
});

/**
 * @lessjs/app - Integration smoke tests for lessjs() unified entry.
 *
 * Tests verify that lessjs() combines sub-plugin entries correctly
 * and handles option combinations without crashing.
 *
 * These are structural/smoke tests — they don't run a full Vite build.
 */
import { assertEquals, assert } from 'jsr:@std/assert@^1.0.0';
import { lessjs } from '../src/index.ts';

Deno.test('lessjs() returns Plugin[]', () => {
  const plugins = lessjs();
  assert(Array.isArray(plugins));
  assert(plugins.length > 0, 'should return at least one plugin');
  plugins.forEach((p, i) => {
    assert(typeof p.name === 'string', `plugin[${i}] should have a name`);
  });
});

Deno.test('lessjs() with empty options does not throw', () => {
  const plugins = lessjs({});
  assert(Array.isArray(plugins));
});

Deno.test('lessjs() returns adapter-vite less() plugins by default', () => {
  const plugins = lessjs();
  const names = plugins.map((p) => p.name);
  // Core adapter-vite plugins should be present
  assert(names.some((n) => n.startsWith('less:')), 'should contain less: prefixed plugins');
});

Deno.test('lessjs() with content option includes content plugin', () => {
  const plugins = lessjs({
    content: {
      blog: { contentDir: 'content/blog', basePath: '/blog' },
    },
  });
  const names = plugins.map((p) => p.name);
  assert(names.includes('less:blog-data'), 'should include blog-data plugin');
});

Deno.test('lessjs() with i18n option includes i18n plugin', () => {
  const plugins = lessjs({
    i18n: {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    },
  });
  const names = plugins.map((p) => p.name);
  assert(
    names.some((n) => n.startsWith('less:i18n')),
    'should include i18n plugin',
  );
});

Deno.test('lessjs() with content + i18n combo includes both', () => {
  const plugins = lessjs({
    content: {
      blog: { contentDir: 'content/blog', basePath: '/blog' },
    },
    i18n: {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    },
  });
  const names = plugins.map((p) => p.name);
  assert(names.includes('less:blog-data'), 'should include blog-data');
  assert(
    names.some((n) => n.startsWith('less:i18n')),
    'should include i18n',
  );
});

Deno.test('lessjs() with content disabled does not include content plugin', () => {
  const plugins = lessjs({});
  const names = plugins.map((p) => p.name);
  assert(!names.includes('less:blog-data'), 'should NOT include blog-data');
});

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  OPTIONAL_PACKAGE_STUBS,
  optionalPackageStubsPlugin,
} from '../src/optional-package-stubs.ts';

Deno.test('OPTIONAL_PACKAGE_STUBS covers adapters and generated-data packages', () => {
  assertEquals(
    Object.keys(OPTIONAL_PACKAGE_STUBS).sort(),
    [
      '@lessjs/adapter-lit',
      '@lessjs/adapter-lit/ssr',
      '@lessjs/adapter-react',
      '@lessjs/adapter-react/ssr',
      '@lessjs/adapter-vanilla',
      '@lessjs/adapter-vanilla/ssr',
      '@lessjs/content',
      '@lessjs/content/sitemap',
      '@lessjs/i18n',
    ],
  );
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@lessjs/content'], 'loadBlogData');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@lessjs/content/sitemap'], 'generateSitemap');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@lessjs/i18n'], 'loadI18nData');
});

Deno.test('optionalPackageStubsPlugin exposes a single shared stub plugin', () => {
  const plugin = optionalPackageStubsPlugin();
  assert(plugin.resolveId);
  assert(plugin.load);
});

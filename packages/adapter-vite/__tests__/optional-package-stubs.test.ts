import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  OPTIONAL_PACKAGE_STUBS,
  optionalPackageStubsPlugin,
} from '../src/optional-package-stubs.ts';

Deno.test('OPTIONAL_PACKAGE_STUBS covers retained optional generated-data packages', () => {
  assertEquals(
    Object.keys(OPTIONAL_PACKAGE_STUBS).sort(),
    [
      '@openelement/app/i18n',
      '@openelement/content',
      '@openelement/content/sitemap',
    ],
  );
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/content'], 'loadBlogData');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/content/sitemap'], 'generateSitemap');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/app/i18n'], 'loadI18nData');
});

Deno.test('optionalPackageStubsPlugin exposes a single shared stub plugin', () => {
  const plugin = optionalPackageStubsPlugin();
  assert(plugin.resolveId);
  assert(plugin.load);
});

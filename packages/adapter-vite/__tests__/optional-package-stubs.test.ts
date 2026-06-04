import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  OPTIONAL_PACKAGE_STUBS,
  optionalPackageStubsPlugin,
} from '../src/optional-package-stubs.ts';

Deno.test('OPTIONAL_PACKAGE_STUBS covers adapters and generated-data packages', () => {
  assertEquals(
    Object.keys(OPTIONAL_PACKAGE_STUBS).sort(),
    [
      '@openelement/adapter-lit',
      '@openelement/adapter-lit/ssr',
      '@openelement/adapter-react',
      '@openelement/adapter-react/ssr',
      '@openelement/adapter-vanilla',
      '@openelement/adapter-vanilla/ssr',
      '@openelement/content',
      '@openelement/content/sitemap',
      '@openelement/i18n',
    ],
  );
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/content'], 'loadBlogData');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/content/sitemap'], 'generateSitemap');
  assertStringIncludes(OPTIONAL_PACKAGE_STUBS['@openelement/i18n'], 'loadI18nData');
});

Deno.test('optionalPackageStubsPlugin exposes a single shared stub plugin', () => {
  const plugin = optionalPackageStubsPlugin();
  assert(plugin.resolveId);
  assert(plugin.load);
});

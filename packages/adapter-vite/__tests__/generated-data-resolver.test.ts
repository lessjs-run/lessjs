import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import {
  createGeneratedDataResolverPlugin,
  GENERATED_BLOG_DATA_ID,
  GENERATED_I18N_ID,
  GENERATED_NAV_ID,
  generatedDataPath,
} from '../src/generated-data-resolver.ts';

Deno.test('generatedDataPath maps generated namespace to app data files', () => {
  const normalized = (path: string | null) => path?.replaceAll('\\', '/');

  assert(
    normalized(generatedDataPath('/site', GENERATED_NAV_ID))?.endsWith(
      '/site/app/data/_generated-nav.ts',
    ),
  );
  assert(
    normalized(generatedDataPath('/site', GENERATED_BLOG_DATA_ID))?.endsWith(
      '/site/app/data/_generated-blog-data.ts',
    ),
  );
  assert(
    normalized(generatedDataPath('/site', GENERATED_I18N_ID))?.endsWith(
      '/site/app/data/_generated-i18n-data.ts',
    ),
  );
});

Deno.test('generated data resolver resolves only @lessjs/generated namespace', () => {
  const plugin = createGeneratedDataResolverPlugin({ root: '/site' });
  const resolveId = plugin.resolveId as (id: string) => string | null;

  assertEquals(resolveId(GENERATED_NAV_ID), '\0less:generated-data:@lessjs/generated/nav');
  assertEquals(resolveId('@lessjs/content/' + 'nav'), null);
  assertEquals(resolveId('virtual:less-' + 'nav'), null);
});

Deno.test('generated data resolver provides fallback modules before first generation', () => {
  const plugin = createGeneratedDataResolverPlugin({ root: '/missing-site' });
  const load = plugin.load as (id: string) => string | null;

  assertStringIncludes(
    load('\0less:generated-data:@lessjs/generated/i18n') ?? '',
    'getDefaultLocale',
  );
});

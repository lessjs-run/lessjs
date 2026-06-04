/**
 * @openelement/i18n - Unit Tests
 * ADR 0018: Tests updated for pure function pattern (loadI18nData)
 */
import { assertEquals, assertStrictEquals } from 'jsr:@std/assert@^1.0.0';
import { loadI18nData } from '../src/i18n-data.ts';
import { i18nStaticPaths, normalizeLocalePath, switchLocale } from '../src/routes.ts';

// ─── i18n-data.ts ────────────────────────────────────────────────

Deno.test('loadI18nData: returns options copy', () => {
  const opts = { locales: ['en', 'zh'], defaultLocale: 'en' };
  const result = loadI18nData(opts);
  assertEquals(result.locales, ['en', 'zh']);
  assertStrictEquals(result.defaultLocale, 'en');
});

Deno.test('loadI18nData: returns independent copy', () => {
  const opts = { locales: ['en', 'zh'], defaultLocale: 'en' };
  const result = loadI18nData(opts);
  // Mutating the result should not affect the original
  result.locales.push('ja');
  assertEquals(opts.locales, ['en', 'zh']);
});

// ─── routes.ts - i18nStaticPaths ─────────────────────────────────

Deno.test('i18nStaticPaths: generates paths from locale list', () => {
  const paths = i18nStaticPaths(['en', 'zh']);
  assertEquals(paths, [{ locale: 'en' }, { locale: 'zh' }]);
});

Deno.test('i18nStaticPaths: accepts explicit locale list', () => {
  const paths = i18nStaticPaths(['fr', 'de', 'ja']);
  assertEquals(paths, [{ locale: 'fr' }, { locale: 'de' }, { locale: 'ja' }]);
});

Deno.test('i18nStaticPaths: returns empty array for empty locales', () => {
  const paths = i18nStaticPaths([]);
  assertEquals(paths, []);
});

// ─── routes.ts - switchLocale ────────────────────────────────────

Deno.test('switchLocale: switches from en to zh', () => {
  const result = switchLocale('/en/guide/architecture', 'zh', ['en', 'zh']);
  assertEquals(result, '/zh/guide/architecture');
});

Deno.test('switchLocale: switches from zh to en', () => {
  const result = switchLocale('/zh/guide/architecture', 'en', ['en', 'zh']);
  assertEquals(result, '/en/guide/architecture');
});

Deno.test('switchLocale: adds locale prefix to un-prefixed path', () => {
  const result = switchLocale('/guide/overview', 'zh', ['en', 'zh']);
  assertEquals(result, '/zh/guide/overview');
});

Deno.test('switchLocale: handles root path with locale prefix', () => {
  const result = switchLocale('/en', 'zh', ['en', 'zh']);
  assertEquals(result, '/zh/');
});

Deno.test('switchLocale: handles root path without locale prefix', () => {
  const result = switchLocale('/', 'en', ['en', 'zh']);
  assertEquals(result, '/en/');
});

Deno.test('switchLocale: handles trailing slash locale prefix', () => {
  const result = switchLocale('/en/', 'zh', ['en', 'zh']);
  assertEquals(result, '/zh/');
});

Deno.test('switchLocale: handles 3+ locales', () => {
  const result = switchLocale('/ja/guide/intro', 'ko', ['en', 'zh', 'ja', 'ko']);
  assertEquals(result, '/ko/guide/intro');
});

Deno.test('normalizeLocalePath: only configured locales are parsed as locale', () => {
  assertEquals(
    normalizeLocalePath('/guide/getting-started', {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    }),
    {
      locale: 'en',
      path: '/guide/getting-started',
      localizedPath: '/guide/getting-started',
      isDefaultLocalePath: true,
    },
  );
});

Deno.test('normalizeLocalePath: localized path keeps configured prefix', () => {
  assertEquals(
    normalizeLocalePath('/zh/guide/getting-started', {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    }),
    {
      locale: 'zh',
      path: '/guide/getting-started',
      localizedPath: '/zh/guide/getting-started',
      isDefaultLocalePath: false,
    },
  );
});

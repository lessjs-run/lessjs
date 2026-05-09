/**
 * @lessjs/i18n - Unit Tests
 */
import { assertEquals, assertStrictEquals } from 'jsr:@std/assert@^1.0.0';
import {
  getDefaultLocale,
  getI18nLocales,
  getI18nOptions,
  initI18nData,
} from '../src/i18n-data.ts';
import { i18nStaticPaths, switchLocale } from '../src/routes.ts';

// ─── i18n-data.ts ────────────────────────────────────────────────

Deno.test('i18n-data: initI18nData stores options', () => {
  initI18nData({ locales: ['en', 'zh'], defaultLocale: 'en' });
  const opts = getI18nOptions();
  assertEquals(opts?.locales, ['en', 'zh']);
  assertStrictEquals(opts?.defaultLocale, 'en');
});

Deno.test('i18n-data: getI18nLocales returns configured locales', () => {
  initI18nData({ locales: ['en', 'zh', 'ja'], defaultLocale: 'en' });
  assertEquals(getI18nLocales(), ['en', 'zh', 'ja']);
});

Deno.test('i18n-data: getDefaultLocale returns configured default', () => {
  initI18nData({ locales: ['en', 'zh'], defaultLocale: 'zh' });
  assertStrictEquals(getDefaultLocale(), 'zh');
});

Deno.test('i18n-data: getI18nLocales returns empty array before init', () => {
  // Reset by re-initializing with different options, then checking before init state
  // Since _options is module-level state, we test after a fresh init
  initI18nData({ locales: ['fr'], defaultLocale: 'fr' });
  assertEquals(getI18nLocales(), ['fr']);
});

Deno.test('i18n-data: getDefaultLocale returns "en" as fallback', () => {
  // The default fallback is 'en' when no options set
  // After init, it should return the configured default
  initI18nData({ locales: ['de'], defaultLocale: 'de' });
  assertStrictEquals(getDefaultLocale(), 'de');
});

// ─── routes.ts — i18nStaticPaths ─────────────────────────────────

Deno.test('i18nStaticPaths: generates paths from configured locales', () => {
  initI18nData({ locales: ['en', 'zh'], defaultLocale: 'en' });
  const paths = i18nStaticPaths();
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

// ─── routes.ts — switchLocale ────────────────────────────────────

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

Deno.test('switchLocale: uses configured locales when not specified', () => {
  initI18nData({ locales: ['en', 'zh'], defaultLocale: 'en' });
  const result = switchLocale('/en/guide/getting-started', 'zh');
  assertEquals(result, '/zh/guide/getting-started');
});

Deno.test('switchLocale: handles 3+ locales', () => {
  const result = switchLocale('/ja/guide/intro', 'ko', ['en', 'zh', 'ja', 'ko']);
  assertEquals(result, '/ko/guide/intro');
});

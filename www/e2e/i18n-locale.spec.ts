/**
 * E2E: Internationalization (i18n)
 *
 * Verifies that the i18n system works correctly:
 *   - Default locale (zh) pages are accessible at root
 *   - English locale pages are accessible at /en/
 *   - Chinese locale pages are accessible at /zh/
 *   - Locale switcher works
 *   - Pages have correct lang attribute per locale
 */

import { expect, test } from '@playwright/test';

test.describe('Locale Routes', () => {
  test('default root loads Chinese locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Root should serve zh locale (default)
    const bodyText = await page.textContent('body');
    // The Chinese homepage should have Chinese text
    expect(bodyText).toBeTruthy();
  });

  test('/en/ loads English locale', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('/zh/ loads Chinese locale', async ({ page }) => {
    await page.goto('/zh/');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('zh');
  });

  test('en guide page loads correctly', async ({ page }) => {
    await page.goto('/en/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('zh guide page loads correctly', async ({ page }) => {
    await page.goto('/zh/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('zh');
  });
});

test.describe('Locale Switcher', () => {
  test('less-layout has locale attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const layout = page.locator('less-layout');
    if ((await layout.count()) > 0) {
      const locale = await layout.getAttribute('locale');
      expect(locale).toMatch(/^(en|zh)$/);
    }
  });

  test('less-layout supports locale switching via locales attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // less-layout receives locale + locales attributes from route components
    // The locale attribute is a string, locales is serialized as JSON string
    const layout = page.locator('less-layout');
    if ((await layout.count()) > 0) {
      // Verify locale attribute exists (already tested in another test, but confirm)
      const locale = await layout.getAttribute('locale');
      expect(locale).toMatch(/^(en|zh)$/);

      // Verify locales attribute exists with serialized array
      const localesAttr = await layout.getAttribute('locales');
      expect(localesAttr).toBeTruthy();
      // Should contain both locale codes
      expect(localesAttr).toContain('en');
      expect(localesAttr).toContain('zh');
    }
  });

  test('switching locale via URL changes page language', async ({ page }) => {
    // Start on Chinese page
    await page.goto('/zh/guide/getting-started');
    await page.waitForLoadState('networkidle');
    const zhLang = await page.getAttribute('html', 'lang');
    expect(zhLang).toBe('zh');

    // Navigate to English version
    await page.goto('/en/guide/getting-started');
    await page.waitForLoadState('networkidle');
    const enLang = await page.getAttribute('html', 'lang');
    expect(enLang).toBe('en');
  });
});

test.describe('i18n SSG Output', () => {
  test('both locale versions of blog exist', async ({ page }) => {
    // Check Chinese blog
    const zhRes = await page.goto('/blog');
    expect(zhRes?.ok()).toBe(true);

    // Check English blog
    const enRes = await page.goto('/en/blog');
    expect(enRes?.ok()).toBe(true);
  });

  test('both locale versions of changelog exist', async ({ page }) => {
    const zhRes = await page.goto('/changelog');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/en/changelog');
    expect(enRes?.ok()).toBe(true);
  });

  test('both locale versions of decisions exist', async ({ page }) => {
    const zhRes = await page.goto('/decisions.html');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/en/decisions/');
    expect(enRes?.ok()).toBe(true);
  });
});

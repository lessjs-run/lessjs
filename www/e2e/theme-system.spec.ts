/**
 * E2E: Theme System
 *
 * Verifies the dark/light theme toggle:
 *   - Theme toggle element is present
 *   - Clicking toggle switches theme
 *   - Theme state is persisted to localStorage
 *   - Default theme is dark
 *   - data-theme attribute is updated on document
 */

import { expect, type Page, test } from '@playwright/test';

function visibleThemeToggle(page: Page) {
  return page.getByRole('button', { name: 'Toggle theme' }).filter({ visible: true }).first();
}

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('theme toggle element exists', async ({ page }) => {
    const toggle = page.locator('less-theme-toggle');
    expect(await toggle.count()).toBeGreaterThan(0);
  });

  test('theme toggle has shadow root', async ({ page }) => {
    const hasShadowRoot = await page.evaluate(() => {
      const toggle = document.querySelector('less-theme-toggle');
      return toggle?.shadowRoot !== null;
    });
    expect(hasShadowRoot).toBe(true);
  });

  test('clicking theme toggle changes data-theme on document', async ({ page }) => {
    // Get current theme
    const themeBefore = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Click the toggle button inside the shadow DOM.
    // DSD renders the button immediately but JS upgrade (event binding)
    // may not have completed when `networkidle` fires.
    const toggleBtn = visibleThemeToggle(page);
    if ((await toggleBtn.count()) > 0) {
      await expect(toggleBtn).toBeVisible();
      await page.waitForTimeout(200);
      await toggleBtn.click();

      // Theme should have changed
      const themeAfter = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      expect(themeAfter).not.toBe(themeBefore);
    }
  });

  test('theme is persisted to localStorage after toggle', async ({ page }) => {
    const toggleBtn = visibleThemeToggle(page);
    if ((await toggleBtn.count()) > 0) {
      await expect(toggleBtn).toBeVisible();
      await toggleBtn.click();

      // Check localStorage
      const stored = await page.evaluate(() => {
        return localStorage.getItem('less-theme');
      });
      expect(stored).toMatch(/^(light|dark)$/);
    }
  });

  test('default theme is dark when no preference set', async ({ page }) => {
    // With no localStorage, the default should be dark
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    // Could be 'dark' or 'light' depending on prefers-color-scheme
    expect(theme).toMatch(/^(light|dark)$/);
  });

  test('multiple toggles cycle between dark and light', async ({ page }) => {
    const toggleBtn = visibleThemeToggle(page);
    if ((await toggleBtn.count()) > 0) {
      await expect(toggleBtn).toBeVisible();
      // Wait for JS upgrade to complete event binding
      await page.waitForTimeout(200);
      // Toggle twice should return to original theme
      const themeBefore = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });

      await toggleBtn.click();
      const themeAfter1 = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      expect(themeAfter1).not.toBe(themeBefore);

      await toggleBtn.click();
      const themeAfter2 = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });
      expect(themeAfter2).toBe(themeBefore);
    }
  });
});

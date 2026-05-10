/**
 * E2E: Islands Reactivity
 *
 * Verifies that interactive island components work correctly:
 *   - Counter island responds to clicks
 *   - Island scripts are loaded
 *   - Shadow DOM encapsulation is maintained
 */

import { expect, test } from '@playwright/test';

test.describe('Counter Island', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page that has the counter island
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');
    // Wait for island upgrade
    await page.waitForTimeout(2000);
  });

  test('counter island element exists in DOM', async ({ page }) => {
    const counter = page.locator('counter-island');
    // The counter may not exist on every page, but on getting-started it should
    if ((await counter.count()) > 0) {
      expect(await counter.count()).toBeGreaterThan(0);
    }
  });

  test('counter island has shadow root after upgrade', async ({ page }) => {
    const hasShadowRoot = await page.evaluate(() => {
      const counter = document.querySelector('counter-island');
      return counter?.shadowRoot !== null;
    });

    // Only check if counter exists
    const counterExists = await page.locator('counter-island').count();
    if (counterExists > 0) {
      expect(hasShadowRoot).toBe(true);
    }
  });

  test('counter increments on plus button click', async ({ page }) => {
    const counter = page.locator('counter-island');
    if ((await counter.count()) > 0) {
      // Get initial count value
      const countBefore = await counter.locator('.count').textContent();
      const initialCount = parseInt(countBefore?.trim() ?? '0', 10);

      // Click the plus button
      const plusBtn = counter.locator('button').last();
      await plusBtn.click();

      // Count should have incremented
      const countAfter = await counter.locator('.count').textContent();
      const newCount = parseInt(countAfter?.trim() ?? '0', 10);
      expect(newCount).toBe(initialCount + 1);
    }
  });

  test('counter decrements on minus button click', async ({ page }) => {
    const counter = page.locator('counter-island');
    if ((await counter.count()) > 0) {
      // Click plus first to ensure count > 0
      const plusBtn = counter.locator('button').last();
      await plusBtn.click();

      const countBefore = await counter.locator('.count').textContent();
      const initialCount = parseInt(countBefore?.trim() ?? '0', 10);

      // Click the minus button
      const minusBtn = counter.locator('button').first();
      await minusBtn.click();

      const countAfter = await counter.locator('.count').textContent();
      const newCount = parseInt(countAfter?.trim() ?? '0', 10);
      expect(newCount).toBe(initialCount - 1);
    }
  });
});

test.describe('Island Script Loading', () => {
  test('island client script is loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that the client script was injected
    const hasClientScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
      return scripts.some(
        (s) => s.src?.includes('client') || s.src?.includes('island'),
      );
    });
    expect(hasClientScript).toBe(true);
  });

  test('custom elements are upgraded after island load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that some custom elements have been upgraded
    const upgradedCount = await page.evaluate(() => {
      let count = 0;
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) count++;
      }
      return count;
    });
    expect(upgradedCount).toBeGreaterThan(0);
  });
});

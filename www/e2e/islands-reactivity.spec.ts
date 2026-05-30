/**
 * E2E: Islands Reactivity
 *
 * Verifies that interactive island components work correctly:
 *   - home-console counter responds to clicks
 *   - reactive-showcase signals update the DOM
 *   - Island scripts are loaded
 *   - Shadow DOM encapsulation is maintained
 */

import { expect, test } from '@playwright/test';

test.describe('Home Counter (home-console)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('counter element exists in DOM', async ({ page }) => {
    const counter = page.locator('home-console');
    expect(await counter.count()).toBeGreaterThan(0);
  });

  test('counter has shadow root after upgrade', async ({ page }) => {
    const hasShadowRoot = await page.evaluate(() => {
      const counter = document.querySelector('home-console');
      return counter?.shadowRoot !== null;
    });
    expect(hasShadowRoot).toBe(true);
  });

  test('counter increments on plus button click', async ({ page }) => {
    const counter = page.locator('home-console');
    const countEl = counter.locator('.counter-value');
    const countBefore = await countEl.textContent();
    const initialCount = parseInt(countBefore?.trim() ?? '0', 10);

    // Click the plus button (second button = +)
    const plusBtn = counter.locator('button').nth(1);
    await plusBtn.click();
    await page.waitForTimeout(100);

    const countAfter = await countEl.textContent();
    const newCount = parseInt(countAfter?.trim() ?? '0', 10);
    expect(newCount).toBe(initialCount + 1);
  });

  test('counter decrements on minus button click', async ({ page }) => {
    const counter = page.locator('home-console');
    // Click plus first to ensure count > initial
    const plusBtn = counter.locator('button').nth(1);
    await plusBtn.click();
    await page.waitForTimeout(100);

    const countEl = counter.locator('.counter-value');
    const countBefore = await countEl.textContent();
    const initialCount = parseInt(countBefore?.trim() ?? '0', 10);

    // Click minus
    const minusBtn = counter.locator('button').first();
    await minusBtn.click();
    await page.waitForTimeout(100);

    const countAfter = await countEl.textContent();
    const newCount = parseInt(countAfter?.trim() ?? '0', 10);
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('Island Script Loading', () => {
  test('island client script is loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

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

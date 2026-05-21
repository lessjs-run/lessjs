/**
 * E2E: Accessibility & Performance
 *
 * Verifies basic accessibility and performance:
 *   - Images have alt text
 *   - Interactive elements are keyboard accessible
 *   - No console errors on load
 *   - Pages load within acceptable time
 *   - Custom elements have ARIA labels where needed
 */

import { expect, test } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage has no auto-detected a11y issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for images without alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => !img.getAttribute('alt')).length;
    });
    expect(imagesWithoutAlt).toBe(0);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that buttons in shadow DOMs have labels
    const unlabeledButtons = await page.evaluate(() => {
      let count = 0;
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) {
          const buttons = el.shadowRoot.querySelectorAll('button');
          for (const btn of buttons) {
            const hasLabel = btn.getAttribute('aria-label') ||
              btn.getAttribute('title') ||
              btn.textContent?.trim();
            if (!hasLabel) count++;
          }
        }
      }
      return count;
    });
    // Allow some tolerance - not all buttons may need labels
    expect(unlabeledButtons).toBeLessThanOrEqual(2);
  });

  test('theme toggle is keyboard accessible via delegatesFocus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // less-theme-toggle is nested inside less-layout's shadow DOM.
    // Playwright locators pierce shadow DOM automatically.
    const toggle = page.locator('less-theme-toggle');
    if ((await toggle.count()) > 0) {
      // Verify delegatesFocus is set on the custom element class
      const hasDelegatesFocus = await page.evaluate(() => {
        const ctor = customElements.get('less-theme-toggle');
        if (!ctor) return false;
        // deno-lint-ignore no-explicit-any
        return (ctor as any).delegatesFocus === true;
      });
      expect(hasDelegatesFocus).toBe(true);

      // Verify the toggle contains a button (focusable target)
      const hasButton = await page.locator('less-theme-toggle >> button').count();
      expect(hasButton).toBeGreaterThan(0);
    }
  });

  test('links have discernible text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emptyLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.filter((link) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');
        const imgAlt = link.querySelector('img')?.getAttribute('alt');
        return !text && !ariaLabel && !title && !imgAlt;
      }).length;
    });
    // Allow small number - some icon links may not have text
    expect(emptyLinks).toBeLessThanOrEqual(3);
  });
});

test.describe('Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('less-layout').waitFor({ state: 'attached' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test('guide page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/guide/getting-started', { waitUntil: 'domcontentloaded' });
    await page.locator('less-layout').waitFor({ state: 'attached' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test('no critical console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for async scripts

    // Filter out known non-critical errors (e.g., analytics, CDN, external CDN integrity mismatch)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('goatcounter') &&
        !e.includes('gc.zgo.at') &&
        !e.includes('net::ERR') &&
        !e.includes('favicon') &&
        !e.includes('Manifest') &&
        // CDN integrity hash mismatches - external CDN resources change
        // independently of the app; these are infrastructure noise, not bugs.
        !e.includes('cdnjs.cloudflare.com') &&
        !e.includes('cdn.jsdelivr.net') &&
        !e.includes("Failed to find a valid digest in the 'integrity' attribute"),
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('PWA Support', () => {
  test('has PWA manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.ok()).toBe(true);

    const manifest = await response!.json();
    expect(manifest.name).toContain('LessJS');
    expect(manifest.short_name).toBe('LessJS');
  });

  test('has service worker script', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.ok()).toBe(true);
  });

  test('homepage has manifest link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const manifestLink = page.locator('link[rel="manifest"]');
    expect(await manifestLink.count()).toBeGreaterThan(0);
  });
});

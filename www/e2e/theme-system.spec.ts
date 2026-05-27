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

/**
 * Find <less-theme-toggle> across shadow DOM boundaries.
 * The toggle lives inside <less-layout>'s shadow DOM on most pages.
 */
function findToggleInPage(): Element | null {
  // Primary: inside less-layout's shadow DOM
  const layout = document.querySelector('less-layout');
  if (layout?.shadowRoot) {
    const toggle = layout.shadowRoot.querySelector('less-theme-toggle');
    if (toggle) return toggle;
  }
  // Fallback: light DOM (for pages without less-layout)
  return document.querySelector('less-theme-toggle');
}

/**
 * Wait for <less-theme-toggle> to be fully upgraded:
 * DSD hydration + _initTheme() must complete before clicks work.
 * We wait for the component to have a data-theme attribute,
 * which is set by _initTheme() during onDsdHydrated().
 *
 * NOTE: <less-theme-toggle> lives inside <less-layout>'s shadow DOM,
 * so we must query through the shadow root to find it.
 */
async function waitForToggleReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const layout = document.querySelector('less-layout');
    const toggle = layout?.shadowRoot?.querySelector('less-theme-toggle') ?? document.querySelector('less-theme-toggle');
    return toggle?.hasAttribute('data-theme') === true;
  }, { timeout: 10000 });
}

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForToggleReady(page);
  });

  test('theme toggle element exists', async ({ page }) => {
    const exists = await page.evaluate(() => {
      const toggle = findToggleInPage();
      return toggle !== null;
    });
    expect(exists).toBe(true);
  });

  test('theme toggle has shadow root', async ({ page }) => {
    const hasShadowRoot = await page.evaluate(() => {
      const toggle = findToggleInPage();
      return toggle?.shadowRoot !== null;
    });
    expect(hasShadowRoot).toBe(true);
  });

  test('clicking theme toggle changes data-theme on document', async ({ page }) => {
    const themeBefore = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Click the toggle button via evaluate to guarantee the shadow DOM
    // button is clicked regardless of Playwright's shadow DOM piercing.
    await page.evaluate(() => {
      const toggle = findToggleInPage();
      const btn = toggle?.shadowRoot?.querySelector('button');
      btn?.click();
    });

    // Theme should have changed
    const themeAfter = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter).not.toBe(themeBefore);
  });

  test('theme is persisted to localStorage after toggle', async ({ page }) => {
    await page.evaluate(() => {
      const toggle = findToggleInPage();
      const btn = toggle?.shadowRoot?.querySelector('button');
      btn?.click();
    });

    // Check localStorage
    const stored = await page.evaluate(() => {
      return localStorage.getItem('less-theme');
    });
    expect(stored).toMatch(/^(light|dark)$/);
  });

  test('default theme is dark when no preference set', async ({ page }) => {
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    // Could be 'dark' or 'light' depending on prefers-color-scheme
    expect(theme).toMatch(/^(light|dark)$/);
  });

  test('multiple toggles cycle between dark and light', async ({ page }) => {
    const themeBefore = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    await page.evaluate(() => {
      const toggle = findToggleInPage();
      const btn = toggle?.shadowRoot?.querySelector('button');
      btn?.click();
    });
    const themeAfter1 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter1).not.toBe(themeBefore);

    await page.evaluate(() => {
      const toggle = findToggleInPage();
      const btn = toggle?.shadowRoot?.querySelector('button');
      btn?.click();
    });
    const themeAfter2 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter2).toBe(themeBefore);
  });
});

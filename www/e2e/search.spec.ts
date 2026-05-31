import { expect, test } from '@playwright/test';

test.describe('Search', () => {
  test('generated search index has only live route paths', async ({ request }) => {
    const res = await request.get('/search-index.json');
    expect(res.ok()).toBe(true);
    const entries = await res.json() as Array<{ path: string }>;
    const stale = ['/guide/routing', '/guide/ssg', '/guide/dsd', '/guide/islands'];
    expect(entries.map((entry) => entry.path)).not.toEqual(expect.arrayContaining(stale));

    for (const entry of entries.slice(0, 20)) {
      const route = await request.get(entry.path);
      expect(route.status(), `${entry.path} should be generated`).toBeLessThan(400);
    }
  });

  test('search island returns a live routing result', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('less-search'));
    await page.keyboard.press('Control+K');
    await page.locator('less-search').evaluate((el) => {
      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement | null;
      input?.focus();
    });
    await page.keyboard.type('routing');
    await page.waitForTimeout(500);

    const href = await page.locator('less-search').evaluate((el) => {
      const link = el.shadowRoot?.querySelector('.result') as HTMLAnchorElement | null;
      return link?.getAttribute('href') ?? null;
    });
    expect(href).toBeTruthy();
    expect(href).not.toBe('/guide/routing');
    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
  });

  test('search overlay is anchored to viewport when opened from layout header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('less-search'));

    await page.locator('less-search').evaluate((el) => {
      const button = el.shadowRoot?.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    const overlay = await page.locator('less-search').evaluate((el) => {
      const node = el.shadowRoot?.querySelector('.overlay');
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        display: style.display,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        viewportWidth: window.innerWidth,
      };
    });

    expect(overlay).not.toBeNull();
    expect(overlay!.display).toBe('flex');
    expect(Math.abs(overlay!.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(overlay!.right - overlay!.viewportWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(overlay!.width - overlay!.viewportWidth)).toBeLessThanOrEqual(1);
  });
});

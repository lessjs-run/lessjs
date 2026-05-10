/**
 * E2E test helpers for LessJS docs site.
 *
 * Provides utilities for verifying DSD structure,
 * custom element rendering, and island script loading.
 */

import type { Locator, Page } from '@playwright/test';

/**
 * Check if an element has a DSD template with the expected shadowrootmode.
 */
export async function hasDsdTemplate(
  page: Page,
  selector: string,
  mode: 'open' | 'closed' = 'open',
): Promise<boolean> {
  const template = page.locator(`${selector} > template[shadowrootmode="${mode}"]`);
  return template.count().then((n) => n > 0);
}

/**
 * Get the shadow root content of a custom element via DSD.
 * Uses evaluate to read the template content from the DOM.
 */
export async function getDsdContent(
  page: Page,
  selector: string,
): Promise<string | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const template = el.querySelector('template[shadowrootmode]');
    return template?.innerHTML ?? null;
  }, selector);
}

/**
 * Wait for a custom element to be defined and upgraded.
 */
export async function waitForCustomElement(
  page: Page,
  tagName: string,
  timeout = 10_000,
): Promise<void> {
  await page.waitForFunction(
    (tag) => customElements.get(tag) !== undefined,
    tagName,
    { timeout },
  );
}

/**
 * Check if an island script was loaded (by looking for its module script tag).
 */
export async function isIslandScriptLoaded(
  page: Page,
  tagName: string,
): Promise<boolean> {
  return page.evaluate((tag) => {
    // Check if the custom element is defined (meaning its island module loaded)
    return customElements.get(tag) !== undefined;
  }, tagName);
}

/**
 * Collect all custom element tag names found in the page HTML.
 */
export async function getCustomElementTags(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const tags = new Set<string>();
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.tagName.includes('-')) {
        tags.add(el.tagName.toLowerCase());
      }
    }
    return [...tags];
  });
}

/**
 * Get the resolved theme ('light' | 'dark' | null) from document.documentElement.
 */
export async function getDocumentTheme(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme');
  });
}

/**
 * Get all meta tag content by name or property.
 */
export async function getMetaContent(
  page: Page,
  attr: 'name' | 'property',
  value: string,
): Promise<string | null> {
  return page.evaluate(
    ({ attr, value }) => {
      const meta = document.querySelector(`meta[${attr}="${value}"]`);
      return meta?.getAttribute('content') ?? null;
    },
    { attr, value },
  );
}

/**
 * Count shadow roots in the page (all custom elements with shadow DOM).
 */
export async function countShadowRoots(page: Page): Promise<number> {
  return page.evaluate(() => {
    let count = 0;
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.shadowRoot) count++;
    }
    return count;
  });
}

/**
 * Re-export common assertions for convenience.
 */
export { expect } from '@playwright/test';

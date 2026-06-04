/**
 * @openelement/adapter-vanilla - DSD hydration tests
 *
 * These tests verify the Mixin pattern and DsdVanillaElement API.
 * DSD hydration behavior requires a real DOM environment (browser)
 * for full integration testing.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { WithDsdHydration } from '../src/dsd-hydration.ts';
import type { DsdHydrationMixin } from '../src/dsd-hydration.ts';

/**
 * Test helper: create a minimal "HTMLElement-like" class for testing
 * the WithDsdHydration mixin without a real DOM environment.
 */
function createMockElementClass(): typeof HTMLElement {
  return class MockHTMLElement {
    shadowRoot: { childElementCount: number; querySelectorAll: (sel: string) => Element[] } | null =
      null;
    static hydrateEvents?: unknown[];
    _dsdHydrated = false;
    _hydrateEvents() {}
    connectedCallback() {}
    disconnectedCallback() {}
    attachShadow(_opts: { mode: string }) {
      this.shadowRoot = { childElementCount: 0, querySelectorAll: () => [] };
      return this.shadowRoot;
    }
  } as unknown as typeof HTMLElement;
}

Deno.test('WithDsdHydration mixin adds _dsdHydrated property', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  const instance = new Mixed() as unknown as DsdHydrationMixin;
  assertEquals(instance._dsdHydrated, false);
});

Deno.test('WithDsdHydration mixin adds _hydrateEvents method', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  const instance = new Mixed() as unknown as DsdHydrationMixin;
  assertEquals(typeof instance._hydrateEvents, 'function');
});

Deno.test('WithDsdHydration mixin adds lifecycle methods', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  const instance = new Mixed() as unknown as DsdHydrationMixin;
  assertEquals(typeof instance.connectedCallback, 'function');
  assertEquals(typeof instance.disconnectedCallback, 'function');
  assertEquals(typeof instance.createRenderRoot, 'function');
});

Deno.test('WithDsdHydration preserves base class methods', () => {
  class MockWithMethod extends createMockElementClass() {
    customMethod(): string {
      return 'base';
    }
  }
  const Mixed = WithDsdHydration(MockWithMethod);
  const instance = new Mixed() as unknown as DsdHydrationMixin & { customMethod: () => string };
  assertEquals(instance.customMethod(), 'base');
  assertEquals(instance._dsdHydrated, false);
});

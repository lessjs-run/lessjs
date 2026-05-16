/**
 * @lessjs/adapter-react - DSD hydration tests
 *
 * These tests verify the Mixin pattern and DsdReactElement API.
 * DSD hydration behavior requires a real DOM environment (browser)
 * for full integration testing.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
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

Deno.test('WithDsdHydration mixin adds getReactElement method', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  const instance = new Mixed() as unknown as DsdHydrationMixin & { getReactElement: () => unknown };
  assertEquals(typeof instance.getReactElement, 'function');
  assertEquals(instance.getReactElement(), null);
});

Deno.test('WithDsdHydration mixin adds lifecycle methods', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  const instance = new Mixed() as unknown as DsdHydrationMixin;
  assertEquals(typeof instance.connectedCallback, 'function');
  assertEquals(typeof instance.disconnectedCallback, 'function');
  assertEquals(typeof instance.createRenderRoot, 'function');
});

Deno.test('WithDsdHydration subclass can override getReactElement', () => {
  const MockElement = createMockElementClass();
  const Mixed = WithDsdHydration(MockElement);
  class MyElement extends Mixed {
    override getReactElement() {
      return { $$typeof: Symbol.for('react.element'), type: 'div', props: {} };
    }
  }
  const instance = new MyElement() as unknown as { getReactElement: () => unknown };
  const element = instance.getReactElement();
  assertExists(element);
  assertEquals((element as Record<string, unknown>).$$typeof, Symbol.for('react.element'));
});

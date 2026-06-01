/**
 * @lessjs/adapter-vanilla - SSR tests
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import {
  extractVanillaStyles,
  installVanillaAdapter,
  uninstallVanillaAdapter,
} from '../src/ssr.ts';
import { getDefaultRegistry } from '@lessjs/core';

Deno.test('installVanillaAdapter registers vanilla adapter', () => {
  installVanillaAdapter();
  const adapter = getDefaultRegistry().get('vanilla');
  assertExists(adapter);
  assertEquals(adapter.name, 'vanilla');
  // Clean up
  uninstallVanillaAdapter();
});

Deno.test('installVanillaAdapter is idempotent', () => {
  installVanillaAdapter();
  installVanillaAdapter(); // second call should be no-op
  const adapter = getDefaultRegistry().get('vanilla');
  assertExists(adapter);
  assertEquals(adapter.name, 'vanilla');
  uninstallVanillaAdapter();
});

Deno.test('uninstallVanillaAdapter removes the adapter', () => {
  installVanillaAdapter();
  uninstallVanillaAdapter();
  // After uninstall, the default registry returns no adapter.
  const adapter = getDefaultRegistry().get();
  assertEquals(adapter, undefined);
});

Deno.test('vanilla adapter isTemplate returns false for strings', () => {
  installVanillaAdapter();
  const adapter = getDefaultRegistry().get('vanilla');
  assertExists(adapter);
  assertEquals(adapter.isTemplate?.('hello'), false);
  assertEquals(adapter.isTemplate?.(42), false);
  assertEquals(adapter.isTemplate?.(null), false);
  uninstallVanillaAdapter();
});

Deno.test('vanilla adapter render converts to string', async () => {
  installVanillaAdapter();
  const adapter = getDefaultRegistry().get('vanilla');
  assertExists(adapter);
  const result = await adapter.render?.('hello world', 'test-element');
  assertEquals(result, 'hello world');
  uninstallVanillaAdapter();
});

Deno.test('extractVanillaStyles from string styles', () => {
  class TestComponent {
    static styles = ':host { display: block; }';
  }
  const result = extractVanillaStyles(TestComponent as unknown as CustomElementConstructor);
  assertEquals(result, ':host { display: block; }');
});

Deno.test('extractVanillaStyles from array styles', () => {
  class TestComponent {
    static styles = [':host { display: block; }', '.inner { color: red; }'];
  }
  const result = extractVanillaStyles(TestComponent as unknown as CustomElementConstructor);
  assertEquals(result, ':host { display: block; }\n.inner { color: red; }');
});

Deno.test('extractVanillaStyles returns undefined for no styles', () => {
  class TestComponent {}
  const result = extractVanillaStyles(TestComponent as unknown as CustomElementConstructor);
  assertEquals(result, undefined);
});

Deno.test('extractVanillaStyles filters non-string array entries', () => {
  class TestComponent {
    static styles = ['valid css', 42, null, 'more css'];
  }
  const result = extractVanillaStyles(TestComponent as unknown as CustomElementConstructor);
  assertEquals(result, 'valid css\nmore css');
});

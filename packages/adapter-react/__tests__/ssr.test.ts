/**
 * @lessjs/adapter-react - SSR tests
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import {
  installReactAdapter,
  isReactElement,
  renderReactToString,
  uninstallReactAdapter,
} from '../src/ssr.ts';
import { getAdapter } from '@lessjs/core';

Deno.test('isReactElement detects React elements', () => {
  // Create a minimal React element structure
  const reactElement = {
    $$typeof: Symbol.for('react.element'),
    type: 'div',
    props: { children: 'Hello' },
  };
  assertEquals(isReactElement(reactElement), true);
});

Deno.test('isReactElement returns false for plain objects', () => {
  assertEquals(isReactElement({}), false);
  assertEquals(isReactElement({ type: 'div' }), false);
  assertEquals(isReactElement(null), false);
  assertEquals(isReactElement('string'), false);
  assertEquals(isReactElement(42), false);
});

Deno.test('isReactElement returns false for Lit TemplateResult-like', () => {
  const litLike = { _$litType$: 1, strings: [], values: [] };
  assertEquals(isReactElement(litLike), false);
});

Deno.test('installReactAdapter registers react adapter', () => {
  installReactAdapter();
  const adapter = getAdapter('react');
  assertExists(adapter);
  assertEquals(adapter.name, 'react');
  uninstallReactAdapter();
});

Deno.test('installReactAdapter is idempotent', () => {
  installReactAdapter();
  installReactAdapter();
  const adapter = getAdapter('react');
  assertExists(adapter);
  assertEquals(adapter.name, 'react');
  uninstallReactAdapter();
});

Deno.test('uninstallReactAdapter removes the adapter', () => {
  installReactAdapter();
  uninstallReactAdapter();
  const adapter = getAdapter();
  assertEquals(adapter, undefined);
});

Deno.test('react adapter isTemplate detects React elements', () => {
  installReactAdapter();
  const adapter = getAdapter('react');
  assertExists(adapter);

  const reactElement = {
    $$typeof: Symbol.for('react.element'),
    type: 'div',
    props: {},
  };
  assertEquals(adapter.isTemplate?.(reactElement), true);
  assertEquals(adapter.isTemplate?.('string'), false);
  assertEquals(adapter.isTemplate?.(42), false);
  uninstallReactAdapter();
});

Deno.test('renderReactToString returns string for non-React values', async () => {
  assertEquals(await renderReactToString('hello'), 'hello');
  assertEquals(await renderReactToString(42), '42');
});

Deno.test('react adapter extractStyles returns undefined', () => {
  installReactAdapter();
  const adapter = getAdapter('react');
  assertExists(adapter);
  class TestComponent {}
  assertEquals(
    adapter.extractStyles?.(TestComponent as unknown as CustomElementConstructor),
    undefined,
  );
  uninstallReactAdapter();
});

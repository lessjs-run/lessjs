import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

Deno.test('empty → zero JS', () => {
  assertExists(generateClientEntry([]).includes('zero client JS needed'));
});

Deno.test('eager island loads immediately', () => {
  const code = generateClientEntry([
    { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'eager' },
  ]);
  assertExists(code.includes("import('@lessjs/ui/less-theme-toggle')"));
  assertExists(code.includes('requestIdleCallback'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('lazy island deferred to idle', () => {
  const code = generateClientEntry([
    { tagName: 'less-hero-ping', modulePath: './ping.ts', strategy: 'lazy' },
  ]);
  assertExists(code.includes('requestIdleCallback'));
  assertExists(code.includes("import('./ping.ts')"));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('mixed eager+lazy', () => {
  const code = generateClientEntry([
    { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'eager' },
    { tagName: 'less-hero-ping', modulePath: '@lessjs/ui/less-hero-ping', strategy: 'lazy' },
    { tagName: 'api-consumer', modulePath: './api-consumer.ts', strategy: 'lazy' },
  ]);
  assertExists(code.includes('requestIdleCallback'));
  assertExists(code.includes('less:ready'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('no legacy SSR client runtime', () => {
  const code = generateClientEntry([
    { tagName: 'my-counter', modulePath: './counter.ts' },
  ]);
  assertEquals(code.includes('LitElement'), false);
  assertEquals(code.includes('lit-element-hydrate-support'), false);
});

Deno.test('less:ready event', () => {
  const code = generateClientEntry([
    { tagName: 'my-island', modulePath: './island.ts' },
  ]);
  assertExists(code.includes('less:ready'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

// ─── v0.5 Trust Release: strategy must reach client entry ────

Deno.test('package island strategy:eager is preserved in client entry', () => {
  // Bug: buildClient used to drop strategy from packageIslands, so
  // less-theme-toggle (strategy: 'eager') was treated as lazy.
  // Fix: strategy is now passed through from metadata.
  const code = generateClientEntry([
    {
      tagName: 'less-theme-toggle',
      modulePath: '@lessjs/ui/less-theme-toggle',
      strategy: 'eager',
      isPackage: true,
    },
    {
      tagName: 'less-button',
      modulePath: '@lessjs/ui/less-button',
      strategy: 'lazy',
      isPackage: true,
    },
  ]);

  // Eager island must appear in the immediate-load array
  assertExists(code.includes("'less-theme-toggle'"));
  // Both must appear in the island map
  assertExists(code.includes("import('@lessjs/ui/less-theme-toggle')"));
  assertExists(code.includes("import('@lessjs/ui/less-button')"));
});

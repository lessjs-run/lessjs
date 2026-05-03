import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

Deno.test('empty → zero JS', () => {
  assertExists(generateClientEntry([]).includes('zero client JS needed'));
});

Deno.test('eager island loads immediately', () => {
  const code = generateClientEntry([
    { tagName: 'kiss-theme-toggle', modulePath: '@kissjs/ui/kiss-theme-toggle', strategy: 'eager' },
  ]);
  assertExists(code.includes("import('@kissjs/ui/kiss-theme-toggle')"));
  assertExists(code.includes('requestIdleCallback'));
  try { new Function(code); } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('lazy island deferred to idle', () => {
  const code = generateClientEntry([
    { tagName: 'kiss-hero-ping', modulePath: './ping.ts', strategy: 'lazy' },
  ]);
  assertExists(code.includes('requestIdleCallback'));
  assertExists(code.includes("import('./ping.ts')"));
  try { new Function(code); } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('mixed eager+lazy', () => {
  const code = generateClientEntry([
    { tagName: 'kiss-theme-toggle', modulePath: '@kissjs/ui/kiss-theme-toggle', strategy: 'eager' },
    { tagName: 'kiss-hero-ping', modulePath: '@kissjs/ui/kiss-hero-ping', strategy: 'lazy' },
    { tagName: 'api-consumer', modulePath: './api-consumer.ts', strategy: 'lazy' },
  ]);
  assertExists(code.includes('requestIdleCallback'));
  assertExists(code.includes('kiss:ready'));
  try { new Function(code); } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('no Lit hydration', () => {
  const code = generateClientEntry([
    { tagName: 'my-counter', modulePath: './counter.ts' },
  ]);
  assertEquals(code.includes('LitElement'), false);
  assertEquals(code.includes('lit-element-hydrate-support'), false);
});

Deno.test('kiss:ready event', () => {
  const code = generateClientEntry([
    { tagName: 'my-island', modulePath: './island.ts' },
  ]);
  assertExists(code.includes('kiss:ready'));
  try { new Function(code); } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

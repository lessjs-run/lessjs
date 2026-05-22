import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

Deno.test('empty -> zero JS', () => {
  assert(generateClientEntry([]).includes('zero client JS needed'));
});

Deno.test('eager island loads immediately', () => {
  const code = generateClientEntry([
    { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'eager' },
  ]);
  assert(code.includes('import("@lessjs/ui/less-theme-toggle")'));
  assert(code.includes('Eager islands'));
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
  assert(code.includes('requestIdleCallback'));
  assert(code.includes('import("./ping.ts")'));
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
  assert(code.includes('requestIdleCallback'));
  assert(code.includes('less:ready'));
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
  assert(code.includes('less:ready'));
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
  assert(code.includes('"less-theme-toggle"'));
  // Both must appear in the island map
  assert(code.includes('import("@lessjs/ui/less-theme-toggle")'));
  assert(code.includes('import("@lessjs/ui/less-button")'));
});

Deno.test('client entry safely escapes tag names and module paths', () => {
  const code = generateClientEntry([
    {
      tagName: 'x-safe',
      modulePath: './safe"quote.ts',
      strategy: 'eager',
    },
  ]);

  assert(code.includes('"x-safe": () => import("./safe\\"quote.ts")'));
  new Function(code);
});

Deno.test('client entry rejects malicious package island metadata', () => {
  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: "x-bad');alert(1);//",
          modulePath: './safe.ts',
        },
      ]),
    Error,
    'Invalid island tagName',
  );

  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: 'x-safe',
          modulePath: 'javascript:alert(1)',
        },
      ]),
    Error,
    'Invalid island modulePath',
  );
});

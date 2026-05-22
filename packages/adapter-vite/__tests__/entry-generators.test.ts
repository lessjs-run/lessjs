import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { generateClientEntry } from '../src/entry-generators.ts';

Deno.test('empty -> zero JS', () => {
  assert(generateClientEntry([]).includes('zero client JS needed'));
});

Deno.test('client:load island loads immediately', () => {
  const code = generateClientEntry([
    { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'load' },
  ]);
  assert(code.includes('import("@lessjs/ui/less-theme-toggle")'));
  assert(code.includes('client:load islands'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('client:idle island deferred to idle', () => {
  const code = generateClientEntry([
    { tagName: 'less-hero-ping', modulePath: './ping.ts', strategy: 'idle' },
  ]);
  assert(code.includes('requestIdleCallback'));
  assert(code.includes('import("./ping.ts")'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('mixed load+idle', () => {
  const code = generateClientEntry([
    { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'load' },
    { tagName: 'less-hero-ping', modulePath: '@lessjs/ui/less-hero-ping', strategy: 'idle' },
    { tagName: 'api-consumer', modulePath: './api-consumer.ts', strategy: 'idle' },
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
    { tagName: 'my-counter', modulePath: './counter.ts', strategy: 'idle' },
  ]);
  assertEquals(code.includes('LitElement'), false);
  assertEquals(code.includes('lit-element-hydrate-support'), false);
});

Deno.test('less:ready event', () => {
  const code = generateClientEntry([
    { tagName: 'my-island', modulePath: './island.ts', strategy: 'idle' },
  ]);
  assert(code.includes('less:ready'));
  try {
    new Function(code);
  } catch (e) {
    assertEquals(true, false, `Syntax error: ${String(e)}`);
  }
});

Deno.test('client:only islands are scheduled with idle client-only bucket', () => {
  const code = generateClientEntry([
    {
      tagName: 'client-only-widget',
      modulePath: './client-only-widget.ts',
      strategy: 'only',
      ssr: false,
      dsd: false,
    },
  ]);

  assert(code.includes('client:idle and client:only islands'));
  assert(code.includes('"client-only-widget"'));
  new Function(code);
});

Deno.test('legacy eager/lazy strategies are not emitted by v0.21 runtime', () => {
  const code = generateClientEntry([
    { tagName: 'x-load', modulePath: './load.ts', strategy: 'load' },
    { tagName: 'x-idle', modulePath: './idle.ts', strategy: 'idle' },
  ]);

  assertEquals(code.includes('eager'), false);
  assertEquals(code.includes('lazy'), false);
});

// 鈹€鈹€鈹€ v0.5 Trust Release: strategy must reach client entry 鈹€鈹€鈹€鈹€

Deno.test('package island strategy:load is preserved in client entry', () => {
  // Bug: buildClient used to drop strategy from packageIslands, so
  // less-theme-toggle (strategy: 'load') must stay in the immediate bucket.
  // Fix: strategy is now passed through from metadata.
  const code = generateClientEntry([
    {
      tagName: 'less-theme-toggle',
      modulePath: '@lessjs/ui/less-theme-toggle',
      strategy: 'load',
      isPackage: true,
    },
    {
      tagName: 'less-button',
      modulePath: '@lessjs/ui/less-button',
      strategy: 'idle',
      isPackage: true,
    },
  ]);

  // Load island must appear in the immediate-load array
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
      strategy: 'load',
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
          strategy: 'idle',
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
          strategy: 'idle',
        },
      ]),
    Error,
    'Invalid island modulePath',
  );
});

Deno.test('client entry rejects legacy eager/lazy strategy values', () => {
  assertThrows(
    () =>
      generateClientEntry([
        {
          tagName: 'x-old',
          modulePath: './old.ts',
          strategy: 'eager',
        } as never,
      ]),
    Error,
    'Invalid island strategy',
  );
});

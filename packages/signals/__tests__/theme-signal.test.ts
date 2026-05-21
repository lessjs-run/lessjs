/**
 * @lessjs/signals - themeSignal unit tests
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { themeSignal } from '../src/index.ts';

/** Wait for effect microtasks */
function waitForEffects(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test('themeSignal - default value', async (t) => {
  await t.step('defaults to "dark" when no DOM is available', () => {
    assertEquals(themeSignal.value, 'dark');
  });

  await t.step('is writable', () => {
    const original = themeSignal.value;
    themeSignal.value = 'light';
    assertEquals(themeSignal.value, 'light');
    themeSignal.value = original;
  });
});

Deno.test('themeSignal - subscribe', async (t) => {
  await t.step('subscribe receives current value', () => {
    let received: string | undefined;
    const unsub = themeSignal.subscribe((v) => {
      received = v;
    });
    assertEquals(received, 'dark');
    unsub();
  });

  await t.step('subscribe receives updates', async () => {
    const original = themeSignal.value;
    const values: string[] = [];
    const unsub = themeSignal.subscribe((v) => {
      values.push(v);
    });
    themeSignal.value = 'nord';
    await waitForEffects();
    assertEquals(values.includes('nord'), true);
    themeSignal.value = original;
    unsub();
  });
});

Deno.test('themeSignal - is a WritableSignal', async (t) => {
  await t.step('has .value getter and setter', () => {
    const orig = themeSignal.value;
    themeSignal.value = 'solarized';
    assertEquals(themeSignal.value, 'solarized');
    themeSignal.value = orig;
  });

  await t.step('has subscribe method', () => {
    assertEquals(typeof themeSignal.subscribe, 'function');
  });
});

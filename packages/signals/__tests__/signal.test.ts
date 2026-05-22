/**
 * @lessjs/signals - signal() unit tests
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { signal } from '../src/index.ts';

/** Wait for effect microtasks to fully propagate */
function waitForEffects(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test('signal() - read/write', async (t) => {
  await t.step('initial value is readable via .value', () => {
    const s = signal(42);
    assertEquals(s.value, 42);
  });

  await t.step('string initial value', () => {
    const s = signal('hello');
    assertEquals(s.value, 'hello');
  });

  await t.step('object initial value', () => {
    const obj = { a: 1, b: 2 };
    const s = signal(obj);
    assertEquals(s.value, obj);
  });

  await t.step('null initial value', () => {
    const s = signal<string | null>(null);
    assertEquals(s.value, null);
  });

  await t.step('undefined initial value', () => {
    const s = signal<string | undefined>(undefined);
    assertEquals(s.value, undefined);
  });

  await t.step('writing .value updates the signal', () => {
    const s = signal(0);
    s.value = 10;
    assertEquals(s.value, 10);
  });

  await t.step('multiple writes update value', () => {
    const s = signal(0);
    s.value = 1;
    s.value = 2;
    s.value = 3;
    assertEquals(s.value, 3);
  });

  await t.step('writing same value does not throw', () => {
    const s = signal(5);
    s.value = 5;
    assertEquals(s.value, 5);
  });
});

Deno.test('signal() - subscribe()', async (t) => {
  await t.step('subscribe is called immediately with current value', () => {
    const s = signal(10);
    let received: number | undefined;
    s.subscribe((v) => {
      received = v;
    });
    assertEquals(received, 10);
  });

  await t.step('subscribe is called when value changes', async () => {
    const s = signal(0);
    const values: number[] = [];
    s.subscribe((v) => {
      values.push(v);
    });
    assertEquals(values, [0]);
    s.value = 1;
    await waitForEffects();
    assertEquals(values.includes(1), true);
  });

  await t.step('unsubscribe stops future notifications', async () => {
    const s = signal(0);
    const values: number[] = [];
    const unsub = s.subscribe((v) => {
      values.push(v);
    });
    unsub();
    s.value = 99;
    await waitForEffects();
    assertEquals(values.includes(99), false);
  });

  await t.step('multiple subscribers all receive updates', async () => {
    const s = signal(0);
    const a: number[] = [];
    const b: number[] = [];
    s.subscribe((v) => {
      a.push(v);
    });
    s.subscribe((v) => {
      b.push(v);
    });
    s.value = 42;
    await waitForEffects();
    assertEquals(a.includes(42), true);
    assertEquals(b.includes(42), true);
  });
});

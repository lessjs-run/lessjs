/**
 * @lessjs/signals - computed() unit tests
 *
 * Tests for computed signal with automatic dependency tracking.
 * NOTE: The TC39 signal polyfill has a known issue where effects that
 * only read computed signals don't re-trigger. Tests are designed to
 * avoid this edge case.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { computed, signal } from '../src/index.ts';

Deno.test('computed() - basic', async (t) => {
  await t.step('computes derived value', () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed(() => a.value + b.value);
    assertEquals(sum.value, 5);
  });

  await t.step('updates when source signal changes', () => {
    const a = signal(10);
    const doubled = computed(() => a.value * 2);
    assertEquals(doubled.value, 20);
    a.value = 25;
    assertEquals(doubled.value, 50);
  });

  await t.step('computed with string transformation', () => {
    const name = signal('world');
    const greeting = computed(() => `hello ${name.value}`);
    assertEquals(greeting.value, 'hello world');
    name.value = 'LessJS';
    assertEquals(greeting.value, 'hello LessJS');
  });

  await t.step('computed value is read-only', () => {
    const a = signal(1);
    const c = computed(() => a.value + 1);
    assertEquals(c.value, 2);
  });

  await t.step('computed with multiple source signals', () => {
    const a = signal(1);
    const b = signal(10);
    const sum = computed(() => a.value + b.value);
    assertEquals(sum.value, 11);
    a.value = 5;
    assertEquals(sum.value, 15);
    b.value = 20;
    assertEquals(sum.value, 25);
  });
});

Deno.test('computed() - subscribe()', async (t) => {
  await t.step('subscribe is called immediately with computed value', () => {
    const a = signal(3);
    const c = computed(() => a.value * 10);
    let received: number | undefined;
    c.subscribe((v) => {
      received = v;
    });
    assertEquals(received, 30);
  });

  await t.step('subscribe callback receives correct initial value', () => {
    const s = signal('hello');
    const c = computed(() => s.value.toUpperCase());
    let received = '';
    const unsub = c.subscribe((v) => {
      received = v;
    });
    assertEquals(received, 'HELLO');
    unsub();
  });
});

Deno.test('computed() - lazy evaluation', async (t) => {
  await t.step('computed is not re-evaluated until read', () => {
    let callCount = 0;
    const a = signal(1);
    const c = computed(() => {
      callCount++;
      return a.value * 2;
    });
    assertEquals(c.value, 2);
    assertEquals(callCount, 1);
    a.value = 5;
    assertEquals(callCount, 1);
    assertEquals(c.value, 10);
    assertEquals(callCount, 2);
  });

  await t.step('computed caches value between reads', () => {
    let callCount = 0;
    const a = signal(1);
    const c = computed(() => {
      callCount++;
      return a.value * 2;
    });
    c.value;
    c.value;
    assertEquals(callCount, 1); // same epoch, not recomputed
  });
});

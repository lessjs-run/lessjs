/**
 * @lessjs/signals - batch() and untracked() unit tests
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { batch, computed, effect, signal, untracked } from '../src/index.ts';

/** Wait for effect microtasks */
function waitForEffects(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── batch() ──────────────────────────────────────────────────

Deno.test('batch() — groups multiple writes', async (t) => {
  await t.step('multiple writes in batch trigger single effect', async () => {
    const a = signal(1);
    const b = signal(2);
    let effectCount = 0;
    effect(() => {
      a.value;
      b.value;
      effectCount++;
    });
    assertEquals(effectCount, 1);

    batch(() => {
      a.value = 10;
      b.value = 20;
    });

    await waitForEffects();
    // The effect should re-run once (both changes batched)
    assertEquals(effectCount, 2);
  });

  await t.step('batch returns the callback result', () => {
    const result = batch(() => 42);
    assertEquals(result, 42);
  });

  await t.step('batch with void return', () => {
    const s = signal(0);
    batch(() => {
      s.value = 1;
    });
    assertEquals(s.value, 1);
  });

  await t.step('nested batch works', () => {
    const s = signal(0);
    batch(() => {
      s.value = 1;
      batch(() => {
        s.value = 2;
      });
    });
    assertEquals(s.value, 2);
  });
});

// ─── untracked() ──────────────────────────────────────────────

Deno.test('untracked() — prevents dependency tracking', async (t) => {
  await t.step('untracked read does not create dependency', async () => {
    const tracked = signal(1);
    const untrackedSig = signal(100);
    let count = 0;

    effect(() => {
      tracked.value;
      untracked(() => untrackedSig.value);
      count++;
    });

    assertEquals(count, 1);

    // Changing the untracked signal should NOT trigger re-run
    untrackedSig.value = 200;
    await waitForEffects();
    assertEquals(count, 1);

    // Changing the tracked signal SHOULD trigger re-run
    tracked.value = 2;
    await waitForEffects();
    assertEquals(count, 2);
  });

  await t.step('untracked returns the callback result', () => {
    const s = signal(42);
    const val = untracked(() => s.value);
    assertEquals(val, 42);
  });

  await t.step('untracked inside computed', () => {
    const a = signal(1);
    const b = signal(10);
    const c = computed(() => a.value + untracked(() => b.value));
    assertEquals(c.value, 11);

    // Changing b should NOT affect computed (not tracked)
    b.value = 20;
    assertEquals(c.value, 11);

    // Changing a should recompute
    a.value = 5;
    assertEquals(c.value, 25);
  });

  await t.step('untracked with void return', () => {
    let sideEffect = 0;
    untracked(() => {
      sideEffect = 42;
    });
    assertEquals(sideEffect, 42);
  });
});

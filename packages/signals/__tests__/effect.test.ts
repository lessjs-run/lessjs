/**
 * @lessjs/signals - effect() unit tests
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { effect, signal } from '../src/index.ts';

/** Wait for effect microtasks to fully propagate */
function waitForEffects(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test('effect() - initial execution', async (t) => {
  await t.step('runs callback immediately', () => {
    let count = 0;
    const s = signal(1);
    effect(() => {
      count++;
      s.value;
    });
    assertEquals(count, 1);
  });

  await t.step('tracks signal reads in initial execution', () => {
    const s = signal('hello');
    let observed = '';
    effect(() => {
      observed = s.value;
    });
    assertEquals(observed, 'hello');
  });
});

Deno.test('effect() - re-execution on signal change', async (t) => {
  await t.step('re-runs when tracked signal changes', async () => {
    const s = signal(0);
    let count = 0;
    effect(() => {
      s.value;
      count++;
    });
    assertEquals(count, 1);
    s.value = 1;
    await waitForEffects();
    assertEquals(count, 2);
  });

  await t.step('re-runs for each distinct change', async () => {
    const s = signal(0);
    let count = 0;
    effect(() => {
      s.value;
      count++;
    });
    s.value = 1;
    await waitForEffects();
    s.value = 2;
    await waitForEffects();
    assertEquals(count, 3);
  });

  await t.step('reads updated value inside re-execution', async () => {
    const s = signal(10);
    let observed = 0;
    effect(() => {
      observed = s.value;
    });
    s.value = 20;
    await waitForEffects();
    assertEquals(observed, 20);
  });
});

Deno.test('effect() - cleanup function', async (t) => {
  await t.step('cleanup function is called before re-run', async () => {
    const s = signal(1);
    const cleanups: number[] = [];
    effect(() => {
      const v = s.value;
      return () => cleanups.push(v);
    });
    s.value = 2;
    await waitForEffects();
    assertEquals(cleanups, [1]);
  });

  await t.step('cleanup is called when effect is disposed', () => {
    const s = signal(1);
    let cleanupCalled = false;
    const dispose = effect(() => {
      s.value;
      return () => {
        cleanupCalled = true;
      };
    });
    dispose();
    assertEquals(cleanupCalled, true);
  });
});

Deno.test('effect() - dispose', async (t) => {
  await t.step('dispose stops future re-runs', async () => {
    const s = signal(0);
    let count = 0;
    const dispose = effect(() => {
      s.value;
      count++;
    });
    assertEquals(count, 1);
    dispose();
    s.value = 1;
    await waitForEffects();
    assertEquals(count, 1);
  });

  await t.step('multiple disposes are safe', () => {
    const s = signal(0);
    let count = 0;
    const dispose = effect(() => {
      s.value;
      count++;
    });
    dispose();
    dispose();
    assertEquals(count, 1);
  });
});

Deno.test('effect() - multiple signals', async (t) => {
  await t.step('tracks multiple signals', async () => {
    const a = signal(1);
    const b = signal(2);
    let sum = 0;
    effect(() => {
      sum = a.value + b.value;
    });
    assertEquals(sum, 3);
    a.value = 10;
    await waitForEffects();
    assertEquals(sum, 12);
    b.value = 20;
    await waitForEffects();
    assertEquals(sum, 30);
  });
});

// deno-lint-ignore-file no-explicit-any no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { isNativeSignal } from '../src/index.ts';

Deno.test('isNativeSignal: returns false when globalThis.Signal is undefined', () => {
  const original = (globalThis as any).Signal;
  delete (globalThis as any).Signal;
  try {
    assertEquals(isNativeSignal(), false);
  } finally {
    (globalThis as any).Signal = original;
  }
});

Deno.test('isNativeSignal: returns true when globalThis.Signal is defined', () => {
  const original = (globalThis as any).Signal;
  (globalThis as any).Signal = {
    State: class {},
    Computed: class {},
    subtle: { Watcher: class {}, untrack: () => {} },
  };
  try {
    assertEquals(isNativeSignal(), true);
  } finally {
    if (original === undefined) {
      delete (globalThis as any).Signal;
    } else {
      (globalThis as any).Signal = original;
    }
  }
});

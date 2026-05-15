/**
 * @lessjs/signals - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() — the primary API surface.
 *
 * @module @lessjs/signals/framework
 */

import { _engine, _log } from './engine.ts';
import type { ReadonlySignal, Unsubscribe, WritableSignal } from './types.ts';

/**
 * Create a new reactive signal.
 * Wraps Signal.State with .value syntax and subscribe().
 */
export function signal<T>(initialValue: T): WritableSignal<T> {
  const state = new _engine.State(initialValue);

  return {
    get value(): T {
      return state.get();
    },
    set value(newValue: T) {
      state.set(newValue);
    },
    subscribe(fn: (value: T) => void): Unsubscribe {
      const dispose = effect(() => {
        fn(state.get());
      });
      return dispose;
    },
  };
}

/**
 * Create a computed signal with automatic dependency tracking.
 */
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const c = new _engine.Computed(fn);

  return {
    get value(): T {
      return c.get();
    },
    subscribe(fn2: (value: T) => void): Unsubscribe {
      const dispose = effect(() => {
        fn2(c.get());
      });
      return dispose;
    },
  };
}

/**
 * Reactive effect: runs fn, tracks which signals it reads,
 * and re-runs when any of those signals change.
 */
export function effect(fn: () => void | (() => void)): Unsubscribe {
  let cleanup: (() => void) | void;
  let pendingCount = 0;

  const c = new _engine.Computed(() => {
    cleanup?.();
    cleanup = fn();
  });

  const watcher = new _engine.subtle.Watcher(() => {
    pendingCount++;
    if (pendingCount === 1) {
      queueMicrotask(() => {
        pendingCount = 0;
        // Loop to handle signal changes that occurred during processing
        let pendingSignals: readonly object[];
        while ((pendingSignals = watcher.getPending()).length > 0) {
          for (const s of pendingSignals) {
            try {
              // deno-lint-ignore no-explicit-any
              (s as any).get();
            } catch (err) {
              _log.warn('Effect error:', err);
            }
          }
        }
        watcher.watch(c);
      });
    }
  });

  // Initial execution
  watcher.watch(c);
  try {
    c.get();
  } catch (err) {
    _log.warn('Effect initial error:', err);
  }

  return () => {
    cleanup?.();
    watcher.unwatch(c);
  };
}

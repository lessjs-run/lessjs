/**
 * @lessjs/core - Signal Engine Facade (SOP-004).
 *
 * v0.22: Public contract for reactive signal engines.
 *
 * Defines the `SignalEngine` interface — the protocol that all signal
 * engine implementations (TC39 polyfill, native browser Signal, alien-signals)
 * must satisfy. This enables swapping the engine without changing any
 * framework or sugar layer code.
 *
 * The default engine is the TC39 signal-polyfill (via @lessjs/signals).
 * An experimental alien-signals adapter ships in @lessjs/signals/alien-engine.
 *
 * @module @lessjs/core/signals
 */

import { computed as _computed, effect as _effect, signal as _signal } from 'alien-signals';

/** Unsubscribe function returned by reactive subscriptions. */
export type Unsubscribe = () => void;

/**
 * A writable reactive signal with .value syntax.
 * Compatible with Preact/Solid Signals and TC39 Signal.State.
 */
export interface WritableSignal<T> {
  /** Read the current value */
  get value(): T;
  /** Write a new value */
  set value(v: T);
  /** Subscribe to value changes. Called immediately with current value. */
  subscribe(fn: (value: T) => void): Unsubscribe;
}

/**
 * A read-only derived signal with .value syntax.
 * Created by computed() or wrapping a read-only source.
 */
export interface ReadonlySignal<T> {
  /** Read the current value */
  readonly value: T;
  /** Subscribe to value changes. Called immediately with current value. */
  subscribe(fn: (value: T) => void): Unsubscribe;
}

/** Union of writable and read-only signals for convenience. */
export type Signal<T> = WritableSignal<T> | ReadonlySignal<T>;

/**
 * SignalEngine — the reactive engine protocol.
 *
 * Every engine implementation (TC39 polyfill, native, alien-signals)
 * must satisfy this interface. The framework layer (@lessjs/signals/framework)
 * uses this protocol to talk to the engine, making engine swapping transparent.
 *
 * @since v0.22 (SOP-004: Signals Facade)
 */
export interface SignalEngine {
  /** Create a new reactive signal with an initial value. */
  signal<T>(initialValue: T): WritableSignal<T>;

  /** Create a computed/derived signal that auto-tracks dependencies. */
  computed<T>(fn: () => T): ReadonlySignal<T>;

  /**
   * Create a reactive effect. The effect re-runs when any signal it reads
   * during execution changes. Returns an unsubscribe function.
   *
   * If `fn` returns a function, it is called as cleanup before each re-run
   * and on final unsubscribe.
   */
  effect(fn: () => void | Unsubscribe): Unsubscribe;
}

/** Create a writable signal backed by alien-signals. */
export function signal<T>(initialValue: T): WritableSignal<T> {
  const s = _signal(initialValue);
  return {
    get value(): T {
      return s();
    },
    set value(v: T) {
      s(v);
    },
    subscribe(fn: (value: T) => void): Unsubscribe {
      const stop = _effect(() => fn(s()));
      return () => stop();
    },
  };
}

/** Create a readonly computed signal backed by alien-signals. */
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const c = _computed(fn);
  return {
    get value(): T {
      return c();
    },
    subscribe(fn2: (value: T) => void): Unsubscribe {
      const stop = _effect(() => fn2(c()));
      return () => stop();
    },
  };
}

/** Run a reactive effect and return its unsubscribe handle. */
export function effect(fn: () => void | Unsubscribe): Unsubscribe {
  let cleanup: Unsubscribe | void;
  const stop = _effect(() => {
    try {
      cleanup?.();
    } catch { /* swallow cleanup errors */ }
    cleanup = fn();
  });

  return () => {
    try {
      cleanup?.();
    } catch { /* swallow cleanup errors */ }
    stop();
  };
}

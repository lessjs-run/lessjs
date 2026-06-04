/**
 * @openelement/signals - Public type exports
 *
 * Shared types used by framework and sugar layers.
 * No internal polyfill dependencies.
 */

/** Unsubscribe function */
export type Unsubscribe = () => void;

/**
 * LessJS WritableSignal - user-friendly wrapper around Signal.State
 * Uses .value syntax (like Preact/Solid) instead of .get()/.set() (TC39)
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
 * LessJS ReadonlySignal - derived from computed or manually created read-only
 */
export interface ReadonlySignal<T> {
  /** Read the current value */
  readonly value: T;
  /** Subscribe to value changes. Called immediately with current value. */
  subscribe(fn: (value: T) => void): Unsubscribe;
}

/** Alias for readability */
export type Signal<T> = WritableSignal<T> | ReadonlySignal<T>;

/** Signal engine protocol used by framework integrations. */
export interface SignalEngine {
  signal<T>(initialValue: T): WritableSignal<T>;
  computed<T>(fn: () => T): ReadonlySignal<T>;
  effect(fn: () => void | Unsubscribe): Unsubscribe;
}

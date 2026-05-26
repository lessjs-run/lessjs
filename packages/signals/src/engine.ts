// deno-lint-ignore-file no-explicit-any
/**
 * @lessjs/signals - Engine Layer
 *
 * v0.22.1: TC39 polyfill removed. alien-signals is the only engine.
 * This file now only exports shared types and a minimal logger.
 *
 * @module @lessjs/signals/engine
 */

// ─── Internal Logger ────────────────────────────────────────────
export const _log = {
  warn: (...args: unknown[]) => {
    console.warn('[LessJS/Signal]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[LessJS/Signal]', ...args);
  },
};

// ─── Symbols ────────────────────────────────────────────────────
export const NODE = Symbol('node');

// ─── Engine types ───────────────────────────────────────────────
export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
  [key: symbol]: (() => void) | undefined;
}

export interface SignalEngineNamespace {
  State: new <T>(
    initialValue: T,
    options?: SignalOptions<T>,
  ) => { get(): T; set(v: T): void; [NODE]: SignalNode<T> };
  Computed: new <T>(
    computation: () => T,
    options?: SignalOptions<T>,
  ) => { get(): T; [NODE]: ComputedNode<T> };
  isState: (s: unknown) => boolean;
  isComputed: (s: unknown) => boolean;
  subtle: {
    Watcher: new (
      notify: (this: unknown) => void,
    ) => { watch(...s: unknown[]): void; unwatch(...s: unknown[]): void; getPending(): unknown[] };
    untrack<T>(cb: () => T): T;
    watched: symbol;
    unwatched: symbol;
  };
}

// ─── Polyfill types (kept for reference, no longer used) ────────
// v0.22.1: These types were used by polyfill.ts which has been removed.
// Kept to avoid breaking downstream type-only consumers if any exist.
export interface ReactiveNode {
  version: number;
  lastCleanEpoch: number;
  dirty: boolean;
  producerNode: ReactiveNode[] | undefined;
  producerLastReadVersion: number[] | undefined;
  producerIndexOfThis: number[] | undefined;
  nextProducerIndex: number;
  liveConsumerNode: ReactiveNode[] | undefined;
  liveConsumerIndexOfThis: number[] | undefined;
  consumerAllowSignalWrites: boolean;
  consumerIsAlwaysLive: boolean;
  producerMustRecompute(node: unknown): boolean;
  producerRecomputeValue(node: unknown): void;
  consumerMarkedDirty(this: unknown): void;
  consumerOnSignalRead(node: unknown): void;
  watched?(): void;
  unwatched?(): void;
  wrapper?: unknown;
}

export interface SignalNode<T> extends ReactiveNode {
  value: T;
  equal: (a: T, b: T) => boolean;
}

export interface ComputedNode<T> extends ReactiveNode {
  value: T;
  error: unknown;
  computation: () => T;
  equal: (a: T, b: T) => boolean;
}

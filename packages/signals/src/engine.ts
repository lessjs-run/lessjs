/**
 * @lessjs/signal - Engine Layer
 *
 * TC39 Signal primitives (polyfill or native).
 * Creates the _engine singleton that framework.ts uses.
 *
 * @module @lessjs/signal/engine
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

// ─── Symbols (defined before import to avoid cycle issues) ──────
const _SIGNAL = Symbol('SIGNAL');
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

// ─── Polyfill types needed by polyfill.ts ───────────────────────
// These are exported so polyfill.ts can import them without cycles.
// ReactiveNode, SignalNode, ComputedNode are internal to polyfill.ts.
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

// ─── Engine singleton ───────────────────────────────────────────
// Import _createPolyfill after all exports — ensures polyfill.ts
// gets NODE and types before engine.ts needs _createPolyfill.
// deno-lint-ignore no-explicit-any
import { _createPolyfill } from './polyfill.ts';

export const _engine: SignalEngineNamespace = (globalThis as any).Signal ?? _createPolyfill();

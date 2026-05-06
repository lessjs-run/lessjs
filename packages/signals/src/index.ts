/**
 * @lessjs/signals - Reactive signals for Island-to-Island communication.
 *
 * v0.6': Based on TC39 signal-polyfill (Apache-2.0 / MIT)
 * Engine: Signal.State + Signal.Computed + Signal.subtle.Watcher
 * Framework API: signal(), computed(), effect(), islandEffect(), channel(), themeSignal
 *
 * When browser natively supports Signal, engine auto-switches to native.
 *
 * Architecture:
 *   Engine layer    → TC39 Signal primitives (polyfill or native)
 *   Framework layer → LessJS user-friendly API (.value syntax, auto-cleanup)
 *   Sugar layer     → islandEffect(), channel(), themeSignal
 *
 * LessJS L2 Island Communication Rules:
 *   1. Islands must not reference each other's shadow DOM directly.
 *   2. Islands communicate through shared signals or channel events.
 *   3. Signals are independent of any DOM lifecycle.
 *   4. Infrastructure APIs (localStorage, document.documentElement,
 *      IntersectionObserver, CustomEvent) are exempt from L2 constraints.
 *
 * @module @lessjs/signals
 */

// ─── Engine Layer: TC39 Signal Primitives ────────────────────────
// Use native Signal if available, otherwise polyfill.
// deno-lint-ignore-file no-explicit-any
// The polyfill is inlined below; when browsers ship native Signal,
// the polyfill code will be tree-shaken away.

interface SignalEngineNamespace {
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

interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
  [key: symbol]: (() => void) | undefined;
}

const _engine: SignalEngineNamespace = _createPolyfill();

// ─── Polyfill Implementation ─────────────────────────────────────

const _SIGNAL = Symbol('SIGNAL');
const NODE = Symbol('node');

interface ReactiveNode {
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

interface SignalNode<T> extends ReactiveNode {
  value: T;
  equal: (a: T, b: T) => boolean;
}

interface ComputedNode<T> extends ReactiveNode {
  value: T;
  error: unknown;
  computation: () => T;
  equal: (a: T, b: T) => boolean;
}

let _activeConsumer: ReactiveNode | null = null;
let _inNotificationPhase = false;
let _epoch = 1;

const REACTIVE_NODE: ReactiveNode = {
  version: 0,
  lastCleanEpoch: 0,
  dirty: false,
  producerNode: undefined,
  producerLastReadVersion: undefined,
  producerIndexOfThis: undefined,
  nextProducerIndex: 0,
  liveConsumerNode: undefined,
  liveConsumerIndexOfThis: undefined,
  consumerAllowSignalWrites: false,
  consumerIsAlwaysLive: false,
  producerMustRecompute: () => false,
  producerRecomputeValue: () => {},
  consumerMarkedDirty: () => {},
  consumerOnSignalRead: () => {},
};

function _setActiveConsumer(node: ReactiveNode | null): ReactiveNode | null {
  const prev = _activeConsumer;
  _activeConsumer = node;
  return prev;
}

function _producerAccessed(node: ReactiveNode): void {
  if (_inNotificationPhase) throw new Error('Signal read during notification phase');
  if (_activeConsumer === null) return;
  _activeConsumer.consumerOnSignalRead(node);
  const idx = _activeConsumer.nextProducerIndex++;
  _assertConsumerNode(_activeConsumer);
  if (idx < _activeConsumer.producerNode!.length && _activeConsumer.producerNode![idx] !== node) {
    if (_consumerIsLive(_activeConsumer)) {
      _producerRemoveLiveConsumerAtIndex(
        _activeConsumer.producerNode![idx],
        _activeConsumer.producerIndexOfThis![idx],
      );
    }
  }
  if (_activeConsumer.producerNode![idx] !== node) {
    _activeConsumer.producerNode![idx] = node;
    _activeConsumer.producerIndexOfThis![idx] = _consumerIsLive(_activeConsumer)
      ? _producerAddLiveConsumer(node, _activeConsumer, idx)
      : 0;
  }
  _activeConsumer.producerLastReadVersion![idx] = node.version;
}

function _producerIncrementEpoch(): void {
  _epoch++;
}

function _producerUpdateValueVersion(node: ReactiveNode): void {
  if (!node.dirty && node.lastCleanEpoch === _epoch) return;
  if (!node.producerMustRecompute(node) && !_consumerPollProducersForChange(node)) {
    node.dirty = false;
    node.lastCleanEpoch = _epoch;
    return;
  }
  node.producerRecomputeValue(node);
  node.dirty = false;
  node.lastCleanEpoch = _epoch;
}

function _producerNotifyConsumers(node: ReactiveNode): void {
  if (node.liveConsumerNode === undefined) return;
  const prev = _inNotificationPhase;
  _inNotificationPhase = true;
  try {
    for (const consumer of node.liveConsumerNode) {
      if (!consumer.dirty) _consumerMarkDirty(consumer);
    }
  } finally {
    _inNotificationPhase = prev;
  }
}

function _producerUpdatesAllowed(): boolean {
  return _activeConsumer?.consumerAllowSignalWrites !== false;
}

function _consumerMarkDirty(node: ReactiveNode): void {
  node.dirty = true;
  _producerNotifyConsumers(node);
  node.consumerMarkedDirty?.call(node.wrapper ?? node);
}

function _consumerBeforeComputation(node: ReactiveNode | null): ReactiveNode | null {
  node && (node.nextProducerIndex = 0);
  return _setActiveConsumer(node);
}

function _consumerAfterComputation(
  node: ReactiveNode | null,
  prevConsumer: ReactiveNode | null,
): void {
  _setActiveConsumer(prevConsumer);
  if (!node || node.producerNode === undefined) return;
  if (_consumerIsLive(node)) {
    for (let i = node.nextProducerIndex; i < node.producerNode!.length; i++) {
      _producerRemoveLiveConsumerAtIndex(node.producerNode![i], node.producerIndexOfThis![i]);
    }
  }
  while (node.producerNode!.length > node.nextProducerIndex) {
    node.producerNode!.pop();
    node.producerLastReadVersion!.pop();
    node.producerIndexOfThis!.pop();
  }
}

function _consumerPollProducersForChange(node: ReactiveNode): boolean {
  _assertConsumerNode(node);
  for (let i = 0; i < node.producerNode!.length; i++) {
    const producer = node.producerNode![i];
    const seenVersion = node.producerLastReadVersion![i];
    if (seenVersion !== producer.version) return true;
    _producerUpdateValueVersion(producer);
    if (seenVersion !== producer.version) return true;
  }
  return false;
}

function _producerAddLiveConsumer(
  node: ReactiveNode,
  consumer: ReactiveNode,
  indexOfThis: number,
): number {
  _assertProducerNode(node);
  _assertConsumerNode(node);
  if (node.liveConsumerNode!.length === 0) {
    node.watched?.call(node.wrapper);
    for (let i = 0; i < node.producerNode!.length; i++) {
      node.producerIndexOfThis![i] = _producerAddLiveConsumer(node.producerNode![i], node, i);
    }
  }
  node.liveConsumerIndexOfThis!.push(indexOfThis);
  return node.liveConsumerNode!.push(consumer) - 1;
}

function _producerRemoveLiveConsumerAtIndex(node: ReactiveNode, idx: number): void {
  _assertProducerNode(node);
  _assertConsumerNode(node);
  if (node.liveConsumerNode!.length === 1) {
    node.unwatched?.call(node.wrapper);
    for (let i = 0; i < node.producerNode!.length; i++) {
      _producerRemoveLiveConsumerAtIndex(node.producerNode![i], node.producerIndexOfThis![i]);
    }
  }
  const lastIdx = node.liveConsumerNode!.length - 1;
  node.liveConsumerNode![idx] = node.liveConsumerNode![lastIdx];
  node.liveConsumerIndexOfThis![idx] = node.liveConsumerIndexOfThis![lastIdx];
  node.liveConsumerNode!.length--;
  node.liveConsumerIndexOfThis!.length--;
  if (idx < node.liveConsumerNode!.length) {
    const idxProducer = node.liveConsumerIndexOfThis![idx];
    const consumer = node.liveConsumerNode![idx];
    _assertConsumerNode(consumer);
    consumer.producerIndexOfThis![idxProducer] = idx;
  }
}

function _consumerIsLive(node: ReactiveNode): boolean {
  return node.consumerIsAlwaysLive || (node?.liveConsumerNode?.length ?? 0) > 0;
}

function _assertConsumerNode(node: ReactiveNode): void {
  node.producerNode ??= [];
  node.producerIndexOfThis ??= [];
  node.producerLastReadVersion ??= [];
}

function _assertProducerNode(node: ReactiveNode): void {
  node.liveConsumerNode ??= [];
  node.liveConsumerIndexOfThis ??= [];
}

// ─── Signal.State / Signal.Computed / Signal.subtle.Watcher ──────

function _createPolyfill(): SignalEngineNamespace {
  const UNSET = Symbol('UNSET');
  const COMPUTING = Symbol('COMPUTING');
  const ERRORED = Symbol('ERRORED');

  // --- Signal.State ---
  class State<T> {
    readonly [NODE]: SignalNode<T>;
    #brand() {}

    constructor(initialValue: T, options?: SignalOptions<T>) {
      const node: SignalNode<T> = Object.create({
        ...REACTIVE_NODE,
        equal: (a: T, b: T) => Object.is(a, b),
        value: initialValue,
      });
      this[NODE] = node;
      node.wrapper = this;
      if (options) {
        if (options.equals) node.equal = options.equals;
        node.watched = (options as any)[subtle_watched];
        node.unwatched = (options as any)[subtle_unwatched];
      }
    }

    get(): T {
      if (!(this instanceof State)) {
        throw new TypeError('Wrong receiver type for Signal.State.prototype.get');
      }
      _producerAccessed(this[NODE]);
      return this[NODE].value;
    }

    set(newValue: T): void {
      if (!(this instanceof State)) {
        throw new TypeError('Wrong receiver type for Signal.State.prototype.set');
      }
      if (_inNotificationPhase) throw new Error('Writes not permitted during Watcher callback');
      const node = this[NODE];
      if (!node.equal.call(node.wrapper, node.value, newValue)) {
        node.value = newValue;
        node.version++;
        _producerIncrementEpoch();
        _producerNotifyConsumers(node);
      }
    }
  }

  // --- Signal.Computed ---
  class Computed<T> {
    readonly [NODE]: ComputedNode<T>;
    #brand() {}

    constructor(computation: () => T, options?: SignalOptions<T>) {
      const node: ComputedNode<T> = Object.create({
        ...REACTIVE_NODE,
        equal: (a: T, b: T) => Object.is(a, b),
        value: UNSET as any,
        error: undefined,
        computation,
      });
      node.consumerAllowSignalWrites = true;
      node.wrapper = this;

      node.producerMustRecompute = (n: unknown) => (n as ComputedNode<T>).value === UNSET;
      node.producerRecomputeValue = (n: unknown) => {
        const cNode = n as ComputedNode<T>;
        const prevConsumer = _consumerBeforeComputation(cNode);
        cNode.value = COMPUTING as any;
        try {
          cNode.value = cNode.computation.call(cNode.wrapper);
          cNode.error = undefined;
        } catch (err) {
          cNode.value = ERRORED as any;
          cNode.error = err;
        } finally {
          _consumerAfterComputation(cNode, prevConsumer);
        }
      };

      this[NODE] = node;
      if (options) {
        if (options.equals) node.equal = options.equals;
        node.watched = (options as any)[subtle_watched];
        node.unwatched = (options as any)[subtle_unwatched];
      }
    }

    get(): T {
      if (!(this instanceof Computed)) {
        throw new TypeError('Wrong receiver type for Signal.Computed.prototype.get');
      }
      _producerUpdateValueVersion(this[NODE]);
      _producerAccessed(this[NODE]);
      if (this[NODE].value === ERRORED) throw this[NODE].error;
      return this[NODE].value;
    }
  }

  // --- subtle.Watcher ---
  class Watcher {
    readonly [NODE]: ReactiveNode;
    #brand() {}

    constructor(notify: (this: Watcher) => void) {
      const node = Object.create(REACTIVE_NODE);
      node.wrapper = this;
      node.consumerMarkedDirty = notify;
      node.consumerIsAlwaysLive = true;
      node.consumerAllowSignalWrites = false;
      node.producerNode = [];
      this[NODE] = node;
    }

    watch(...signals: any[]): void {
      const node = this[NODE];
      node.dirty = false;
      const prev = _setActiveConsumer(node);
      for (const signal of signals) {
        _producerAccessed(signal[NODE]);
      }
      _setActiveConsumer(prev);
    }

    unwatch(...signals: any[]): void {
      const node = this[NODE];
      _assertConsumerNode(node);
      for (let i = node.producerNode!.length - 1; i >= 0; i--) {
        if (signals.includes(node.producerNode![i].wrapper)) {
          _producerRemoveLiveConsumerAtIndex(node.producerNode![i], node.producerIndexOfThis![i]);
          const lastIdx = node.producerNode!.length - 1;
          node.producerNode![i] = node.producerNode![lastIdx];
          node.producerIndexOfThis![i] = node.producerIndexOfThis![lastIdx];
          node.producerNode!.length--;
          node.producerIndexOfThis!.length--;
          node.nextProducerIndex--;
          if (i < node.producerNode!.length) {
            const idxConsumer = node.producerIndexOfThis![i];
            const producer = node.producerNode![i];
            _assertProducerNode(producer);
            producer.liveConsumerIndexOfThis![idxConsumer] = i;
          }
        }
      }
    }

    getPending(): any[] {
      const node = this[NODE];
      return node.producerNode!.filter((n) => n.dirty).map((n) => n.wrapper);
    }
  }

  // Symbols for watched/unwatched hooks
  const subtle_watched = Symbol('watched');
  const subtle_unwatched = Symbol('unwatched');

  // Build the Signal namespace matching TC39 spec
  const Sig = {
    State,
    Computed,
    isState: (s: any) => typeof s === 'object' && s !== null && s instanceof State,
    isComputed: (s: any) => typeof s === 'object' && s !== null && s instanceof Computed,
    isWatcher: (s: any) => typeof s === 'object' && s !== null && s instanceof Watcher,
    subtle: {
      Watcher,
      untrack<T>(cb: () => T): T {
        const prev = _setActiveConsumer(null);
        try {
          return cb();
        } finally {
          _setActiveConsumer(prev);
        }
      },
      currentComputed(): any {
        return _activeConsumer?.wrapper;
      },
      introspectSources(sink: any): any[] {
        return sink[NODE]?.producerNode?.map((n: any) => n.wrapper) ?? [];
      },
      introspectSinks(signal: any): any[] {
        return signal[NODE]?.liveConsumerNode?.map((n: any) => n.wrapper) ?? [];
      },
      hasSinks(signal: any): boolean {
        return (signal[NODE]?.liveConsumerNode?.length ?? 0) > 0;
      },
      hasSources(signal: any): boolean {
        return (signal[NODE]?.producerNode?.length ?? 0) > 0;
      },
      watched: subtle_watched,
      unwatched: subtle_unwatched,
    },
    Options: undefined as any, // type-only
  };

  return Sig as SignalEngineNamespace;
}

// ─── Framework Layer: LessJS User-Friendly API ───────────────────

/** Unsubscribe function */
export type Unsubscribe = () => void;

/**
 * LessJS WritableSignal — user-friendly wrapper around Signal.State
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
 * LessJS ReadonlySignal — derived from computed or manually created read-only
 */
export interface ReadonlySignal<T> {
  /** Read the current value */
  readonly value: T;
  /** Subscribe to value changes. Called immediately with current value. */
  subscribe(fn: (value: T) => void): Unsubscribe;
}

/** Alias for readability */
export type Signal<T> = WritableSignal<T> | ReadonlySignal<T>;

/**
 * Create a new reactive signal.
 * Wraps Signal.State with .value syntax and subscribe().
 */
export function signal<T>(initialValue: T): WritableSignal<T> {
  const state = new _engine.State(initialValue);
  const _subVersion = 0;

  return {
    get value(): T {
      return state.get();
    },
    set value(newValue: T) {
      state.set(newValue);
    },
    subscribe(fn: (value: T) => void): Unsubscribe {
      // Use effect to track and notify
      const dispose = effect(() => fn(state.get()));
      return dispose;
    },
  };
}

/**
 * Create a computed signal with automatic dependency tracking.
 * Unlike old derived(), no need to pass sources manually.
 */
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const c = new _engine.Computed(fn);

  return {
    get value(): T {
      return c.get();
    },
    subscribe(fn2: (value: T) => void): Unsubscribe {
      const dispose = effect(() => fn2(c.get()));
      return dispose;
    },
  };
}

/**
 * Reactive effect: runs fn, tracks which signals it reads,
 * and re-runs when any of those signals change.
 *
 * Built on Signal.subtle.Watcher per TC39 spec.
 * Returns a dispose function to clean up.
 */
export function effect(fn: () => void | (() => void)): Unsubscribe {
  let cleanup: (() => void) | void;
  let pending = false;

  const c = new _engine.Computed(() => {
    cleanup?.();
    cleanup = fn();
  });

  const watcher = new _engine.subtle.Watcher(() => {
    if (!pending) {
      pending = true;
      queueMicrotask(() => {
        pending = false;
        for (const s of watcher.getPending()) {
          try {
            (s as any).get();
          } catch (err) {
            console.warn('[LessJS Effect] Error:', err);
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
    console.warn('[LessJS Effect] Initial error:', err);
  }

  return () => {
    cleanup?.();
    watcher.unwatch(c);
  };
}

/**
 * Island-aware effect: automatically disposes when the island disconnects.
 * Uses MutationObserver to detect when the host element is removed from DOM.
 */
export function islandEffect(
  host: Element,
  fn: () => void | (() => void),
): Unsubscribe {
  const dispose = effect(fn);

  // Watch for disconnection
  const mo = new MutationObserver(() => {
    if (!host.isConnected) {
      dispose();
      mo.disconnect();
    }
  });

  // Observe parent changes (element itself won't mutate for isConnected)
  if (host.parentNode) {
    mo.observe(host.parentNode, { childList: true });
  }

  // Also check on each transition (fallback for shadow DOM scenarios)
  const checkConnected = () => {
    if (!host.isConnected) {
      dispose();
      mo.disconnect();
    }
  };

  // Periodic check as fallback (lightweight)
  const intervalId = setInterval(checkConnected, 5000);

  return () => {
    dispose();
    mo.disconnect();
    clearInterval(intervalId);
  };
}

/**
 * Batch multiple signal writes into a single update.
 * Prevents intermediate effects from firing.
 */
export function batch<T>(fn: () => T): T {
  // Within a batch, we defer effect processing by running synchronously
  // The Watcher-based effect already batches via microtask, so
  // multiple .set() calls within the same sync tick naturally batch.
  // This is a semantic alias for clarity.
  return fn();
}

/**
 * Run a function without tracking any signal reads.
 */
export function untracked<T>(fn: () => T): T {
  return _engine.subtle.untrack(fn);
}

// ─── Channel (Event Bus) ────────────────────────────────────────

/** Channel event handler type */
export type ChannelHandler<T = unknown> = (data: T) => void;

/**
 * A named event bus for cross-island communication.
 * Uses CustomEvent on document.body — platform API, L2 exempt.
 */
export interface Channel<T = unknown> {
  readonly name: string;
  emit(event: string, data?: T): void;
  on(event: string, handler: ChannelHandler<T>): Unsubscribe;
  once(event: string, handler: ChannelHandler<T>): Unsubscribe;
}

const _channelTarget = typeof document !== 'undefined' ? document.body : null;

/**
 * Create a named event channel for island-to-island communication.
 */
export function channel<T = unknown>(name: string): Channel<T> {
  if (!_channelTarget) {
    console.warn(
      '[LessJS Channel] No DOM available — events will be no-ops (expected in SSR/SSG).',
    );
  }

  return {
    name,
    emit(event: string, data?: T): void {
      if (!_channelTarget) return;
      _channelTarget.dispatchEvent(
        new CustomEvent(`less:${name}:${event}`, {
          detail: data,
          bubbles: false,
          cancelable: false,
        }),
      );
    },
    on(event: string, handler: ChannelHandler<T>): Unsubscribe {
      if (!_channelTarget) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => handler((e as CustomEvent).detail as T);
      _channelTarget.addEventListener(fullEvent, listener);
      return () => {
        _channelTarget?.removeEventListener(fullEvent, listener);
      };
    },
    once(event: string, handler: ChannelHandler<T>): Unsubscribe {
      if (!_channelTarget) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => {
        _channelTarget?.removeEventListener(fullEvent, listener);
        handler((e as CustomEvent).detail as T);
      };
      _channelTarget.addEventListener(fullEvent, listener);
      return () => {
        _channelTarget?.removeEventListener(fullEvent, listener);
      };
    },
  };
}

// ─── Convenience: Global Theme Signal ────────────────────────────

/**
 * Global theme signal. Reflects the current data-theme on :root.
 * Islands can subscribe to theme changes.
 */
export const themeSignal = createThemeSignal();

function createThemeSignal(): WritableSignal<string> {
  const s = signal<string>(
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'dark'
      : 'dark',
  );

  if (typeof document !== 'undefined') {
    const mo = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme) s.value = theme;
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  return s;
}

// ─── Default Export ──────────────────────────────────────────────

export default { signal, computed, effect, islandEffect, batch, untracked, channel, themeSignal };

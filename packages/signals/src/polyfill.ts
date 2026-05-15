/**
 * @lessjs/signals - TC39 Signal Polyfill Implementation
 *
 * Internal polyfill for Signal.State / Signal.Computed / Signal.subtle.Watcher.
 * Used when the browser does not provide native Signal support.
 * When browsers ship native Signal, this module becomes dead code.
 *
 * @module @lessjs/signals/polyfill
 */

import {
  type ComputedNode,
  NODE,
  type ReactiveNode,
  type SignalEngineNamespace,
  type SignalNode,
  type SignalOptions,
} from './engine.ts';

// ─── Module-level state ──────────────────────────────────────────

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

// ─── Internal helpers ────────────────────────────────────────────

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

// v0.14.3: Added overflow protection — reset epoch before MAX_SAFE_INTEGER
// to prevent stale computed signals from not recalculating.
function _producerIncrementEpoch(): void {
  _epoch++;
  if (_epoch > Number.MAX_SAFE_INTEGER - 1000) {
    _epoch = 1;
  }
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
  // v0.14.6: Guard against index out of bounds (duplicate unwatch calls)
  if (idx < 0 || idx >= (node.liveConsumerNode?.length ?? 0)) return;
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

// ─── Module-level sentinel symbols ───────────────────────────────
// v0.14.3 N-8: Moved from inside _createPolyfill to module scope so they
// are created once (not per-call). If _createPolyfill is called more than
// once (e.g., in tests), the sentinels remain consistent across instances.
const _UNSET = Symbol('UNSET');
const _COMPUTING = Symbol('COMPUTING');
const _ERRORED = Symbol('ERRORED');

// v0.14.6 N-5: Symbols for watched/unwatched hooks moved to module scope
// so they are created once and shared across all _createPolyfill() calls.
const subtle_watched = Symbol('watched');
const subtle_unwatched = Symbol('unwatched');

// ─── _createPolyfill: Signal.State / Signal.Computed / Signal.subtle.Watcher ──

export function _createPolyfill(): SignalEngineNamespace {
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
        value: _UNSET as any,
        error: undefined,
        computation,
      });
      node.consumerAllowSignalWrites = true;
      node.wrapper = this;

      node.producerMustRecompute = (n: unknown) => (n as ComputedNode<T>).value === _UNSET;
      node.producerRecomputeValue = (n: unknown) => {
        const cNode = n as ComputedNode<T>;
        const prevConsumer = _consumerBeforeComputation(cNode);
        cNode.value = _COMPUTING as any;
        try {
          cNode.value = cNode.computation.call(cNode.wrapper);
          cNode.error = undefined;
        } catch (err) {
          cNode.value = _ERRORED as any;
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
      if (this[NODE].value === _ERRORED) throw this[NODE].error;
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

  // Build the Signal namespace matching TC39 spec
  const Sig = {
    State,
    Computed,
    // deno-lint-ignore no-explicit-any
    isState: (s: any) => typeof s === 'object' && s !== null && s instanceof State,
    // deno-lint-ignore no-explicit-any
    isComputed: (s: any) => typeof s === 'object' && s !== null && s instanceof Computed,
    // deno-lint-ignore no-explicit-any
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
      // deno-lint-ignore no-explicit-any
      currentComputed(): any {
        return _activeConsumer?.wrapper;
      },
      // deno-lint-ignore no-explicit-any
      introspectSources(sink: any): any[] {
        return sink[NODE]?.producerNode?.map((n: any) => n.wrapper) ?? [];
      },
      // deno-lint-ignore no-explicit-any
      introspectSinks(signal: any): any[] {
        return signal[NODE]?.liveConsumerNode?.map((n: any) => n.wrapper) ?? [];
      },
      // deno-lint-ignore no-explicit-any
      hasSinks(signal: any): boolean {
        return (signal[NODE]?.liveConsumerNode?.length ?? 0) > 0;
      },
      // deno-lint-ignore no-explicit-any
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

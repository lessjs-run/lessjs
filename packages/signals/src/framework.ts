/**
 * @lessjs/signals - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * v0.22: Alien Signals is the default engine. Falls back to TC39 polyfill
 * if alien-signals is not installed.
 *
 * @module @lessjs/signals/framework
 */

import { _engine, _log } from './engine.ts';
import type { ReadonlySignal, Unsubscribe, WritableSignal } from './types.ts';
import type { SignalEngine } from '@lessjs/core/signals';

// ─── Lazy engine init (alien default, TC39 fallback) ───────────
let _signalEngine: SignalEngine | null = null;
let _engineInit: Promise<void> | null = null;

async function _ensureSignalEngine(): Promise<SignalEngine> {
  if (_signalEngine) return _signalEngine;
  if (!_engineInit) {
    _engineInit = (async () => {
      try {
        const { createDefaultEngine } = await import('./alien-engine.ts');
        const engine = await createDefaultEngine();
        if (engine) {
          _signalEngine = engine;
          return;
        }
      } catch { /* fallback */ }
      // Fallback to TC39 polyfill
      _signalEngine = _tc39Engine;
    })();
  }
  await _engineInit;
  return _signalEngine!;
}

const _tc39Engine: SignalEngine = {
  signal<T>(initialValue: T) {
    const state = new _engine.State(initialValue);
    return {
      get value(): T {
        return state.get();
      },
      set value(n: T) {
        state.set(n);
      },
      subscribe(fn: (v: T) => void) {
        return effect(() => fn(state.get()));
      },
    };
  },
  computed<T>(fn: () => T) {
    const c = new _engine.Computed(fn);
    return {
      get value(): T {
        return c.get();
      },
      subscribe(fn2: (v: T) => void) {
        return effect(() => fn2(c.get()));
      },
    };
  },
  effect(fn: () => void | (() => void)) {
    return _tc39Effect(fn);
  },
};

function _tc39Effect(fn: () => void | (() => void)): Unsubscribe {
  let cleanup: (() => void) | void;
  let pendingCount = 0;

  const c = new _engine.Computed(() => {
    try {
      cleanup?.();
    } catch (e) {
      console.warn('[LessJS/Signal] effect cleanup threw:', e);
    }
    cleanup = fn();
  });

  const watcher = new _engine.subtle.Watcher(() => {
    pendingCount++;
    if (pendingCount === 1) {
      queueMicrotask(() => {
        pendingCount = 0;
        let pendingSignals: unknown[];
        while ((pendingSignals = watcher.getPending()).length > 0) {
          for (const s of pendingSignals) {
            try {
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

// ─── Signal Engine (sync) ──────────────────────────────────────
// For sync usage (signal/computed), prefer alien if ready,
// otherwise use TC39. Both return .value-compatible objects.

export function signal<T>(initialValue: T): WritableSignal<T> {
  const e = _signalEngine ?? _tc39Engine;
  return e.signal(initialValue) as WritableSignal<T>;
}

export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const e = _signalEngine ?? _tc39Engine;
  return e.computed(fn) as ReadonlySignal<T>;
}

export function effect(fn: () => void | (() => void)): Unsubscribe {
  const e = _signalEngine ?? _tc39Engine;
  return e.effect(fn);
}

// Kick off alien engine load (non-blocking)
_ensureSignalEngine();

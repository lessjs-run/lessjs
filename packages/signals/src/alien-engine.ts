/**
 * @openelement/signals - Alien Signals Engine Adapter.
 *
 * v0.22 (SOP-004): Default engine using alien-signals.
 * v0.22.1: TC39 polyfill removed. alien-signals is the only engine.
 *
 * Alien Signals (1.6KB) is a lightweight reactive library with push-pull
 * hybrid architecture, used by Vue 3.6 core and XState.
 *
 * ## Design (SOP-004 § Signals Facade)
 * - Alien is the ONLY engine.
 * - alien-signals is a hard dependency.
 *
 * @module @openelement/signals/alien-engine
 */

import { computed as _c, effect as _e, signal as _s } from 'alien-signals';
import type { SignalEngine } from './types.ts';

// ─── Adapter (synchronous wrapper around alien-signals API) ─────

/**
 * Minimal interface for alien-signals module.
 */
interface AlienSignalsModule {
  signal<T>(v: T): { (): T; (v: T): void };
  computed<T>(fn: () => T): { (): T };
  effect(fn: () => void): () => void;
}

/**
 * Create a SignalEngine backed by alien-signals.
 */
export function createAlienEngine(
  alienMod: AlienSignalsModule,
): SignalEngine {
  return {
    signal<T>(initialValue: T) {
      const s = alienMod.signal(initialValue);
      return {
        get value(): T {
          return s();
        },
        set value(v: T) {
          s(v);
        },
        subscribe(fn: (value: T) => void): () => void {
          const e = alienMod.effect(() => fn(s()));
          return () => e();
        },
      };
    },

    computed<T>(fn: () => T) {
      const c = alienMod.computed(fn);
      return {
        get value(): T {
          return c();
        },
        subscribe(fn2: (value: T) => void): () => void {
          const e = alienMod.effect(() => fn2(c()));
          return () => e();
        },
      };
    },

    effect(fn: () => void | (() => void)) {
      let cleanup: (() => void) | void;
      const e = alienMod.effect(() => {
        try {
          cleanup?.();
        } catch { /* swallow */ }
        cleanup = fn() as (() => void) | void;
      });
      return () => {
        try {
          cleanup?.();
        } catch { /* swallow */ }
        e();
      };
    },
  };
}

// ─── Default Engine (sync) ──────────────────────────────────────

const _defaultAlienMod: AlienSignalsModule = { signal: _s, computed: _c, effect: _e };

/**
 * Get the default signal engine.
 *
 * v0.22.1: Always returns alien-signals engine (sync).
 * alien-signals is a hard dependency — there is no fallback.
 */
export function createDefaultEngine(): SignalEngine {
  return createAlienEngine(_defaultAlienMod);
}

/**
 * @lessjs/signals - Experimental Alien Signals Engine Adapter.
 *
 * v0.22 (SOP-004): Experimental alternative engine using alien-signals.
 *
 * This is NOT the default engine. To enable, set the environment variable:
 *   LESSJS_SIGNALS_ENGINE=alien
 *
 * Alien Signals is a lightweight (1.5KB) reactive library with push-pull
 * hybrid architecture. It has a different API surface than the TC39 Signal
 * proposal, so this module adapts it to the SignalEngine interface.
 *
 * ## Design (SOP-004 § Signals Facade)
 * - This module is experimental and behind a feature flag.
 * - Alien Signals is an optional peer dependency — never a hard import.
 * - If alien-signals is not installed, the engine gracefully falls back
 *   to the default TC39 engine with a warning.
 * - The adapter is self-contained: framework.ts and sugar.ts are unchanged.
 *
 * @module @lessjs/signals/alien-engine
 */

import type { SignalEngine } from '@lessjs/core/signals';

// ─── Adapter (synchronous wrapper around alien-signals API) ─────

/**
 * Minimal interface for alien-signals module.
 *
 * This avoids `typeof import('alien-signals')` which requires the optional
 * dependency to be installed for type-checking. Instead we define only the
 * API surface the adapter needs.
 */
interface AlienSignalsModule {
  signal<T>(v: T): { get(): T; set(v: T): void };
  computed<T>(fn: () => T): { get(): T };
  effect(fn: () => void): { stop(): void };
}

/**
 * Create a SignalEngine backed by alien-signals.
 *
 * This wraps alien-signals' API (e.g. `alienSignal(v)`, `alienComputed(fn)`,
 * `alienEffect(fn)`) into the LessJS SignalEngine interface (`.value` syntax,
 * `subscribe()`).
 *
 * The adaptation layer adds ~200 bytes of code — the entire solution
 * (alien-signals + adapter) is approximately 1.7KB, compared to ~3KB
 * for the TC39 polyfill.
 *
 * @param alienMod - The resolved alien-signals module (passed explicitly
 *   to avoid dynamic import inside the synchronous adapter).
 */
export function createAlienEngine(
  alienMod: AlienSignalsModule,
): SignalEngine {
  return {
    signal<T>(initialValue: T) {
      // alien-signals: alienSignal(v) returns { get: () => T, set: (v: T) => void }
      const s = alienMod.signal(initialValue);
      return {
        get value(): T {
          return s.get();
        },
        set value(v: T) {
          s.set(v);
        },
        subscribe(fn: (value: T) => void): () => void {
          // alien-signals: alienEffect(() => fn(s.get())) returns { stop: () => void }
          const e = alienMod.effect(() => fn(s.get()));
          return () => e.stop();
        },
      };
    },

    computed<T>(fn: () => T) {
      // alien-signals: alienComputed(fn) returns { get: () => T }
      const c = alienMod.computed(fn);
      return {
        get value(): T {
          return c.get();
        },
        subscribe(fn2: (value: T) => void): () => void {
          const e = alienMod.effect(() => fn2(c.get()));
          return () => e.stop();
        },
      };
    },

    effect(fn: () => void | (() => void)) {
      // alien-signals: alienEffect(fn) returns { stop: () => void }
      // alien-signals effect does NOT support cleanup functions natively.
      // We wrap to add cleanup support.
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
        e.stop();
      };
    },
  };
}

// ─── Engine Selection ───────────────────────────────────────────

/**
 * Get the active signal engine based on environment configuration.
 *
 * Priority:
 *   1. LESSJS_SIGNALS_ENGINE env var (if set)
 *   2. Native browser Signal (if available)
 *   3. Default TC39 polyfill (always available)
 *
 * This is used by the framework layer in engine.ts to select the
 * engine at runtime without breaking existing imports.
 */
export async function getAlienEngineIfRequested(): Promise<SignalEngine | null> {
  if (typeof process !== 'undefined' && process.env?.LESSJS_SIGNALS_ENGINE === 'alien') {
    try {
      const alienMod = await import('alien-signals');
      return createAlienEngine(alienMod);
    } catch (e) {
      console.error(
        '[LessJS/Signals] Failed to initialize alien engine:',
        e instanceof Error ? e.message : String(e),
      );
      return null;
    }
  }
  return null;
}

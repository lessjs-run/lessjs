/**
 * @lessjs/signals - Reactive signals powered by alien-signals.
 *
 * v0.22: Alien-signals is the sole engine. TC39 polyfill removed.
 *
 * Architecture:
 *   Engine layer    -> alien-signals adapter (alien-engine.ts)
 *   Framework layer -> User-friendly API: signal(), computed(), effect()
 *
 * @module @lessjs/signals
 */

// ─── Public types ───────────────────────────────────────────────
export type { ReadonlySignal, Signal, Unsubscribe, WritableSignal } from './types.ts';

// ─── SignalEngine facade (SOP-004) ──────────────────────────────
export type { SignalEngine } from '@lessjs/core/signals';

// ─── Alien engine (default) ─────────────────────────────────────
export { createAlienEngine, createDefaultEngine } from './alien-engine.ts';

// ─── Framework layer ────────────────────────────────────────────
export { computed, effect, signal } from './framework.ts';

// ─── Default export (tree-shakeable) ────────────────────────────
import { computed, effect, signal } from './framework.ts';

export default { signal, computed, effect };

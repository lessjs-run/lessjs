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
export type { ReadonlySignal, Signal, SignalEngine, Unsubscribe, WritableSignal } from './types.ts';

// ─── Alien engine (default) ─────────────────────────────────────
export { createAlienEngine, createDefaultEngine } from './alien-engine.ts';

// ─── Framework layer ────────────────────────────────────────────
export { computed, effect, effectScope, signal } from './framework.ts';

// ─── Default export (tree-shakeable) ────────────────────────────
import { computed, effect, signal } from './framework.ts';

export default { signal, computed, effect };

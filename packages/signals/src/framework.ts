/**
 * @openelement/signals - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * v0.22.1: Alien Signals is the only engine. TC39 polyfill removed.
 * effectScope exposes component-level effect lifecycle management.
 *
 * @module @openelement/signals/framework
 */

import { effectScope as _es } from 'alien-signals';
import { createDefaultEngine } from './alien-engine.ts';
import type { SignalEngine } from './types.ts';

// ─── Engine (sync — alien-signals is hard dependency) ───────────
const engine: SignalEngine = createDefaultEngine();

export const signal: SignalEngine['signal'] = engine.signal.bind(engine);
export const computed: SignalEngine['computed'] = engine.computed.bind(engine);
export const effect: SignalEngine['effect'] = engine.effect.bind(engine);

// ─── Alien-signals advanced primitives ──────────────────────────

/**
 * Create an effect scope. All effects created inside the scope
 * are automatically captured as children. The returned dispose
 * function cleans up all captured effects — a single call
 * replaces manual AbortController and signal subscriber tracking.
 */
export function effectScope(fn: () => void): () => void {
  return _es(fn);
}

/**
 * @lessjs/signals - Framework Layer
 *
 * Developer-friendly API wrapping the engine.
 * signal(), computed(), effect() - the primary API surface.
 *
 * v0.22.1: Alien Signals is the only engine. TC39 polyfill removed.
 *
 * @module @lessjs/signals/framework
 */

import { createDefaultEngine } from './alien-engine.ts';
import type { SignalEngine } from '@lessjs/core/signals';

// ─── Engine (sync — alien-signals is hard dependency) ───────────
const engine: SignalEngine = createDefaultEngine();

export const signal: SignalEngine['signal'] = engine.signal.bind(engine);
export const computed: SignalEngine['computed'] = engine.computed.bind(engine);
export const effect: SignalEngine['effect'] = engine.effect.bind(engine);

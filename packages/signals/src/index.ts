/**
 * @lessjs/signals - Reactive signals for Island-to-Island communication.
 *
 * v0.6': Based on TC39 signal-polyfill (Apache-2.0 / MIT)
 * Engine: Signal.State + Signal.Computed + Signal.subtle.Watcher
 * Framework API: signal(), computed(), effect(), islandEffect(), channel(), themeSignal
 *
 * When browser natively supports Signal, engine auto-switches to native.
 *
 * Architecture (3 layers):
 *   Engine layer    -> TC39 Signal primitives (polyfill or native)
 *   Framework layer -> User-friendly API (.value syntax, subscribe)
 *   Sugar layer     -> islandEffect(), channel(), themeSignal
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

export type {
  Channel,
  ChannelHandler,
  ReadonlySignal,
  Signal,
  Unsubscribe,
  WritableSignal,
} from './types.ts';

export { computed, effect, signal } from './framework.ts';
export { batch, channel, islandEffect, isNativeSignal, themeSignal, untracked } from './sugar.ts';

// Default export for convenient import - tree-shakable since bundlers
// eliminate the default object when only named imports are used.
import { computed, effect, signal } from './framework.ts';
import { batch, channel, islandEffect, isNativeSignal, themeSignal, untracked } from './sugar.ts';

export default {
  signal,
  computed,
  effect,
  islandEffect,
  batch,
  untracked,
  channel,
  themeSignal,
  isNativeSignal,
};

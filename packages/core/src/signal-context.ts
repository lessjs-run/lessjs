/**
 * @lessjs/core - SignalContext — DOM-tree-based cross-component signal sharing.
 *
 * v0.25.0 (SOP-005): Provider exposes symbolic property on host element.
 * Consumer walks parentElement / shadowRoot.host upward to find it.
 * Returns a signal so effect() auto-tracks dependencies.
 *
 * ~20 lines, zero new dependencies. Reuses existing alien-signals + DOM APIs.
 *
 * @module @lessjs/core/signal-context
 */

import { signal } from '@lessjs/signals';

export interface Context<T> {
  key: symbol;
  defaultValue: T;
}

type SignalValue<T> = { value: T; subscribe(fn: (v: T) => void): () => void };

const defaultSignals = new Map<symbol, unknown>();
const hostSignals = new WeakMap<object, Map<symbol, unknown>>();

export function createContext<T>(key: symbol, defaultValue: T): Context<T> {
  const s = signal<T>(defaultValue);
  defaultSignals.set(key, s);
  return { key, defaultValue };
}

function getHostSignal<T>(
  host: object,
  ctx: Context<T>,
  initialValue: T,
): SignalValue<T> {
  let map = hostSignals.get(host);
  if (!map) {
    map = new Map<symbol, unknown>();
    hostSignals.set(host, map);
  }
  let scoped = map.get(ctx.key) as SignalValue<T> | undefined;
  if (!scoped) {
    scoped = signal<T>(initialValue) as unknown as SignalValue<T>;
    map.set(ctx.key, scoped);
  }
  return scoped;
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: Context<T>,
  value: T,
): void {
  const scoped = getHostSignal(host, ctx, value);
  scoped.value = value;
  (host as unknown as Record<symbol, unknown>)[ctx.key] = scoped;
}

function findProvidedSignal<T>(
  host: HTMLElement | undefined,
  ctx: Context<T>,
): SignalValue<T> | undefined {
  let current: Node | null | undefined = host;
  while (current) {
    const candidate = (current as unknown as Record<symbol, unknown>)[ctx.key];
    if (candidate && typeof candidate === 'object' && 'value' in candidate) {
      return candidate as SignalValue<T>;
    }
    current = current.parentNode;
    if (!current) {
      const root = host?.getRootNode?.();
      current = root instanceof ShadowRoot ? root.host : null;
    }
  }
  return undefined;
}

/**
 * Consume a SignalContext value reactively.
 *
 * Returns the nearest scoped signal, then the default context signal.
 * not a copy. provideContext updates Map signal → consumer effect()
 * auto-tracks → DOM updates. No DOM walking needed.
 */
export function consumeContext<T>(
  ctx: Context<T>,
  host?: HTMLElement,
): SignalValue<T> {
  const scoped = findProvidedSignal(host, ctx);
  if (scoped) {
    return scoped;
  }
  const s = defaultSignals.get(ctx.key);
  if (s) return s as SignalValue<T>;
  return signal(ctx.defaultValue) as unknown as SignalValue<T>;
}

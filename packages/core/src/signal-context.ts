/**
 * @lessjs/core - SignalContext — DOM-tree-based cross-component signal sharing.
 *
 * v0.29.6: WeakMap replaces symbol-keyed DOM property stamping.
 * Consumer walks parentElement / shadowRoot.host upward to find signals.
 *
 * @module @lessjs/core/signal-context
 */

import { type Signal, signal } from '@lessjs/signals';

export interface Context<T> {
  key: symbol;
  defaultValue: T;
}

const defaultSignals = new Map<symbol, Signal<unknown>>();
const hostSignals = new WeakMap<object, Map<symbol, Signal<unknown>>>();

export function createContext<T>(key: symbol, defaultValue: T): Context<T> {
  const s = signal<T>(defaultValue);
  defaultSignals.set(key, s as Signal<unknown>);
  return { key, defaultValue };
}

function getOrCreateHostSignal<T>(
  host: object,
  ctx: Context<T>,
  initialValue: T,
): Signal<T> {
  let map = hostSignals.get(host);
  if (!map) {
    map = new Map();
    hostSignals.set(host, map);
  }
  let scoped = map.get(ctx.key) as Signal<T> | undefined;
  if (!scoped) {
    scoped = signal<T>(initialValue);
    map.set(ctx.key, scoped as Signal<unknown>);
  }
  return scoped;
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: Context<T>,
  value: T,
): void {
  const scoped = getOrCreateHostSignal(host, ctx, value);
  scoped.value = value;
}

function findProvidedSignal<T>(
  host: HTMLElement | undefined,
  ctx: Context<T>,
): Signal<T> | undefined {
  let current: Node | null | undefined = host;
  while (current) {
    const store = hostSignals.get(current as object);
    if (store) {
      const candidate = store.get(ctx.key);
      if (candidate) return candidate as Signal<T>;
    }
    current = current.parentNode;
    if (!current) {
      const root = host?.getRootNode?.();
      current = root instanceof ShadowRoot ? root.host : null;
    }
  }
  return undefined;
}

export function consumeContext<T>(
  ctx: Context<T>,
  host?: HTMLElement,
): Signal<T> {
  const scoped = findProvidedSignal(host, ctx);
  if (scoped) return scoped;
  const s = defaultSignals.get(ctx.key);
  if (s) return s as Signal<T>;
  return signal(ctx.defaultValue);
}

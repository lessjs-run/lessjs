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

const contexts = new Map<symbol, unknown>();

export function createContext<T>(key: symbol, defaultValue: T): Context<T> {
  const s = signal<T>(defaultValue);
  contexts.set(key, s);
  return { key, defaultValue };
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: Context<T>,
  value: T,
): void {
  const s = contexts.get(ctx.key);
  if (s && typeof s === 'object' && 'value' in s) {
    (s as { value: T }).value = value;
  }
  (host as unknown as Record<symbol, unknown>)[ctx.key] = value;
}

export function consumeContext<T>(
  host: HTMLElement,
  ctx: Context<T>,
): { value: T; subscribe(fn: (v: T) => void): () => void } {
  let el: Element | null = host.parentElement;
  while (el) {
    const v = (el as unknown as Record<symbol, unknown>)[ctx.key];
    if (v !== undefined) {
      return signal(v as T) as unknown as { value: T; subscribe(fn: (v: T) => void): () => void };
    }
    el = el.parentElement || ((el.getRootNode() as ShadowRoot)?.host ?? null);
  }
  return signal(ctx.defaultValue) as unknown as {
    value: T;
    subscribe(fn: (v: T) => void): () => void;
  };
}

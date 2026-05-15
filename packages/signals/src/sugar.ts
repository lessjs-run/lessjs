/**
 * @lessjs/signals - Sugar Layer
 *
 * Higher-level APIs built on framework.ts:
 * islandEffect, batch, untracked, channel, themeSignal.
 *
 * @module @lessjs/signals/sugar
 */

import { _engine } from './engine.ts';
import { effect, signal } from './framework.ts';
import type { Channel, ChannelHandler, Unsubscribe, WritableSignal } from './types.ts';

/**
 * Island-aware effect: automatically disposes when the island disconnects.
 */
export function islandEffect(
  host: Element,
  fn: () => void | (() => void),
): Unsubscribe {
  let disposed = false;

  const disposeEffect = effect(fn);

  function teardown() {
    if (disposed) return;
    disposed = true;
    disposeEffect();
    mo.disconnect();
    clearInterval(intervalId);
  }

  const mo = new MutationObserver(() => {
    if (!host.isConnected) teardown();
  });

  function observeParent() {
    mo.disconnect();
    const parent = host.parentElement ?? host.parentNode;
    if (parent) {
      mo.observe(parent, { childList: true });
    }
  }
  observeParent();

  // v0.14.5: Track last parent to avoid unnecessary MO reconnect
  let lastParent = host.parentElement ?? host.parentNode;

  // Periodic check for two edge cases that MutationObserver alone cannot cover:
  // 1. The element is moved to a new parent — MO still watches the old parent
  //    (there's no DOM event for "element reparented")
  // 2. MO fails silently in certain edge cases (extremely rare in modern browsers)
  // A 30-second interval is a lightweight safety net for these scenarios.
  const intervalId = setInterval(() => {
    if (!host.isConnected) {
      teardown();
    } else {
      // Only re-observe if parent changed since last check
      const currentParent = host.parentElement ?? host.parentNode;
      if (currentParent !== lastParent) {
        lastParent = currentParent;
        observeParent();
      }
    }
  }, 30000);

  return teardown;
}

/**
 * @deprecated
 * Current implementation is a no-op placeholder until the TC39 Signal
 * specification finalizes native batching support. At that point, this
 * function will be updated to batch multiple signal writes into a single
 * reactive update.
 *
 * Using this function currently provides no optimization benefit.
 * You can safely remove calls to batch() without changing behavior.
 */
export function batch<T>(fn: () => T): T {
  return fn();
}

/**
 * Run a function without tracking any signal reads.
 */
export function untracked<T>(fn: () => T): T {
  return _engine.subtle.untrack(fn);
}

// ─── Channel (Event Bus) ────────────────────────────────────────

// M-05 fix: Lazy getter for _getChannelTarget() — deferred until first access,
// so SSR environments don't capture null at module load time.
let _channelTargetCache: EventTarget | null | undefined = undefined;
function _getChannelTarget(): EventTarget | null {
  if (_channelTargetCache === undefined) {
    _channelTargetCache = typeof document !== 'undefined' ? document.body : null;
  }
  return _channelTargetCache;
}

/**
 * Create a named event channel for island-to-island communication.
 */
export function channel<T = unknown>(name: string): Channel<T> {
  if (!_getChannelTarget()) {
    console.warn(
      '[LessJS/Signal] No DOM available — channel events will be no-ops (expected in SSR/SSG).',
    );
  }

  return {
    name,
    emit(event: string, data?: T): void {
      if (!_getChannelTarget()) return;
      _getChannelTarget()!.dispatchEvent(
        new CustomEvent(`less:${name}:${event}`, {
          detail: data,
          bubbles: false,
          cancelable: false,
        }),
      );
    },
    on(event: string, handler: ChannelHandler<T>): Unsubscribe {
      const target = _getChannelTarget();
      if (!target) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => handler((e as CustomEvent).detail as T);
      target.addEventListener(fullEvent, listener);
      return () => {
        target.removeEventListener(fullEvent, listener);
      };
    },
    once(event: string, handler: ChannelHandler<T>): Unsubscribe {
      const target = _getChannelTarget();
      if (!target) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => {
        target.removeEventListener(fullEvent, listener);
        handler((e as CustomEvent).detail as T);
      };
      target.addEventListener(fullEvent, listener);
      return () => {
        target.removeEventListener(fullEvent, listener);
      };
    },
  };
}

// ─── Convenience: Global Theme Signal ────────────────────────────

function createThemeSignal(): WritableSignal<string> {
  const s = signal<string>(
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'dark'
      : 'dark',
  );

  // M-03 fix: Expose cleanup so MutationObserver can be disconnected in tests
  if (typeof document !== 'undefined') {
    const mo = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme) s.value = theme;
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // Expose cleanup for test environments
    (s as WritableSignal<string> & { _cleanupThemeSignal?: () => void })
      ._cleanupThemeSignal = () => mo.disconnect();
  }

  return s;
}

/**
 * Global theme signal. Reflects the current data-theme on :root.
 */
export const themeSignal: WritableSignal<string> = createThemeSignal();

/**
 * Returns true if using browser-native Signal implementation.
 */
export function isNativeSignal(): boolean {
  // deno-lint-ignore no-explicit-any
  return typeof (globalThis as any).Signal !== 'undefined';
}

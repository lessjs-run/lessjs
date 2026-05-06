/**
 * @lessjs/signals - Reactive signals for Island-to-Island communication.
 *
 * v0.6: Minimal signals library that enables islands to communicate
 * without direct DOM references (L2 Island Communication constraints).
 *
 * Architecture:
 *   - Signal<T>: A reactive value that notifies subscribers on change.
 *     Islands can share signals to coordinate state without DOM access.
 *   - Channel: A named event bus for cross-island messaging.
 *     Uses CustomEvent internally — platform API, no framework dependency.
 *
 * LessJS L2 Island Communication Rules:
 *   1. Islands must not reference each other's shadow DOM directly.
 *   2. Islands communicate through shared signals or channel events.
 *   3. Signals are independent of any DOM lifecycle.
 *   4. Infrastructure APIs (localStorage, document.documentElement,
 *      IntersectionObserver, CustomEvent) are exempt from L2 constraints.
 *
 * Usage:
 * ```ts
 * import { signal, channel } from '@lessjs/signals';
 *
 * // Shared signal for island state
 * const count$ = signal(0);
 *
 * // Island A: writes to signal
 * count$.value = count$.value + 1;
 *
 * // Island B (any component): reads signal reactively
 * count$.subscribe(newVal => console.log('Count:', newVal));
 * ```
 *
 * Channel-based communication:
 * ```ts
 * const navChannel = channel('navigation');
 *
 * // Island A emits event
 * navChannel.emit('navigate', { path: '/guide' });
 *
 * // Island B listens
 * navChannel.on('navigate', (data) => updateRoute(data.path));
 * ```
 *
 * @module @lessjs/signals
 */

// ─── Signal ─────────────────────────────────────────────────────

/** Subscription callback type for Signal changes */
export type SignalSubscriber<T> = (value: T) => void;

/** Unsubscribe function returned by signal.subscribe() */
export type Unsubscribe = () => void;

/**
 * A reactive signal: holds a value and notifies subscribers on change.
 *
 * Lightweight — no framework dependency, works in any context.
 * Uses a simple publish/subscribe pattern internally.
 *
 * @template T - The type of the signal's value
 */
export interface Signal<T> {
  /** Get the current value */
  readonly value: T;

  /**
   * Subscribe to value changes.
   * The subscriber is called immediately with the current value,
   * and again whenever the value changes.
   *
   * @param fn - Callback invoked on each value change
   * @returns Unsubscribe function
   */
  subscribe(fn: SignalSubscriber<T>): Unsubscribe;
}

/**
 * Create a new reactive signal.
 *
 * @param initialValue - The initial value
 * @returns A Signal<T> instance
 */
export function signal<T>(initialValue: T): Signal<T> {
  let _value = initialValue;
  const subscribers = new Set<SignalSubscriber<T>>();

  return {
    get value(): T {
      return _value;
    },

    set value(newValue: T) {
      if (Object.is(_value, newValue)) return;
      _value = newValue;
      // Notify subscribers synchronously (same as Vue/Solid signals)
      for (const fn of subscribers) {
        try {
          fn(_value);
        } catch (err) {
          console.warn('[LessJS Signal] Subscriber error:', err);
        }
      }
    },

    subscribe(fn: SignalSubscriber<T>): Unsubscribe {
      subscribers.add(fn);
      // Call immediately with current value
      try {
        fn(_value);
      } catch (err) {
        console.warn('[LessJS Signal] Initial subscriber call error:', err);
      }
      return () => {
        subscribers.delete(fn);
      };
    },
  };
}

/**
 * A derived signal: computed from one or more source signals.
 * Updates whenever any source signal changes.
 *
 * @param sources - Array of source signals
 * @param compute - Function that computes the derived value from sources
 * @returns A new Signal containing the computed value
 */
export function derived<T>(
  sources: Signal<unknown>[],
  compute: () => T,
): Signal<T> {
  let _value = compute();
  const subscribers = new Set<SignalSubscriber<T>>();

  // Subscribe to all sources
  // Note: unsubscribes array reserved for future cleanup implementation
  sources.map((s) =>
    s.subscribe(() => {
      const newValue = compute();
      if (!Object.is(_value, newValue)) {
        _value = newValue;
        for (const fn of subscribers) {
          try {
            fn(_value);
          } catch (err) {
            console.warn('[LessJS Signal] Derived subscriber error:', err);
          }
        }
      }
    })
  );

  return {
    get value(): T {
      return _value;
    },

    subscribe(fn: SignalSubscriber<T>): Unsubscribe {
      subscribers.add(fn);
      try {
        fn(_value);
      } catch (err) {
        console.warn('[LessJS Signal] Derived initial call error:', err);
      }
      return () => {
        subscribers.delete(fn);
      };
    },
  };
}

/**
 * Effect: run a function whenever any signals it reads change.
 * Uses a simple approach — wraps in a subscriber pattern.
 *
 * @param fn - Effect function that reads signals and performs side effects
 * @returns Cleanup function
 */
export function effect(fn: () => void): Unsubscribe {
  // Execute once immediately
  try {
    fn();
  } catch (err) {
    console.warn('[LessJS Signal] Effect error:', err);
  }

  // For now, effect is a fire-once utility.
  // Full reactive tracking would require a signal system with
  // automatic dependency tracking (like Solid or Preact Signals).
  // For v0.6, we provide the simpler subscribe-based pattern.
  return () => {
    // No cleanup needed for basic effect
  };
}

// ─── Channel (Event Bus) ────────────────────────────────────────

/** Channel event handler type */
export type ChannelHandler<T = unknown> = (data: T) => void;

/**
 * A named event bus for cross-island communication.
 *
 * Uses CustomEvent on a shared DOM element (document.body) internally,
 * which is a platform API — exempt from L2 Island Communication constraints.
 *
 * @template T - The type of data carried by channel events
 */
export interface Channel<T = unknown> {
  /** Channel name (namespace) */
  readonly name: string;

  /**
   * Emit an event on this channel.
   *
   * @param event - Event name within the channel
   * @param data - Payload data
   */
  emit(event: string, data?: T): void;

  /**
   * Subscribe to an event on this channel.
   *
   * @param event - Event name to listen for
   * @param handler - Callback invoked when the event fires
   * @returns Cleanup function to unsubscribe
   */
  on(event: string, handler: ChannelHandler<T>): Unsubscribe;

  /**
   * Subscribe to a single event, then automatically unsubscribe.
   *
   * @param event - Event name to listen for
   * @param handler - Callback invoked once
   * @returns Cleanup function
   */
  once(event: string, handler: ChannelHandler<T>): Unsubscribe;
}

// Internal: shared event target for channel communication
const _channelTarget = typeof document !== 'undefined' ? document.body : null;

/**
 * Create a named event channel for island-to-island communication.
 *
 * @param name - Channel name (used as event namespace prefix)
 * @returns A Channel instance
 */
export function channel<T = unknown>(name: string): Channel<T> {
  if (!_channelTarget) {
    console.warn(
      '[LessJS Channel] No DOM available — channel events will be no-ops. ' +
        'This is expected in SSR/SSG contexts.',
    );
  }

  return {
    name,

    emit(event: string, data?: T): void {
      if (!_channelTarget) return;
      const fullEvent = `less:${name}:${event}`;
      _channelTarget.dispatchEvent(
        new CustomEvent(fullEvent, {
          detail: data,
          bubbles: false,
          cancelable: false,
        }),
      );
    },

    on(event: string, handler: ChannelHandler<T>): Unsubscribe {
      if (!_channelTarget) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => {
        handler((e as CustomEvent).detail as T);
      };
      _channelTarget.addEventListener(fullEvent, listener);
      return () => {
        _channelTarget?.removeEventListener(fullEvent, listener);
      };
    },

    once(event: string, handler: ChannelHandler<T>): Unsubscribe {
      if (!_channelTarget) return () => {};
      const fullEvent = `less:${name}:${event}`;
      const listener = (e: Event) => {
        _channelTarget?.removeEventListener(fullEvent, listener);
        handler((e as CustomEvent).detail as T);
      };
      _channelTarget.addEventListener(fullEvent, listener);
      return () => {
        _channelTarget?.removeEventListener(fullEvent, listener);
      };
    },
  };
}

// ─── Convenience: Global Theme Signal ───────────────────────────

/**
 * Global theme signal. Reflects the current data-theme on :root.
 * Islands can subscribe to theme changes without reading document.documentElement.
 *
 * This is a convenience — you can also use the raw signal() API.
 */
export const themeSignal = createThemeSignal();

function createThemeSignal(): Signal<string> {
  const s = signal<string>(
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'dark'
      : 'dark',
  );

  // Sync with data-theme changes on :root
  if (typeof document !== 'undefined') {
    // L2 EXEMPTION: reading/writing document.documentElement is an
    // infrastructure API (same as localStorage, URL, etc.).
    const mo = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme) {
        // Use the setter to trigger subscribers
        (s as { value: string }).value = theme;
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  return s;
}

// ─── Default export ─────────────────────────────────────────────

export default { signal, derived, effect, channel, themeSignal };

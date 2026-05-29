/**
 * @lessjs/core - Signal-like detection utility.
 *
 * v0.24.3: Extracted from template.ts so JSX renderers don't depend on
 * the legacy template module. Provides neutral isSignalLike + unwrapSignalLike
 * and the SignalLike type.
 *
 * @module @lessjs/core/signal-like
 */

/** Duck-type: any object with { value, subscribe } is treated as Signal. */
export interface SignalLike<T = unknown> {
  readonly value: T;
  subscribe(fn: (value: T) => void): () => void;
}

/** Type guard for Signal-like objects. */
export function isSignalLike(value: unknown): value is SignalLike {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof (value as { subscribe?: unknown }).subscribe === 'function',
  );
}

/** Extract .value from a Signal-like object, or return as-is. */
export function unwrapSignalLike<T>(value: T): T extends SignalLike<infer V> ? V : T {
  if (isSignalLike(value)) {
    return (value as SignalLike).value as T extends SignalLike<infer V> ? V : T;
  }
  return value as T extends SignalLike<infer V> ? V : T;
}

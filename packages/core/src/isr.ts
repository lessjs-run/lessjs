/**
 * @lessjs/core - route-level ISR cache primitives.
 *
 * ISR in v0.21 is an adapter-facing HTML cache contract, not a generic SSR
 * server. The framework defines cache states and keys; deployment adapters own
 * persistence, locking, and provider-specific invalidation.
 */

export type IsrCacheState = 'miss' | 'hit' | 'stale' | 'error';

export interface IsrCacheEntry {
  html: string;
  createdAt: number;
  revalidate: number;
  headers?: Record<string, string>;
}

export interface IsrCacheResult {
  state: IsrCacheState;
  entry?: IsrCacheEntry;
  error?: Error;
}

export interface IsrCache {
  get(key: string, now?: number): Promise<IsrCacheResult> | IsrCacheResult;
  set(key: string, entry: IsrCacheEntry): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
}

export interface IsrRouteConfig {
  revalidate: number;
}

export function isIsrRouteConfig(value: unknown): value is IsrRouteConfig {
  return typeof value === 'object' && value !== null &&
    typeof (value as IsrRouteConfig).revalidate === 'number' &&
    Number.isFinite((value as IsrRouteConfig).revalidate) &&
    (value as IsrRouteConfig).revalidate > 0;
}

export function createIsrCacheKey(
  routePath: string,
  params: Record<string, string> = {},
): string {
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const suffix = sortedParams.length === 0 ? '' : '?' +
    sortedParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  return `${routePath}${suffix}`;
}

export class MemoryIsrCache implements IsrCache {
  readonly #entries = new Map<string, IsrCacheEntry>();

  get(key: string, now = Date.now()): IsrCacheResult {
    const entry = this.#entries.get(key);
    if (!entry) return { state: 'miss' };
    const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
    return {
      state: ageSeconds >= entry.revalidate ? 'stale' : 'hit',
      entry,
    };
  }

  set(key: string, entry: IsrCacheEntry): void {
    this.#entries.set(key, entry);
  }

  delete(key: string): void {
    this.#entries.delete(key);
  }
}

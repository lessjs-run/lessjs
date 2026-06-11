/**
 * Runtime-free cache adapter protocol.
 *
 * The protocol expresses cache intent without choosing Nitro, KV, filesystem,
 * in-memory, or platform cache primitives.
 */

/** Cache entry metadata shared by ISR and runtime adapters. */
export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  revalidate?: number;
  tags?: readonly string[];
}

/** Minimal cache protocol for replacement-compatible runtime adapters. */
export interface CacheAdapter<T = unknown> {
  name: string;
  get(key: string): Promise<CacheEntry<T> | undefined>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete?(key: string): Promise<boolean>;
  purgeTag?(tag: string): Promise<number>;
}

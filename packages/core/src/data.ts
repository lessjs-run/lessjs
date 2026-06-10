/**
 * @openelement/core — Data adapter contract.
 *
 * Platform-neutral data adapter for SSG `load()` and ISR `revalidate()`.
 * Does NOT import node:* APIs, Vite, database drivers, or filesystem.
 * Memory and file implementations are baseline proofs; databases stay
 * at the adapter/recipe level.
 *
 * @see ADR-0095: Data / Database Boundary
 * @module @openelement/core/data
 */

/** Platform-neutral data adapter contract. */
export interface DataAdapter<T = unknown> {
  /** Adapter name for diagnostics and logging. */
  name: string;
  /** Fetch data by key. Returns undefined when not found. */
  get(key: string): Promise<T | undefined>;
  /** List available keys (used by route generation from data sources). */
  keys?(): Promise<string[]>;
}

/** In-memory data adapter backed by a Map. Zero I/O. */
export class MemoryDataAdapter<T = unknown> implements DataAdapter<T> {
  readonly name = 'memory';
  #store: Map<string, T>;

  constructor(entries?: Iterable<[string, T]>) {
    this.#store = new Map(entries);
  }

  get(key: string): Promise<T | undefined> {
    return Promise.resolve(this.#store.get(key));
  }

  keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.#store.keys()));
  }

  set(key: string, value: T): void {
    this.#store.set(key, value);
  }

  delete(key: string): boolean {
    return this.#store.delete(key);
  }

  get size(): number {
    return this.#store.size;
  }
}

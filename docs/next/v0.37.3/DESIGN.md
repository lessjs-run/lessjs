# v0.37.3 Design

## Data / Database Boundary

### Problem

openElement currently has implicit data patterns (FileIsrCache, blog-data
generation, i18n loading) but no explicit data adapter contract. This leads to:

- ad-hoc file system access in ISR cache implementations;
- generated data coupled to Vite plugin lifecycle;
- no standard way to inject a database-backed data source into SSG/SSR.

### Approach

Define a small, platform-neutral data adapter contract at the type level.
Treat data sources as **external injectables** — the framework provides the
contract; adapters and recipes provide the implementation.

### Contract Shape (draft)

```ts
// @openelement/core/data — proposed subpath

export interface DataAdapter<T = unknown> {
  /** Name for diagnostics */
  name: string;
  /** Fetch data by key (used by SSG `load` / ISR `revalidate`) */
  get(key: string): Promise<T | undefined>;
  /** List keys (used by route generation from data) */
  keys?(): Promise<string[]>;
}
```

### Baseline Proofs

- `MemoryDataAdapter` — in-memory Map, zero I/O.
- `FileDataAdapter` — JSON files, build-time only.
- No database, no ORM, no auth, no migration in the default runtime.

### Non-Goals

- No built-in ORM.
- No generic auth platform.
- No migration system.
- No `@openelement/database` package (kept at adapter/recipe level).

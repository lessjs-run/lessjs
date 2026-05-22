# SOP-005: ISR Cache Layer

> Version: v0.21.0\
> Phase: ISR + API Parity\
> Priority: P0\
> Status: PLANNED

## Objective

Add route-level stale-while-revalidate HTML regeneration without turning LessJS
into a generic request-time SSR framework.

## Contract

Routes may export:

```ts
export const revalidate = 60;
```

Meaning:

- `false` or missing: static output only
- `0`: always regenerate when requested
- positive number: seconds before cached HTML becomes stale

## Cache States

| State | Behavior                                   |
| ----- | ------------------------------------------ |
| miss  | render page, store HTML, return fresh      |
| hit   | return cached HTML                         |
| stale | return stale HTML and trigger regeneration |
| error | keep serving last good HTML when available |

## Storage Interface

Define a small adapter-facing interface:

```ts
export interface IsrCache {
  get(key: string): Promise<IsrEntry | null>;
  set(key: string, entry: IsrEntry): Promise<void>;
  revalidate?(key: string): Promise<void>;
}
```

Provide an in-memory implementation for tests/dev. Production adapters can
provide platform storage later.

## Route Key

Key must include:

- pathname
- locale when i18n is active
- route params
- relevant search params only if route opts in

## Non-Goals

- No generic SSR mode for every request.
- No distributed locking in v0.21.
- No CDN-specific integration as the default implementation.

## Verification

- Unit tests for miss, hit, stale, regeneration, and render failure.
- Integration test with one route exporting `revalidate`.
- Build output records ISR routes.
- Docs state that production storage adapters are still limited.

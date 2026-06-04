# v0.34.0 SOP: Data Integration Layer

> Status: Planned\
> Roadmap: Data Integration Layer

## Goal

Support real app data while keeping ORM choice outside the framework.

## Entry Criteria

- v0.31.0 page `load()` is stable.
- v0.32.0 rendering modes define runtime/cache boundaries.
- v0.33.0 server/API context is stable.

## Tasks

- [ ] Write data integration matrix: Drizzle, Kysely, Prisma, TypeORM, Deno KV,
      Cloudflare D1, Postgres, SQLite.
- [ ] Add route loader examples for at least two SQL libraries and one KV store.
- [ ] Document serverless connection lifecycle and pooling guidance.
- [ ] Document edge runtime constraints.
- [ ] Add fixture apps that use external data libraries through `load()`.
- [ ] Add docs warning that openElement does not own an ORM.
- [ ] Add migration notes for users moving from top-level fetch to `load()`.

## Verification

- docs examples typecheck where possible
- fixture builds
- `deno task test`
- `deno task build`

## Non-Goals

- No built-in ORM.
- No schema migration tool.
- No auth provider.
- No proprietary database abstraction.

## Exit Criteria

- Data docs are useful without pretending to be a backend platform.
- External ORM examples do not leak into core dependencies.

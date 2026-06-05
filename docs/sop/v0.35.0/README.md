# v0.35.0 SOP: Data Integration Recipes

> Status: Planned\
> Roadmap: Data Integration Recipes\
> ADR: ADR-0084

## Goal

Prove real app data flows through openElement while keeping ORM, database, and
hosting choices outside the framework core.

## Entry Criteria

- v0.32.0 page lifecycle is stable.
- v0.33.0 rendering runtime defines cache and deploy boundaries.
- v0.34.0 server context and mutation behavior are stable.

## Tasks

- [ ] Write a data integration matrix for Drizzle, Kysely, Prisma, TypeORM, Deno
      KV, Cloudflare D1, Postgres, and SQLite.
- [ ] Add route loader examples for at least two SQL libraries and one KV store.
- [ ] Add mutation examples that reuse the v0.34 server route contract.
- [ ] Document serverless connection lifecycle and pooling guidance.
- [ ] Document edge runtime constraints and unsupported combinations.
- [ ] Add fixture apps that use external data libraries through `load()` and
      server mutations.
- [ ] Add docs warning that openElement does not own an ORM, auth provider, or
      migration tool.
- [ ] Add migration notes for users moving from ad hoc fetch code to `load()`
      and server routes.

## Verification

- docs examples typecheck where practical
- fixture builds for selected integrations
- route loader and mutation tests
- `deno task test`
- `deno task build`

## Non-Goals

- No built-in ORM.
- No schema migration tool.
- No auth provider.
- No proprietary database abstraction.
- No package surface reset.

## Exit Criteria

- Data docs are useful for real applications without pretending to be a backend
  platform.
- External data examples do not leak new dependencies into core packages.
- UI starters in v0.36 can use documented data patterns.

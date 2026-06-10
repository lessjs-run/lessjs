# v0.37.3 SOP: Data / Database Boundary

> Status: Active\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.2\
> NextVersion: `docs/next/v0.37.3/`

## Goal

Define a data adapter contract and validate the boundary between framework core,
adapters, and user-owned data sources — without becoming an ORM, auth platform,
or database. This line also closes the current JSR publish hotfix discovered on
`main` after code-validation CI passed.

## Entry Criteria

- v0.37.2 SSR / ISR runtime contract is complete.
- Existing data patterns (FileIsrCache, MemoryIsrCache, blog-data, i18n-data,
  nav generation, route `revalidate`, `isr-manifest.json`) have been audited.
- Roadmap mandates no built-in ORM or database ownership.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0093: SSR / ISR Runtime Contract (cache/injection pattern precedent).
- ADR-0095: Data / Database Boundary (to be written).

## Step-by-Step Tasks

1. Audit all existing data patterns in the repository.
2. Design a minimal `DataAdapter<T>` type contract that is framework-agnostic
   and side-effect-free at the type level.
3. Implement `MemoryDataAdapter` as a baseline (in-memory Map).
4. Implement `FileDataAdapter` for build-time data loading from JSON files.
5. Add unit tests for both adapters with error-path coverage.
6. Verify no regression in existing ISR cache implementations.
7. Write ADR-0095 documenting the boundary decision and non-goals.
8. Update workflow and status docs for v0.37.3.
9. Hotfix the 2026-06-10 `main` Publish to JSR failure so missing-version
   publishing is deterministic, recoverable after partial JSR publication, and
   cannot leave downstream packages blocked on unpublished internal
   dependencies.

## Verification

- Data adapter unit tests.
- ISR cache regression tests.
- Type-level contract passes `deno check`.
- No new package cycles (`graph:check`).
- Architecture contract check passes.
- `main` Publish to JSR rerun or replacement run passes, including downstream
  packages that depend on `@openelement/ssg` and `@openelement/adapter-vite`.
- Post-publish consumer smoke is not skipped because of a failed publish job.
- The publish workflow uses the graph-driven release script rather than
  hand-written parallel background jobs.

## Non-Goals

- No built-in ORM, auth, or migration system.
- No `@openelement/database` package.
- No default database selection (PostgreSQL, SQLite, etc.).
- No server-side session management.
- No replacement of existing ISR cache primitives.

## Exit Criteria

- Users can understand the data boundary: what the framework provides, what
  adapters provide, what recipes demonstrate.
- A minimal data adapter contract exists with baseline proof.
- ADR-0095 is accepted and registered.
- The `main` release publish gate is green or the exact external blocker is
  recorded before release closure.
- v0.37.4 can build on this contract for CSS UI data consumption patterns.

## AutoFlow Boundary

AutoFlow may prove adapter test evidence. It must not select a default database,
ORM, or auth provider.

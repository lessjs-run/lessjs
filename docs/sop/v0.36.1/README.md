# v0.36.1 SOP: AutoFlow Closure & v0.36 Release Truth

> Status: Active\
> Roadmap: AutoFlow Closure & v0.36 Release Truth\
> NextVersion: `docs/next/v0.36.1/`

## Goal

Ship a stabilization patch that closes v0.36 release truth drift and proves
AutoFlow self-evolution with one real, low-risk merged cell. Do not start v0.37
server/data/UI/starter/Hub product scope.

## Tasks

- [x] Fix AutoFlow generated version-bump tests on Windows with path-safe APIs.
- [x] Keep generated cell artifacts test-safe under root `deno task test`.
- [x] Treat `harness:passing` as intermediate state and merge only after review.
- [x] Count only `merged` cells as successful evolution metrics.
- [x] Include versionCycle metadata in ledger events so metrics can replay cells.
- [x] Derive AutoFlow package count from the package graph instead of hardcoding 19.
- [x] Execute `cell-v0.36.1-001` as a real version-bump cell.
- [x] Record metrics with `totalCellsAttempted: 1`, `totalCellsMerged: 1`, and `firstPassRate: 1`.
- [x] Align `STATUS`, `ROADMAP`, v0.36.0 SOP/NextVersion, changelog, and release note.
- [x] Keep v0.37 product closure explicitly deferred.

## Exit Criteria

- `deno task autoflow:health` reports no release-blocking drift.
- `deno task autoflow:check` fails on release truth drift and passes once docs/metrics agree.
- `deno task test` no longer fails on generated AutoFlow cell tests.
- Full release gate status is recorded before tagging or publishing.

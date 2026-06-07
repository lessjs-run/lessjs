# v0.35.6 Release Checklist

## Before Bump

- [ ] L2 AgentCodeGenerator implemented and tested.
- [ ] L3 MetricsCollector implemented and tested.
- [ ] All 8 improvement cells executed through AutoFlow pipeline.
- [ ] Evidence Ledger contains real events for all executed cells.
- [ ] Evolution Tracker produces `docs/autoflow/metrics/v0.35.6.json`.
- [ ] SOP tasks completed (`docs/sop/v0.35.6/README.md`).
- [ ] NextVersion tasks completed (`docs/next/v0.35.6/TASKS.md`).
- [ ] `deno task autoflow:test` passes.
- [ ] `deno task test` passes (all existing tests).

## Local Implementation Gates

Run in order per STATUS.md Release Gate Order:

```bash
deno task workflow:check       # [ ] NextVersion 8 files present
deno task arch:check           # [ ] Architecture contract holds
deno task graph:check          # [ ] Zero cycles, unified versions
deno task docs:check-current   # [ ] Current docs consistent
deno task docs:check-strategy  # [ ] Strategic docs present
deno task fmt:check            # [ ] Format compliance
deno task lint                 # [ ] Lint compliance
deno task typecheck            # [ ] All 19 packages type-check
deno task test                 # [ ] All unit tests pass
deno task build                # [ ] Build succeeds
deno task dsd:check-report     # [ ] DSD report valid
deno task publish:dry-run      # [ ] Publish dry-run passes
deno task test:e2e             # [ ] E2E tests pass
```

## Bump and Docs

- [ ] All 19 packages aligned to v0.35.6 (via `tools/bump-version.ts`).
- [ ] Root `deno.json` imports updated to v0.35.6.
- [ ] CHANGELOG.md entry written.
- [ ] Publish dry-run passes.

## Remote Closure

- [ ] Push `dev`.
- [ ] Wait for all `dev` CI jobs (test.yml, lint.yml, sop-gate.yml).
- [ ] Merge `dev` into `main`.
- [ ] Wait for all `main` CI jobs.
- [ ] Create and push `v0.35.6` tag on `main`.
- [ ] Publish GitHub release note.
- [ ] `deno task publish` — publish 19 packages to JSR in DAG order.
- [ ] Post-publish consumer smoke test passes.

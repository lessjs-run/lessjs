# v0.36.0 Release Checklist

## Before Bump

- [ ] All 13 cells executed and evidenced.
- [ ] autoflow:evolve runs at least 1 cell autonomously.
- [ ] EvolutionMetrics.firstPassRate > 0.
- [ ] SOP tasks completed.
- [ ] NextVersion tasks completed.
- [ ] **ROADMAP cross-check**: every item in ROADMAP v0.36.0 section verified
      against actual deliverables. Undelivered items explicitly marked as deferred
      in ROADMAP and SOP.
- [ ] CHANGELOG cell: `changelog` cell executed (auto-generated CHANGELOG entry).
- [ ] Release note cell: `release-note` cell executed (auto-generated release note).
- [ ] `deno task autoflow:test` passes.
- [ ] `deno task test` passes (all existing tests).

## Local Implementation Gates

```bash
deno task workflow:check
deno task arch:check
deno task graph:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

## Bump and Docs

- [ ] All 20 packages aligned to v0.36.0.
- [ ] Root `deno.json` imports updated.
- [ ] Cross-package imports updated.
- [ ] CHANGELOG.md entry written.
- [ ] Root README.md version references updated.
- [ ] Root README.zh.md version references updated.
- [ ] www/ documentation updated.
- [ ] Publish dry-run passes.

## Remote Closure

- [ ] Push `dev`.
- [ ] Wait for all `dev` CI jobs.
- [ ] Merge `dev` into `main`.
- [ ] Wait for all `main` CI jobs.
- [ ] Create and push `v0.36.0` tag on `main`.
- [ ] Publish GitHub release note.
- [ ] `deno task publish` — publish 19+ packages to JSR.
- [ ] Post-publish consumer smoke test passes.

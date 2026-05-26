# SOP-005: Quality Gates and Release Closure

> Version: v0.22.0\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-001, SOP-002, SOP-003, SOP-004

## Objective

Close v0.22.0 only when architecture cleanup is real, verified, and reflected in
public docs. This SOP prevents docs from claiming cleanup that the repo has not
proved.

## Required Quality Improvements

- Coverage reports must be generated and uploaded, not only produced in temp
  coverage folders.
- Consumer monitor must run a generated project build plus at least one browser
  smoke test.
- Playwright must keep traces on first retry for e2e failures.
- CI cache config should include useful restore keys.
- `lint.yml` and `sop-gate.yml` overlap must be resolved deliberately.
- Docs/status/roadmap must agree on v0.22 as Architecture Integrity.

## Release Gate

Run in this order:

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task hub:validate --strict --json
deno task hub:check-index
deno task test:e2e
```

## Closure Checklist

### Consumer Surface

- [ ] Generated `deno.json` contains only user-facing imports.
- [ ] Generated project builds in a temp directory.
- [ ] Generated project browser smoke passes.
- [ ] JSR consumer monitor remains useful on Windows.

### Package Boundaries

- [ ] `@lessjs/core` no longer owns build-only contracts.
- [ ] Extracted helper packages have one authoritative implementation.
- [ ] Hub scanner has no `null!` placeholder.
- [ ] Public docs describe extracted packages accurately.

### Adapter Decomposition

- [ ] `adapter-vite/src/index.ts` is reduced to public orchestration.
- [ ] Optional stubs, head injection, and resolver helpers have focused tests.
- [ ] Build phase comments match actual execution order.

### Signals and Validation

- [ ] Signal facade tests pass.
- [ ] `@lessjs/signals` public paths remain stable.
- [ ] Validation strictness is unchanged or stronger.
- [ ] Schema/library experiments are documented if adopted.

### CI and Docs

- [ ] Coverage artifact is uploaded.
- [ ] Playwright trace is enabled on first retry.
- [ ] Cache restore keys are present where useful.
- [ ] Duplicate CI jobs are removed or justified.
- [ ] `README`, `STATUS`, `ROADMAP`, SOP, and ADR docs agree.

## Changelog and Status

- [ ] Create or update `docs/changelog/v0.22.0.md`.
- [ ] Record the architecture cleanup scope.
- [ ] Record what was deferred to v0.23.
- [ ] Record full gate results.

## Exit Criteria

- v0.22.0 can be described as Architecture Integrity.
- v0.22.0 cannot be described as Edge Full-Stack MVP.
- Edge Full-Stack work is explicitly deferred to v0.23.x or later.
- `git status --short` contains only intentional release changes and no
  generated verification artifacts.

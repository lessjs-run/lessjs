# v0.35.0 SOP: AutoFlow2 Harness Gate

> Status: Planned\
> Roadmap: AutoFlow2 Harness Gate\
> ADR: ADR-0086

## Goal

Turn a narrow, low-noise subset of AutoFlow2 contradictions into local and CI
blockers. The gate should prevent evidence drift, not replace product judgment.

## Entry Criteria

- v0.34.0 AutoFlow2 sidecar report is implemented and tested.
- Report JSON shape is stable enough for a gate.
- Fixture states cover released, active, planned, drifted, and invalid
  workflows.

## Tasks

- [ ] Add `deno task autoflow:check`.
- [ ] Fail active version mismatch.
- [ ] Fail missing active NextVersion package.
- [ ] Fail SOP claim without evidence.
- [ ] Fail invalid release state.
- [ ] Fail package/doc/version drift.
- [ ] Fail public API/template mismatch for implemented API claims.
- [ ] Fail illegal workflow state transitions.
- [ ] Add state-machine path tests for legal and illegal transitions.
- [ ] Add property/model-based command checks for allowed actions versus repo
      state.
- [ ] Add AutoFlow status to `.github/PULL_REQUEST_TEMPLATE.md`.
- [ ] Add AutoFlow status to CI.
- [ ] Document that AutoFlow cannot merge, tag, bump, publish, or remove human
      review.

## Verification

- AutoFlow state-machine path tests
- AutoFlow property/model-based tests
- AutoFlow fixture tests
- `deno task autoflow:check`
- `deno task workflow:check`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`

## Non-Goals

- No subjective roadmap scoring as a hard gate.
- No automatic code edits.
- No release control.
- No package surface reset.
- No rendering/server/data/UI feature expansion beyond fixtures needed for the
  gate.

## Exit Criteria

- `autoflow:check` fails only predefined hard contradictions.
- Legal workflow transitions pass through generated/model paths.
- PR evidence includes AutoFlow state.
- CI can require AutoFlow without creating noisy product-judgment failures.

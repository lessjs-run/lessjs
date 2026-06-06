# v0.34.0 SOP: AutoFlow2 Sidecar Kernel

> Status: Implemented\
> Roadmap: AutoFlow2 Sidecar Kernel\
> ADR: ADR-0086

## Goal

Introduce an internal advisory workflow kernel that turns repository state into
a machine-readable report. v0.34 reports state and evidence; it does not block
CI beyond its own tests and does not edit code.

## Entry Criteria

- v0.33.0 AI-readable page, island, head, route, and render intent APIs are
  implemented and documented.
- `workflow:check` still passes for the active NextVersion package.
- Current SOP, roadmap, status, package graph, and workflow files are
  internally consistent.

## Tasks

- [x] Introduce internal `tools/autoflow`.
- [x] Define workflow states for planned, next, active, implemented, released,
      drifted, and invalid states.
- [x] Define workflow cells for ADR, SOP, NextVersion, package graph, docs,
      tests, build, CI, release note, and package version evidence.
- [x] Read `docs/governance/PROJECT_WORKFLOW.md`, `docs/status/STATUS.md`,
      `docs/roadmap/ROADMAP.md`, SOPs, `docs/next`, ADRs, package graph,
      workflow files, and gate results where available.
- [x] Emit JSON with `version`, `workflowState`, `cells`, `evidence`,
      `blockers`, and `allowedActions`.
- [x] Emit a human summary that can be pasted into PR evidence.
- [x] Add fixture states for released, active, planned, drifted, and invalid
      repositories.
- [x] Add integration tests for each fixture state.
- [x] Keep the sidecar advisory: no automatic edits, release control, package
      bump, tag, merge, or publish.

## Verification

- AutoFlow fixture tests
- `deno task workflow:check`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`

## Non-Goals

- No CI blocker for AutoFlow contradictions yet.
- No autonomous edits.
- No release, tag, merge, bump, or publish control.
- No subjective product quality scoring as a gate.
- No public package surface reset.

## Exit Criteria

- A maintainer can run the sidecar locally and get a JSON report plus human
  summary.
- The report identifies workflow state, cells, evidence, blockers, and allowed
  actions.
- Invalid fixture states are reported clearly without blocking real CI.
- v0.35 has enough report stability to add a narrow hard gate.

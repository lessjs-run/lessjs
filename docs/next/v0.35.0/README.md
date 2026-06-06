# v0.35.0 NextVersion Package

> Version: v0.35.0\
> Theme: AutoFlow2 Harness Gate\
> Governing SOP: `docs/sop/v0.35.0/README.md`\
> ADRs: ADR-0087, ADR-0088\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

Turn AutoFlow2 from v0.34's advisory sidecar into a CI-blocking gate.
`deno task autoflow:check` must verify Pnueli temporal invariants and
exit 0 (pass) or 1 (fail).

## Status: IMPLEMENTED

## Execution Map

| File                   | Role                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `DESIGN.md`            | Cell state machine (Harel), invariant checker (Pnueli), evidence ledger (Durable Execution)  |
| `TASKS.md`             | Implementation tasks mapped to SOP                                                           |
| `ACCEPTANCE.md`        | Exit criteria: 8 invariants verified, 83 tests pass, CI integration                          |
| `TEST_MATRIX.md`       | 83 tests: 43 cell-state-machine, 12 evidence-ledger, 28 existing                             |
| `DOCS_PLAN.md`         | STATUS.md, ROADMAP.md, CHANGELOG.md updated. ADR-0087, ADR-0088 created. SOP v0.35.0 created |
| `RISK_REGISTER.md`     | Low-risk: invariant checker is read-only. No code edits, git ops, or release control         |
| `RELEASE_CHECKLIST.md` | fmt:check ✅, lint ✅, typecheck ✅, test ✅ (83 pass), bump: 19 packages to 0.35.0 ✅       |

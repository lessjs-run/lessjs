# v0.35.0 SOP: AutoFlow2 Harness Gate

> Status: Next\
> Roadmap: AutoFlow2 Harness Gate\
> ADR: ADR-0086, ADR-0088\
> NextVersion: `docs/next/v0.35.0/` (to be created)

## Goal

Turn AutoFlow2 from advisory reporter (v0.34) into a CI-blocking gate.
`deno task autoflow:check` must exit 0 when all Pnueli temporal invariants
hold, and exit 1 when any error-level invariant is violated.

Research basis: C5 (Pnueli temporal logic), 01 (MAPE-K Monitor+Analyze),
03 (Rainbow Architecture Evaluator), 04 (Durable Execution event sourcing),
02 (Harel broadcast events), 06 (Model-Based Testing).

## Entry Criteria

- v0.34.0 AutoFlow2 sidecar kernel is implemented and tested against 5
  fixture states.
- `deno task autoflow:report` produces valid JSON and Markdown summaries.
- All 12 release gates pass on `dev` and `main`.

## Tasks

### Core Modules (6 new files)

- [x] Implement `cell-state-machine.ts` — Harel hierarchical state machine.
      - 12 lifecycle states: planned, branched, executing, harness:pending,
      harness:running, harness:passing, harness:failing, merging, merged,
      failed:retriable, failed:non-retriable, cancelled.
      - 3 orthogonal dimensions: lifecycle × risk (low/medium/high/critical)
      × dependency (blocked/ready/completed).
      - Broadcast events on every state transition (Harel §2).
      - Apply-event function: `applyCellEvent(state, event) → CellState`.
      - `cell-state-machine.test.ts` with model-based testing (fast-check).

- [x] Implement `invariant-checker.ts` — Pnueli temporal invariant checker.
      - 8 invariants registered (5 error + 3 warning).
      - `checkAllInvariants(ledger, projectRoot) → InvariantCheckReport`.
      - Error invariants: cell-merge-requires-harness, upstream-fail-cancels-
      downstream, version-alignment, no-self-modification, retry-limit.
      - Warning invariants: cell-eventually-completes, status-matches-reality,
      no-parallel-conflict.

- [x] Implement `evidence-ledger.ts` — Cell evidence ledger (Durable Execution).
      - `appendEvent(cellId, event)` — append to events.jsonl.
      - `rebuildState(cellId)` — replay events → CellState (event sourcing).
      - `getCellState(cellId)` — read cached state.json or rebuild.
      - `listCells()` / `getCellsForCycle(version)` — query interface.

- [x] Implement `event-sourcing.ts` — Event sourcing primitives.
      - Event type definitions (CellCreated, BranchCreated, CodeCommitted,
      HarnessStarted, HarnessGateResult, MergeStarted, MergeCompleted,
      CellFailed, CellRetried, CellCancelled, CellMerged).
      - `applyCellEvent(state, event) → CellState` — deterministic replay.
      - `isTerminal(state)` / `canRetry(state)` — query helpers.

- [x] Implement `harness-runner.ts` — Gate runner.
      - `runAllGates(projectRoot) → HarnessRunResult`.
      - `runSpecificGate(projectRoot, gate) → HarnessGateResult`.
      - Current 12 gates: workflow:check, arch:check, graph:check,
      docs:check-current, docs:check-strategy, fmt:check, lint, typecheck,
      test, build, dsd:check-report, publish:dry-run, test:e2e.

- [x] Implement `mod-check.ts` — CLI entry for `deno task autoflow:check`.
      - Reads governance docs via existing readers.
      - Runs invariant checker.
      - Exit 0 (all error invariants pass) or Exit 1 (violations found).
      - `--strict` flag: warnings → errors.

### Testing

- [x] `cell-state-machine.test.ts` — model-based tests with fast-check.
      - Generate all legal command sequences from state model.
      - Verify terminal states are stable (no transitions out).
      - Verify retry count is monotonic.
      - Verify all CELL_TRANSITIONS entries are reachable.

- [ ] `invariant-checker.test.ts` — per-invariant fixtures.
      - Fixture: cell in merging state without harness-pass → violation.
      - Fixture: upstream cell failed, downstream not cancelled → violation.
      - Fixture: version mismatch between STATUS and package graph → violation.

- [x] `evidence-ledger.test.ts` — event sourcing replay tests.
      - Create ledger, append events, rebuild state, verify correct state.
      - Test empty ledger → initial state.
      - Test corrupted state.json → rebuild from events.jsonl.

- [ ] `harness-runner.test.ts` — gate execution tests.
      - Mock gate: verify pass/fail detection.
      - Verify all 12 gates are enumerated.

### CI Integration

- [ ] Add `deno task autoflow:check` to CI workflow.
- [ ] Add AutoFlow status to PR evidence template.
- [ ] Document exit criteria for CI gate.

### Fixtures

- [ ] Create `tools/autoflow/fixtures/cell-states/` directory.
- [ ] Fixture: `planned/` — empty events.jsonl.
- [ ] Fixture: `executing/` — cell-created + branch-created events.
- [ ] Fixture: `harness-passing/` — code-committed + 12 gate-pass events.
- [ ] Fixture: `harness-failing/` — code-committed + 1 gate-fail event.
- [ ] Fixture: `merged/` — full lifecycle → merge-success event.

### Deno Tasks

- [ ] Add `"autoflow:check"` — `deno run --allow-read tools/autoflow/mod-check.ts`.
- [ ] Add `"autoflow:check:strict"` — with `--strict` flag.
- [ ] Add `"autoflow:test"` — `deno test --allow-read tools/autoflow/__tests__/`.

## Verification

- [ ] `deno task autoflow:check` exits 0 on clean repo.
- [ ] `deno task autoflow:check` exits 1 on a deliberately drifted fixture.
- [ ] `deno task autoflow:check --strict` reports warnings as errors.
- [ ] `deno task autoflow:test` — all tests pass (target: 50+ tests).
- [ ] `deno task fmt:check` — passes.
- [ ] `deno task lint` — passes.
- [ ] `deno task typecheck` — passes.
- [ ] `deno task test` — existing 794 tests still pass.
- [ ] CI workflow includes autoflow:check and passes.

## Non-Goals

- No cell execution, git operations, or code edits (v0.36).
- No multi-version evolution tracking or metrics (v0.37).
- No autonomous merge/tag/publish.
- No subjective product quality scoring as a gate.
- No modification of `tools/autoflow/` or `.github/workflows/` by any
  automated process.

## Exit Criteria

- `deno task autoflow:check` runs successfully on a clean checkout.
- `deno task autoflow:check` correctly exits 1 on all drift fixture states.
- All 8 Pnueli invariants have at least one positive and one negative test.
- CI blocks PRs that violate error-level invariants.
- Existing 12 release gates continue to pass.

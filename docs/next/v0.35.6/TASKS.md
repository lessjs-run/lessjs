# v0.35.6 Tasks

> Version: v0.35.6\
> SOP: `docs/sop/v0.35.6/README.md`\
> Updated: 2026-06-07

## Part A — L2/L3 Framework

- [x] A1: Implement `tools/autoflow/agent-code-generator.ts` (ADR-0089)
- [x] A2: Update `executor.ts` — integrate AgentCodeGenerator
- [x] A3: Update `mod-evolve.ts` — replace DryRunGenerator, wire scheduler
- [x] A4: Implement `tools/autoflow/metrics-collector.ts`
- [x] A5: Update `evolution-tracker.ts` — real cycle start/complete
- [x] A6: Add `agent-code-generator.test.ts` (17 tests)
- [x] A7: Integration test — one cell through full pipeline

## Part B — Wave 1 Cells (low risk, parallel)

- [x] B1: Cell 001 — `tools/bump-version.ts` (version-bump)
- [x] B2: Cell 002 — 5 package READMEs (readme-update)
- [x] B3: Cell 003 — Coverage CI gate (test-add)
- [x] B4: Cell 004 — Security usage guide (doc-align)
- [x] B5: Cell 008 — CI fast/full gate separation (doc-align)

## Part C — Wave 2 Cells (medium risk, sequential)

- [x] C1: Cell 005 — SOP-011 type cleanup (typecheck-fix) — 21→17 `as unknown as`
- [x] C2: Cell 006 — Render performance benchmarks (test-add)
- [x] C3: Cell 007 — Post-publish smoke test (test-add)

## Part D — Release Closure

- [x] D1: Bump all 19 packages to v0.35.6
- [x] D2: Update CHANGELOG.md
- [x] D3: Run full release gate sequence (12/13 gates pass, 2 pre-existing E2E failures unrelated to v0.35.6)
- [x] D4: Evolution Tracker completeCycle('v0.35.6') → docs/autoflow/metrics/v0.35.6.json

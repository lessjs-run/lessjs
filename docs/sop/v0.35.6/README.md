# v0.35.6 SOP: AutoFlow2 Full-Auto Evolution

> Status: Next\
> Roadmap: AutoFlow2 Full-Auto Evolution\
> ADR: ADR-0088, ADR-0089\
> NextVersion: `docs/next/v0.35.6/`

## Goal

Make AutoFlow2 L2 Cell Execution and L3 Evolution Loop production-ready,
then execute 8 improvement cells through the AutoFlow pipeline as dog-fooding.

This is the version where AutoFlow transitions from "framework exists" to
"framework produces real results with real evidence."

## Entry Criteria

- v0.35.0-v0.35.5 AutoFlow2 framework is implemented (L1 Harness Gate
  production-ready, L2/L3 framework exists but uses DryRunGenerator).
- `deno task autoflow:check` passes on clean repo.
- All 19 packages aligned to v0.35.4+.
- All existing release gates pass.

## Part A — L2 Cell Execution Completion

### AgentCodeGenerator (ADR-0089)

- [ ] Implement `tools/autoflow/agent-code-generator.ts`.
      - File-system protocol: read → generate → write → gate → evidence.
      - Safety boundaries: reject writes to `tools/autoflow/`,
      `.github/workflows/`, `docs/governance/`, root `deno.json`.
      - Risk-based gate selection (low: fmt+lint, medium: +typecheck,
      high: +test, critical: +build).
      - `generateTests()`: create test files for the target cell.
      - `implementCode()`: write implementation files.
      - `reviewCode()`: generate review report.

- [ ] Update `executor.ts` — integrate AgentCodeGenerator.
      - Real file writes (not mock).
      - Gate execution after each phase.
      - Evidence recording via Evidence Ledger.

- [ ] Update `mod-evolve.ts` — end-to-end CLI.
      - Replace DryRunGenerator with AgentCodeGenerator.
      - Wire scheduler with executor.
      - Cell lifecycle: planned → branched → executing → harness:passing → merged.
      - Evidence Ledger populated with real events.

### Testing

- [ ] `agent-code-generator.test.ts` — protocol compliance tests.
      - Safety boundary rejection test.
      - Gate execution test (mock deno commands).
      - File write + read-back verification.

- [ ] Integration test — one cell through full pipeline.
      - version-bump cell: planned → merged with real evidence.

## Part B — L3 Evolution Loop Real Data

### Metrics Collector

- [ ] Implement `tools/autoflow/metrics-collector.ts`.
      - Collect gate pass/fail rates from Evidence Ledger.
      - Collect test coverage from `deno test --coverage`.
      - Collect lint/typecheck scores from gate results.
      - Compute AlphaEvolve fitness score per cell.
      - Populate `EvolutionMetrics` with real data.

### Evolution Tracker Integration

- [ ] Update `evolution-tracker.ts` — real cycle completion.
      - `startCycle('v0.35.6')` at pipeline start.
      - `completeCycle('v0.35.6')` after all cells processed.
      - Metrics persisted to `docs/autoflow/metrics/v0.35.6.json`.

- [ ] `getTrend()` — baseline data point.
      - v0.35.6 is the first cycle with real data.
      - Future cycles (v0.36+) will build the trend.

## Part C — 8 Improvement Cells

### Wave 1: Low-risk, independent (5 cells, parallel)

- [ ] **Cell 001**: `tools/bump-version.ts` (version-bump, low)
      - CLI tool: reads current version, updates all 19 `deno.json` files.
      - Supports `--from` and `--to` flags.
      - Validates alignment after update.
      - Files: `tools/bump-version.ts` (new).

- [ ] **Cell 002**: 5 package READMEs (readme-update, low)
      - Create README.md for: compat-check, cem, style-sheet, create, signals.
      - Follow existing README template (name, description, install, exports).
      - Files: `packages/{compat-check,cem,style-sheet,create,signals}/README.md`.

- [ ] **Cell 003**: Coverage CI gate (test-add, low)
      - Add coverage threshold check to CI workflow.
      - `deno test --coverage` + threshold verification (≥70%).
      - Baseline: run coverage first to determine current actual percentage.
      - Files: `.github/workflows/test.yml` (coverage job),
      `tools/check-coverage.ts` (new).

- [ ] **Cell 004**: Security usage guide (doc-align, low)
      - Document XSS prevention patterns.
      - Demonstrate DOMPurify/sanitize-html integration.
      - Explain `trustedHtml` trust boundary.
      - Files: `docs/guide/security.md` (new).

- [ ] **Cell 008**: CI fast/full gate separation (doc-align, low)
      - Split CI into fast gate (< 2 min) and full gate (< 15 min).
      - Fast: fmt + lint + typecheck + autoflow:check.
      - Full: test + build + e2e + publish:dry-run.
      - Files: `.github/workflows/test.yml`.

### Wave 2: Medium-risk (3 cells, sequential)

- [ ] **Cell 005**: SOP-011 type cleanup (typecheck-fix, medium)
      - Eliminate `as unknown as` type coercions across packages.
      - Target: reduce from 42 to < 10 remaining.
      - Files: multiple package source files.
      - Gate: typecheck must pass after each file change.

- [ ] **Cell 006**: Render performance benchmarks (test-add, low)
      - Create `bench/` directory with VNode rendering benchmarks.
      - Benchmark SSR serialization throughput.
      - Benchmark JSX → VNode → RenderNode pipeline.
      - Files: `bench/render.bench.ts` (new), `bench/ssr.bench.ts` (new).

- [ ] **Cell 007**: Post-publish smoke test (test-add, medium)
      - Automated consumer project verification after publish.
      - Create temp project, install from JSR, build, verify.
      - Integrate into publish workflow.
      - Files: `tools/consumer-smoke.ts` (new),
      `.github/workflows/publish.yml`.

### Deferred to v0.36.0 (5 items, high-risk or large-scope)

| #  | Item                             | Reason                            |
| -- | -------------------------------- | --------------------------------- |
| 9  | adapter-vite → @openelement/ssg  | 4000+ line refactor, high risk    |
| 10 | SSG parallel rendering (workers) | New architecture, needs design    |
| 11 | Cross-browser E2E                | CI config + test matrix expansion |
| 12 | Error boundary enhancement       | Core runtime changes              |
| 13 | Signals system documentation     | Needs stable API first            |

## Verification

- [ ] `deno task autoflow:check` exits 0 on clean repo.
- [ ] `deno task autoflow:evolve --dry-run` reports cells with real DAG.
- [ ] `deno task autoflow:evolve` executes at least Cell 001 through full
      pipeline (planned → merged).
- [ ] Evidence Ledger contains real events for executed cells.
- [ ] Evolution Tracker produces `docs/autoflow/metrics/v0.35.6.json`.
- [ ] `deno task fmt:check` — passes.
- [ ] `deno task lint` — passes.
- [ ] `deno task typecheck` — passes.
- [ ] `deno task test` — all existing tests still pass.
- [ ] All 8 cells have corresponding evidence records.
- [ ] All 19 packages aligned to v0.35.6.

## Non-Goals

- No LLM-based CodeGenerator integration (file-system protocol only).
- No autonomous merge/tag/publish (human-triggered).
- No modification of `tools/autoflow/` by any automated cell (safety).
- No modification of `.github/workflows/` by any automated cell (safety).
- No cross-browser E2E or adapter-vite decomposition (deferred to v0.36).

## Exit Criteria

- L2 Cell Execution produces real file changes verified by deterministic gates.
- L3 Evolution Loop captures real metrics from v0.35.6 cell executions.
- All 8 improvement cells executed and evidenced.
- CI all-green on `dev` branch.
- `deno task autoflow:health` reports non-zero metrics.
- Existing 12 release gates continue to pass.

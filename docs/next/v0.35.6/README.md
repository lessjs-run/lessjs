# v0.35.6 NextVersion Package

> Version: v0.35.6\
> Theme: AutoFlow2 Full-Auto Evolution\
> Governing SOP: `docs/sop/v0.35.6/README.md`\
> ADRs: ADR-0088, ADR-0089\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

v0.35.6 completes the AutoFlow2 mechanical autonomy stack by making L2 Cell
Execution and L3 Evolution Loop production-ready:

- **L2 Cell Execution** — AgentCodeGenerator replaces DryRunGenerator with
  real file-system protocol (spec → result) for AI-driven code generation.
- **L3 Evolution Loop** — Real metrics collection from CI/test/coverage,
  enabling closed-loop MAPE-K feedback.
- **8 Improvement Cells** — Improvement recommendations from the v0.35.5
  technical audit, executed via AutoFlow dog-fooding (cells executing cells).

## Scope

8 cells across 2 waves, organized by risk and dependency:

| Wave | Risk   | Count | Focus                                 |
| ---- | ------ | ----- | ------------------------------------- |
| 1    | Low    | 5     | Documentation alignment & tooling     |
| 2    | Medium | 3     | CI gates, refactoring, test expansion |

5 additional items deferred to v0.36.0 (adapter-vite decomposition, SSG
parallel rendering, cross-browser E2E, error boundary enhancement, signals
documentation).

## Key Deliverables

- `tools/autoflow/agent-code-generator.ts` — L2 AgentCodeGenerator
- `tools/autoflow/metrics-collector.ts` — L3 metrics collector
- `tools/bump-version.ts` — Cell 001: version automation tool
- `docs/guide/security.md` — Cell 004: security usage guide
- `bench/render.bench.ts` — Cell 006: render performance benchmarks
- `tools/consumer-smoke.ts` — Cell 007: post-publish smoke test

## Execution Map

| File               | Role                                          |
| ------------------ | --------------------------------------------- |
| `TASKS.md`         | Detailed task list with status tracking       |
| `ACCEPTANCE.md`    | Exit criteria: all 8 cells pass harness gates |
| `RISK_REGISTER.md` | Wave 2 medium-risk cells require human review |

## Completion Rule

All 8 cells executed through AutoFlow pipeline. Each cell's harness gate
passes. CI all-green. No breaking public API changes. Evidence Ledger
contains real events. Evolution Tracker produces v0.35.6 metrics.

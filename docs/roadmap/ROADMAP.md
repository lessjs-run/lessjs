# openElement Roadmap

> Source of truth for forward version planning.\
> Current line: v0.35.0 AutoFlow2 Mechanical Autonomy.\
> Next line: v0.36.0 Rendering Runtime and Deployment.\
> Updated: 2026-06-06.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a JSX-first Web Components application framework with
Declarative Shadow DOM as the default server-rendered output. Built on DSD-first
HTML, progressive islands, and a 19-package monorepo under `@openelement/*`.

v0.33.0 (AI-Readable API Foundation) defined the public application contract
that all subsequent versions build upon.

## Version Ladder

| Version | Name                             | Goal                                                                                                           | Status |
| ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| v0.30.x | Contract cleanup                 | Done                                                                                                           |        |
| v0.31.0 | JSX-first Application API        | Done                                                                                                           |        |
| v0.32.0 | App Lifecycle Contract           | Done                                                                                                           |        |
| v0.33.0 | AI-Readable API Foundation       | Done                                                                                                           |        |
| v0.34.0 | AutoFlow2 Sidecar Kernel         | Done                                                                                                           |        |
| v0.35.0 | AutoFlow2 Mechanical Autonomy    | Current — Harness Gate + Cell Execution + Evolution Loop (3 layers, 13 modules, 11 deno tasks). See STATUS.md. |        |
| v0.36.0 | Rendering Runtime and Deployment | Planned — SSR, ISR, streaming DSD, cache. AutoFlow governed.                                                   |        |
| v0.37.0 | Server/Data/UI Product Closure   | Planned                                                                                                        |        |
| v0.38.0 | Public Surface Reset             | Planned                                                                                                        |        |
| v0.39.0 | v1 Release Candidate             | Planned                                                                                                        |        |
| v1.0.0  | Stable Engine + AutoFlow Default | Vision                                                                                                         |        |

## v0.35.0 — AutoFlow2 Mechanical Autonomy

Combines what was originally planned as v0.35 (Harness Gate), v0.36 (Cell
Execution), and v0.37 (Evolution Loop) into a single version.

### Layer 1 — Harness Gate

- `cell-state-machine.ts` — 12-state Harel hierarchical model, 3 orthogonal dimensions, broadcast events.
- `invariant-checker.ts` — 8 Pnueli temporal invariants.
- `evidence-ledger.ts` + `event-sourcing.ts` — Durable Execution event sourcing.
- `harness-runner.ts` — 12-gate runner.
- `mod-check.ts` — autoflow:check CLI (exit 0/1).
- `.githooks/pre-commit` enhanced with autoflow:check.
- `.github/workflows/lint.yml` enhanced with autoflow:check in CI.

### Layer 2 — Cell Execution

- `executor.ts` — three-phase (testgen → implement → review), pluggable CodeGenerator.
- `git-ops.ts` — git operations with Kahn isolation.
- `dag-builder.ts` — evidence → DAG with conflict detection.
- `scheduler.ts` — wave-based parallel + cascade.
- `mod-evolve.ts` — autoflow:evolve CLI.

### Layer 3 — Evolution Loop

- `metrics.ts` — AlphaEvolve fitness + SWE-bench 12-D metrics.
- `evolution-tracker.ts` — multi-cycle trend (Lehman C3).
- `mod-health.ts` — agent diagnostic.
- `.workbuddy/skills/autoflow/SKILL.md` — agent project driver.

### Research Basis

- 15 internal papers + 12 external papers (EMNLP 2024, ICSE 2025, ACM TOSEM 2025).
- Full library at `docs/references/autoworkflow/`.

SOP: `docs/sop/v0.35.0/`\
ADR: ADR-0087, ADR-0088

## v0.36.0 — Rendering Runtime and Deployment

Resume product work under AutoFlow2 governance. SSR, ISR, streaming DSD,
cache adapters, deploy recipes.

## v0.37.0 — Server/Data/UI Product Closure

Server, data, UI, starters, Hub disposition, pruning evidence.

## v0.38.0 — Public Surface Reset

Package/product surface reset with AI-assisted evidence analysis.
Human decision, AI-generated candidate analysis.

## v0.39.0 — v1 Release Candidate

Validate final APIs, docs, starters, deploy smoke, publish gates.

## v1.0.0 — Stable Engine + AutoFlow Default

API freeze. AutoFlow evidence as part of default release gates.
Requires: 3+ autonomous version cycles of evidence, v0.38 reset complete,
v0.39 RC gates pass.

## Explicit Non-Goals

| Item                              | Decision                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Built-in ORM                      | External recipes only.                                                                                      |
| Generic auth platform             | External integrations only.                                                                                 |
| React-like runtime                | openElement outputs Web Components + DSD.                                                                   |
| String renderer                   | JSX/VNode/RenderNode only.                                                                                  |
| Silent compatibility shims        | No. 0.x may break.                                                                                          |
| Autonomous architecture decisions | No. ADR, API reset, package removal require human review (R5/R6: 85% of studies require human involvement). |

## Document Cross-Reference

| Document Type | Rhythm          | Location                |
| ------------- | --------------- | ----------------------- |
| SOP           | per version     | `docs/sop/`             |
| ADR           | decision-driven | `docs/adr/`             |
| Changelog     | per release     | `docs/changelog/`       |
| Status        | always current  | `docs/status/STATUS.md` |
| Release Note  | per version     | `docs/release/`         |

# v0.36.0 NextVersion Package

> Version: v0.36.0\
> Theme: Rendering Runtime, Deployment & Deferred Refactors\
> Governing SOP: `docs/sop/v0.36.0/README.md`\
> ADRs: ADR-0088, ADR-0089, ADR-0090\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

v0.36.0 resumes product work under AutoFlow2 governance after the v0.35.x
mechanical autonomy line. It delivers rendering runtime enhancements,
deployment recipes, deferred refactors from the v0.35.6 audit, and proves
AutoFlow autonomous cell execution with real firstPassRate metrics.

## Scope

13 cells across 7 parts (A–G), organized by risk and dependency:

| Part | Risk    | Count | Focus                                  |
| ---- | ------- | ----- | -------------------------------------- |
| A    | Low     | 3     | Signals docs, deploy recipes, www sync |
| B    | Medium  | 2     | Error boundary retry + degraded render |
| C    | Low     | 1     | File-system ISR cache adapter          |
| D    | High    | 3     | adapter-vite → @openelement/ssg        |
| E    | Medium  | 1     | SSG parallel rendering (workers)       |
| F    | Medium  | 1     | Cross-browser E2E (Firefox, Safari)    |
| G    | Depends | 2     | AutoFlow autonomous execution proof    |

## Key Deliverables

- `docs/guide/signals.md` — Signals system documentation
- `docs/guide/deployment.md` — Updated deployment recipes
- `packages/core/src/error-boundary.ts` — Retry + degraded rendering
- `packages/core/src/isr.ts` — FileIsrCache adapter
- `packages/ssg/` — New @openelement/ssg package (extracted from adapter-vite)
- `www/e2e/playwright.config.ts` — Cross-browser config

## Completion Rule

All cells executed through AutoFlow pipeline. Evidence Ledger contains
real events with non-zero firstPassRate. CI all-green. www/ and root
README updated to reflect v0.36.0.

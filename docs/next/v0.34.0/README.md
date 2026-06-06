# v0.34.0 NextVersion Package

> Version: v0.34.0\
> Theme: AutoFlow2 Sidecar Kernel\
> Governing SOP: `docs/sop/v0.34.0/README.md`\
> ADRs: ADR-0086\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

Introduce an internal read-only tool under `tools/autoflow/` that reads
repository governance documents and emits a machine-readable JSON report plus a
human summary. The sidecar is advisory: it observes and reports, but does not
block CI or edit code.

This is the kernel that v0.35 will turn into a hard gate.

## Execution Map

| File                   | Role                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `DESIGN.md`            | Architecture: state machine, cells, readers, output format |
| `TASKS.md`             | Concrete implementation steps mapped to SOP                |
| `ACCEPTANCE.md`        | Completion criteria and evidence                           |
| `TEST_MATRIX.md`       | Tests, fixtures, gates                                     |
| `DOCS_PLAN.md`         | Current docs, website, template, changelog, release note   |
| `RISK_REGISTER.md`     | Risks, mitigations, non-goals                              |
| `RELEASE_CHECKLIST.md` | Release closure sequence                                   |

## Completion Rule

This version is complete only when the v0.34 SOP tasks, this package, local
gates, changelog, release note, `dev` CI, `main` CI, and release tag all agree.
The sidecar must remain advisory — no CI blocker code exists before v0.35.

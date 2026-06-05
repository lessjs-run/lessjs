# v0.32.0 NextVersion Package

> Version: v0.32.0\
> Theme: App Lifecycle Contract\
> Governing SOP: `docs/sop/v0.32.0/README.md`\
> ADRs: ADR-0084, ADR-0085\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

v0.32.0 turns the JSX-first Application API into a stable application
lifecycle. The framework must make route matching, params, load context,
rendering, layout selection, redirect, not-found, and error rendering explicit
before v0.33 can productize SSR, ISR, streaming, and deployment behavior.

## Execution Map

| File                   | Role                                             |
| ---------------------- | ------------------------------------------------ |
| `DESIGN.md`            | Lifecycle contract and architecture              |
| `TASKS.md`             | Work items mapped to the SOP                     |
| `ACCEPTANCE.md`        | Completion criteria and evidence                 |
| `TEST_MATRIX.md`       | Unit, generated-entry, build, docs, and CI gates |
| `DOCS_PLAN.md`         | Website and current-doc update plan              |
| `RISK_REGISTER.md`     | Risks, mitigations, and non-goals                |
| `RELEASE_CHECKLIST.md` | Release closure sequence                         |

## Completion Rule

This version is complete only when the SOP tasks, this package, local gates,
changelog, release note, `dev` CI, `main` CI, and release tag all agree.

# v0.33.0 NextVersion Package

> Version: v0.33.0\
> Theme: AI-Readable API Foundation\
> Governing SOP: `docs/sop/v0.33.0/README.md`\
> ADRs: ADR-0086\
> Workflow: `docs/governance/PROJECT_WORKFLOW.md`

## Purpose

v0.33.0 makes the application API easier for humans, tools, and AI assistants to
read without guessing. The version must make page intent, route intent, head
intent, render intent, island metadata, and island SSR behavior explicit while
keeping existing APIs compatible.

This is the foundation for AutoFlow2. AutoFlow2 cannot reliably judge workflow
state if the code surface still hides important intent in ad hoc metadata,
generated code, or naming conventions.

## Execution Map

| File                   | Role                                             |
| ---------------------- | ------------------------------------------------ |
| `DESIGN.md`            | AI-readable API design and compatibility policy  |
| `TASKS.md`             | Work items mapped to the SOP                     |
| `ACCEPTANCE.md`        | Completion criteria and evidence                 |
| `TEST_MATRIX.md`       | API, generated-entry, template, docs, and gates  |
| `DOCS_PLAN.md`         | Current docs, website, template, and release map |
| `RISK_REGISTER.md`     | Risks, mitigations, and non-goals                |
| `RELEASE_CHECKLIST.md` | Release closure sequence                         |

## Completion Rule

This version is complete only when the v0.33 SOP tasks, this package, local
gates, changelog, release note, `dev` CI, `main` CI, and release tag all agree.
The version must not claim AutoFlow2 runtime behavior; that belongs to v0.34 and
v0.35.

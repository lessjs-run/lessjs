# openElement AutoWorkflow

> Status: Mandatory project workflow. Every human maintainer and AI assistant
> must read this document before planning, implementing, reviewing, or releasing
> work in this repository.

## Goal

AutoWorkflow turns project management into repository evidence. A change is not
complete because an issue, chat message, or SOP says it is complete. It is
complete only when the repository contains the decision, the execution package,
the implementation, and the gates that prove the claim.

Current execution anchor: package line `v0.39.0`, active execution line
`v0.39.0`, and product formula
`openElement = Elements + UI + Framework + Protocols`.

## Required Reading Order

Read these files before starting work:

1. `docs/governance/PROJECT_WORKFLOW.md`
2. `docs/status/STATUS.md`
3. `docs/roadmap/ROADMAP.md`
4. the active version SOP under `docs/sop/`
5. the active NextVersion package under `docs/next/`
6. relevant ADRs listed by the SOP and NextVersion package

If these documents disagree, stop and fix the documents before changing product
code. The workflow is part of the product contract.

## Document Roles

| Layer       | Location                | Purpose                                             |
| ----------- | ----------------------- | --------------------------------------------------- |
| Governance  | `docs/governance/`      | Mandatory process and release rules                 |
| Status      | `docs/status/STATUS.md` | Current truth, active line, and release gate order  |
| Roadmap     | `docs/roadmap/`         | Version sequence and product direction              |
| ADR         | `docs/adr/`             | Architectural decisions and irreversible trade-offs |
| SOP         | `docs/sop/`             | Version contract: goals, tasks, verification, exit  |
| NextVersion | `docs/next/<version>/`  | Execution dossier for the active version            |
| Changelog   | `docs/changelog/`       | User-visible changes after implementation is proven |
| Release     | `docs/release/`         | Release note after local and remote gates are green |

## NextVersion Package

Every minor version must have a `docs/next/<version>/` package before
implementation starts.

Required files:

- `README.md` - scope, decision links, and execution map.
- `DESIGN.md` - architecture and API design.
- `TASKS.md` - concrete tasks mapped to SOP items.
- `ACCEPTANCE.md` - exit criteria and evidence requirements.
- `TEST_MATRIX.md` - local gates, fixtures, CI jobs, and browser proof.
- `DOCS_PLAN.md` - docs, website, changelog, and release-note work.
- `RISK_REGISTER.md` - risks, mitigations, and non-goals.
- `RELEASE_CHECKLIST.md` - release, push, CI, merge, tag checklist.

## Execution Rules

- Start from repository evidence, not memory or chat history.
- Keep one public contract for each surface.
- Keep one renderer pipeline and one metadata/source-of-truth.
- Remove duplicate or obsolete code instead of adding compatibility shims.
- Do not claim a SOP item is complete without a code, docs, test, or gate proof.
- Do not bump packages until local gates for the version pass.
- Do not claim JSR availability unless direct registry checks prove it.
- For v0.39.0 and later, JSR publish is a release exit gate. See ADR-0100.
- ADR-0097 only describes the historical v0.37/v0.38 exception period.
- Do not merge `dev` to `main` until `dev` CI is green.
- Do not tag until `main` CI is green.

## Pull Request Workflow

Every PR must identify:

- target version and SOP;
- ADRs added or changed;
- NextVersion tasks completed;
- local commands run;
- CI status;
- release-document impact.

If the change is architectural, add or update an ADR. If the change affects a
planned version, update the SOP and NextVersion package in the same PR.

## Release Workflow

Use this order for a minor release:

1. complete implementation against the SOP and NextVersion package;
2. update current docs and website content;
3. run local gates in `docs/status/STATUS.md`;
4. bump all packages only after implementation gates pass;
5. write changelog and release note;
6. run release gates including publish dry-run;
7. push `dev`;
8. wait for all `dev` CI jobs;
9. merge `dev` into `main`;
10. wait for all `main` CI jobs;
11. create and push the release tag;
12. publish the GitHub release note;
13. let the JSR publish workflow run, or trigger local/CI publish manually;
14. close the version only after JSR publish and post-publish consumer smoke
    evidence pass, unless a new ADR records an explicit exception.

For v0.39.0 and later, JSR package visibility and post-publish JSR consumer
smoke are release evidence, not telemetry. A version line is not closed until
the status, roadmap, release checklist, release note, and public README files
record the JSR outcome truthfully.

## Automation Gates

`deno task workflow:check` verifies that the workflow itself remains visible and
that the active NextVersion package has the required shape. This gate must run
locally and in CI.

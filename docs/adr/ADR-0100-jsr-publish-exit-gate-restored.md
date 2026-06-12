# ADR-0100: JSR Publish Exit Gate Restored

## Status

Accepted.

## Context

ADR-0097 temporarily demoted live JSR publishing and registry visibility from a
version-exit gate to best-effort distribution telemetry. That decision was made
while JSR-side availability and publish behavior were unstable enough to block
roadmap execution for reasons outside this repository.

JSR publishing has recovered enough for release governance to treat successful
publish evidence as part of the release exit gate again. openElement still
keeps local gates, package graph checks, docs checks, and `dev` / `main` CI as
the primary correctness proof, but distribution is no longer an optional
postscript once a version line is closed.

## Decision

Starting with v0.39.0 release closure, JSR publish is restored as a required
release exit gate.

The v0.39+ release closure requires:

1. local package graph and publish dry-run pass;
2. `dev` non-JSR CI passes;
3. `main` non-JSR CI passes after merge or sync;
4. the `Publish to JSR` workflow or an equivalent local publish attempt
   completes successfully for the package line;
5. status, roadmap, release checklist, and README files do not describe current
   JSR publish as best-effort telemetry.

Historical v0.37 and v0.38 lines that were completed under ADR-0097 remain
historically valid. ADR-0100 supersedes ADR-0097 for current and future release
exit criteria.

## Consequences

- Release notes may no longer claim a version line is closed until JSR publish
  evidence exists or the line has an explicit ADR-approved exception.
- `docs:check-public` guards current public docs against reintroducing
  best-effort JSR wording.
- SOP and NextVersion release checklists must include JSR publish as a required
  gate.
- AutoFlow health and gate listings should surface `publish:dry-run` and the
  live/CI JSR publish requirement as release gates.

## Non-Goals

- This ADR does not rewrite the historical v0.37/v0.38 release record.
- This ADR does not remove dry-run publishing; dry-run remains a local preflight
  before live or CI publish.
- This ADR does not require adding new packages or changing package ownership.

# ADR-0097: JSR Best-Effort Release Gate

Status: Accepted

Date: 2026-06-12

## Context

openElement's v0.37.4 release recovery showed that JSR publish state can become
externally inconsistent:

- `deno publish` can hang after a package version is partially accepted;
- package-level `meta.json` can lag or fail to expose an immutable version;
- resolver visibility can disagree with workflow state;
- post-publish consumer smoke can be blocked by registry propagation rather
  than by openElement code.

This makes JSR unsuitable as a hard version-exit criterion. A release process
that blocks roadmap execution on JSR visibility treats an external registry
incident as product incompleteness.

## Decision

JSR publish is now a best-effort external distribution step, not a required
version-exit gate.

Version exit is proven by repository-controlled evidence:

- SOP tasks and acceptance criteria are complete;
- required local gates pass;
- AutoFlow evidence is present where the SOP requires it;
- `dev` and `main` non-JSR CI are green before merge/tag/release;
- package versions, changelog, release notes, and docs are internally
  consistent;
- `deno task publish:dry-run` passes for the package graph.

Each release should still attempt JSR publishing through the existing local or
CI publish path. If JSR fails, hangs, or remains partially visible, record the
external registry state and continue the roadmap once repository-controlled
release evidence is complete.

The Publish to JSR workflow may continue to run on `main` and
`workflow_dispatch`. Its result is distribution telemetry, not proof that the
version implementation is incomplete.

## Consequences

### Positive

- Roadmap execution no longer stalls on JSR registry incidents.
- Release truth separates product readiness from external package visibility.
- AutoFlow, local gates, and non-JSR CI become the durable release evidence.
- JSR failures remain visible and auditable without blocking development.

### Neutral

- A GitHub release may exist before every JSR package is resolver-visible.
  Release notes must explicitly state JSR availability as best-effort when the
  registry is unhealthy.
- Consumers that depend only on JSR may still be affected by registry
  instability.

### Negative

- Users can see a release note before the full JSR package line resolves.
  Mitigation: document registry state in the release note and keep publish
  retries running independently.

## Required Workflow Changes

- Remove JSR 20/20 visibility and post-publish consumer smoke from version exit
  criteria.
- Keep `deno task publish:dry-run` as a required local package graph gate.
- Keep local publish or CI publish attempts as a required best-effort
  distribution action.
- Treat JSR publish failures as release notes/status caveats, not as roadmap
  blockers.
- Continue to avoid claiming "JSR available" unless direct resolver checks prove
  it.

## Non-Goals

- No deletion of the JSR publish workflow.
- No claim that JSR failures are harmless for consumers.
- No replacement registry is selected in this ADR.
- No relaxation of local gates, package graph checks, or non-JSR CI.

## Related

- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- `docs/status/STATUS.md`: current release gate order.
- `docs/governance/PROJECT_WORKFLOW.md`: release workflow.

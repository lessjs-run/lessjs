# ADR-0048: CI and Release Gate Separation

- Status: ACCEPTED
- Date: 2026-05-25

## Context

The v0.21.x JSR consumer hardening line exposed a gap between three different
checks that had been treated as one release signal:

- source-backed checks that prove the current branch can build;
- post-publish checks that prove the immutable JSR package set works after it
  exists; and
- platform compatibility checks that monitor JSR latest on non-Linux runners.

The old SOP Gate included a `JSR consumer build (ubuntu + windows)` job that
ran `deno run -A jsr:@lessjs/create test-blog`. That job used the already
published latest JSR version, not the current commit. It was useful as a public
path monitor, but it could not validate unpublished release candidates. The
Ubuntu half also duplicated the post-publish consumer smoke in `publish.yml`,
while the Windows half could be canceled or delayed by hosted-runner capacity
and block unrelated source-gate feedback.

## Decision

LessJS CI is split into three explicit layers:

1. **SOP Gate**
   Runs source-backed validation for the current branch. It keeps local package
   tests, generated-project starter proof, build, DSD, Hub, docs, and e2e gates.
   It does not run JSR latest as a required branch gate.

2. **Publish Gate**
   Runs after publishing missing JSR package versions. It generates a fresh
   consumer project from `jsr:@lessjs/create` on Ubuntu and builds it. This is
   the authoritative release gate for immutable JSR packages.

3. **JSR Consumer Monitor**
   Runs manually and on schedule against JSR latest on Windows. It proves the
   public command on a second operating system without blocking every source
   branch or duplicating the Ubuntu post-publish release gate.

## Consequences

- Release failures caused by immutable package publication remain caught by the
  post-publish consumer smoke.
- Source branches get faster, more relevant feedback because JSR latest no
  longer masquerades as a release-candidate check.
- Windows compatibility remains visible, but hosted-runner cancellation does
  not block the main SOP Gate.
- If the Windows monitor fails, the fix should be handled as a compatibility
  issue against JSR latest or the next patch release, not as evidence that the
  current source branch failed to build.

## Acceptance

- `.github/workflows/sop-gate.yml` contains only source-backed branch gates.
- `.github/workflows/publish.yml` keeps the Ubuntu post-publish consumer smoke.
- `.github/workflows/jsr-consumer-monitor.yml` runs JSR latest on Windows by
  `workflow_dispatch` and schedule.
- `docs/sop/v0.21.x/` documents the separation so future release work does not
  reintroduce duplicate JSR consumer gates.

# v0.36.5 SOP: Release Truth and AutoFlow Closure

> Status: Active\
> Roadmap: Release Truth and AutoFlow Closure\
> NextVersion: `docs/next/v0.36.5/`

## Goal

Close the repository truth gaps left after v0.36.3 and v0.36.4. This patch
aligns workflow checks, AutoFlow evidence, release docs, status docs, and public
website copy with the actual v0.36.4 package state.

## Tasks

- [x] Create one release task issue for v0.36.5 patch execution.
- [ ] Move `workflow:check` from the stale v0.36.2 package to v0.36.5.
- [ ] Complete missing v0.36.4 NextVersion evidence files.
- [ ] Align STATUS, ROADMAP, SOP index, changelog, and release notes for
      v0.36.3 and v0.36.4.
- [ ] Fix stale public website version, package-count, and SSG ownership copy.
- [ ] Record AutoFlow evidence for v0.36.3 and v0.36.4 where repository proof
      exists.
- [ ] Update stale v0.21.x wording in the SOP Gate workflow.
- [ ] Run the local release-truth gates and document the result in the PR.

## Verification

Required gates:

```bash
deno task workflow:check
deno task graph:check
deno task arch:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task verify:configs
deno task autoflow:check-dev
deno task autoflow:report:json
deno task build
deno task test:e2e
```

## Non-Goals

- Do not add new product capabilities.
- Do not bump packages before release gates prove the patch.
- Do not implement the future DsdElement, CSS UI, protocol, or full-stack
  framework product lines in this patch.
- Do not tag, publish, or merge to main from this issue.

## Exit Criteria

- `workflow:check` validates v0.36.5.
- AutoFlow has no missing evidence blocker for the active patch package.
- v0.36.3 and v0.36.4 docs agree with the current 20-package v0.36.4 state.
- Website public copy no longer presents v0.33.0 or v0.23.0 as current.
- PR links issue #48 and lists the local gate results.

## Related

- Issue #48
- [ADR-0086: AI-Readable Architecture and AutoFlow Roadmap](../../adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md)

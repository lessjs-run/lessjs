# SOP-010: v0.22 Entry Gate

Status: planned\
Target version: v0.21.5\
Owner: release owner

## Objective

Decide whether LessJS is ready to start v0.22.0 Edge Full-Stack implementation.

This SOP is intentionally a gate, not a feature plan. If the gate fails, v0.22.0 should not expand the runtime surface.

## Evidence Inputs

- all v0.21.x SOP outputs
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`
- `docs/sop/v0.22.0/README.md`
- public API inventory
- DSD conformance results
- OpenWC/Open UI compatibility docs
- SSG starter proof
- Hub validation reports

## Entry Questions

Answer these before opening v0.22.0 implementation work:

1. Is the `@lessjs/core` public API classified and documented?
2. Are stale Reactive DSD and hydration contracts removed from types and docs?
3. Does the DSD conformance suite test browser-parsed behavior?
4. Does the SSG blog/docs path build from a generated project?
5. Are build warnings and DSD report errors either fixed or explicitly accepted with finite thresholds?
6. Is Hub validation deterministic and strict enough to support ecosystem claims?
7. Do status and roadmap docs match command results?
8. Is the v0.22.0 scope still limited to edge runtime plumbing, ISR, API mounting, and deployment guides?

## Required Release Gate

Run from the repo root:

```powershell
git status --short --branch
deno task fmt:check
deno task lint
deno task typecheck
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task hub:validate --strict --json
deno task hub:check-index
deno task docs:check-strategy
deno task test:e2e
git status --short --branch
```

## Pass Criteria

The gate passes only if:

- no P0 issue remains open;
- no unexplained P1 issue remains open;
- every failing command has an accepted, documented reason and a follow-up owner;
- public API inventory is complete;
- generated project SSG proof passes;
- docs/status/roadmap do not claim implemented v0.22 behavior;
- v0.22 non-goals are still explicit.

## Fail Criteria

Do not proceed to v0.22.0 implementation if any of these are true:

- `@lessjs/core` public API is still unclassified;
- `DsdComponent.render()` or hydration docs contradict real behavior;
- DSD report thresholds allow unlimited known failures;
- generated SSG starter cannot build cleanly;
- Hub validation is nondeterministic;
- v0.22 scope has expanded into auth, ORM, session, permissions, or generic full-stack abstractions;
- docs describe future work as shipped behavior.

## v0.22 Allowed Scope After Passing

If the gate passes, v0.22.0 may start only these tracks:

- edge-compatible HTTP handler boundary;
- Hono API route mounting;
- static asset serving in edge runtimes;
- ISR cache adapter boundary;
- Cloudflare Workers KV adapter;
- Deno KV adapter;
- deployment guide and example;
- showcase proof.

## v0.22 Still Out of Scope

These remain out of scope even after the gate passes:

- auth framework;
- session framework;
- ORM/database abstraction;
- permissions/RBAC;
- full RPC system;
- generic backend framework features;
- non-standards component abstraction.

## Acceptance Criteria

- A v0.21.5 release note or status update records the gate result.
- `docs/status/STATUS.md` and `docs/roadmap/ROADMAP.md` match the evidence.
- Any accepted caveat has an owner and next command.
- v0.22.0 starts from a clean, narrow scope.

## Exit Decision

If passed, start v0.22.0 SOP-001. If failed, create a v0.21.6 remediation plan instead of expanding the architecture.

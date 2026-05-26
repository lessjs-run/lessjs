# LessJS v0.22.0 - Architecture Integrity

> Status: PLANNING\
> Target: architecture debt paydown before new Edge Full-Stack surface\
> Governing ADR: ADR-0049

## Mission

v0.22.0 makes the current v0.21.x architecture clean enough to extend. The
release is not a feature expansion line. It pays down the engineering and
architecture debt exposed by the 2026-05-26 review set before LessJS resumes
ISR/KV/Showcase work.

The release should make this true:

```text
LessJS app
  -> small consumer deno.json
  -> clear public imports
  -> runtime/build package boundaries
  -> decomposed adapter-vite pipeline
  -> stable signal facade
  -> unified schema and validation ownership
  -> stronger CI and generated-consumer gates
```

## Scope Boundary

| Included                              | Excluded in v0.22                       |
| ------------------------------------- | --------------------------------------- |
| Consumer import surface cleanup       | ISR production handler                  |
| `@lessjs/core` boundary repair        | CF Workers KV / Deno KV adapters        |
| Extracted package ownership cleanup   | www Edge Full-Stack Showcase            |
| `adapter-vite` decomposition          | New 10-component UI expansion           |
| Signals facade / engine separation    | ORM/database/auth/session abstractions  |
| Hub/CEM/schema validation unification | Generic Node server target              |
| Coverage, consumer E2E, trace gates   | Public Edge Full-Stack completion claim |

ADR-0038 remains accepted, but its implementation moves to v0.23.x or later.

## Release Order

| Step | SOP     | Priority | Purpose                         | Must Finish Before          |
| ---- | ------- | -------- | ------------------------------- | --------------------------- |
| 1    | SOP-001 | P0       | Consumer surface cleanup        | Any release candidate build |
| 2    | SOP-002 | P0       | Package boundary repair         | New public API claims       |
| 3    | SOP-003 | P0       | `adapter-vite` decomposition    | Build pipeline expansion    |
| 4    | SOP-004 | P1       | Signals/schema hardening        | v0.23 Edge restart          |
| 5    | SOP-005 | P0       | Quality gates and release close | v0.22 completion            |

## Entry Criteria

- v0.21 public docs and package versions are understood.
- The 2026-05-26 conversation archive is normalized under
  `docs/conversation/20260526/`.
- ADR-0049 is accepted.
- No implementation change starts without a mapped SOP step and verification
  command.

## Exit Criteria

- Generated consumer projects have a minimal, explainable `deno.json`.
- `@lessjs/core` no longer owns build-only files or duplicated extracted helper
  implementations.
- `adapter-vite` has testable modules for plugin assembly, import resolution,
  head injection, optional stubs, and build phases.
- `@lessjs/signals` has a documented facade/engine boundary.
- Hub/CEM/schema validation has one ownership model and no type placeholders.
- CI emits coverage artifacts, keeps generated-consumer proof meaningful, and
  preserves Playwright traces for failures.
- Full release gates pass and docs/status/roadmap agree with the verified
  state.

## Deferred Plans

The previous v0.22 Edge Full-Stack SOPs are superseded as active v0.22 work.
Their concepts move to v0.23.x after this cleanup line exits:

- ISR production handler
- CF Workers KV and Deno KV adapters
- www self-hosting proof
- deployment guides

## Related

- ADR-0049: Architecture Debt First Roadmap Reset
- ADR-0038: ISR + Edge KV Architecture
- `docs/conversation/20260526/20260526-architecture-debt-decision.md`

# LessJS v0.23.0 - Layered Package Architecture

> Status: PLANNING\
> Target: make LessJS package ownership durable before Edge Full-Stack work\
> Governing ADR: ADR-0050

## Mission

v0.23.0 turns the v0.22 Architecture Integrity work into a durable package
architecture. The release should make the repository easier to reason about,
publish, test, and extend without turning `@lessjs/core` or
`@lessjs/adapter-vite` into permanent catch-all packages.

The release should make this true:

```text
LessJS user code
  -> imports small public facades
  -> relies on a pure runtime kernel
  -> avoids adapter internals
  -> gets deterministic generated projects
  -> can be tested against local and published package graphs

LessJS maintainers
  -> know which package owns each contract
  -> can change build adapters without moving runtime APIs
  -> can publish packages in a checked dependency order
  -> can explain every public dependency
```

## Scope Boundary

| Included                                     | Excluded in v0.23                    |
| -------------------------------------------- | ------------------------------------ |
| Shared contracts/protocols ownership         | ISR production handler               |
| `@lessjs/core` runtime kernel boundary       | CF Workers KV / Deno KV adapters     |
| Signal facade and runtime facade positioning | Auth, ORM, database, session systems |
| `@lessjs/app` as configuration facade        | Generic Node server abstraction      |
| `adapter-vite` build-module contracts        | Marketplace growth targets           |
| Package graph and consumer smoke gates       | API freeze                           |
| Docs/status/package ownership governance     | v1.0 stability claim                 |

ADR-0038 remains accepted, but its implementation moves to v0.24.x or later.

## Release Order

| Step | SOP     | Priority | Purpose                          | Must Finish Before      |
| ---- | ------- | -------- | -------------------------------- | ----------------------- |
| 1    | SOP-001 | P0       | Contracts and protocols package  | Any import migration    |
| 2    | SOP-002 | P0       | Core runtime kernel boundary     | Runtime facade work     |
| 3    | SOP-003 | P0       | Runtime and app facade split     | Template/docs updates   |
| 4    | SOP-004 | P0       | Adapter-vite build modularity    | Edge Full-Stack restart |
| 5    | SOP-005 | P0       | Package graph and consumer gates | Release candidate       |
| 6    | SOP-006 | P1       | Docs and governance alignment    | v0.23 completion        |

## Entry Criteria

- v0.22 Architecture Integrity work is either complete or explicitly listed as
  carry-forward work.
- ADR-0050 is accepted.
- The post-publish create smoke test runs the just-published create version.
- No v0.23 code change starts without a mapped SOP step and verification
  command.

## Exit Criteria

- Shared build/runtime contracts have one owner.
- `@lessjs/core` no longer owns implementation packages or adapter contracts.
- `@lessjs/signals` is documented as a LessJS facade over `alien-signals`.
- `@lessjs/app` is the configuration facade; an authoring runtime facade is
  introduced or explicitly rejected.
- `adapter-vite` has clear build module boundaries and does not export
  contracts only because other packages need a type.
- CI checks LessJS package cycles, publish order, generated consumer builds,
  and docs/status/roadmap consistency.
- README, status, roadmap, ADR index, SOP index, and changelog agree on the
  active version line.

## Related

- ADR-0050: Layered Package Architecture
- ADR-0049: Architecture Debt First Roadmap Reset
- ADR-0048: CI and Release Gate Separation
- ADR-0041: ESM Module Graph First for JSR Consumer Builds
- ADR-0037: DSD-First Strategic Boundary

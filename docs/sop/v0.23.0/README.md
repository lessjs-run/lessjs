# LessJS v0.23.0 - Layered Package Architecture

> Status: IMPLEMENTED\
> Target: make LessJS package ownership durable before Edge Full-Stack work\
> Governing ADR: ADR-0050

## Mission

v0.23.0 turns the v0.22 Architecture Integrity work into a durable package
architecture. The release should make the repository easier to reason about,
publish, test, and extend without turning `@openelement/core` or
`@openelement/adapter-vite` into permanent catch-all packages.

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
| `@openelement/core` runtime kernel boundary  | CF Workers KV / Deno KV adapters     |
| Signal facade and runtime facade positioning | Auth, ORM, database, session systems |
| `@openelement/app` as configuration facade   | Generic Node server abstraction      |
| `adapter-vite` build-module contracts        | Marketplace growth targets           |
| Package graph and consumer smoke gates       | API freeze                           |
| Docs/status/package ownership governance     | v1.0 stability claim                 |

ADR-0038 remains accepted, but its implementation moves to v0.24.x or later.

## Release Order

| Step | SOP     | Priority | Purpose                          | Must Finish Before      |
| ---- | ------- | -------- | -------------------------------- | ----------------------- |
| 0    | PREP    | P0       | Package ownership inventory      | Any import migration    |
| 1    | SOP-005 | P0       | Package graph and consumer gates | Structural refactors    |
| 2    | SOP-001 | P0       | Contracts and protocols package  | Cross-package migration |
| 3    | SOP-002 | P0       | Core runtime kernel boundary     | Runtime facade work     |
| 4    | SOP-003 | P0       | Runtime and app facade split     | Template/docs updates   |
| 5    | SOP-004 | P0       | Adapter-vite build modularity    | Edge Full-Stack restart |
| 6    | SOP-006 | P1       | Docs and governance alignment    | v0.23 completion        |

## Entry Criteria

- v0.22 Architecture Integrity work is either complete or explicitly listed as
  carry-forward work.
- ADR-0050 is accepted.
- The post-publish create smoke test runs the just-published create version.
- No v0.23 code change starts without a mapped SOP step and verification
  command.
- A package ownership inventory exists for every `packages/*/deno.json` export
  and every `@openelement/*` dependency edge.

## Initial Inventory Findings

The v0.23 work started from the v0.22.1 graph and is closed by the v0.23.0
package graph:

| Finding                                              | v0.23.0 response                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `content` and `i18n` imported adapter build types    | shared build types and virtual ids now live under `@openelement/protocols`       |
| `app` imported adapter build context                 | `@openelement/app` now consumes the public adapter facade instead of subpaths    |
| `core` drifted toward signal implementation          | `@openelement/signals` remains the `alien-signals` facade and runtime owner      |
| generated templates used core as authoring barrel    | `@openelement/runtime` is the authoring facade used by generated projects        |
| publish workflow missed the new runtime package      | publish order now includes every package, including `@openelement/runtime`       |
| direct source imports were hidden by root import map | `graph:check` now fails undeclared package-local `@openelement/*` source imports |

## Execution Rules

- Do graph gates before moving imports.
- Move ownership before removing compatibility bridges.
- Do not keep compatibility bridges for paths whose ownership is wrong.
- Replace old imports with canonical owners and document breaking import moves.
- Every package move must include local workspace proof and generated consumer
  proof.
- Do not start Edge Full-Stack implementation until the v0.23 package graph
  exits cleanly.

## Exit Criteria

- Shared build/runtime contracts have one owner: `@openelement/protocols`.
- `@openelement/core` no longer owns adapter build contracts or the authoring
  facade.
- `@openelement/signals` is documented as the LessJS facade over `alien-signals`.
- `@openelement/app` is the configuration facade, while `@openelement/runtime` is the
  authoring facade.
- `adapter-vite` no longer exports shared contracts only because other packages
  need a type.
- `deno task graph:check` verifies package cycles, publish order, unified
  versions, workflow coverage, and package-local direct import declarations.
- README, status, roadmap, architecture notes, SOP index, and changelog agree
  on v0.23.0 as the active implemented architecture line.
- v0.24 planning can resume without depending on adapter-owned contracts or
  core-owned implementation facades.

## Related

- ADR-0050: Layered Package Architecture
- ADR-0049: Architecture Debt First Roadmap Reset
- ADR-0048: CI and Release Gate Separation
- ADR-0041: ESM Module Graph First for JSR Consumer Builds
- ADR-0037: DSD-First Strategic Boundary

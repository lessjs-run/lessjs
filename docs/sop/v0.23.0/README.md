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
  and every `@lessjs/*` dependency edge.

## Initial Inventory Findings

The v0.23 work starts from the current v0.22.1 graph:

| Finding                                                             | Evidence                                                                               | Required response                                   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `content` and `i18n` import adapter build contracts                 | imports from `@lessjs/adapter-vite/build-types` and `@lessjs/adapter-vite/virtual-ids` | move shared contracts to the contracts layer        |
| `app` imports adapter build context                                 | `@lessjs/adapter-vite/build-context`                                                   | keep app as facade, not adapter contract owner      |
| `core` imports `alien-signals`                                      | `packages/core/src/signals.ts`                                                         | move canonical signal creation to `@lessjs/signals` |
| `core` re-exports `style-sheet`, CEM, compatibility, manifest tools | `packages/core/deno.json` exports                                                      | classify each as bridge or wrong owner              |
| generated templates import authoring APIs from `core`               | `packages/create/cli.ts`                                                               | decide whether `@lessjs/runtime` is needed          |
| `adapter-vite` generates source that imports core subpaths          | entry generation and subpath resolver                                                  | keep generated imports explicit and checked         |

## Execution Rules

- Do graph gates before moving imports.
- Move ownership before removing compatibility bridges.
- Keep one compatibility window for public import paths unless a path is
  internal-only.
- Every package move must include local workspace proof and generated consumer
  proof.
- Do not start Edge Full-Stack implementation until the v0.23 package graph
  exits cleanly.

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
- v0.24 planning can resume without depending on adapter-owned contracts or
  core-owned implementation facades.

## Related

- ADR-0050: Layered Package Architecture
- ADR-0049: Architecture Debt First Roadmap Reset
- ADR-0048: CI and Release Gate Separation
- ADR-0041: ESM Module Graph First for JSR Consumer Builds
- ADR-0037: DSD-First Strategic Boundary

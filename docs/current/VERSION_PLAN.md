# v0.40.x Version Plan - Cleanup Train

## Objective

Make `dev` the focused v0.40 product-line branch and collapse the repository to
the product shape:

```text
openElement = Elements + UI + Framework + Protocols
```

The current local package line is `v0.40.0`. The v0.40.x line is a manually
approved breaking cleanup train. It is not a normal AutoFlow patch-release
line: AutoFlow3 may execute gates and evidence collection, but package graph and
public API changes require the approved plan id
`ADR-0105/v0.40.x-cleanup-train`.

## Scope

- Keep an 11-package current graph documented in `docs/current/PACKAGE_SURFACE.md`.
- Promote `@openelement/elements` into the canonical component-authoring facade.
- Remove standalone `@openelement/runtime`, `@openelement/style-sheet`, and
  `@openelement/ssg` from the current package graph.
- Move `StyleSheet` into `@openelement/core/style-sheet` and re-export it from
  `@openelement/elements`.
- Move SSG internals into `@openelement/adapter-vite`.
- Keep Preact island support as optional `@openelement/app/preact`.
- Keep `alien-signals` as the default signal engine and add
  `@openelement/signals/preact-engine` only as a candidate.
- Keep AutoFlow3 as the single workflow/gate/evidence control plane.
- Keep active docs to current truth, ADR, roadmap/status, release evidence, and
  archive index.

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0104 keeps signal-engine changes behind protocol conformance.
- ADR-0105 approves this v0.40.x breaking cleanup train.
- AutoFlow3 patch automation must refuse v0.40.x cleanup-train release execution
  unless the approved plan id is present.
- Minor/major scope, public API, package topology, default runtime, default
  signal engine, release policy, security, auth, and database ownership changes
  still require human-approved ADR or version-plan evidence.

## Workstreams

### v0.40.1 - Governance And Repo Hygiene

- [x] Add v0.40.x cleanup-train governance.
- [x] Make pre-push run `autoflow:push` on all branches.
- [x] Make `autoflow:push` select `arch:check` for package/tool/hook/config changes.
- [x] Delete tracked root `bench/`.
- [x] Add repo hygiene checks for removed package names and tracked generated root artifacts.

### v0.40.2 - Package Graph Collapse To 11

- [x] Remove standalone `@openelement/style-sheet`.
- [x] Move `StyleSheet` into `@openelement/core/style-sheet`.
- [x] Promote `@openelement/elements` as the authoring facade.
- [x] Remove standalone `@openelement/runtime`.
- [x] Move SSG internals into `@openelement/adapter-vite`.
- [x] Remove standalone `@openelement/ssg`.
- [x] Update workspace, import map, release order, package count, publish order, and checks.

### v0.40.3 - Preact Island Proof

- [x] Add optional `@openelement/app/preact`.
- [x] Record island metadata and hydration strategies through the existing island protocol.
- [x] Prove DSD opt-out metadata.
- [ ] Add browser-level client upgrade proof in release evidence.

### v0.40.4 - Signal Candidate And Code Clean

- [x] Keep `alien-signals` as default.
- [x] Add optional `@openelement/signals/preact-engine`.
- [x] Run shared SignalEngine conformance across alien and Preact engines.
- [x] Guard that core and elements do not require `@preact/signals-core`.
- [ ] Continue cleaning mojibake in active source/tools as gates expose it.

### v0.40.5 - Release Hardening

- [x] Add package graph and repo hygiene checks for the 11-package target.
- [x] Add hook-policy coverage proving package/tool/hook changes trigger `arch:check`.
- [x] Run full release dry-run and JSR publish dry-run in release order.
- [x] Prepare release evidence for the cleanup train.
- [ ] Do not claim publish closure until JSR package truth and post-publish smoke pass.

## Acceptance

- The workspace has exactly 11 current packages.
- `graph:check`, `package-surface:check`, and release order agree on the same
  11-package graph.
- Active workflows are at most 4 and all CI gate orchestration enters through
  AutoFlow3.
- Root has no tracked generated artifacts or tracked `bench/`.
- Active code does not import removed packages.
- Preact remains optional and does not enter `core` or `elements` as a required
  dependency.
- `nitro:proof:node` and `nitro:proof:workers` still pass.
- Release evidence records package removals and the cleanup-train approval
  before v0.40.x closure.

## Test Matrix

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task graph:check
deno task arch:check
deno task repo:hygiene
deno task workflow:check
deno task workflow:check-slimming
deno task docs:check-public
deno task docs:check-current
deno task docs:check-strategy
deno task package-surface:check
deno task signals:check-protocol-boundary
deno task autoflow:test
deno task autoflow:push
deno task autoflow:ci
deno task nitro:proof:node
deno task nitro:proof:workers
deno task consumer:local
deno task consumer:core-smoke
deno task publish:dry-run
```

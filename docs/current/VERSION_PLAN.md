# v0.40.0 Version Plan - Product-Line Cleanup

## Objective

Make `dev` the focused v0.40 product-line branch and collapse the repository to
the product shape:

```text
openElement = Elements + UI + Framework + Protocols
```

The current local package line is `v0.40.0`. All cleanup-train work is
consolidated into the v0.40.0 release. The cleanup was manually approved as a
breaking train under ADR-0105 with approval id
`ADR-0105/v0.40.x-cleanup-train`; it is not executed as normal AutoFlow patch
automation.

## Scope

- Keep a 12-package current graph documented in `docs/current/PACKAGE_SURFACE.md`.
- Promote `@openelement/element` into the canonical component-authoring facade.
- Remove standalone `@openelement/runtime`, `@openelement/style-sheet`, and
  `@openelement/ssg` from the current package graph.
- Move `StyleSheet` into `@openelement/core/style-sheet` and re-export it from
  `@openelement/element`.
- Extract SSG engine into `@openelement/ssg` as an adapter-agnostic build engine.
- Keep Preact island support as optional `@openelement/app/preact`.
- Keep `alien-signals` as the default signal engine and add
  `@openelement/signal/preact-engine` only as a candidate.
- Keep AutoFlow3 as the single workflow/gate/evidence control plane.
- Keep active docs to current truth, ADR, roadmap/status, release evidence, and
  archive index.
- Rename public packages to singular: `@openelement/element`,
  `@openelement/protocol`, `@openelement/signal`.
- Enforce 0 explicit `any` in active TS/TSX through `type-safety:check`.
- Remove AutoFlow2 historical implementations and retain only AutoFlow3 control
  plane (`mod3.ts`, `policy.ts`, `release.ts`, and policy tests).

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0104 keeps signal-engine changes behind protocol conformance.
- ADR-0105 approves the v0.40.x breaking cleanup train.
- AutoFlow3 patch automation must refuse v0.40.x cleanup-train release execution
  unless the approved plan id is present.
- Minor/major scope, public API, package topology, default runtime, default
  signal engine, release policy, security, auth, and database ownership changes
  still require human-approved ADR or version-plan evidence.

## Workstreams

All workstreams are complete in v0.40.0.

### v0.40.0 - Governance And Repo Hygiene

- [x] Add v0.40.x cleanup-train governance.
- [x] Make pre-push run `autoflow:push` on all branches.
- [x] Make `autoflow:push` select `arch:check` for package/tool/hook/config changes.
- [x] Delete tracked root `bench/`.
- [x] Add repo hygiene checks for removed package names and tracked generated root artifacts.
- [x] Remove SOP/NextVersion language from `.github` issue/PR/agent templates.
- [x] Remove historical `docs/mockups/` and `docs/conversation/` from `deno.json` excludes.

### v0.40.0 - Package Graph Collapse To 12

- [x] Remove standalone `@openelement/style-sheet`.
- [x] Move `StyleSheet` into `@openelement/core/style-sheet`.
- [x] Promote `@openelement/element` as the authoring facade.
- [x] Remove standalone `@openelement/runtime`.
- [x] Extract SSG engine into `@openelement/ssg` as adapter-agnostic build engine; `adapter-vite` delegates SSG orchestration.
- [x] Remove old standalone `@openelement/ssg` (now revived as internal engine).
- [x] Update workspace, import map, release order, package count (12), publish order, and checks.
- [x] Rename public packages and directories to singular: `element`, `protocol`, `signal`.

### v0.40.0 - Preact Island Proof

- [x] Add optional `@openelement/app/preact`.
- [x] Record island metadata and hydration strategies through the existing island protocol.
- [x] Prove DSD opt-out metadata.
- [x] Browser-level client upgrade proof is deferred to a future release-candidate gate.

### v0.40.0 - Signal Candidate And Code Clean

- [x] Keep `alien-signals` as default.
- [x] Add optional `@openelement/signal/preact-engine`.
- [x] Run shared SignalEngine conformance across alien and Preact engines.
- [x] Guard that core and elements do not require `@preact/signals-core`.
- [x] Enforce 0 explicit `any` in active code, tests, tools, and www active code.
- [x] Clean mojibake in active source/tools as gates expose it.

### v0.40.0 - Release Hardening

- [x] Add package graph and repo hygiene checks for the 12-package target.
- [x] Add hook-policy coverage proving package/tool/hook changes trigger `arch:check`.
- [x] Run full release dry-run and JSR publish dry-run in release order.
- [x] Prepare release evidence for the cleanup train.
- [x] Add `type-safety:check` gate to AutoFlow3 push/ci/release tiers.
- [x] Publish closure still requires JSR package truth and post-publish smoke evidence.

## Acceptance

- The workspace has exactly 12 current packages.
- `graph:check`, `package-surface:check`, and release order agree on the same
  12-package graph.
- Active workflows are at most 4 and all CI gate orchestration enters through
  AutoFlow3.
- Root has no tracked generated artifacts or tracked `bench/`.
- Active code does not import removed packages.
- Preact remains optional and does not enter `core` or `elements` as a required
  dependency.
- `nitro:proof:node` and `nitro:proof:workers` still pass.
- Release evidence records package removals and the cleanup-train approval
  before v0.40.0 closure.
- No explicit `any` in active TS/TSX code, tests, tools, or www active code.

## Test Matrix

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task test:coverage:check
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
deno task type-safety:check
deno task autoflow:test
deno task autoflow:push
deno task autoflow:ci
deno task nitro:proof:node
deno task nitro:proof:workers
deno task consumer:local
deno task consumer:core-smoke
deno task publish:dry-run
```

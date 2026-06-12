# v0.40.0 Version Plan - Product-Line Reset + Repository Slimming

## Objective

Make `dev` the focused product-line branch for the v1 path while keeping the
old v0.39 architecture evidence frozen on `arch/v0.39-line`.

Current package and release-gate truth remains `v0.39.0`; this plan is the
active execution bridge toward the `v0.40.0` product-line reset.

v0.40 has two equal exit requirements:

1. the product surface becomes real and narrow;
2. the repository shape stops contradicting that product story.

The product target remains:

```text
openElement = Elements + UI + Framework + Protocols
```

## Scope

- Treat Elements, UI, Framework, and Protocols as the only first-class product
  lines.
- Productize the Elements line around `@openelement/elements` and
  `OpenElement`.
- Keep Vite + Nitro as the Framework base engine while keeping route,
  renderer, runtime, cache, data, island, and signal contracts replaceable
  through Protocols.
- Record Preact as the v0.40 heavy-framework island priority.
- Treat `@preact/signals-core` only as a `SignalEngine` candidate pending
  protocol conformance, bundle, SSR/CSR, and consumer-smoke evidence.
- Make Repository Slimming a first-class v0.40 workstream covering root
  fixtures, Hub, active docs, package graph shape, workflows, and gates.
- Collapse active planning into this version plan instead of adding another
  SOP plus NextVersion dossier.
- Keep AutoFlow3 as the single gate and evidence control plane.

## Non-Goals

- No uncontrolled physical package deletion without ADR approval.
- No Hub revival.
- No Vue, React, Svelte, or generic heavy-island expansion.
- No Web Awesome implementation or default UI strategy change.
- No default signal-engine swap.
- No v1 API freeze.
- No release-policy change.
- No AutoFlow authority over minor, major, or v1 scope decisions.

## Governance Rules

- ADR-0101 is the governance boundary for this reset.
- New packages, package removals, package merges, package graph topology
  changes, default runtime changes, default signal-engine changes, and public
  API resets require human-approved ADR evidence.
- Mechanical moves of historical fixtures, archived docs, and inactive gate
  wiring may proceed inside v0.40 when the existing public API and package graph
  remain stable.
- Any v0.40 task that violates patch eligibility must downgrade AutoFlow3 from
  automation to `requires human review`.

## Workstreams

### A. Elements Product Surface

- [x] Create the `@openelement/elements` implementation plan against ADR-0099,
      ADR-0101, and ADR-0102.
- [x] Implement or map the `OpenElement` base class as the Elements-facing
      authoring surface.
- [x] Decide the `DsdElement` compatibility story: alias, migration path, or
      deprecation schedule.
- [x] Add shadow/DSD default tests and explicit light DOM opt-in tests for the
      new Elements surface.
- [ ] Update starter, README, package README, and website docs to teach
      `OpenElement` without making lower-level internals first-run concepts.

### B. Preact Island Proof

- [x] Add a narrow Preact island proof without making Preact the product
      identity.
- [ ] Prove SSR output, client upgrade, explicit hydration strategy, asset
      loading, and consumer starter behavior.
- [x] Keep Preact out of `@openelement/core` and `@openelement/elements`
      required runtime dependencies.
- [x] Document Vue, React, Svelte, and generic heavy-island expansion as frozen
      until a later ADR reopens them.

### C. Signal Engine Candidate

ADR-0104 keeps the default signal engine unchanged and requires any
`@preact/signals-core` work to stay behind the `SignalEngine` protocol.

- [ ] Add `@preact/signals-core` as a candidate only behind the existing
      `SignalEngine` and `@openelement/protocols/signals` boundary.
- [x] Run conformance tests against the existing signal behavior.
- [ ] Measure bundle and SSR/CSR behavior before any default-engine proposal.
- [ ] Keep the current signal default unless a later ADR explicitly approves a
      default change.

### D. Root Cleanup

- [x] Move or re-home `fixtures/nitro-proof` so the root no longer carries a
      one-off v0.37.6 proof fixture as active product shape.
- [ ] Keep `nitro:proof:node` and `nitro:proof:workers` working after the move,
      or archive those tasks as historical release evidence with an ADR-backed
      replacement.
- [ ] Audit root-level generated or local-output directories and ensure tracked
      root entries are active product, active tooling, or archived evidence.
- [ ] Update `.gitignore`, task paths, and docs references after any root
      cleanup.

### E. Hub Physical Freeze

- [x] Decide whether `hub-index` is archived release evidence, generated data,
      or removed from the active product line.
- [x] Remove `hub-index` from active root product shape unless a human ADR
      reopens Hub by guarding all write/update tasks behind
      `OPEN_ELEMENT_ALLOW_ARCHIVED_HUB_WRITE=1`.
- [x] Disable, delete, or manual-scope `hub-ci.yml` while Hub remains frozen.
- [ ] Keep `packages/hub` publishable only if release graph compatibility
      requires it; otherwise prepare a package removal or merge ADR.
- [ ] Remove Hub from first-run docs, current gates, and starter narratives.

### F. Docs Slimming

- [ ] Keep active docs to four categories: current truth, ADR, release
      evidence, and archive.
- [ ] Treat `docs/current/VERSION_PLAN.md` as the only active v0.40 execution
      plan; do not add `docs/sop/v0.40.0/` or `docs/next/v0.40.0/`.
- [ ] Move historical SOP, NextVersion, conversation, review, and old
      governance materials into archive batches.
- [ ] Make docs gates scan current truth and ADR/release indexes, not every
      historical planning directory.
- [x] Add an archive index so old evidence remains discoverable without being
      treated as current truth.

### G. Package Graph Rationalization

v0.40 must classify every package and stop presenting all 21 packages as equal
product surfaces.

| Group                       | Packages                                                                                        | v0.40 decision                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Product-facing              | `elements`, `ui`, `app`, `create`, `protocols`                                                  | Keep and document as first-run surfaces.                              |
| Foundation / implementation | `core`, `runtime`, `router`, `signals`, `style-sheet`, `ssg`, `content`, `i18n`, `adapter-vite` | Keep if needed, but demote from first-run product docs.               |
| Adapter / interop           | `adapter-lit`, `adapter-vanilla`, `adapter-react`                                               | Freeze or keep as compatibility surfaces; no broad adapter expansion. |
| Archive / merge candidates  | `hub`, `cem`, `compat-check`, `rpc`                                                             | Prepare ADR-backed freeze, merge, or removal decisions.               |

- [x] Add a current package-surface inventory with product, foundation,
      adapter, tool, and archive-candidate classifications in
      `docs/current/PACKAGE_SURFACE.md`.
- [x] Decide whether v0.40 physically reduces the workspace package count or
      records ADR-approved deferrals for each retained archive candidate.
- [ ] If an ADR approves removal or merge, update `PACKAGE_COUNT`,
      `RELEASE_PACKAGE_ORDER`, import maps, package READMEs, release gates, and
      migration notes in the same change.
- [ ] Keep `graph:check` as the hard gate for any package topology change.

### H. Gate and Workflow Slimming

- [ ] Keep AutoFlow3 as the single workflow/gate/evidence control plane.
- [ ] Reduce local hook entry points to `autoflow:dev` and `autoflow:push`.
- [x] Reduce CI gate entry to `autoflow-ci.yml`; legacy `fast-gate.yml`,
      `sop-gate.yml`, duplicate lint/test workflows, and Hub-specific workflows
      must be removed, disabled, or manual-scoped.
- [ ] Keep JSR publish and post-publish smoke as release evidence, not generic
      repeated PR gates.
- [ ] Remove old SOP Gate and AutoFlow2-era wording from current governance
      docs after the active gate path is stable.

### I. Release Evidence and Migration

- [ ] Record v0.40 release evidence under `docs/release/`.
- [ ] Keep v0.39 SOP/NextVersion as historical evidence until the archive move
      is complete.
- [ ] Add migration notes for Elements naming, package-surface classification,
      Hub freeze, docs layout, and gate entry changes.
- [ ] Ensure JSR publish and post-publish smoke evidence are present before
      declaring v0.40 closure.

## Acceptance

- Public docs agree that Preact, not Vue, is the v0.40 heavy-island priority.
- `@openelement/elements` and `OpenElement` have implementation, tests, and
  migration docs or an ADR-backed deferral.
- Repository Slimming is complete enough that root fixtures, Hub, docs,
  package graph, and gate shape no longer contradict the four-product model.
- `fixtures/nitro-proof` no longer exists as an unexplained root proof fixture.
- `hub-index` is archived, generated-only, or removed from active product and
  gate paths.
- Active docs no longer require parallel SOP plus NextVersion planning for the
  current version.
- Every workspace package has a v0.40 classification and each archive/merge
  candidate has either an accepted ADR action or an explicit deferral.
- CI and hooks enter through AutoFlow3, with duplicate gate orchestration
  removed, disabled, or manual-scoped.
- AutoFlow3 policy tests prove patch automation is allowed only for bounded
  mechanical changes.
- Minor and major release commands fail without approved ADR and version-plan
  evidence.
- JSR publish and post-publish smoke evidence exist before v0.40 closure.

## Test Matrix

```bash
deno task workflow:check
deno task workflow:check-slimming
deno task docs:check-public
deno task docs:check-current
deno task docs:check-strategy
deno task graph:check
deno task ci:check-package-tests
deno task package-surface:check
deno task signals:check-protocol-boundary
deno task fmt:check
deno task lint
deno task typecheck
deno task autoflow:test
deno task autoflow:dev --dry-run
deno task autoflow:push --dry-run
deno task autoflow:ci --dry-run
deno task autoflow:patch-release --dry-run
deno task test
deno task build
deno task publish:dry-run
```

Release work still requires the full repository gate list, dev/main CI, JSR
publish, post-publish smoke, and release evidence before closure.

# v0.40.0 Version Plan - Product-Line Reset

## Objective

Make `dev` the focused v0.40 product-line branch and keep the project aligned to:

```text
openElement = Elements + UI + Framework + Protocols
```

v0.40 is a breaking Repository Slimming release. It narrows the package graph, removes Hub
from the active product, makes AutoFlow3 the only gate control plane, and keeps
Vite + Nitro as the Framework base while protocols remain replaceable.

The current local package line is `v0.40.0`. Publish closure still requires
release evidence and JSR/post-publish smoke before v0.40 is marked released.

## Scope

- Keep a 14-package current graph documented in `docs/current/PACKAGE_SURFACE.md`.
- Remove historical `rpc`, `hub`, `cem`, `compat-check`, `adapter-lit`,
  `adapter-react`, and `adapter-vanilla` packages from the current workspace.
- Keep Preact as the v0.40 heavy-island priority without making it the product
  identity.
- Keep `@preact/signals-core` only as a `SignalEngine` candidate pending
  conformance, SSR/CSR, bundle, and consumer evidence.
- Keep current docs to current truth, ADR, roadmap/status, release evidence, and
  archive index.
- Keep AutoFlow3 as the single workflow/gate/evidence control plane.

## Governance Rules

- ADR-0101 is the authority boundary for this reset.
- ADR-0104 keeps the signal engine candidate work behind protocol conformance.
- AutoFlow3 may execute mechanical patch work only; minor/major scope, public
  API, package graph, default runtime, default signal engine, release policy,
  security, auth, and database ownership changes require human-approved ADR or
  version-plan evidence.
- v0.40 package removals are human-approved as part of this Version Plan and
  must be reflected in release evidence before closure.

## Workstreams

### Elements Product Surface

- [x] Create `@openelement/elements`.
- [x] Provide `OpenElement` and `DsdElement` compatibility exports.
- [x] Add Elements shadow/DSD and light DOM opt-in tests.
- [ ] Update starter, README, package README, and website docs to teach
      `OpenElement` as the first-run authoring surface.

### Framework and Nitro Base

- [x] Keep Vite + Nitro proof tasks as Framework evidence.
- [x] Keep protocols as the runtime-free replacement boundary.
- [ ] Prove Preact island SSR output, client upgrade, explicit hydration
      strategy, asset loading, and consumer starter behavior.

### Package Graph Rationalization

- [x] Reduce the workspace package graph from 21 to 14 packages.
- [x] Inline CEM compatibility needed by `@openelement/ssg`.
- [x] Remove Hub, RPC, CEM, compat-check, and interop adapter packages.
- [x] Update package count, release order, workspace imports, and package
      surface checks.
- [x] Add v0.40 migration/release evidence for removed packages.

### Docs Slimming

- [x] Keep active docs to current truth, ADR, release evidence, roadmap/status,
      and archive index.
- [x] Remove historical SOP, NextVersion, conversation, review, reference,
      design, mockup, and old AutoFlow docs from active repo truth.
- [x] Use `docs/archive/README.md` as the archive index; complete history remains
      available through git history.
- [x] Ensure docs checks ignore removed historical locations.

### Gate and Workflow Slimming

- [x] Keep workflows to `autoflow-ci.yml`, `codeql.yml`, `publish-jsr.yml`, and
      `jsr-consumer-monitor.yml`.
- [x] Remove duplicate `test.yml`, Hub CI, manual publish, and deploy API
      workflows.
- [x] Make `publish-jsr.yml` call `deno task autoflow:ci` directly.
- [x] Remove old AutoFlow2 and duplicate gate tasks from `deno.json`.
- [x] Run and fix AutoFlow3 local, push, and CI gates.

## Acceptance

- The workspace has exactly 14 current packages.
- `graph:check`, `package-surface:check`, and release order agree on the same
  14-package graph.
- Active workflows are at most 4 and all CI gate orchestration enters through
  AutoFlow3.
- Root has no tracked Hub index or generated output.
- Active docs no longer depend on SOP/NextVersion/conversation/review trees.
- `nitro:proof:node` and `nitro:proof:workers` still pass.
- Release evidence records package removals, Hub removal, docs slimming, and
  workflow slimming before v0.40 closure.

## Test Matrix

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task graph:check
deno task workflow:check
deno task workflow:check-slimming
deno task docs:check-public
deno task docs:check-current
deno task docs:check-strategy
deno task package-surface:check
deno task signals:check-protocol-boundary
deno task autoflow:test
deno task autoflow:dev
deno task autoflow:push
deno task autoflow:ci
deno task nitro:proof:node
deno task nitro:proof:workers
```

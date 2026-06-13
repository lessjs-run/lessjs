# ADR-0105: v0.40.x Cleanup Train Exception

Date: 2026-06-14

Status: Accepted

Supersedes in part: ADR-0090, ADR-0101 package graph assumptions

## Context

ADR-0101 established AutoFlow3 as the workflow, gate, evidence, and release
state control plane. It also drew a hard boundary: AutoFlow3 cannot decide
minor/major product scope, public API, package topology, default runtime,
default signal engine, or release policy.

The v0.40 repository still carried too much historical surface after the first
cleanup pass. In particular, `@openelement/elements` was still thin, while
`@openelement/runtime`, `@openelement/style-sheet`, and `@openelement/ssg`
remained standalone packages that blurred the product line.

## Decision

v0.40.x is a manually approved breaking cleanup train. These patches are not
normal AutoFlow patch releases.

The approved cleanup target is an 11-package package graph:

- `@openelement/core`
- `@openelement/elements`
- `@openelement/ui`
- `@openelement/app`
- `@openelement/create`
- `@openelement/protocols`
- `@openelement/adapter-vite`
- `@openelement/signals`
- `@openelement/router`
- `@openelement/content`
- `@openelement/i18n`

The following packages are removed from the current package graph:

- `@openelement/runtime`
- `@openelement/style-sheet`
- `@openelement/ssg`

`@openelement/elements` remains plural and becomes the canonical component
authoring facade. It re-exports `OpenElement`, `DsdElement`, `StyleSheet`,
signals, island helpers, JSX runtime helpers, and key authoring types.

`StyleSheet` moves to `@openelement/core/style-sheet` and is re-exported from
`@openelement/elements`.

SSG implementation moves inside `@openelement/adapter-vite` as build-pipeline
internals. There is no standalone public `@openelement/ssg` package in the
v0.40.x current graph.

Preact islands are supported through optional `@openelement/app/preact`. Fresh
is a comparison target for Preact island semantics, not an adopted router or
server runtime.

`alien-signals` remains the default signal engine in v0.40.x.
`@openelement/signals/preact-engine` is only an optional candidate backed by
`@preact/signals-core`.

## AutoFlow Boundary

AutoFlow3 patch automation must refuse v0.40.x cleanup-train releases unless
the release state or command references this approved plan id:

```text
ADR-0105/v0.40.x-cleanup-train
```

AutoFlow3 may run gates, produce evidence, classify changes, and execute an
approved release flow. It may not infer that package removals, public API
changes, or default engine changes are ordinary patch work.

## Consequences

- The publish order shrinks to 11 packages.
- Active code must not import removed packages.
- Root generated artifacts and stale root benchmarks are rejected by repo
  hygiene checks.
- `autoflow:push` must include `arch:check` for package, tool, hook, workflow,
  and root config changes.
- `core` and `elements` must not require `@preact/signals-core`.
- Historical ADR and release evidence may still mention removed packages as
  history; active truth lives in current docs, ADRs, roadmap/status, checks, and
  release evidence.

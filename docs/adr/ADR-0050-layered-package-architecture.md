# ADR-0050: Layered Package Architecture

- Status: ACCEPTED
- Date: 2026-05-26

## Context

The v0.22 release work exposed a deeper pattern than ordinary cleanup:

- `@lessjs/core` is still the default place for rendering, public types,
  compatibility bridges, and convenience exports.
- `@lessjs/adapter-vite` owns build context, virtual module ids, import
  resolution, SSG phases, generated entry code, and Vite plugin assembly.
- `@lessjs/content` and `@lessjs/i18n` depend on adapter-owned build contracts
  even though they are feature packages.
- `@lessjs/signals` is a LessJS facade over `alien-signals`, not an owned
  reactive engine.
- Generated projects are now a release contract. Recent failures came from
  published package graphs and consumer import maps, not from local source
  typechecking alone.
- Public docs can outrun code unless current status, roadmap, ADR, SOP,
  package versions, and consumer smoke tests agree.

LessJS should stay Web Standards-first, DSD-first, static-first, low-magic, and
deterministic. That spirit is weakened when public packages leak internal build
dependencies or when `core` becomes a convenience aggregation package.

## Decision

LessJS adopts a layered package architecture.

The intended ownership model is:

```text
protocols / contracts
  stable shared types, build contracts, virtual ids, diagnostics

runtime kernel
  DsdElement, html templates, renderDSD, island runtime, navigation, logging

implementation packages
  signal facade over alien-signals, StyleSheet implementation, CEM parser,
  compatibility classifier, validation helpers

build adapters
  Vite integration, SSG phases, import resolution, entry generation,
  post-processing, generated consumer wiring

product facades
  authoring runtime facade and app configuration facade

tools and ecosystem
  create CLI, Hub, compatibility evidence, submission and validation tools
```

`@lessjs/core` is the runtime kernel. It should not become the all-purpose DX
barrel. Compatibility re-exports are allowed only with explicit ownership and a
deprecation plan.

`@lessjs/signals` remains the LessJS signal API facade powered by
`alien-signals`. LessJS owns the public `.value` / `subscribe()` contract and
framework integration semantics, not the low-level reactive algorithm.

`@lessjs/app` remains the configuration facade for `lessjs()` and Vite plugin
composition. A separate authoring facade such as `@lessjs/runtime` may be added
if single-import component authoring remains important.

Build contracts shared by `adapter-vite`, `content`, `i18n`, `create`, and
consumer smoke tests should move to a contracts layer rather than living under
one adapter package.

v0.23.x is reassigned from Edge Full-Stack to Layered Package Architecture. The
previous Edge Full-Stack plan moves to v0.24.x. Ecosystem hardening moves to
v0.25.x.

## Consequences

### Positive

- Package responsibilities become explainable to external contributors.
- Publish order and JSR dependency graphs become easier to verify.
- `@lessjs/core` can stay small, stable, and standards-focused.
- `adapter-vite` can evolve without pulling feature packages into adapter
  internals.
- Generated projects can remain small while still listing every direct import
  they own.
- Edge Full-Stack work starts from a cleaner runtime/build boundary.

### Negative

- v0.23 no longer ships the ISR production handler or KV adapters.
- A contracts package adds one more public package to govern carefully.
- Compatibility bridges must be maintained during a deprecation window.
- Some imports may move even when runtime behavior does not change.

### Neutral

- This decision does not reject ADR-0038. It delays its implementation until
  the package system can support it cleanly.
- This decision does not require replacing Deno, JSR, Vite, Hono, or
  alien-signals. Those choices remain aligned with the project when kept in the
  right layer.
- This decision does not require turning every helper into an object or class.
  Pure functions remain preferred for rendering and serialization.

## Acceptance

- `docs/roadmap/ROADMAP.md` lists v0.23.x as Layered Package Architecture,
  v0.24.x as Edge Full-Stack, and v0.25.x as Ecosystem Hardening.
- `docs/sop/v0.23.0/` contains SOPs for contracts, core boundary, facades,
  adapter modularity, release graph gates, and docs governance.
- `docs/status/STATUS.md` explains the new version order.
- `@lessjs/create` post-publish smoke runs the just-published create version,
  not an ambiguous latest version.
- Future v0.23 code changes start from the SOPs in `docs/sop/v0.23.0/`.

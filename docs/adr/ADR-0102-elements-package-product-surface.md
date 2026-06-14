# ADR-0102: Elements Package Product Surface

- Status: Accepted
- Date: 2026-06-13
- Target: v0.40.0
- Depends on: ADR-0099, ADR-0101

## Context

ADR-0099 approved the four-product matrix and named Elements as the native Web
Components authoring product. ADR-0101 made v0.40 the product-line reset and
kept `dev` as the focused v1 development line.

The repository now exposes `OpenElement` from `@openelement/core`, but that is
only a compatibility bridge. It still forces first-run Elements users to import
from the low-level implementation package. That contradicts the product story:

```text
openElement = Elements + UI + Framework + Protocols
```

Adding a new package is a package graph topology change, so ADR-0101 requires
human-approved ADR evidence before implementation.

## Decision

Add `@openelement/element` as the first-class Elements package in v0.40.

The package starts as a narrow product facade over the existing implementation:

- export `OpenElement`;
- re-export the component authoring types needed by Elements users;
- preserve shadow/DSD as the default render mode;
- preserve explicit light DOM opt-in;
- avoid Vite, Nitro, app routing, UI component, and signal-engine default
  ownership.

`@openelement/core` keeps `OpenElement` as a compatibility export for v0.40, but
first-run docs should teach `@openelement/element`.

## Package Graph Changes

The workspace package count increases from 20 to 21 for v0.40.

Required implementation changes:

- add `packages/element`;
- add `@openelement/element` to root `deno.json` workspace and imports;
- add the package to `RELEASE_PACKAGE_ORDER` after `@openelement/core`;
- update `PACKAGE_COUNT`;
- update package graph and package surface checks;
- add tests proving `OpenElement` import from `@openelement/element`;
- update README and package docs to prefer Elements for component authoring.

## Non-Goals

- Do not remove `DsdElement` in v0.40.
- Do not remove `OpenElement` from `@openelement/core` in v0.40.
- Do not move the implementation out of `@openelement/core` in the same step.
- Do not make Elements depend on Vite, Nitro, UI, app routing, or Preact.
- Do not change the default signal engine.

## Consequences

### Positive

- The Elements product becomes a real package instead of only a roadmap name.
- First-run authoring can stop pointing at `@openelement/core`.
- v1 can freeze a narrower public surface.

### Neutral

- The package is initially a facade; implementation migration can happen later.
- Package count temporarily increases before archive-candidate packages are
  removed or merged by later ADR work.

### Negative

- Release order, package count, import maps, and publish evidence must include
  one more package.
- JSR publish has one more package in the release line.

## Acceptance

- `deno task graph:check` passes with 21 packages.
- `deno task package-surface:check` classifies `@openelement/element` as
  product-facing.
- `deno task typecheck` checks the new package.
- Tests prove `OpenElement` can be imported from `@openelement/element`.
- README and current docs teach `@openelement/element` as the first-run
  Elements surface.

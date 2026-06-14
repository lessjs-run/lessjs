# ADR-0102: Elements Package Product Surface

- Status: Accepted (updated v0.40.0 final cleanup)
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
first-run docs teach `@openelement/element`.

**v0.40.0 final update**: `@openelement/element` now owns the full component
authoring surface:

- `OpenElement` — the canonical custom element base class
- `defineElement`, `defineLayout` — element/layout definition helpers
- Prop system (`PropDecl`, `initializeStaticProps`, etc.)
- `ErrorBoundary` — declarative error boundary component
- `StyleSheet` — CSSStyleSheet wrapper
- `signal`, `computed`, `effect` — signal primitives (re-exported from
  `@openelement/signal`)
- JSX runtime (`jsx`, `jsxDEV`, `jsxs`, `Fragment` — re-exported from core)
- Island utilities (`defineIsland`, `bindSsrProps`, `getSsrProps`)
- Context API (`createContext`, `provideContext`, `consumeContext`)
- HTML utilities (`escapeHtml`, `escapeAttr`, `trustedHtml`)

The Elements product is now a real package that component authors import
directly, rather than a compatibility bridge pointing to `@openelement/core`.

## Package Graph Changes

The workspace package count is 11 for v0.40 (after archive-candidate packages
were removed).

Required implementation changes (completed):

- [x] add `packages/element`;
- [x] add `@openelement/element` to root `deno.json` workspace and imports;
- [x] add the package to `RELEASE_PACKAGE_ORDER` after `@openelement/core`;
- [x] update `PACKAGE_COUNT`;
- [x] update package graph and package surface checks;
- [x] add tests proving `OpenElement` import from `@openelement/element`;
- [x] update README and package docs to prefer Elements for component authoring.

## Non-Goals

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

### Negative

- JSR publish has one more package in the release line.

## Acceptance

- [x] `deno task graph:check` passes with 11 packages.
- [x] `deno task package-surface:check` classifies `@openelement/element` as
      product-facing.
- [x] `deno task typecheck` checks the new package.
- [x] Tests prove `OpenElement` can be imported from `@openelement/element`.
- [x] README and current docs teach `@openelement/element` as the first-run
      Elements surface.
- [x] `@openelement/element` exports `ErrorBoundary`, `defineElement`,
      `defineLayout`, prop system, `StyleSheet`, signals, JSX runtime,
      island utilities, context API, and HTML utilities.

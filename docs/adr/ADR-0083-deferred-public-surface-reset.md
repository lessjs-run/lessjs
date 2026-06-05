# ADR-0083: Deferred Public Surface Reset

- Status: Accepted
- Date: 2026-06-05
- Target: v0.32-v1.0

## Context

openElement v0.31.0 has a working Application API, release-proven package graph,
and published 19-package `@openelement/*` line. The graph is technically
healthy, but it reflects internal module boundaries more than product
boundaries.

The project has competing forces:

- it must remain maintainable by a small team;
- it must not become a high-coupling full-stack monolith;
- islands should stay framework-agnostic and interoperable with any Custom
  Element implementation;
- Elements, UI, and Framework concerns should be understandable as separate
  product surfaces;
- runtime, builder, backend, and database choices should stay replaceable where
  practical;
- v0.31 just stabilized the authoring direction, so immediate package migration
  would spend the next release on import churn instead of product validation.

## Decision

Do not reorganize the physical package surface immediately after v0.31.0.

Instead:

1. Keep the existing v0.31 package graph while v0.32-v0.36 validate rendering,
   server/data, UI, starter, and migration surfaces.
2. Treat v0.37.0 as the planned **Public Surface Reset** before v1.0.
3. Freeze v1.0 only after the v0.37 reset is complete and proven by local gates,
   CI, generated-project smoke, publish dry-run, and consumer smoke.
4. Apply new package governance immediately so the current graph does not grow
   in the wrong direction before v0.37.

The target public surface for v0.37 review is:

```text
@openelement/protocol    small public interop contracts
@openelement/elements    DSD-first Custom Element authoring surface
@openelement/ui          DSD-first UI component library
@openelement/framework   application framework surface
@openelement/create      project scaffolding
```

Builder, backend, and compatibility integrations should default to subpaths
unless they become independently useful products with heavy dependency graphs or
separate release cadence:

```text
@openelement/framework/vite
@openelement/framework/router
@openelement/framework/content
@openelement/framework/i18n
@openelement/elements/signals
@openelement/elements/styles
@openelement/elements/compat/lit
@openelement/elements/compat/react
```

## Immediate Governance

Effective immediately:

- Do not add a new top-level `@openelement/*` package without an ADR.
- Prefer subpaths over new packages for integrations.
- Keep protocol contracts small, runtime-free, and Web Standards shaped.
- Do not make `@openelement/ui` depend on framework routing or app shell state.
- Do not make the framework own a database, ORM, auth platform, or backend
  runtime.
- Keep Vite, Hono, Deno, Cloudflare, Node, and database support at adapter or
  recipe boundaries.
- Keep the renderer model JSX -> VNode -> RenderNode -> DSD HTML/DOM.
- Do not reopen the v0.30-v0.31 renderer and trusted HTML cleanup to solve
  package naming.

## Consequences

Positive:

- v0.32-v0.36 can validate product behavior before package churn.
- v0.37 can be based on real usage evidence instead of speculative naming.
- v1.0 has a cleaner freeze point.
- Single-maintainer release overhead stops growing immediately.

Negative:

- The 19-package graph remains visible until the reset.
- Some docs must explain current packages and target packages separately.
- v0.37 will be a deliberate breaking migration.

Neutral:

- `@openelement/protocol` is a likely public package, but the current
  `@openelement/protocols` package is not automatically that contract.
- `signals` remains public API, but its long-term public home should be reviewed
  as part of `@openelement/elements`.
- `router` remains framework-owned until it is proven generic enough to stand as
  a separate product.

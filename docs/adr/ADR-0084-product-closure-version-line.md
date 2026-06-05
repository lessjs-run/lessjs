# ADR-0084: Product Closure Version Line

- Status: Accepted
- Date: 2026-06-05
- Target: v0.32-v1.0

## Context

openElement v0.31.0 established the JSX-first Application API. The next releases
must turn that API into a complete product path before v1.0:

```text
create project -> author pages/islands/layouts -> load data -> handle server
routes and mutations -> deploy rendering modes -> verify UI starters -> freeze
public imports
```

The previous roadmap put rendering modes, server/data work, UI shell, hardening,
and public package reset into a short v0.32-v0.37 line. That order was directionally
correct, but it made v0.32 too wide and left no release-candidate buffer after
the package reset.

## Decision

Adopt a product-closure release line:

```text
v0.32 App Lifecycle Contract
v0.33 Rendering Runtime and Deployment
v0.34 Server Routes and Mutations
v0.35 Data Integration Recipes
v0.36 UI Shell and Starter Productization
v0.37 Production Hardening and Product Pruning
v0.38 Public Surface Reset
v0.39 v1 Release Candidate
v1.0 Stable Application Engine
```

This changes the earlier roadmap in four ways:

1. Split rendering work into lifecycle semantics first, runtime/deploy semantics
   second.
2. Add a first-class server mutation step before data recipes.
3. Move public surface reset from v0.37 to v0.38 so v0.37 can produce API,
   package, Hub, and product-pruning evidence first.
4. Add v0.39 as a release-candidate line after the package reset and before
   v1.0.

## Consequences

Positive:

- Each minor has one product question to answer.
- Rendering, server, data, and UI work can depend on stable earlier contracts.
- Package reset happens after evidence, not speculation.
- v1.0 is not published immediately after a breaking import reset.

Negative:

- The v1.0 path is one minor longer.
- Roadmap, status, SOP index, and architecture docs must be updated together.
- v0.38 will still be a deliberate breaking release.

Neutral:

- ADR-0083 still governs the public surface reset decision, but ADR-0084 changes
  the planned reset version to v0.38.
- Hub remains available in the current package graph, but v0.37 must decide
  whether it is public product, internal tooling, deferred, archived, or removed.

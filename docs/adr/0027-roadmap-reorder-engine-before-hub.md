# ADR-0027: Roadmap Reorder — Universal Engine Before Hub

- Status: ACCEPTED
- Date: 2026-05-16
- Supersedes: Roadmap Phase 4-6 ordering in ROADMAP.md

## Context

The original roadmap had this Phase order:

1. Phase 4 (v0.18.x): Hub Foundation — public registry, search, snapshots
2. Phase 5 (v0.19.x): Platform Maturity — scoped registries, Edge
3. Phase 6 (v1.0): General-Purpose Engine — zero-config SSR/SSG for any WC

This ordering has a dependency problem: the Hub's core value proposition is
"SSR/SSG snapshot previews" of WC packages. But without a universal rendering
engine, the Hub cannot render previews of third-party packages. The Hub
depends on the engine, not the other way around.

Additionally, the Hub was originally planned as a separate repository. This
creates unnecessary friction during early development: shared types require
JSR publishes to sync, CI is duplicated, and dogfooding is weaker.

## Decision

### 1. Reorder Phases: Engine first, Hub second

New order:

- Phase 4 (v0.18.x): Universal WC Engine — CEM parser, third-party SSR fallback
- Phase 5 (v0.19.x): Platform + Hub — public registry, search, snapshots, Edge
- Phase 6 (v1.0): General-Purpose Engine + API freeze

Rationale: The engine is the foundation. The Hub is the building on top.
You can't build snapshot previews without a rendering engine.

### 2. Hub stays in main monorepo

The Hub lives in `packages/hub/` within the LessJS monorepo until one of
these conditions is met:

- Hub has independent deployment rhythm (3x/day vs 1x/week for framework)
- Hub has a dedicated team maintaining it
- CI time becomes a real bottleneck

Rationale: Early development benefits enormously from co-location:
shared types without publish lag, immediate breakage detection, single CI
pipeline, zero overhead for cross-repo coordination.

### 3. v0.17.x patch plan update

v0.17.x now includes cross-runtime support (v0.17.1) and defers `less add`
to v0.18.x where the universal engine provides the rendering foundation.

## Consequences

- v0.18.x is more ambitious but also more valuable — it's the "any WC package
  works" milestone
- Hub development is deferred until the engine can render previews
- Monorepo gets heavier when Hub is added, but the benefit of co-location
  outweighs the cost at this scale
- v0.17.x scope is tighter: manifest-native + cross-runtime + SSR filtering

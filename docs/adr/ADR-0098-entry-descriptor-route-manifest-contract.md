# ADR-0098: EntryDescriptor Route Manifest Contract

Status: Accepted

Date: 2026-06-12

## Context

`@openelement/ssg` currently owns the generated server-entry descriptor in
`entry-descriptor.ts`. That descriptor is a pure data object, but its type
surface is coupled to the SSG package. ADR-0096 requires
`@openelement/protocol` to become the replacement boundary for route,
runtime, renderer, island, and cache integration.

The route manifest is the most important protocol handoff for a Nitro runtime
proof. Nitro must receive route, island, SSR admission, app-shell, middleware,
document, and prerender intent as data. It must not need to import SSG build
implementation modules to understand the application contract.

## Decision

`@openelement/protocol/routes` owns the route manifest and entry descriptor
contract shape.

The protocol module defines:

- route declarations for page and API routes;
- island declarations and hydration metadata;
- SSR admission plans;
- renderer and middleware scope declarations;
- document and app-shell plans;
- the full `EntryDescriptor` data contract;
- a minimal route protocol entry for non-SSG producers.

`@openelement/ssg` keeps ownership of:

- filesystem scanning;
- route sorting and dynamic route inference;
- import path generation;
- CEM/package manifest scanning;
- SSG-specific descriptor construction;
- Hono entry rendering.

The migration rule is compatibility-first:

1. Protocol types are introduced in `@openelement/protocol/routes`.
2. SSG may re-export or implement against those types without changing public
   behavior.
3. Full implementation migration only happens when graph, build, and renderer
   tests prove the contract remains stable.

## Consequences

### Positive

- Nitro and future runtimes can consume route semantics without importing SSG
  implementation code.
- Manual manifests, CMS route sources, or Vike-style deployment metadata can
  target the same protocol.
- Route manifest conformance can be tested independently from Hono entry
  generation.

### Neutral

- The protocol mirrors existing SSG data before replacing SSG internals. This
  creates some temporary duplication, but keeps v0.37.5 bounded and safe.
- Hono remains an implementation detail of the current generated entry. The
  protocol names middleware and routes as data, not as Hono-specific code.

### Negative

- The route manifest is a large public contract surface and must evolve
  carefully.
- Some SSG types still reference CEM compatibility and app shell concepts. The
  protocol must keep those as data-only shapes, not implementation imports.

## Non-Goals

- No Nitro runtime proof in this ADR.
- No removal of SSG entry generation.
- No new top-level package.
- No change to file route scanning behavior.
- No claim that all route producers are supported before conformance tests
  exist.

## Related

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- `packages/ssg/src/entry-descriptor.ts`
- `packages/protocol/src/routes.ts`

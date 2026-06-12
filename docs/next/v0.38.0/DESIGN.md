# v0.38.0 Design

## Product Surface Model

v0.38.0 uses a classification-first reset. Every current package and public
subpath must be assigned one of these states before code moves:

- `product`: primary user-facing surface that docs and starter templates may
  recommend.
- `advanced-subpath`: public but specialized; docs may reference it only in
  advanced guides.
- `internal`: implementation detail; remove from public docs and templates.
- `archived`: retained for compatibility during 0.x but not part of the v1
  direction.
- `removed`: intentionally removed or scheduled for removal with migration
  notes.

## Candidate Products

The v0.37.x train points toward four product surfaces:

- elements: `DsdElement` and Web Component authoring primitives;
- UI: pure CSS and DSD-compatible `open-*` components;
- protocols: runtime-free contracts and conformance suites;
- framework: app authoring, Vite facade, Nitro runtime path, routes, data,
  islands, SSG/SSR/ISR, and starter composition.

The exact package names are a release decision. Any new package name requires
ADR approval before implementation.

## Invariants

- `@openelement/ui` must not depend on framework routing.
- Protocol exports must stay runtime-free.
- Nitro remains runtime/deployment plumbing, not the authoring API.
- Static routes keep the zero-framework-JS default.
- JSR publish state remains distribution telemetry, not release truth.

## Evidence Shape

The reset is complete only when the inventory, classification, docs, package
graph, create templates, generated consumer path, and release gates agree.

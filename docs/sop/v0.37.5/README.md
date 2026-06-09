# v0.37.5 SOP: Protocol Ports and Adapter Map

> Status: Planned\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0-v0.37.4

## Goal

Define a small protocol layer around real substitution boundaries without
turning the project into a broad abstraction framework.

## Entry Criteria

- SSR/ISR, data/database, UI, and DsdElement boundaries have documented
  contracts.
- Existing `@openelement/protocols` build-time contracts have been audited.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0025: Renderer Protocol.
- ADR-0077: Structured Render IR and Single Renderer Pipeline.

## Step-by-Step Tasks

1. Audit existing `@openelement/protocols` exports and consumers.
2. Define minimal renderer, server, build, data/load, component-adapter, and
   cache/ISR ports.
3. Map existing Deno/Vite/Hono/DsdElement paths onto the ports.
4. Document which substitutions are supported now, which are recipes, and which
   are future experiments.
5. Add type tests for the ports.
6. Add docs showing adapter mapping without promising full Deno/Node,
   Hono/Express, or DsdElement/Lit equivalence.
7. Decide whether `@openelement/protocols` remains the package name until
   v0.38.

## Verification

- protocol type tests.
- package graph check.
- architecture contract check.
- docs strategy check.

## Non-Goals

- No full Spring clone.
- No all-backends-are-equal claim.
- No new top-level protocol package before v0.38 ADR approval.
- No database/auth ownership.

## Exit Criteria

- Protocol boundaries explain real adapter points.
- The public docs do not overpromise replaceability.
- v0.38 has evidence for package surface decisions.

## AutoFlow Boundary

AutoFlow may check protocol type tests and mapping docs. It must not choose
package names or declare a substitution supported without proof.

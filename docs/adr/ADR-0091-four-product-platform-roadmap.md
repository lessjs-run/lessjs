# ADR-0091: Four-Product Platform Roadmap

- Status: Accepted
- Date: 2026-06-09
- Target: v0.37-v1.0
- Supersedes: v0.37-v1 sequencing in ADR-0086
- Preserves: ADR-0086 AutoFlow2 boundary

## Context

ADR-0086 correctly made the repository more machine-readable before continuing
product expansion. It also intentionally limited AutoFlow2: AutoFlow can report
state, evidence, blockers, and allowed actions, but it cannot replace human
review for ADRs, public API resets, package removal, releases, tags, or
publishing.

The sequencing after v0.36 is now the problem. The existing roadmap groups
server, data, UI, starter, Hub disposition, pruning evidence, and public surface
preparation into v0.37.0. That is too large for one version and risks repeating
the release-truth drift that v0.36.5 had to close.

The repository already has foundations for the intended product lines:

- `DsdElement`, DSD rendering, JSX runtime, and render reports in core;
- `@openelement/ui` and Open Props token work;
- `@openelement/protocols` as a small zero-dependency contract layer;
- `@openelement/app`, `@openelement/adapter-vite`, `@openelement/ssg`, and
  `@openelement/create` as the framework/preset path;
- SSR, SSG, Streaming DSD, and ISR primitives.

The roadmap needs to make those product lines explicit without pretending they
are complete.

## Decision

Adopt a four-product platform target:

```text
elements  -> DsdElement and standards-first component authoring
ui        -> pure CSS-first UI layer, behavior optional
protocol  -> small ports/adapters contracts
framework -> full-stack preset and create path
```

SSR and ISR are framework core capabilities, not a fifth product.

Default rendering doctrine:

- static routes emit zero framework JavaScript unless an island, hydration, or
  client-only component is explicitly used;
- DSD/shadow DOM is the default component rendering mode;
- light DOM is allowed only as an explicit opt-in contract;
- `dsd: false`, `hydrate: "only"`, and `pure-island` must be audited before
  they are described as light DOM.

Replace the old v0.37-v1 sequence with:

```text
v0.37.0 Product Doctrine + Rendering Contract Reset
v0.37.1 DsdElement Shadow + Light Contract
v0.37.2 SSR / ISR Server Runtime Contract
v0.37.3 Data / Database Boundary
v0.37.4 Pure CSS UI Foundation
v0.37.5 Protocol Ports + Adapter Map
v0.37.6 Full-Stack Preset Smoke
v0.38.x Product Surface Reset and Hardening
v0.39.0 Full-Stack Framework RC
v1.0.0 Stable Four-Product Platform
```

Database and auth ownership:

- openElement will not own a built-in ORM, auth platform, or database migration
  system;
- database integration belongs in data/database adapter contracts and recipes;
- concrete database technologies may appear as examples or adapters only after
  their boundary is defined.

## AutoFlow Policy

AutoFlow is an execution and evidence system.

Allowed:

- check NextVersion shape;
- check SOP task evidence;
- report docs/version/package drift;
- run and summarize graph, architecture, test, build, and E2E gates;
- produce evidence for small implementation cells.

Not allowed:

- decide public API names;
- choose package splits;
- choose license strategy;
- choose database defaults;
- approve security/auth defaults;
- merge, tag, release, publish, or replace human review.

## Consequences

Positive:

- v0.37 becomes a sequence of bounded versions instead of one epic.
- SSR, ISR, and default zero-JS remain first-class framework commitments.
- `DsdElement` can remain shadow/DSD-first while supporting light DOM where it
  fits the platform.
- database work can enter the roadmap without turning into ORM ownership.
- v0.38 package reset will be based on product evidence, not speculation.

Negative:

- The route to v1 has more version steps.
- More SOPs and NextVersion packages must be maintained.
- v0.37.0 becomes a planning/documentation version, which may feel slower than
  immediate implementation.

Neutral:

- ADR-0083 still governs deferred public surface reset.
- ADR-0086 still governs AutoFlow2 boundaries and evidence discipline.
- Existing v0.36 package APIs are not changed by this ADR.

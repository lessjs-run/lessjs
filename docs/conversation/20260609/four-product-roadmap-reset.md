# Four-Product Roadmap Reset Discussion

Date: 2026-06-09

## Context

The v0.36.5 release-truth patch closed version, AutoFlow, release-note, and
website drift after v0.36.3 and v0.36.4. The next planning question was whether
the existing v0.37.0 "Server/Data/UI Product Closure" scope was realistic.

Repository evidence showed that v0.37.0 had become too broad. It combined
server, data, UI, starter, Hub disposition, protocol boundaries, package pruning,
and preparation for the v0.38 public surface reset. That made v0.37.0 an epic
rather than a bounded version.

## Product Direction

The future product target is a four-product platform:

1. `DsdElement` / elements: a standards-first custom-element base product.
2. UI: a pure CSS-first UI layer, with behavior components optional.
3. Protocol: small ports/adapters contracts for renderer, server, build, data,
   component adapter, and cache/ISR boundaries.
4. Framework/create: the full-stack preset and project creation path that
   composes the stabilized surfaces.

SSR and ISR are not a fifth product. They are core full-stack framework
capabilities.

## Rendering Doctrine

- openElement remains static-first and SSR/SSG-first.
- Static routes should emit zero framework JavaScript unless islands,
  hydration, or client-only components are explicitly used.
- DSD/shadow DOM remains the default rendering mode.
- `DsdElement` should allow an explicit light DOM opt-in for layout, content,
  global CSS, and integration use cases.
- Existing `dsd: false`, `hydrate: "only"`, and `pure-island` semantics must be
  audited before they are described as light DOM. Today they are closer to
  client-only or pure-island behavior than to SSR light DOM.

## Server, Data, and Database

- Server work belongs to the framework product line.
- Data/database work should define boundaries and recipes, not a built-in ORM.
- Database choices should remain external adapters or recipes. Candidate recipe
  directions include file/memory baselines, Deno KV, Cloudflare KV/D1, and
  custom adapters.
- Auth is not a core framework product.

## AutoFlow Boundary

AutoFlow can execute small cells and produce evidence:

- NextVersion shape checks.
- SOP task evidence.
- docs/version drift checks.
- package graph and release-truth checks.
- generated starter smoke.
- SSR/ISR manifest/cache evidence.
- UI token/CSS smoke.
- data adapter contract tests.

AutoFlow must not decide:

- public API names;
- package splits;
- license strategy;
- database defaults;
- auth/security defaults;
- breaking changes;
- merge, tag, release, or publish actions.

Those decisions require ADRs and human review.

## Version Chain Decision

The v0.37 line should be split into a validation train:

- v0.37.0: product doctrine and rendering contract reset.
- v0.37.1: DsdElement shadow/light contract.
- v0.37.2: SSR/ISR server runtime contract.
- v0.37.3: data/database boundary.
- v0.37.4: pure CSS UI foundation.
- v0.37.5: protocol ports and adapter map.
- v0.37.6: full-stack preset smoke.

Then:

- v0.38.x: public product surface reset and hardening.
- v0.39.0: full-stack framework release candidate.
- v1.0.0: stable four-product platform.

## Non-Goals

- Do not implement product code in v0.37.0.
- Do not introduce a new top-level package during the doctrine reset.
- Do not reclassify `dsd: false` as light DOM without tests and ADR coverage.
- Do not add a built-in ORM, auth platform, or database migration system.

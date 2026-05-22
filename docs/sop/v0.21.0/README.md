# v0.21.0 SOP Index - Hydration + ISR

> Status: IMPLEMENTED\
> Roadmap phase: v0.21.x Hydration + ISR\
> Strategic boundary: [ADR-0037](../../adr/0037-dsd-first-strategic-boundary.md)

v0.21 turns the v0.20 Ocean-Island foundation into a more credible
application-framework surface. The release must keep SSG + DSD as the default,
then add explicit client hydration strategies, ISR cache behavior, and API
route deployment parity without weakening the DSD admission model.

## Release Goal

Ship a falsifiable Hydration + ISR line:

- `client:load`, `client:idle`, `client:visible`, and `client:only`
- island manifest and client runtime support for those strategies
- route-level ISR metadata and cache lifecycle
- API route production parity with request context
- docs, examples, and gates proving dev/build behavior

## Document Map

```text
docs/sop/v0.21.0/
  README.md                                  -> this file
  SOP-001-hydration-contract.md             -> public directive and metadata contract
  SOP-002-island-manifest-pipeline.md       -> scanner/build manifest propagation
  SOP-003-client-runtime-strategies.md      -> browser runtime for load/idle/visible/only
  SOP-004-client-only-ssr-exclusion.md      -> SSR exclusion and diagnostics for client:only
  SOP-005-isr-cache-layer.md                -> route-level ISR cache and regeneration
  SOP-006-api-route-production-parity.md    -> API routes, request context, deployment shape
  SOP-007-www-demo-and-docs.md              -> public examples and website docs
  SOP-008-hub-hydration-metadata.md         -> Hub/report metadata for strategy evidence
  SOP-009-release-verification.md           -> release gate matrix
  SOP-010-non-goals-and-deferred-work.md    -> hard scope boundaries
```

## Execution Order

```text
Phase 0: Contract (0.5d)
  SOP-001

Phase 1: Build Pipeline (1.5d)
  SOP-002 -> SOP-004

Phase 2: Runtime (1.5d)
  SOP-003

Phase 3: ISR + API Parity (2.0d)
  SOP-005 -> SOP-006

Phase 4: Public Surface + Hub Evidence (1.0d)
  SOP-007 -> SOP-008

Phase 5: Release Closure (0.8d)
  SOP-009 -> SOP-010

Total: ~7.3 days (single developer, sequential)
```

## Entry Criteria

- v0.20 DsdElement cleanup line is complete.
- `deno task fmt:check`, `lint`, `typecheck`, `test`, `build`,
  `test:e2e`, and `dsd:check-report` pass on `dev`.
- `docs/roadmap/ROADMAP.md` still marks v0.21 as the next milestone.
- No public docs claim v0.21 capabilities as shipped before implementation.

## Key Decisions

| Decision                                           | SOP     |
| -------------------------------------------------- | ------- |
| Directive names match Astro-style user vocabulary  | SOP-001 |
| DSD remains default; hydration is opt-in           | SOP-001 |
| Strategy metadata must be visible in build reports | SOP-002 |
| `client:only` must not enter the SSR bundle        | SOP-004 |
| ISR is route-level HTML regeneration, not full SSR | SOP-005 |
| API parity means deployable handler contracts      | SOP-006 |
| Docs must prove dev/build parity                   | SOP-007 |

## Release Exit Criteria

- All four hydration directives work in dev and production build.
- DSD report includes strategy, source, and SSR exclusion reason where relevant.
- Client bundles contain only the island modules used by each page.
- ISR tests cover fresh hit, stale hit, regeneration, and error fallback.
- API route tests cover dev, build, and production handler execution.
- Public docs clearly separate shipped v0.21 behavior from v0.22 reactive DSD.
- `deno task publish:dry-run` is green or documented as blocked by an external
  publishing condition.

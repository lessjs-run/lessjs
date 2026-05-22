# SOP-010: Non-Goals And Deferred Work

> Version: v0.21.0\
> Phase: Release Closure\
> Priority: P0\
> Status: PLANNED

## Hard Non-Goals

v0.21 must not expand into:

- generic request-time SSR for every route
- auth/session framework
- database or ORM integration
- publisher accounts or package signing
- v0.22 Signals rendering
- template compiler
- cross-provider ISR storage guarantees
- React/Vue/Svelte app framework parity claims

## Deferred To v0.22

- `DsdElement` + Signals integration
- safe template helper with automatic escaping
- optional DOM diffing
- reactive island authoring improvements

## Deferred To v1.0

- API freeze
- manifest schema freeze
- adapter protocol freeze
- stable Hub compatibility guarantees
- formal migration guide for all pre-v1 versions

## Risk Register

| Risk                                      | Mitigation                                      |
| ----------------------------------------- | ----------------------------------------------- |
| Hydration directives become syntax-only   | require dev/build/e2e proof for every strategy  |
| `client:only` leaks into SSR bundle       | add bundle exclusion tests                      |
| ISR expands into generic SSR              | keep `revalidate` route-level and cache-focused |
| API parity grows into platform framework  | expose context only, defer provider SDKs        |
| Docs overclaim dynamic framework maturity | run `docs:check-strategy` and manual review     |

## Closure Rule

If a feature has no test, no report field, and no public example, it is not a
v0.21 feature. Move it to roadmap or v0.22/v1.0 notes.

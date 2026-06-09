# v0.37.6 SOP: Full-Stack Preset Smoke

> Status: Planned\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.1-v0.37.5

## Goal

Prove that the four product surfaces can compose into a real generated
application before the v0.38 public product surface reset.

## Entry Criteria

- DsdElement shadow/light contract is proven.
- SSR/ISR runtime contract is documented and tested.
- Data/database recipe boundary exists.
- Pure CSS UI foundation exists.
- Protocol ports are mapped to current implementation.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0083: Deferred Public Surface Reset.

## Step-by-Step Tasks

1. Define the smoke app requirements.
2. Update create templates or add a dedicated smoke fixture.
3. Include a static page that emits zero framework JavaScript.
4. Include a shadow DSD component.
5. Include a light DOM component.
6. Include an explicit island that ships JavaScript.
7. Include a route using `load()` and a data recipe.
8. Include an ISR route that writes manifest evidence.
9. Include pure CSS UI usage.
10. Run generated project build, DSD report, and E2E.
11. Record evidence for v0.38 package surface decisions.

## Verification

- generated project smoke.
- build.
- dsd report.
- E2E.
- package graph and publish dry-run when release-ready.

## Non-Goals

- No final public package split.
- No production database adapter default.
- No auth framework.
- No v1 API freeze.

## Exit Criteria

- A fresh generated app proves the four-product composition path.
- Static zero-JS and explicit island JS are both testable.
- v0.38 can start from evidence rather than product speculation.

## AutoFlow Boundary

AutoFlow may run smoke generation and collect evidence. It must not approve the
final v1 package surface.

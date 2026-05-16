# LessJS Roadmap

> From renderer kernel to Web Components SSR/SSG engine and registry Hub.
> This document is the source of truth for version planning.

## Principle

Near-term versions are patch-level and evidence-driven. Far-term versions are
minor-level targets until the previous admission gate is met.

The central rule from v0.17.3 onward:

**LessJS promises deterministic outcomes, not universal magic.** A component is
SSR-rendered only when a declared adapter or validated package contract makes it
safe. Otherwise it becomes client-only or fails validation before build output
is generated.

## Phase Overview

| Phase | Version | Name                | Goal                                                           | Status  |
| ----- | ------- | ------------------- | -------------------------------------------------------------- | ------- |
| 1     | v0.15.x | Renderer Kernel     | Structured render output, hooks, build report                  | Done    |
| 2     | v0.16.x | WC Package Protocol | Manifest + local registry                                      | Done    |
| 3     | v0.17.x | Ecosystem Entry     | Manifest-native pipeline, filtering, multi-adapter boundary    | Active  |
| 4     | v0.18.x | Universal WC Engine | CEM parser, compatibility tiers, validation CLI, safe add flow | Planned |
| 5     | v0.19.x | Registry Hub MVP    | Searchable validated package index with reports and snapshots  | Planned |
| 6     | v1.0.x  | Stable Engine       | API freeze and deterministic package admission guarantees      | Vision  |

## Compatibility Admission Model

| Package/component state                                     | Outcome                                       | Build behavior                                                |
| ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Less manifest says `ssr: true` and a renderer can handle it | SSR/SSG                                       | Render through declared adapter                               |
| Less manifest says `ssr: false`                             | Client-only                                   | Do not import/register in SSR bundle; emit hydration metadata |
| CEM exists but no Less SSR declaration exists               | Client-only by default                        | Validate metadata, do not assume SSR                          |
| No CEM and no Less manifest                                 | Reject or require manual config               | Avoid guessing package shape                                  |
| Duplicate custom-element tags                               | Reject unless scoped registry support applies | Avoid global registry conflict                                |
| Browser-only render dependency is detected                  | Client-only or explicit experimental path     | Report reason in diagnostics                                  |
| DOM simulation is enabled                                   | Experimental opt-in                           | Timeout-bound, isolated, and reported                         |

## Phase 1: Renderer Kernel (v0.15.x) - Done

Delivered across v0.15.1, v0.15.2, and v0.15.3:

- `RenderOutput`, `RenderError`, and `HydrationHint` structured types
- `RendererProtocol` with named adapters
- `RenderHooks` lifecycle
- `render-dsd.ts` split into focused modules
- `DsdBuildReport` and `dsd-report.json`
- `SsgPageOutput` structured return from `renderRoute()`
- repeatable release gate: fmt, lint, typecheck, audit, test, build, e2e

Exit criteria: met.

## Phase 2: WC Package Protocol (v0.16.x) - Done

Goal: LessJS can describe WC packages as data instead of only executing package
code. The local registry validates and indexes package metadata.

Patch breakdown: see [v0.16.md](./v0.16.md).

Exit criteria: manifest + registry shipped; legacy `PackageIslandMeta`
removed in later v0.17 work.

## Phase 3: Ecosystem Entry (v0.17.x) - Active

Goal: make the pipeline manifest-native and prove that multiple rendering
families can coexist without overclaiming third-party compatibility.

| Patch   | Main outcome                          | Admission gate                                                                                 |
| ------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| v0.17.0 | Manifest-native adapter-vite pipeline | No legacy `PackageIslandMeta` in runtime path                                                  |
| v0.17.1 | Cross-runtime adapter-vite hardening  | No hard Deno-only process/runtime assumptions                                                  |
| v0.17.2 | SSR filtering + report visibility     | `ssr: false` decisions are visible in build reports                                            |
| v0.17.3 | Vanilla + React adapters              | Multi-adapter works for declared renderers; third-party UI libs are not automatically SSR-safe |
| v0.17.4 | Compatibility boundary hardening      | Local island metadata controls SSR imports before bundle generation                            |

v0.17.4 is complete and now provides the cleanup boundary before v0.18:

- local island `less.ssr === false` is read before SSR entry generation
- client-only modules are not imported or registered in the SSR bundle
- package-level SSR is opt-in unless a validated manifest says otherwise
- nested custom-element rendering respects client-only decisions
- `dsd-report.json` records admission decisions with reasons

## Phase 4: Universal WC Engine (v0.18.x) - Planned

Goal: make third-party WC packages installable and renderable through explicit
compatibility tiers.

Planned patch ladder:

| Patch   | Main outcome                     | Admission gate                                                         |
| ------- | -------------------------------- | ---------------------------------------------------------------------- |
| v0.18.0 | CEM parser + compatibility tiers | CEM is parsed, but unknown packages default to client-only             |
| v0.18.1 | `less validate-manifest`         | Invalid, ambiguous, unsafe, and unsupported packages fail before build |
| v0.18.2 | `less add` dry-run/install       | Install flow updates config only after validation passes               |
| v0.18.3 | DOM simulation prototype         | Explicit opt-in only; timeout-bound and reported                       |

v0.18 must not claim that "any CEM package SSRs." The stronger and realistic
claim is:

> Any package with enough validated metadata gets a deterministic outcome:
> SSR/SSG, client-only fallback, or actionable rejection.

Primary validation targets:

- LessJS packages and examples
- vanilla Web Components with `render(): string`
- React-wrapped Web Components through `@lessjs/adapter-react`
- selected third-party WC libraries, initially as compatibility fixtures rather
  than marketing claims

## Phase 5: Registry Hub MVP (v0.19.x) - Planned

Goal: move from local registry to a public, searchable registry index that is
fed by validation artifacts.

MVP scope:

- package search and detail pages
- manifest/compatibility report ingestion
- SSR/SSG snapshot previews only for packages that pass admission
- bundle size and hydration metadata
- security/audit status from lockfiles and package metadata
- duplicate tag and version conflict reporting
- v0.19.1 previews and quality gates after ingestion is stable

Deferred until after MVP:

- publisher accounts
- package signing
- scoped Custom Element Registries
- edge rendering support
- plugin marketplace

Hub rule:

**The Hub does not execute arbitrary packages as a trust decision. It displays
validation output produced by the engine and its CI jobs.**

## Phase 6: Stable Engine (v1.0) - Vision

Goal: freeze the public API and support Web Components through stable package
admission guarantees.

v1.0 should promise:

- stable renderer protocol
- stable manifest/compatibility schema
- stable `dsd-report.json` schema
- stable client-only fallback behavior
- stable `less add` and `less validate-manifest` flows
- documented package compatibility tiers

v1.0 should not promise:

- SSR for every CEM package
- browser-equivalent DOM simulation
- automatic safe execution of arbitrary package code
- public Hub marketplace maturity

v1.0 exit criteria:

- `less init && less add <validated-package> && deno task build` produces
  either SSR/SSG output or a documented client-only fallback with no manual
  patching.
- all exported APIs are documented with stability level
- v0.x migration guide exists
- validation, report, and add/install flows are covered by tests
- no breaking changes after v1.0 without a major version bump

## Cross-Phase Concerns

| Concern                      | Current State            | Target                                      |
| ---------------------------- | ------------------------ | ------------------------------------------- |
| Third-party UI compatibility | Active v0.17.3 issue     | Admission tiers + client-only fallback      |
| Documentation sync           | Manual                   | Release checklist and changelog index       |
| Test coverage                | Strong unit/e2e baseline | Add compatibility fixtures                  |
| Open source governance       | Partial                  | Complete before public Hub                  |
| Version checks               | Manual                   | `check:versions` before v0.18               |
| Security                     | Basic audit              | Package admission and Hub policy            |
| Build reports                | `dsd-report.json` exists | Include skip reasons and compatibility tier |

## Document Cross-Reference

| Document Type | Rhythm                                  | Location                |
| ------------- | --------------------------------------- | ----------------------- |
| SOP           | Per patch near-term; per minor far-term | `docs/sop/`             |
| ADR           | Decision-driven                         | `docs/adr/`             |
| Changelog     | Per patch                               | `docs/changelog/`       |
| Status        | Always current                          | `docs/status/STATUS.md` |
| Roadmap       | This document + per-minor pages         | `docs/roadmap/`         |

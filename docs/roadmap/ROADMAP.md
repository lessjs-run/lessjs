# LessJS Roadmap

> From Renderer Kernel to General-Purpose WC SSR/SSG Engine + Registry Hub.
> This document is the single source of truth for version planning.

## Principle

**Near-term fine, far-term coarse.** v0.16 has patch-level SOPs. v0.17+ has
minor-level goals only — patch breakdowns are written when we get there.

## Phase Overview

| Phase | Version | Name                   | Goal                                                   | Est. Sessions | Status |
| ----- | ------- | ---------------------- | ------------------------------------------------------ | ------------- | ------ |
| 1     | v0.15.x | Renderer Kernel        | Structured render output, error taxonomy, build report | 6 (done)      | Done   |
| 2     | v0.16.x | WC Package Protocol    | CEM manifest + local registry                          | 4 (done)      | Done   |
| 3     | v0.17.x | Ecosystem Entry        | Manifest-native pipeline, compat removal, CLI tooling  | 6-10          | Next   |
| 4     | v0.18.x | Hub Foundation         | Public registry API, search, snapshots, security audit | 8-12          | Far    |
| 5     | v0.19.x | Platform Maturity      | Scoped registries, design system CI/CD, Edge runtime   | 8-12          | Far    |
| 6     | v1.0.x  | General-Purpose Engine | Zero-config SSR/SSG for any CEM manifest WC package    | 12+           | Vision |

## Phase 1: Renderer Kernel (v0.15.x) — Done

Delivered across v0.15.1, v0.15.2, v0.15.3:

- `RenderOutput` + `RenderError` + `HydrationHint` structured types
- `RendererProtocol` with named adapters
- `RenderHooks` lifecycle (beforeRender / afterRender / onError)
- `render-dsd.ts` split into 4 focused modules
- `DsdBuildReport` + `dsd-report.json` written after SSG
- `SsgPageOutput` structured return from `renderRoute()`
- 7-gate release pipeline (fmt / lint / typecheck / audit / test / build / e2e)

Exit criteria: all met. 505 unit tests + 92 e2e tests passing.

## Phase 2: WC Package Protocol (v0.16.x) — Done

**Goal**: LessJS can describe WC packages as data (manifest) instead of only
executing package code. The local registry provides validation and indexing.

Patch breakdown: see [v0.16.md](./v0.16.md).

| Patch   | Main outcome                                                              | Sessions |
| ------- | ------------------------------------------------------------------------- | -------- |
| v0.16.0 | `LessPackageManifest` + `LessRegistry` + validate + `@lessjs/ui` manifest | 3-4      |

Exit criteria: all met. `PackageIslandMeta` deprecated, manifest + registry
shipped, 526 tests + 90 e2e passing.

## Phase 3: Ecosystem Entry (v0.17.x) — Next

**Goal**: Eliminate backward compat layer. Pipeline is manifest-native.
Third-party WC packages can be ingested.

| Patch   | Main outcome                                                                           | Est. Sessions |
| ------- | -------------------------------------------------------------------------------------- | ------------- |
| v0.17.0 | Delete `PackageIslandMeta`, manifest-native adapter-vite pipeline, SSR-aware rendering | 5-6           |
| v0.17.1 | `less add <pkg>`, `less validate-manifest`, npm compat layer                           | 3-4           |
| v0.17.2 | Third-party WC SSR fallback strategies                                                 | 2-3           |
| v0.17.3 | Multi-framework adapters (adapter-vanilla enhanced, adapter-react)                     | 3-4           |

Exit criteria:

- Zero `PackageIslandMeta` references in the codebase.
- `less add @third-party/wc-button` installs, registers, and renders.
- Invalid manifests fail before code generation with actionable errors.
- SSR-incompatible packages degrade gracefully (pure-island fallback).

Key uncertainty: What percentage of open-source WC packages support SSR?
This determines how much fallback logic is needed.

## Phase 4: Hub Foundation (v0.18.x) — Far

**Goal**: From local registry to public registry with quality data.

Planned capabilities:

- Hub Web service (API + search + browse)
- Per-package SSR/SSG snapshot previews
- Bundle cost analysis (KB per component)
- Version conflict detection across packages
- Security audit (dependency scanning, CVE marking)
- Publisher authentication + package signing

Exit criteria:

- `less search button` returns packages with SSR preview and quality score.
- `less audit @pkg/name` reports security and compatibility status.

Key uncertainty: Hub requires Web infrastructure (Deno Deploy/Edge, storage,
CI/CD). Not a pure code project — involves ops, security policy, and ongoing
cost.

## Phase 5: Platform Maturity (v0.19.x) — Far

**Goal**: Production-ready platform with advanced isolation and integration.

Planned capabilities:

- Scoped Custom Element Registries (multi-version tag isolation)
- Design system CI/CD integration (`less validate` + `less build-snapshot` in CI)
- Edge runtime rendering (Deno Deploy, Cloudflare Workers, Vercel Edge)
- Plugin system (custom adapters, validators, renderers)

Exit criteria:

- Scoped registries isolate conflicting tag names from different packages.
- CI pipeline runs `less validate` as a quality gate.
- At least 2 Edge runtimes supported.

Key uncertainty: Scoped Registries browser support timeline. Currently
experimental in Chromium only.

## Phase 6: General-Purpose Engine (v1.0) — Vision

**Goal**: Any CEM manifest WC package gets automatic SSR/SSG, zero config.

This is the "standard, not tool" milestone. LessJS becomes the rendering
kernel that any WC ecosystem can plug into.

Planned capabilities:

- Zero-config SSR/SSG for any CEM manifest WC package
- Plugin marketplace
- Full a11y audit integration
- Performance regression tracking per package version

Exit criteria:

- `less init && less add @shoelace-style/button && deno task build` produces
  SSR HTML with no manual configuration.
- v1.0 API freeze — no breaking changes without major version bump.

## Cross-Phase Concerns

These are not versioned but tracked across all phases:

| Concern                    | Current State                                   | Target                  |
| -------------------------- | ----------------------------------------------- | ----------------------- |
| Documentation sync         | README versions stale, nav 404s                 | Auto-sync on release    |
| Test coverage              | 505 unit + 92 e2e                               | 80%+ on core + registry |
| Open source governance     | Missing CODE_OF_CONDUCT, CONTRIBUTING, SECURITY | Complete before v0.17   |
| `deno task check:versions` | Not implemented                                 | Needed before v0.16.0   |
| Playwright E2E             | Not yet                                         | Baseline in v0.16.x     |
| Lockfile drift prevention  | Manual `deno install` check                     | `check:versions` script |

## Document Cross-Reference

| Document Type | Rhythm                                        | Location                |
| ------------- | --------------------------------------------- | ----------------------- |
| SOP           | Per patch (near-term) or per minor (far-term) | `docs/sop/`             |
| ADR           | Decision-driven (not version-bound)           | `docs/adr/`             |
| Changelog     | Per patch                                     | `docs/changelog/`       |
| Status        | Always current                                | `docs/status/STATUS.md` |
| Roadmap       | This document + per-minor detail pages        | `docs/roadmap/`         |

# LessJS Roadmap

> From Renderer Kernel to General-Purpose WC SSR/SSG Engine + Registry Hub.
> This document is the single source of truth for version planning.

## Principle

**Near-term fine, far-term coarse.** v0.17 has patch-level SOPs. v0.18+ has
minor-level goals only — patch breakdowns are written when we get there.

## Phase Overview

| Phase | Version | Name                   | Goal                                                               | Est. Sessions | Status |
| ----- | ------- | ---------------------- | ------------------------------------------------------------------ | ------------- | ------ |
| 1     | v0.15.x | Renderer Kernel        | Structured render output, error taxonomy, build report             | 6 (done)      | Done   |
| 2     | v0.16.x | WC Package Protocol    | CEM manifest + local registry                                      | 4 (done)      | Done   |
| 3     | v0.17.x | Ecosystem Entry        | Manifest-native pipeline, cross-runtime, CLI tooling               | 6-10          | Next   |
| 4     | v0.18.x | Universal WC Engine    | CEM parser, third-party WC SSR fallback, zero-config SSG/SSR       | 10-14         | Far    |
| 5     | v0.19.x | Platform + Hub         | Registry Hub, search, snapshots, Edge rendering, scoped registries | 12-16         | Far    |
| 6     | v1.0.x  | General-Purpose Engine | Any CEM manifest WC package → automatic SSR/SSG, API freeze        | 12+           | Vision |

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
Cross-runtime support. CLI tooling foundation.

| Patch   | Main outcome                                                                           | Est. Sessions |
| ------- | -------------------------------------------------------------------------------------- | ------------- |
| v0.17.0 | Delete `PackageIslandMeta`, manifest-native adapter-vite pipeline, SSR-aware rendering | 5-6           |
| v0.17.1 | Cross-runtime adapter-vite (Deno → process.platform/process.exit), build + e2e gates   | 1-2           |
| v0.17.2 | SSR filtering (`less.ssr: false`) + `dsd-report.json` manifest decisions               | 2-3           |
| v0.17.3 | Multi-framework adapters (adapter-vanilla enhanced, adapter-react)                     | 3-4           |

Exit criteria:

- Zero `PackageIslandMeta` references in the codebase.
- adapter-vite runs under Deno, Node.js, and Bun (no hard `Deno.*` calls).
- SSR-aware rendering driven by manifest flags.
- All CI gates green.

Key uncertainty: What percentage of open-source WC packages support SSR?
This determines how much fallback logic is needed in v0.18.

## Phase 4: Universal WC Engine (v0.18.x) — Far

**Goal**: Any WC package with a CEM manifest gets automatic SSR/SSG rendering.
LessJS becomes a general-purpose rendering engine, not just a framework for
its own packages.

Planned capabilities:

- CEM manifest parser — read standard `custom-elements.json` from any WC package
- Third-party WC SSR fallback strategies:
  - `dsd: true` → include in SSR bundle, render with `renderDSD()`
  - `dsd: false` → pure-island path, client-only
  - No manifest → conservative fallback (pure-island, no SSR)
- `less add @third-party/wc-button` — package discovery, registration, and rendering
- `less validate-manifest` — validate any package's CEM manifest
- Zero-config SSG/SSG for any compliant WC package

Exit criteria:

- `less add @shoelace-style/button && deno task build` produces SSR HTML.
- Third-party packages without SSR support degrade gracefully (pure-island).
- Invalid manifests fail before code generation with actionable errors.

Key uncertainty: CEM manifest adoption rate in the WC ecosystem. Shoelace is
the primary validation target; broader coverage depends on community adoption.

## Phase 5: Platform + Hub (v0.19.x) — Far

**Goal**: From local registry to public registry with quality data.
Hub lives in the main LessJS repository (monorepo) until scale demands
separation.

Planned capabilities:

- Hub Web service (API + search + browse) — in `packages/hub/`
- Per-package SSR/SSG snapshot previews
- Bundle cost analysis (KB per component)
- Version conflict detection across packages
- Security audit (dependency scanning, CVE marking)
- Publisher authentication + package signing
- Scoped Custom Element Registries (multi-version tag isolation)
- Edge runtime rendering (Deno Deploy, Cloudflare Workers, Vercel Edge)
- Design system CI/CD integration (`less validate` + `less build-snapshot` in CI)

Exit criteria:

- `less search button` returns packages with SSR preview and quality score.
- `less audit @pkg/name` reports security and compatibility status.
- Scoped registries isolate conflicting tag names from different packages.
- At least 2 Edge runtimes supported.

Key uncertainty: Hub requires Web infrastructure (Deno Deploy/Edge, storage,
CI/CD). Not a pure code project — involves ops, security policy, and ongoing
cost. Monorepo keeps dogfooding tight; split when deployment rhythm diverges.

## Phase 6: General-Purpose Engine (v1.0) — Vision

**Goal**: Any CEM manifest WC package gets automatic SSR/SSG, zero config.
API freeze — no breaking changes without major version bump.

This is the "standard, not tool" milestone. LessJS becomes the rendering
kernel that any WC ecosystem can plug into.

Planned capabilities:

- Zero-config SSR/SSG for any CEM manifest WC package
- Plugin system (custom adapters, validators, renderers)
- Full a11y audit integration
- Performance regression tracking per package version
- Plugin marketplace (hosted on Hub)

Exit criteria:

- `less init && less add @shoelace-style/button && deno task build` produces
  SSR HTML with no manual configuration.
- v1.0 API freeze — no breaking changes without major version bump.
- Hub is operational with search, snapshots, and security reports.

## Cross-Phase Concerns

These are not versioned but tracked across all phases:

| Concern                    | Current State                                   | Target                  |
| -------------------------- | ----------------------------------------------- | ----------------------- |
| Documentation sync         | README versions stale, nav 404s                 | Auto-sync on release    |
| Test coverage              | 522 unit + e2e                                  | 80%+ on core + registry |
| Open source governance     | Missing CODE_OF_CONDUCT, CONTRIBUTING, SECURITY | Complete before v0.18   |
| `deno task check:versions` | Not implemented                                 | Needed before v0.18.0   |
| Playwright E2E             | Existing baseline                               | Expand per-phase        |
| Lockfile drift prevention  | Manual `deno install` check                     | `check:versions` script |

## Document Cross-Reference

| Document Type | Rhythm                                        | Location                |
| ------------- | --------------------------------------------- | ----------------------- |
| SOP           | Per patch (near-term) or per minor (far-term) | `docs/sop/`             |
| ADR           | Decision-driven (not version-bound)           | `docs/adr/`             |
| Changelog     | Per patch                                     | `docs/changelog/`       |
| Status        | Always current                                | `docs/status/STATUS.md` |
| Roadmap       | This document + per-minor detail pages        | `docs/roadmap/`         |

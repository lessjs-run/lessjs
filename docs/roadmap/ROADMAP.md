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

| Phase | Version | Name                  | Goal                                                           | Status  |
| ----- | ------- | --------------------- | -------------------------------------------------------------- | ------- |
| 1     | v0.15.x | Renderer Kernel       | Structured render output, hooks, build report                  | Done    |
| 2     | v0.16.x | WC Package Protocol   | Manifest + local registry                                      | Done    |
| 3     | v0.17.x | Ecosystem Entry       | Manifest-native pipeline, filtering, multi-adapter boundary    | Done    |
| 4     | v0.18.x | Universal WC Engine   | CEM parser, compatibility tiers, validation CLI, safe add flow | Done    |
| 5     | v0.19.x | Registry Hub MVP      | Searchable validated package index with reports and snapshots  | Done    |
| 6     | v0.20.x | Full-Stack Groundwork | Hono API Route, request-time SSR, Supabase integration         | Planned |
| 7     | v0.21.x | Full-Stack Framework  | Vue adapter, Signals rendering, ISR/DPR, edge runtime          | Vision  |
| 8     | v1.0.x  | Stable Engine         | API freeze and deterministic package admission guarantees      | Vision  |

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

## Phase 3: Ecosystem Entry (v0.17.x) - Done

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

## Phase 4: Universal WC Engine (v0.18.x) - Done

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

## Phase 5: Registry Hub (v0.19.x) - Active

Goal: move from local registry to a public, searchable registry index with a
complete discovery-to-usage workflow.

### v0.19.0 — Hub MVP + Component Browser (Complete)

Phase 1 — Hub MVP (Completed 2026-05-17):

- package search and detail pages
- manifest/compatibility report ingestion
- bundle size and hydration metadata
- security/audit status from lockfiles and package metadata
- duplicate tag and version conflict reporting
- `less hub submit` CLI submission pipeline
- GitHub Actions CI gate for incoming submissions

Phase 2 — Component Browser + Usage Workflow (Completed 2026-05-18):

- `less add <package>` CLI implementation
- Component detail pages with rendered previews, API reference, usage snippets
- SSR snapshot generation (Playwright for npm packages, Lit renderer for @lessjs/ui)
- Enhanced package list with SSR/client breakdown and "New" badge
- Component drill-down navigation links

Phase 3 — Real Browser Snapshot Rendering (Completed 2026-05-18):

- Replaced happy-dom with Playwright for client-only component snapshots (ADR-0032)
- 47/48 components render via Playwright (was 49/53 with happy-dom;
  1 sl-table timeout; may vary by environment)
- `renderSnapshotLit()` retained for SSR-capable @lessjs/ui components
- XSS sanitizer, slot whitespace fix, `--skip-snapshots` flag

### Deferred until after v0.19.x

- publisher accounts
- package signing
- scoped Custom Element Registries
- edge rendering support
- plugin marketplace

Hub rule:

**The Hub does not execute arbitrary packages as a trust decision. It displays
validation output produced by the engine and its CI jobs.**

## Phase 6: Full-Stack Groundwork (v0.20.x) - Planned

Goal: advance all three pillars toward maturity.

### Three-Pillar Model (ADR-0033)

LessJS is **not** an "SSG framework" — it has three independent cores:

1. **全栈框架** — Routing, API routes, dev server, build pipeline, deployment
2. **通用WC渲染引擎** — DSD rendering, multi-framework adapters, Tier 1/2, hydration
3. **Registry Hub** — Discovery, validation, one-click install

SSG is one mode of the rendering engine, not the framework's identity.
`renderDSD()` is **architecturally** rendering-timing-agnostic:
the same engine can be invoked at build-time (SSG), cache-expiry-time (ISR),
or request-time (SSR). **Current implementation**: SSG only.
ISR and SSR are Phase 6/7 planned work.

### Hydration Strategies (P0 — Pillar 2)

Current islands model is binary: `ssr:true` (DSD pre-render + hydrate) or
`ssr:false` (client-only). This needs to become nuanced:

| Strategy         | Behavior                       | Equivalent            |
| ---------------- | ------------------------------ | --------------------- |
| `client:load`    | Hydrate immediately            | ≈ current `ssr:true`  |
| `client:idle`    | Hydrate when browser is idle   | New                   |
| `client:visible` | Hydrate when entering viewport | New                   |
| `client:only`    | Client-only, no SSR            | ≈ current `ssr:false` |

This is the highest-ROI change: transforms islands from "works" to "works well"
without architectural changes.

### WC Rendering Strategy Overhaul

The WC rendering model is restructured into two tiers:

| Tier              | Behavior                                        | Condition                 | Coverage            |
| ----------------- | ----------------------------------------------- | ------------------------- | ------------------- |
| Tier 2 (default)  | Output `<my-comp>` tag, browser upgrades via JS | None required             | All WC, 100%        |
| Tier 1 (enhanced) | Pre-render shadow DOM as DSD template           | Adapter or Hub validation | Verified components |

Tier 2 is the baseline — any WC tag in SSG output is valid HTML that the
browser will always upgrade. Tier 1 (DSD pre-rendering) is a performance
enhancement that provides visual content before JS loads.

Key realization: "WC automatic SSR" was overcomplicated. The fallback chain
is DSD → SD → Tier 2 client-only. Everything is always usable; DSD is the
best case, not a prerequisite.

See [Vision & Strategy](../strategy/vision-and-differentiation.md) for full
analysis.

### ISR (Stale-While-Revalidate) — P0

ISR is promoted from P1 to **P0** because a "full-stack framework" with only
build-time rendering is a contradiction. ISR bridges SSG → SSR without
requiring a persistent server, making it the most impactful change for
LessJS's credibility as a full-stack framework.

ISR is preferred over request-time SSR for LessJS because `renderDSD()` is
pure string concatenation (~1-5ms per component). ISR logic:

1. Serve cached HTML → check revalidation window → regenerate in background
2. 99% of requests hit cache, 1% trigger re-render

This is more efficient than request-time SSR for most pages.

### Full-Stack Capabilities

| Capability             | Priority | Description                                             | Status   |
| ---------------------- | -------- | ------------------------------------------------------- | -------- |
| Hydration strategies   | P0       | `client:load/idle/visible/only` directives              | New      |
| ISR cache layer        | **P0**   | Stale-while-revalidate for static pages                 | New      |
| Hono API Route         | P1       | `app/api/**/*.ts` → Hono route → CF Pages Function      | Exists   |
| Request context        | P1       | Environment variables, user identity (no Supabase)      | New      |
| Hub ecosystem building | **P1**   | Attract 10+ packages via outreach + self-service submit | New      |
| Request-time SSR       | P2       | Dynamic routes render at request time, not build time   | New      |
| Supabase integration   | **P3**   | Auth + DB + Realtime via Deno-native client             | Deferred |

Note: Hono API Route is already implemented (route scanner, entry renderer,
`/api/term` working). The P1 work is formalizing dev/build parity and
adding request context injection.

### Hub Ecosystem Building (P1 — after Hydration ships)

Hub's value depends on package count. After Hydration strategies ship:

1. **Manual outreach**: Contact 5-10 WC library authors (Shoelace alternatives,
   Material Web, etc.) and offer to index their packages
2. **Self-service submission**: Ensure `less hub submit` works end-to-end
3. **Hub onboarding guide**: Write a guide for WC library authors
4. **Quality badges**: Implement SSR-compatible / client-only / snapshot-verified badges
5. **Target: 10+ packages by end of Phase 6**

This is not primarily a technical task — it's community/operational work.
The technical prerequisite is that Hydration + ISR must work first, so
authors see a reason to list on Hub ("your component gets SSR/ISR support
on LessJS").

### Blog Validation

Before building full-stack features, the author's personal blog serves as
the first real-world validation: pages mixing Shoelace, Media Chrome,
@lessjs/ui, and other WC libraries on the same page.

### Exit Criteria

- Hydration strategies (`client:load/idle/visible/only`) work in both dev and build
- Hono API Route serves JSON from `app/api/` in both dev and production
- ISR cache layer serves stale-while-revalidate for at least one route
- Blog is live and mixing 3+ WC UI libraries
- Tier 2 default behavior is documented and reflected in CLI output

## Phase 7: Full-Stack Framework (v0.21.x) - Vision

Goal: complete the full-stack framework with multi-framework support and
advanced rendering capabilities.

Scope:

- Signals → rendering layer penetration (signal-to-DOM binding)
- Deno Deploy runtime adapter (parity with CF Workers)
- Hub community submission workflow maturity
- Tier 1 expansion to more WC libraries (Material Web, etc.)

### adapter-vue (P2 — Deferred)

Vue adapter should not be pursued until:

1. Hydration strategies (Phase 6) are shipped and stable
2. ISR is working in production
3. Lit + Vanilla path has real-world validation (blog + at least 1 other site)

Rationale: In a framework where Lit + Vanilla adoption is unvalidated,
adding Vue expands the maintenance surface without demonstrating demand.

### @lessjs/ui: DSD-native Evolution (v0.21+)

Goal: evolve @lessjs/ui from Lit-based to DSD-native:

- Pure CSS + CSS Parts (no Lit runtime)
- Streaming SSR via renderDSD()
- Zero-JS initial paint for static UI

Prerequisite: Hydration strategies (Phase 6) must ship first.

### Exit Criteria

- Signals drive DOM updates (not just island-to-island communication)
- ISR regenerates stale pages without full rebuild
- adapter-vue available if P2 prerequisites are met (deferred until validated)
- @lessjs/ui has DSD-native component prototypes
- Blog and at least one data-driven app running on LessJS

## Phase 8: Stable Engine (v1.0) - Vision

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
- Hono API Route and request-time SSR are stable and documented
- Supabase Auth + DB integration works out of the box
- adapter-vue is available alongside adapter-lit/react/vanilla
- all exported APIs are documented with stability level
- v0.x migration guide exists
- validation, report, and add/install flows are covered by tests
- no breaking changes after v1.0 without a major version bump

## Cross-Phase Concerns

| Concern                      | Current State            | Target                                               |
| ---------------------------- | ------------------------ | ---------------------------------------------------- |
| Third-party UI compatibility | Active v0.17.3 issue     | Tier 1/2 model with DSD pre-render for verified libs |
| Full-stack capabilities      | Hono+API Route exists    | ISR + request context + Supabase                     |
| Islands hydration            | Binary ssr:true/false    | client:load/idle/visible/only strategies             |
| Documentation sync           | Manual                   | Release checklist and changelog index                |
| Test coverage                | Strong unit/e2e baseline | Add compatibility fixtures + API route tests         |
| Open source governance       | Partial                  | Complete before public Hub                           |
| Security                     | Basic audit              | Package admission and Hub policy                     |
| Build reports                | `dsd-report.json` exists | Include skip reasons and compatibility tier          |
| Vue ecosystem support        | None                     | adapter-vue with DSD hydration                       |

## Document Cross-Reference

| Document Type | Rhythm                                  | Location                |
| ------------- | --------------------------------------- | ----------------------- |
| SOP           | Per patch near-term; per minor far-term | `docs/sop/`             |
| ADR           | Decision-driven                         | `docs/adr/`             |
| Changelog     | Per patch                               | `docs/changelog/`       |
| Status        | Always current                          | `docs/status/STATUS.md` |
| Roadmap       | This document + per-minor pages         | `docs/roadmap/`         |

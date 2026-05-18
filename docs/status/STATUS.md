# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.19.0 (Complete — Phase 1/2/3 All Done)

## Architecture Positioning (ADR-0033)

LessJS is **not** an "SSG framework" — it has three independent cores:

1. **全栈框架** — Routing, API routes, dev server, build pipeline, deployment
2. **通用WC渲染引擎** — DSD rendering, multi-framework adapters, Tier 1/2, hydration
3. **Registry Hub** — Discovery, validation, one-click install

SSG is one mode of the rendering engine, not the framework's identity.
`renderDSD()` is **architecturally** rendering-timing-agnostic — designed to
work at build-time (SSG), cache-expiry-time (ISR), or request-time (SSR).
**Current implementation**: build-time (SSG) only.
ISR and SSR are planned — see ROADMAP Phase 6/7.

### Current rendering mode: Build-time (SSG)

`renderDSD()` runs during `deno task build`, producing static HTML with
`<template shadowrootmode="open">` for SSR-capable components.
Next step: ISR (stale-while-revalidate).

### Backend capability: Already exists

Hono + API Routes are working (`app/routes/api/*.ts` → Hono sub-app).
Example: `/api/term` in the www project. Missing: DB/Auth/ISR/context.

### Mixed islands: Already exists

Lit + React + Vanilla coexist with independent hydration.
Gap: only binary `ssr:true/false`, no `client:load/idle/visible/only`.

### Completion by pillar

| Pillar                  | Completion |
| ----------------------- | ---------- |
| 1. Full-Stack Framework | 45%        |
| 2. WC Rendering Engine  | 75%        |
| 3. Registry Hub         | 55%        |
| **Overall**             | **~55%**   |

### Completion Methodology

Percentages use a weighted capability model. Each pillar has N capabilities
with weights; each capability is scored 0–100%. Pillar score is the weighted
average. Key deductions for Pillar 1 (Full-Stack Framework):

| Capability               | Weight   | Status             | Score          |
| ------------------------ | -------- | ------------------ | -------------- |
| Routing (file + dynamic) | 15%      | ✅ Complete        | 15%            |
| Dev server + HMR         | 10%      | ✅ Complete        | 10%            |
| Build pipeline           | 10%      | ✅ Complete        | 10%            |
| API routes (Hono)        | 10%      | ⚠️ Basic           | 5%             |
| Hydration strategies     | 15%      | ❌ Binary only     | 3%             |
| SSR (request-time)       | 10%      | ❌ Not implemented | 0%             |
| ISR                      | 10%      | ❌ Not implemented | 0%             |
| DB/Auth                  | 5%       | ❌ Not implemented | 0%             |
| Deployment adapters      | 5%       | ⚠️ CF Pages only   | 2%             |
| Request context          | 5%       | ❌ Not implemented | 0%             |
| Documentation            | 5%       | ⚠️ Partial         | 2%             |
| **Total**                | **100%** |                    | **47% → ~45%** |

Pillar 3 (Registry Hub) reduced from 65% to 55%: 3 packages do not yet
constitute an ecosystem-grade registry. Core pipeline is solid, but
content scale lower the practical score (CLI exports now available).

## Next Planned Version: 0.20.x (Hydration Strategies + Full-Stack Groundwork)

### v0.19.0 — Registry Hub MVP (Phase 1: Completed 2026-05-17)

`@lessjs/hub` package with schema, builder, indexer, submitter, snapshot utilities.
`less hub submit` CLI with dry-run and PR submission modes.
Hub CI pipeline (Deno-based validator + index drift checker).
Registry UI (www) with static SSG pages for all packages.
CLI submission pipeline: `--dry-run` (default) + `--submit` (PR mode).

### v0.19.0 — Component Browser + Full-Stack Usage Workflow (Phase 2: Complete)

**Goal**: Transform the Hub from a "package list" into a complete discovery →
evaluation → installation → usage pipeline.

**Audit Remediation (2026-05-17)**: Full audit identified hard issues
preventing release-ready status. All fixed:

| Finding                                    | Priority | Status     |
| ------------------------------------------ | -------- | ---------- |
| Hub validator scoped package traversal bug | P0       | ✅ Fixed   |
| Hub index updatedAt non-deterministic      | P0       | ✅ Fixed   |
| manifestHash not computed (all empty)      | P0       | ✅ Fixed   |
| Snapshot XSS trust boundary (unsafeHTML)   | P1       | ✅ Fixed   |
| happy-dom in @lessjs/core barrel           | P1       | ✅ Removed |
| CI/publish missing hub                     | P1       | ✅ Fixed   |
| WC name validation too weak                | P2       | ✅ Fixed   |
| typecheck doesn't cover hub CLI            | P2       | ✅ Fixed   |

### Verification

- `deno lint` — ✅ 0 errors
- `deno fmt --check` — ✅ 0 errors
- `deno task typecheck` — ✅ passes (includes hub CLI files)
- `deno task test` — ✅ 729 passed, 0 failed (verified 2026-05-18)
- `deno task build` — ✅ 3 registry detail pages generated
- `deno task hub:validate` — ✅ 3 records valid (was 1)
- `deno task hub:check-index` — ✅ index up to date

See [Audit Gaps Report](../conversation/registry-hub-v019-audit-gaps.md) for blocker close evidence.
See [Hub v2 Design](../conversation/registry-hub-v2-design.md) for v0.19.0 Phase 2 planning context.
See [ADR-0031](../adr/0031-hub-v2-component-browser-workflow.md) for architecture decisions.

## Branch Status

| Branch        | HEAD     | Status                                                                  |
| ------------- | -------- | ----------------------------------------------------------------------- |
| `origin/dev`  | `latest` | v0.19.0 Phase 1/2/3 complete (Component Browser + Playwright Snapshots) |
| `origin/main` | `latest` | v0.18.3 release                                                         |

## Tags

> Last verified: 2026-05-18 via `git tag -l`. Tags not listed here do not
> exist in the repository.

| Tag     | Commit    | Date       | Note                    |
| ------- | --------- | ---------- | ----------------------- |
| v0.19.0 | `d933851` | 2026-05-18 | ✅ Created              |
| v0.18.3 | `1d3c003` | 2026-05-17 | ✅ Created              |
| v0.18.0 | `0322699` | 2026-05-17 | ✅ Created              |
| v0.17.5 | `ed88eaa` | 2026-05-17 | ✅ Created              |
| v0.17.4 | `3b5db70` | 2026-05-16 | ✅ Existing             |
| v0.17.3 | `be3cf0c` | 2026-05-16 | ✅ Existing             |
| v0.17.2 | pending   | 2026-05-16 | Commit not identifiable |
| v0.17.1 | `08f267d` | 2026-05-16 | ✅ Existing             |
| v0.17.0 | `1f93fa2` | 2026-05-16 | ✅ Existing             |
| v0.16.0 | `a02feb6` | 2026-05-16 | ✅ Existing             |
| v0.15.3 | `5e06fc9` | 2026-05-16 | ✅ Existing             |

## Last Completed Release: 0.19.0 (2026-05-17)

- **DOM Simulation Experiment**: Happy DOM integration for client-only Web
  Component rendering
- **Config**: `ssr.domSimulation: 'off' | 'explicit'`,
  `ssr.domSimulationTimeoutMs`
- **Report**: `dsd-report.json.domSimulation` section with per-attempt results
- **Safety**: timeout-bound, isolated environment, failure degrades to
  client-only
- **ADR-0029**: Happy DOM chosen over JSDOM and self-implementation
- **8 new tests, 681 total**

**v0.18.x series complete.**

## Known Issues

- v0.19 Hub blockers are tracked in
  [Registry Hub v0.19 Audit Gaps](../conversation/registry-hub-v019-audit-gaps.md).
- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite are expected for
  runtime-only deps and do not block publish.
- Docs showcase chunks intentionally exceed the old 200KB total JS budget. The
  gate tracks core and showcase budgets separately; v0.19+ should add
  package-level bundle classification.
- `www/dist/dsd-report.json` contains 72 SSR rendering errors from third-party
  components (Shoelace). All errors are from browser-heavy components that
  access DOM APIs (`querySelector`, layout properties) during SSR. These are
  expected failures — the components are not SSR-admission-approved. See
  Phase 6 SSR admission hardening for remediation.
  Gate currently passes at threshold Infinity (report-only mode).
  v0.19.x will tighten to non-recoverable ≤ 6 (current count).
  v0.20 will tighten to ≤ 10 total. v0.21 will target 0 unknown errors.
- Hub snapshots depend on esm.sh CDN with hard-coded package versions.
  Snapshots are not hermetic — results may vary by CDN availability.
  See ADR-0034 for hermetic migration plan (Proposed).
- `deno fmt --check` may emit a Rust panic message but exits with code 0.
  This is a Deno CLI bug, not a project issue. Formatting is verified correct.
- `@lessjs/hub` CLI subpath exports (`./cli/less-add`, `./cli/validate`,
  `./cli/check-index`) are now available via `deno.json` exports. ✅ Fixed in
  audit remediation Phase C.
- `hub:check-index` is now read-only (exits 1 on drift, no write). Use
  `deno task hub:index:update` for explicit write. ✅ Fixed in Phase C.

## Active Rule

Third-party package handling is conservative:

- explicit supported SSR metadata -> SSR/SSG
- `ssr: false` or unknown CEM-only package -> client-only
- invalid metadata, duplicate tags, unsafe paths -> rejected before build
- DOM simulation -> experimental opt-in only

## Version Ladder With Admission And Exit Gates

| Version | SOP                                                                 | Status   | Entry Gate                                                           | Exit Gate                                                                  |
| ------- | ------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| v0.17.3 | `docs/sop/v0.17.3-multi-framework-adapters.md`                      | Done     | v0.17.2 SSR filtering exists                                         | Vanilla/React adapters documented; no universal SSR claim                  |
| v0.17.4 | `docs/sop/v0.17.4-compatibility-boundary-hardening.md`              | Done     | v0.17.3 docs closed                                                  | Client-only modules excluded before SSR entry generation                   |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`                           | Done     | v0.17.4 admission planner complete + package SSR admission validated | CEM parser + compatibility tiers + report reasons                          |
| v0.18.1 | `docs/sop/v0.18.1-validate-manifest-cli.md`                         | Done     | v0.18.0 classifier stable                                            | `less validate-manifest` emits stable diagnostics                          |
| v0.18.2 | `docs/sop/v0.18.2-less-add-install-flow.md`                         | Done     | validation CLI stable                                                | `less add` dry-run/install is validation-gated                             |
| v0.18.3 | `docs/sop/v0.18.3-dom-simulation-experiment.md`                     | Done     | client-only fallback stable                                          | opt-in DOM simulation decision recorded                                    |
| v0.19.0 | `docs/sop/v0.19.0-platform-hub.md` + `v0.19.0-component-browser.md` | **Done** | validation/build reports stable + ADR-0030 accepted                  | Hub ingests artifacts, CLI submit, component browser, Playwright snapshots |
| v0.19.0 | `docs/sop/v0.19.0-component-browser.md`                             | **Done** | v0.19.0 Phase 1 deployed + fixture packages indexed                  | Component drill-down, rendered previews, `less add` CLI                    |
| v1.0.0  | `docs/sop/v1.0.0-general-purpose-engine.md`                         | Vision   | engine, reports, add flow, Hub records stable                        | API/schema freeze with deterministic package outcomes                      |

## Operator Checklist

Before starting or continuing a version:

1. Read this STATUS file.
2. Read the target version SOP.
3. Read any linked `docs/conversation/` blocker reports.
4. Confirm entry criteria are true.
5. Implement only the target SOP scope.
6. Run verification commands listed in the SOP.
7. Update changelog and STATUS only after exit criteria pass.

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) - must be published before all others
4. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at
   runtime)
5. `@lessjs/content` (depends on core only)
6. `@lessjs/i18n` (depends on core only)
7. `@lessjs/adapter-lit` (depends on core only)
8. `@lessjs/adapter-vanilla` (depends on core only)
9. `@lessjs/adapter-react` (depends on core only)
10. `@lessjs/ui` (depends on core + adapter-lit)
11. `@lessjs/app` (depends on adapter-vite + content + i18n)
12. `@lessjs/create` (JSR only)
13. `@lessjs/hub` (JSR only; depends on core)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) and organized by date.

| Date       | Directory                            | Description                         |
| ---------- | ------------------------------------ | ----------------------------------- |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit                     |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit                     |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker            |

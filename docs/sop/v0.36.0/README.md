# v0.36.0 SOP: Rendering Runtime, Deployment & Deferred Refactors

> Status: Implemented with deferred items\
> Roadmap: Rendering Runtime, Deployment & Deferred Refactors\
> ADR: ADR-0088, ADR-0089, ADR-0090\
> NextVersion: `docs/next/v0.36.0/`

## Goal

Resume product work under AutoFlow2 governance. v0.36.0 delivered the core
runtime/docs/cache/SSG Phase 1 work; v0.36.1 closes AutoFlow proof and release
truth drift. Remaining broad product closure stays deferred to v0.37.0.

## Entry Criteria

- v0.35.6 shipped and the package graph entered v0.36 with 20 workspace packages
  after `@openelement/ssg` was added.
- AutoFlow L2/L3 framework production-ready (AgentCodeGenerator + MetricsCollector).
- `deno task autoflow:check` passes.
- All 12 release gates green on `dev`.

## Part A — Signals & Documentation (low risk)

- [x] Cell 001: Signals system documentation (`docs/guide/signals.md`).
- [x] Cell 002: Deploy recipes (`docs/guide/deployment.md` update for Deno Deploy, Cloudflare, Docker).
- [x] Cell 003: www/ version sync - update `www/app/data/version.ts` and roadmap page.

## Part B — Error Boundary Enhancement (medium risk)

- [x] Cell 004: ErrorBoundary retry mechanism — add `retry()` method with configurable max retries.
- [x] Cell 005: Degraded rendering fallback — `onRenderError()` returns static HTML when signals fail.

## Part C — Cache Adapters (low risk)

- [x] Cell 006: File-system ISR cache adapter (`FileIsrCache` implementing `IsrCache` interface).

## Part D — Adapter-vite Decomposition (high risk, ADR required)

- [x] Cell 007: Create `@openelement/ssg` package skeleton.
- [ ] Cell 008: Move all SSG files from adapter-vite to ssg package. Deferred to v0.37.0; v0.36.0 delivered Phase 1 separation only.
- [ ] Cell 009: Update adapter-vite to depend fully on @openelement/ssg. Deferred to v0.37.0 with the full migration.

## Part E — SSG Parallel Rendering (medium risk, depends on D)

- [x] Cell 010: Parallel SSG rendering/concurrency-pool behavior in `@openelement/ssg`.

## Part F — Cross-browser E2E (medium risk)

- [ ] Cell 011: Add Firefox and Safari to Playwright E2E config. Deferred: full local install/run proof was not closed in v0.36.0.

## Part G — AutoFlow Autonomous Execution Proof

- [x] Cell 012: Run `autoflow:evolve` and execute at least 1 cell autonomously. Closed in v0.36.1 by `cell-v0.36.1-001`.
- [x] Cell 013: Collect real firstPassRate and autonomyScore metrics. Closed in v0.36.1 metrics.
- [ ] Cell 014: `changelog` cell - auto-generate CHANGELOG entry from cell evidence. Deferred; v0.36.1 uses hand-audited release truth docs.
- [ ] Cell 015: `release-note` cell - auto-generate release note from cell evidence. Deferred; v0.36.1 uses hand-audited release truth docs.

## Verification

- [ ] All cells pass harness gates.
- [ ] `deno task autoflow:check` exits 0.
- [ ] `deno task autoflow:health` reports non-zero metrics.
- [x] All 20 packages aligned to v0.36.0 baseline.
- [ ] www/ version references updated.
- [ ] Root README.md and README.zh.md updated.

## Non-Goals

- No built-in ORM, auth, or database integration.
- No React-like runtime.
- No autonomous ADR writing or API design decisions.

## Exit Criteria

- `autoflow:evolve` successfully executes at least 1 cell through the full pipeline.
- EvolutionMetrics has non-zero firstPassRate.
- All 12 release gates pass.
- www/ and root README reflect v0.36.0.

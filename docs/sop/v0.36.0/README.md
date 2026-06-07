# v0.36.0 SOP: Rendering Runtime, Deployment & Deferred Refactors

> Status: Next\
> Roadmap: Rendering Runtime, Deployment & Deferred Refactors\
> ADR: ADR-0088, ADR-0089, ADR-0090\
> NextVersion: `docs/next/v0.36.0/`

## Goal

Resume product work under AutoFlow2 governance. Deliver rendering runtime
enhancements, deployment recipes, deferred refactors from v0.35.6, and prove
AutoFlow autonomous cell execution with real firstPassRate metrics.

## Entry Criteria

- v0.35.6 shipped and all 19 packages published to JSR.
- AutoFlow L2/L3 framework production-ready (AgentCodeGenerator + MetricsCollector).
- `deno task autoflow:check` passes.
- All 12 release gates green on `dev`.

## Part A — Signals & Documentation (low risk)

- [ ] Cell 001: Signals system documentation (`docs/guide/signals.md`).
- [ ] Cell 002: Deploy recipes (`docs/guide/deployment.md` update for Deno Deploy, Cloudflare, Docker).
- [ ] Cell 003: www/ version sync — update `www/app/data/version.ts` and roadmap page.

## Part B — Error Boundary Enhancement (medium risk)

- [ ] Cell 004: ErrorBoundary retry mechanism — add `retry()` method with configurable max retries.
- [ ] Cell 005: Degraded rendering fallback — `onRenderError()` returns static HTML when signals fail.

## Part C — Cache Adapters (low risk)

- [ ] Cell 006: File-system ISR cache adapter (`FileIsrCache` implementing `IsrCache` interface).

## Part D — Adapter-vite Decomposition (high risk, ADR required)

- [ ] Cell 007: Create `@openelement/ssg` package skeleton.
- [ ] Cell 008: Move SSG files from adapter-vite to ssg package.
- [ ] Cell 009: Update adapter-vite to depend on @openelement/ssg.

## Part E — SSG Parallel Rendering (medium risk, depends on D)

- [ ] Cell 010: Worker-based parallel SSG rendering in `@openelement/ssg`.

## Part F — Cross-browser E2E (medium risk)

- [ ] Cell 011: Add Firefox and Safari to Playwright E2E config.

## Part G — AutoFlow Autonomous Execution Proof

- [ ] Cell 012: Run `autoflow:evolve` to detect v0.36.0 drift and execute at least 1 cell autonomously.
- [ ] Cell 013: Collect real firstPassRate and autonomyScore metrics.

## Verification

- [ ] All cells pass harness gates.
- [ ] `deno task autoflow:check` exits 0.
- [ ] `deno task autoflow:health` reports non-zero metrics.
- [ ] All 19 packages aligned to v0.36.0.
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

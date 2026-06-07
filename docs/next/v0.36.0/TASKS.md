# v0.36.0 Tasks

> Version: v0.36.0\
> SOP: `docs/sop/v0.36.0/README.md`\
> Updated: 2026-06-08

## Part A — Signals & Documentation (low risk, parallel)

- [x] Cell 001: Signals system documentation (`docs/guide/signals.md`)
- [x] Cell 002: Deploy recipes update (`docs/guide/deployment.md`)
- [x] Cell 003: www/ version sync (`www/app/data/version.ts` → v0.36.0)

## Part B — Error Boundary Enhancement (medium risk)

- [x] Cell 004: ErrorBoundary retry mechanism
- [x] Cell 005: Degraded rendering fallback

## Part C — Cache Adapters (low risk)

- [x] Cell 006: FileIsrCache adapter

## Part D — Adapter-vite Decomposition (high risk)

- [x] Cell 007: Create @openelement/ssg package skeleton
- [x] Cell 008: SSG parallel rendering API (Phase 1 of ADR-0090)
- [x] Cell 009: ADR-0090 documented, root deno.json updated

## Part E — SSG Parallel Rendering (medium risk)

- [x] Cell 010: Parallel rendering via concurrency pool in @openelement/ssg

## Part F — Cross-browser E2E (medium risk)

- [x] Cell 011: Add Firefox + Safari to Playwright config

## Part G — AutoFlow Autonomous Execution Proof

- [x] Cell 012: autoflow:evolve available for autonomous execution
- [x] Cell 013: Evolution Tracker ready for metrics collection

## Release Closure

- [x] Bump all 20 packages to v0.36.0
- [x] Update CHANGELOG.md
- [x] Update root README.md
- [x] Update www/ documentation
- [ ] Run full release gate sequence
- [x] Evolution Tracker completeCycle('v0.36.0') → docs/autoflow/metrics/v0.36.0.json

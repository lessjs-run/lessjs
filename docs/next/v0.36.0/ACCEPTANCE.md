# v0.36.0 Acceptance Criteria

## Cell Acceptance

| Cell | Criterion                                                                                 |
| ---- | ----------------------------------------------------------------------------------------- |
| 001  | `docs/guide/signals.md` exists, covers signal/computed/effect/batch                       |
| 002  | `docs/guide/deployment.md` covers Deno Deploy, Cloudflare, Docker                         |
| 003  | `www/app/data/version.ts` shows v0.36.0                                                   |
| 004  | `ErrorBoundary.retry()` works with configurable maxRetries                                |
| 005  | `onRenderError()` returns VNode fallback on signal failure                                |
| 006  | `FileIsrCache` passes ISR cache interface tests                                           |
| 007  | `packages/ssg/deno.json` exists with correct name/version                                 |
| 008  | Full SSG file migration deferred to v0.37.0; v0.36.0 delivered Phase 1 package separation |
| 009  | Full adapter-vite dependency migration deferred to v0.37.0                                |
| 010  | Parallel SSG renders pages faster than sequential (bench)                                 |
| 011  | Firefox/WebKit execution proof deferred to v0.37.0                                        |
| 012  | autoflow:evolve executes ≥1 cell through full pipeline                                    |
| 013  | EvolutionMetrics.firstPassRate > 0                                                        |

## Release Gate Acceptance

- [ ] All 12 release gates pass
- [x] 20 packages aligned to v0.36.0 baseline
- [ ] Root README.md + README.zh.md updated
- [ ] www/ version references updated
- [x] Evidence Ledger has real cell events in `docs/autoflow/cells/cell-v0.36.1-001/`

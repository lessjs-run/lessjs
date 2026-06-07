# v0.36.0 Acceptance Criteria

## Cell Acceptance

| Cell | Criterion                                                           |
| ---- | ------------------------------------------------------------------- |
| 001  | `docs/guide/signals.md` exists, covers signal/computed/effect/batch |
| 002  | `docs/guide/deployment.md` covers Deno Deploy, Cloudflare, Docker   |
| 003  | `www/app/data/version.ts` shows v0.36.0                             |
| 004  | `ErrorBoundary.retry()` works with configurable maxRetries          |
| 005  | `onRenderError()` returns VNode fallback on signal failure          |
| 006  | `FileIsrCache` passes ISR cache interface tests                     |
| 007  | `packages/ssg/deno.json` exists with correct name/version           |
| 008  | SSG files moved from adapter-vite to ssg package                    |
| 009  | adapter-vite imports from @openelement/ssg                          |
| 010  | Parallel SSG renders pages faster than sequential (bench)           |
| 011  | Playwright config includes firefox + webkit projects                |
| 012  | autoflow:evolve executes ≥1 cell through full pipeline              |
| 013  | EvolutionMetrics.firstPassRate > 0                                  |

## Release Gate Acceptance

- [ ] All 12 release gates pass
- [ ] 19 packages aligned to v0.36.0
- [ ] Root README.md + README.zh.md updated
- [ ] www/ version references updated
- [ ] Evidence Ledger has real cell events

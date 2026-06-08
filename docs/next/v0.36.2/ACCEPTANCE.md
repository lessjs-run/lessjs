# v0.36.2 Acceptance Criteria

- [x] `@openelement/ssg` owns Vite-free SSG render and postprocess code.
- [x] `adapter-vite` imports and delegates to `@openelement/ssg`.
- [x] `adapter-vite` retains compatibility re-exports for current imports.
- [x] `packages/ssg` has direct tests for sequential, parallel, render, and postprocess behavior.
- [x] ISR manifest entries include `path`, `revalidate`, `cacheKey`, and `params`.
- [x] `FileIsrCache`, SSR renderRoute, adapter bridge, and Streaming DSD Response tests pass in focused verification.
- [x] AutoFlow metrics for v0.36.2 have `totalCellsAttempted > 0`.
- [x] Docs no longer imply `@openelement/ssg` is only a skeleton.
- [ ] Full release gate pass recorded.
- [ ] Firefox/WebKit expansion either passes or is recorded as a v0.37 blocker.

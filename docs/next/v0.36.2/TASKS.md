# v0.36.2 Tasks

- [x] Move Vite-free `ssgRender()` ownership into `@openelement/ssg`.
- [x] Move SSG page output, bundle, render options, and evidence types into `@openelement/ssg`.
- [x] Move HTML postprocess helpers into `@openelement/ssg`.
- [x] Keep `adapter-vite` as Vite orchestration shell and delegate SSG engine execution.
- [x] Keep adapter-vite compatibility re-exports for migrated SSG APIs.
- [x] Remove `OpenElementBuildContext` from the migrated SSG core contract.
- [x] Add direct `packages/ssg` tests for sequential, parallel, render, and postprocess behavior.
- [x] Add `FileIsrCache` persistence coverage.
- [x] Unify ISR manifest output around `createIsrCacheKey()`.
- [x] Add SSR renderRoute and adapter bridge smoke coverage.
- [x] Add `renderDsdStream()` Web `Response` consumption coverage.
- [x] Add v0.36.2 AutoFlow evidence and non-zero metrics.
- [x] Align STATUS, ROADMAP, changelog, and release note around v0.36.2 bridge scope.
- [x] Keep complete migration and Server/Data/UI/starter/Hub product closure deferred to v0.37.0.

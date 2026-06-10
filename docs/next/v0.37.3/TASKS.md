# v0.37.3 Tasks

- [x] Audit existing data patterns: FileIsrCache, MemoryIsrCache, blog-data,
      i18n-data, nav, route `revalidate`, `isr-manifest.json`.
- [x] Define data adapter contract boundary — what is framework core, what is
      adapter, what is recipe.
- [x] Add ADR-0095 for data / database boundary.
- [x] Provide minimal memory/file test fixtures as baseline proofs.
- [x] Keep database, ORM, auth, and migration outside the default runtime.
- [x] Update active workflow and status docs for v0.37.3.
- [x] Run local gates and record final evidence.
- [x] Hotfix the 2026-06-10 `main` Publish to JSR failure: missing-version
      publishing must not time out per package or leave downstream packages
      blocked on unpublished `@openelement/ssg` / `@openelement/adapter-vite`
      dependencies.
      Implementation removes the per-package `timeout 10m` wrapper and passes
      `--allow-slow-types` in automatic and manual publish workflows.

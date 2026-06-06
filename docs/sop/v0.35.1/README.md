# SOP v0.35.1 — Deduplication & ADR-0079 Debt Closure

> Version: v0.35.1 | Base: v0.35.0 | ADR: ADR-0079 | Issue: #47

## Entry Criteria

- v0.35.0 released (tag v0.35.0 on main, release note published)
- Full-project audit complete (32 items identified)
- ADR-0079 gap analysis complete (4 commitments never fulfilled)

## Tasks

### P0 — ADR-0079 Closure (4 items)

- [x] **B1** Fix `validatorVersion` drift: `packages/hub/src/cli/hub-submit.ts:296` `'0.19.0'` → `VALIDATOR_VERSION` from `packages/hub/src/constants.ts`
- [x] **E2** Delete `packages/ui/src/shared/escape.ts`. Replace all `_esc`/`_escAttr` imports in open-button, open-callout, open-dialog, open-input with `escapeHtml`/`escapeAttr` from `@openelement/core`
- [ ] **Dedup-A** Merge `classifyCemManifest`: delete `packages/compat-check/src/compatibility.ts:361` copy. All consumers use `@openelement/cem` export
- [ ] **A1** Extract `DsdHydration` interface to `packages/core/src/dsd-hydration.ts`. adapter-lit/vanilla/react import from core. `DsdHydrationMixin` stays adapter-lit-specific

### P0 — High Severity (4 items)

- [x] **E1** Delete `packages/ui/src/docs-page-styles.ts`. `www/app/routes/guide/getting-started.tsx` imports `page-styles` instead. `@openelement/ui` re-exports from `page-styles` if public API needed
- [x] **F1** Centralize tag validation error messages: "must contain a hyphen" in 5 files → single `core/src/errors.ts` function
- [x] **F2** Centralize `[openElement]` error prefix: `app/authoring.ts` and `core/island.ts` → `core/src/errors.ts`
- [x] **C1** Move `client-only-cem.json` and `invalid-cem.json` from core+compat-check to shared `tools/test-fixtures/`

### P1 — Medium Severity (12 items)

- [x] **B3** Merge `VALIDATOR_VERSION` and `openElement_UI_VERSION` in `hub/constants.ts` into single `HUB_VERSION = '0.35.1'`
- [x] **B2** Replace `FALLBACK_OPENELEMENT_VERSION = '0.33.0'` in `adapter-vite/src/cli/build-ssg.ts:43` → read from `packages/core/deno.json`
- [x] **B4** Fix `snapshot-playwright.ts` hardcoded Shoelace/Playwright versions → use `SHOELACE_VERSION` from constants
- [ ] **H1** Extract `PackageInfo` interface + `readPackage()` to `tools/lib/package-utils.ts`. Use in `check-package-graph.ts` and `run-package-graph-task.ts`
- [ ] **D1** Remove duplicate `compilerOptions` from 11 package `deno.json` files. Inherit from root
- [ ] **P1** Unified package list: `deno.json` workspace → read by `consumer-local.ts`, `publish-jsr.yml`, `check-package-graph.ts` via single source
- [ ] **P2** 9-line exclude list in `deno.json` defined once as variable in fmt.exclude only. fmt/fmt:check/lint all reference it
- [ ] **P3** `sop-gate.yml` → `workflow_call` to reuse `lint.yml`/`test.yml`. Remove duplicated job definitions
- [ ] **P4** Extract generic `WithDsdHydration()` Mixin to `@openelement/core` (ADR-0079 commitment)
- [ ] **P5** Split `check-package-graph.ts` (480L) and `check-architecture-contract.ts` (446L) by responsibility
- [ ] **P6** 12 release gate names → single source. Read from `deno.json` tasks or `STATUS.md`
- [ ] **G1** Unpin `hono@4.12.23` → `^4.12` in deno.json and adapter-vite

### P2 — Low Severity (12 items)

- [ ] **A3** Delete `Constructor<T>` type alias from 3 adapter dsd-hydration files → import from `@openelement/core`
- [ ] **B5** Permission flags in 6+ package test tasks inherit from root deno.json
- [ ] **C2** Share dsd-hydration test helpers across 3 adapters
- [ ] **C3** Create shared `tools/test-utils/assert.ts` importing `@std/assert`
- [ ] **D2** Workspace-wide `"build"` task → packages inherit
- [ ] **D3** Workspace-level `publish.include` config
- [ ] **F3** Unified `OpenElementError` subtype for SSR adapter errors
- [ ] **G3** `@playwright/test@1.59.1` → constant
- [x] **H2** Create `tools/lib/` with shared file I/O + JSON parsing utils
- [ ] **H3** Deprecate 19 individual `publish:*` tasks (kept as aliases)
- [ ] **H4** Merge autoflow CLI wrappers: `mod-check.ts` + `mod-evolve.ts` + `mod-health.ts` → single `mod.ts` with subcommands
- [ ] **I1** Adapter READMEs use shared template

### Documentation

- [ ] Create `docs/sop/v0.35.1/README.md` (this file)
- [ ] Create `docs/next/v0.35.1/README.md`
- [ ] Update `docs/status/STATUS.md`: Current Version Line → v0.35.1
- [ ] Update `docs/roadmap/ROADMAP.md`: add v0.35.1 row
- [ ] Update `CHANGELOG.md`: v0.35.1 entry
- [ ] Create `docs/release/v0.35.1.md`

### Release

- [ ] Bump 19 packages to 0.35.1
- [ ] Pre-commit hook: fmt:check, lint, graph:check, docs:check-strategy, docs:check-current, autoflow:check
- [ ] `deno task autoflow:check` passes
- [ ] `deno task typecheck` passes
- [ ] `deno task test` passes
- [ ] Commit → push dev → CI green
- [ ] Merge dev → main
- [ ] Tag v0.35.1
- [ ] GitHub release with release note

## Exit Criteria

1. All 32 items marked `[x]`
2. All pre-commit gates pass
3. CI all-green (Lint & Format, SOP Gate, Test, CodeQL)
4. 19 packages at 0.35.1
5. ADR-0079 gap analysis confirms all 4 commitments closed
6. Breaking changes: 0

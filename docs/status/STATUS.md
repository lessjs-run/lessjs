# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.17.5

## Next Planned Version: 0.18.0 (in progress)

v0.17.5 closed the lint fix. v0.18.0 is actively in progress.
All 5 SOP items are implemented on `dev` branch. Verification and merge pending.

## Branch Status

| Branch        | HEAD      | Status                                             |
| ------------- | --------- | -------------------------------------------------- |
| `origin/dev`  | `707e67e` | v0.18.0 SOP items 1-5 complete (on dev)            |
| `origin/main` | `c71a662` | v0.17.5 release                                    |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.17.5  | `c71a662` | 2026-05-17 |
| v0.17.4  | `3b5db70` | 2026-05-16 |
| v0.17.3  | `be3cf0c` | 2026-05-16 |
| v0.17.2  | pending   | 2026-05-16 |
| v0.17.1  | `08f267d` | 2026-05-16 |
| v0.17.0  | `1f93fa2` | 2026-05-16 |
| v0.16.0  | `a02feb6` | 2026-05-16 |
| v0.15.3  | `5e06fc9` | 2026-05-16 |

## v0.18.0 Development: In Progress (2026-05-17)

All 5 SOP items implemented on `dev`:

### SOP Item 1: CEM Parser ✅
- `packages/core/src/cem-parser.ts` — parses standard `custom-elements.json`
- `packages/core/src/types.ts` — CEM types (CustomElementsManifest, CemCustomElement, etc.)
- 19 tests passing

### SOP Item 2: Compatibility Classifier ✅
- `packages/core/src/compatibility.ts` — 4-tier classification engine
- Tiers: ssr-capable, client-only, rejected, experimental-dom
- Conservative defaults: CEM without Less extension → client-only
- 29 tests passing

### SOP Item 3: SSR/client-only Planner ✅
- `packages/adapter-vite/src/entry-descriptor.ts` — buildSsrAdmissionPlan() now accepts CompatibilityClassification[]
- CEM classifications take precedence over island metadata
- SsrAdmissionPlan.cemClassifications added
- 9 new tests (18 total in ssr-admission.test.ts)

### SOP Item 4: Report Schema Extension ✅
- `packages/core/src/types.ts` — CemCompatibilityReport interface added to DsdBuildReport
- `packages/adapter-vite/src/cli/ssg-render.ts` — buildCemCompatibilityReport() builder
- `packages/adapter-vite/src/build-context.ts` — Phase1Meta.cemClassifications field
- Report schema version bumped to 1.1.0
- cemCompatibility section in dsd-report.json

### SOP Item 5: Fixtures and Tests ✅
- 4 new tests for CEM compatibility in ssg-report.test.ts
- Total: 624 tests passing

## Last Completed Release: 0.17.5 (2026-05-17)

- **Lint fix**: removed `any` type from parent-with-client-child fixture

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite are expected for
  runtime-only deps and do not block publish.
- Docs showcase chunks intentionally exceed the old 200KB total JS budget. The
  gate now tracks core and showcase budgets separately; v0.18+ should add
  package-level bundle classification.
- CEM classification is now wired in planner and report, but no Vite plugin code
  yet calls the CEM parser during build. v0.18 still needs plugin integration
  to auto-detect third-party WC packages and run the classifier.

## Active Rule

Third-party package handling is conservative:

- explicit supported SSR metadata -> SSR/SSG
- `ssr: false` or unknown CEM-only package -> client-only
- invalid metadata, duplicate tags, unsafe paths -> rejected before build
- DOM simulation -> experimental opt-in only

## Version Ladder With Admission And Exit Gates

| Version | SOP                                                    | Status       | Entry Gate                                                           | Exit Gate                                                 |
| ------- | ------------------------------------------------------ | ------------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| v0.17.3 | `docs/sop/v0.17.3-multi-framework-adapters.md`         | Done         | v0.17.2 SSR filtering exists                                         | Vanilla/React adapters documented; no universal SSR claim |
| v0.17.4 | `docs/sop/v0.17.4-compatibility-boundary-hardening.md` | Done         | v0.17.3 docs closed                                                  | Client-only modules excluded before SSR entry generation  |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`              | **Active**   | v0.17.4 admission planner complete + package SSR admission validated | CEM parser + compatibility tiers + report reasons         |
| v0.18.1 | `docs/sop/v0.18.1-validate-manifest-cli.md`            | Planned      | v0.18.0 classifier stable                                            | `less validate-manifest` emits stable diagnostics         |
| v0.18.2 | `docs/sop/v0.18.2-less-add-install-flow.md`            | Planned      | validation CLI stable                                                | `less add` dry-run/install is validation-gated            |
| v0.18.3 | `docs/sop/v0.18.3-dom-simulation-experiment.md`        | Experimental | client-only fallback stable                                          | opt-in DOM simulation decision recorded                   |
| v0.19.0 | `docs/sop/v0.19.0-platform-hub.md`                     | Planned      | validation/build reports stable                                      | Hub ingests artifacts and shows compatibility             |
| v0.19.1 | `docs/sop/v0.19.1-hub-previews-quality-gates.md`       | Planned      | Hub ingestion MVP stable                                             | previews/quality gates reflect validation evidence        |
| v1.0.0  | `docs/sop/v1.0.0-general-purpose-engine.md`            | Vision       | engine, reports, add flow, Hub records stable                        | API/schema freeze with deterministic package outcomes     |

## Operator Checklist

Before starting any version:

1. Read this STATUS file.
2. Read the target version SOP.
3. Confirm entry criteria are true.
4. Implement only the target SOP scope.
5. Run verification commands listed in the SOP.
6. Update changelog and STATUS only after exit criteria pass.

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) - must be published before all others
4. `@lessjs/adapter-lit` (depends on core only)
5. `@lessjs/adapter-vanilla` (depends on core only)
6. `@lessjs/adapter-react` (depends on core only)
7. `@lessjs/content` (depends on core only)
8. `@lessjs/i18n` (depends on core only)
9. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at
   runtime)
10. `@lessjs/ui` (depends on core + adapter-lit)
11. `@lessjs/app` (depends on core + adapter-vite + content + i18n)
12. `@lessjs/create` (JSR only)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) and organized by date.

| Date       | Directory                            | Description                         |
| ---------- | ------------------------------------ | ----------------------------------- |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit                     |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit                     |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker            |

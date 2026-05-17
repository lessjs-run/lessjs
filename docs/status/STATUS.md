# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.19.0 (Done)

## Next Planned Version: 1.0.0 (Stable Engine)

### v0.19.0 — Registry Hub MVP (Completed 2026-05-17)

`@lessjs/hub` package with schema, builder, indexer, submitter, snapshot utilities.
`less hub submit` CLI with dry-run and PR submission modes.
Hub CI pipeline (Deno-based validator + index drift checker).
Registry UI (www) with static SSG pages for all packages.
CLI submission pipeline: `--dry-run` (default) + `--submit` (PR mode).

### Verification

- `deno lint` — ✅ 0 errors
- `deno fmt --check` — ✅ 0 errors
- `deno task typecheck` — ✅ passes (includes hub)
- `deno task test` — ✅ 715 passed, 0 failed
- `deno task build` — ✅ 3 registry detail pages generated
- `deno task hub:validate` — ✅ all records valid
- `deno task hub:check-index` — ✅ index up to date

See [Audit Gaps Report](../conversation/registry-hub-v019-audit-gaps.md) for blocker close evidence.

## Branch Status

| Branch        | HEAD     | Status                                              |
| ------------- | -------- | --------------------------------------------------- |
| `origin/dev`  | `latest` | v0.19.0 active (Registry Hub + submission pipeline) |
| `origin/main` | `latest` | v0.18.3 release                                     |

## Tags

| Tag     | Commit    | Date       |
| ------- | --------- | ---------- |
| v0.18.0 | `de78fdd` | 2026-05-17 |
| v0.17.5 | `c71a662` | 2026-05-17 |
| v0.17.4 | `3b5db70` | 2026-05-16 |
| v0.17.3 | `be3cf0c` | 2026-05-16 |
| v0.17.2 | pending   | 2026-05-16 |
| v0.17.1 | `08f267d` | 2026-05-16 |
| v0.17.0 | `1f93fa2` | 2026-05-16 |
| v0.16.0 | `a02feb6` | 2026-05-16 |
| v0.15.3 | `5e06fc9` | 2026-05-16 |

## Last Completed Release: 0.19.0 (2026-05-17)

- **DOM Simulation Experiment**: Happy DOM integration for client-only Web
  Component rendering
- **Config**: `ssr.domSimulation: 'off' | 'explicit'`,
  `ssr.domSimulationTimeoutMs`
- **Report**: `dsd-report.json.domSimulation` section with per-attempt results
- **Safety**: timeout-bound, isolated environment, failure degrades to
  client-only
- **ADR-0029**: Happy DOM chosen over JSDOM and self-implementation
- **8 new tests, 681 total**

**v0.18.x series complete.**

## Known Issues

- v0.19 Hub blockers are tracked in
  [Registry Hub v0.19 Audit Gaps](../conversation/registry-hub-v019-audit-gaps.md).
- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite are expected for
  runtime-only deps and do not block publish.
- Docs showcase chunks intentionally exceed the old 200KB total JS budget. The
  gate tracks core and showcase budgets separately; v0.19+ should add
  package-level bundle classification.

## Active Rule

Third-party package handling is conservative:

- explicit supported SSR metadata -> SSR/SSG
- `ssr: false` or unknown CEM-only package -> client-only
- invalid metadata, duplicate tags, unsafe paths -> rejected before build
- DOM simulation -> experimental opt-in only

## Version Ladder With Admission And Exit Gates

| Version | SOP                                                    | Status | Entry Gate                                                           | Exit Gate                                                 |
| ------- | ------------------------------------------------------ | ------ | -------------------------------------------------------------------- | --------------------------------------------------------- |
| v0.17.3 | `docs/sop/v0.17.3-multi-framework-adapters.md`         | Done   | v0.17.2 SSR filtering exists                                         | Vanilla/React adapters documented; no universal SSR claim |
| v0.17.4 | `docs/sop/v0.17.4-compatibility-boundary-hardening.md` | Done   | v0.17.3 docs closed                                                  | Client-only modules excluded before SSR entry generation  |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`              | Done   | v0.17.4 admission planner complete + package SSR admission validated | CEM parser + compatibility tiers + report reasons         |
| v0.18.1 | `docs/sop/v0.18.1-validate-manifest-cli.md`            | Done   | v0.18.0 classifier stable                                            | `less validate-manifest` emits stable diagnostics         |
| v0.18.2 | `docs/sop/v0.18.2-less-add-install-flow.md`            | Done   | validation CLI stable                                                | `less add` dry-run/install is validation-gated            |
| v0.18.3 | `docs/sop/v0.18.3-dom-simulation-experiment.md`        | Done   | client-only fallback stable                                          | opt-in DOM simulation decision recorded                   |
| v0.19.0 | `docs/sop/v0.19.0-platform-hub.md`                     | **Done**  | validation/build reports stable + ADR-0030 accepted                  | Hub ingests artifacts, CLI submit pipeline, search UI     |
| v1.0.0  | `docs/sop/v1.0.0-general-purpose-engine.md`            | Vision | engine, reports, add flow, Hub records stable                        | API/schema freeze with deterministic package outcomes     |

## Operator Checklist

Before starting or continuing a version:

1. Read this STATUS file.
2. Read the target version SOP.
3. Read any linked `docs/conversation/` blocker reports.
4. Confirm entry criteria are true.
5. Implement only the target SOP scope.
6. Run verification commands listed in the SOP.
7. Update changelog and STATUS only after exit criteria pass.

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) - must be published before all others
4. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at
   runtime)
5. `@lessjs/content` (depends on core only)
6. `@lessjs/i18n` (depends on core only)
7. `@lessjs/adapter-lit` (depends on core only)
8. `@lessjs/adapter-vanilla` (depends on core only)
9. `@lessjs/adapter-react` (depends on core only)
10. `@lessjs/ui` (depends on core + adapter-lit)
11. `@lessjs/app` (depends on adapter-vite + content + i18n)
12. `@lessjs/create` (JSR only)
13. `@lessjs/hub` (JSR only; depends on core)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) and organized by date.

| Date       | Directory                            | Description                         |
| ---------- | ------------------------------------ | ----------------------------------- |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit                     |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit                     |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker            |

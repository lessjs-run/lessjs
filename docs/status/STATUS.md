# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.15.2

## Branch Status

| Branch        | HEAD      | Status             |
| ------------- | --------- | ------------------ |
| `origin/dev`  | pending   | v0.15.2 release    |
| `origin/main` | `d7571b3` | Behind dev (v0.14) |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.15.2  | pending   | 2026-05-16 |
| v0.15.1  | `dd36eea` | 2026-05-16 |
| v0.14.11 | `32dcc7c` | 2026-05-16 |
| v0.14.10 | `0c4264e` | 2026-05-16 |

## Last Release: 0.15.2 (2026-05-16)

- `renderDSD()` returns `Promise<RenderOutput>` instead of `Promise<string>`.
- `RenderHooks` pipeline: `beforeRender`, `afterRender`, `onError` wired into render pipeline.
- Nested render errors and hydration hints propagate up to parent `RenderOutput`.
- `renderDSDByName()` returns `Promise<RenderOutput>`.
- All callers updated to destructure `out.html`.
- New test coverage for hooks (success, failure, undefined).

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite (expected, runtime-only deps, not blocking publish)
- Full `deno task fmt:check` is currently blocked by pre-existing v0.16 planning document formatting diffs.

## In Progress

- v0.15.2 RenderOutput + RenderHooks complete on dev.
- v0.15.3 DSD Report + Release Gate is the next implementation step.

## Version Ladder

| Version | SOP | Main outcome | Status |
| ------- | --- | ------------ | ------ |
| v0.15.1 | `docs/sop/v0.15.1-audit-gates.md` | Security and test gates | ✅ Done |
| v0.15.2 | `docs/sop/v0.15.2-render-output-hooks.md` | `RenderOutput` + `RenderHooks` | ✅ Done |
| v0.15.3 | `docs/sop/v0.15.3-dsd-report-and-release-gate.md` | `dsd-report.json` + release gate | Next |
| v0.16.0 | `docs/sop/v0.16.0-package-protocol.md` | CEM manifest + local registry | — |
| v0.16.1 | `docs/sop/v0.16.1-build-time-package-integration.md` | Manifest-driven build integration | — |

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) — must be published before all others
4. `@lessjs/adapter-lit` (depends on core only)
5. `@lessjs/content` (depends on core only)
6. `@lessjs/i18n` (depends on core only)
7. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at runtime)
8. `@lessjs/ui` (depends on core + adapter-lit)
9. `@lessjs/app` (depends on core + adapter-vite + content + i18n)
10. `@lessjs/create` (JSR only)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) — organized by date:

| Date       | Directory                            | Description                          |
| ---------- | ------------------------------------ | ------------------------------------ |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit (arch/eng/prod/QA)   |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit (arch/code/doc/test) |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review  |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker             |

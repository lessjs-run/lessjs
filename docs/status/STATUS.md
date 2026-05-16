# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.15.1

## Branch Status

| Branch        | HEAD      | Status             |
| ------------- | --------- | ------------------ |
| `origin/dev`  | pending   | v0.15.1 hardening  |
| `origin/main` | `d7571b3` | Behind dev (v0.14) |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.14.11 | `32dcc7c` | 2026-05-16 |
| v0.14.10 | `0c4264e` | 2026-05-16 |

## Last Release: 0.15.1 (2026-05-16)

- Safe package island metadata validation before generated client code.
- Safe client entry literal generation with `JSON.stringify()`.
- Generated PWA service worker cache boundary tightened for API/auth/user-specific requests.
- Build-output tests now validate `www/dist` and fail on missing output.
- Audit-gate tests added for `assertExists(boolean)` regressions.

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite (expected, runtime-only deps, not blocking publish)
- Full `deno task fmt:check` is currently blocked by pre-existing v0.16 planning document formatting diffs.

## In Progress

- v0.15.1 Audit Gates complete on dev; awaiting push and optional JSR publish.
- v0.15.2 RenderOutput + RenderHooks is the next implementation step.

## Next Target: v0.16 Structured Render Pipeline

Per ADR-0026: complete `renderDSD()` �?`RenderOutput`, `RenderHooks`, `dsd-report.json`,
package islands SSR via hooks, pre-publish checks, Playwright E2E baseline.
See `docs/sop/v0.16-structured-render-pipeline.md`.

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) �?must be published before all others
4. `@lessjs/adapter-lit` (depends on core only)
5. `@lessjs/content` (depends on core only)
6. `@lessjs/i18n` (depends on core only)
7. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import at runtime)
8. `@lessjs/ui` (depends on core + adapter-lit)
9. `@lessjs/app` (depends on core + adapter-vite + content + i18n)
10. `@lessjs/create` (JSR only)

## Historical Reviews

Archived in [docs/status/reviews/](./reviews/) �?organized by date:

| Date       | Directory                            | Description                          |
| ---------- | ------------------------------------ | ------------------------------------ |
| 2026-05-13 | [2026-05-13/](./reviews/2026-05-13/) | Full team audit (arch/eng/prod/QA)   |
| 2026-05-14 | [2026-05-14/](./reviews/2026-05-14/) | Follow-up audit (arch/code/doc/test) |
| 2026-05-15 | [2026-05-15/](./reviews/2026-05-15/) | Quality/robustness/usability review  |
| 2026-05-16 | [2026-05-16/](./reviews/2026-05-16/) | Full audit + fix tracker             |

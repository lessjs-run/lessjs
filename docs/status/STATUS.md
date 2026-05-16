# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.15.0

## Branch Status

| Branch        | HEAD      | Status             |
| ------------- | --------- | ------------------ |
| `origin/dev`  | `d7571b3` | Active development |
| `origin/main` | `d7571b3` | Synced with dev    |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.14.11 | `32dcc7c` | 2026-05-16 |
| v0.14.10 | `0c4264e` | 2026-05-16 |

## Last Release: 0.14.11 (2026-05-16)

- G1: Use single quotes in route formatting (adapter-vite)
- G5: Replace fragile nav scanner regex with char-by-char parser
- G10: Break circular dep — extract build-types.ts & virtual-ids.ts to @lessjs/core
- G11: Deduplicate term command logic into shared term-commands.ts
- G12: Remove no-explicit-any from global lint exclude; per-file exemptions only

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite (expected, runtime-only deps, not blocking publish)

## In Progress

- v0.15 Renderer Kernel (Phase 4-6 remaining: DSD report, create CLI fix, tests)

## Next Target: v0.16 WC Package Protocol

Per ADR-0024: extend PackageIslandMeta toward CEM-compatible package manifest.

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

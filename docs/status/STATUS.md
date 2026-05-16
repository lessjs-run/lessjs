# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.17.1

## Branch Status

| Branch        | HEAD      | Status          |
| ------------- | --------- | --------------- |
| `origin/dev`  | pending   | v0.17.1 release |
| `origin/main` | `1f93fa2` | v0.17.0 release |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.17.1  | pending   | 2026-05-16 |
| v0.17.0  | `1f93fa2` | 2026-05-16 |
| v0.16.0  | `a02feb6` | 2026-05-16 |
| v0.15.3  | `5e06fc9` | 2026-05-16 |
| v0.15.2  | `64dadd8` | 2026-05-16 |
| v0.15.1  | `dd36eea` | 2026-05-16 |
| v0.14.11 | `32dcc7c` | 2026-05-16 |

## Last Release: 0.17.1 (2026-05-16)

- Cross-runtime adapter-vite: `Deno.build.os` → `process.platform`,
  `Deno.exit(1)` → `process.exit(1)`.
- Zero hard Deno dependencies in `ssg.ts`.
- v0.17.0 SOP verification: build + e2e gates passed.
- 522 tests passing, fmt/lint/typecheck clean.

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite (expected,
  runtime-only deps, not blocking publish)
- v0.17.0 SOP: SSR filtering (`less.ssr: false`) and `dsd-report.json`
  manifest decisions not yet implemented — deferred to v0.17.2

## In Progress

- v0.17.2: SSR filtering + dsd-report manifest decisions
- v0.17.3: Multi-framework adapters

## Version Ladder

| Version | SOP                                               | Main outcome                                       | Status  |
| ------- | ------------------------------------------------- | -------------------------------------------------- | ------- |
| v0.15.1 | `docs/sop/v0.15.1-audit-gates.md`                 | Security and test gates                            | Done    |
| v0.15.2 | `docs/sop/v0.15.2-render-output-hooks.md`         | `RenderOutput` + `RenderHooks`                     | Done    |
| v0.15.3 | `docs/sop/v0.15.3-dsd-report-and-release-gate.md` | `dsd-report.json` + release gate                   | Done    |
| v0.16.0 | `docs/sop/v0.16.0-package-protocol.md`            | CEM manifest + local registry                      | Done    |
| v0.17.0 | `docs/sop/v0.17.0-manifest-native-pipeline.md`    | Delete `PackageIslandMeta`, manifest-native pipe   | Done    |
| v0.17.1 | `docs/sop/v0.17.1-cross-runtime.md`               | Cross-runtime adapter-vite, build + e2e gates      | Done    |
| v0.17.2 | `docs/sop/v0.17.2-ssr-filtering-dsd-report.md`    | SSR filtering + dsd-report manifest decisions      | Next    |
| v0.17.3 | —                                                 | Multi-framework adapters                           | Planned |
| v0.18.0 | `docs/sop/v0.18.0-universal-wc-engine.md`         | CEM parser + third-party WC SSR fallback           | Far     |
| v0.18.1 | —                                                 | `less add` package discovery + registration        | Far     |
| v0.18.2 | —                                                 | Zero-config SSG/SSG for any CEM WC package         | Far     |
| v0.19.0 | —                                                 | Registry Hub + search + snapshots + Edge rendering | Far     |
| v1.0.0  | —                                                 | General-Purpose Engine + API freeze                | Vision  |

## JSR Publish Order

1. `@lessjs/rpc` (no LessJS deps)
2. `@lessjs/signals` (no LessJS deps)
3. `@lessjs/core` (no LessJS deps) — must be published before all others
4. `@lessjs/adapter-lit` (depends on core only)
5. `@lessjs/content` (depends on core only)
6. `@lessjs/i18n` (depends on core only)
7. `@lessjs/adapter-vite` (depends on core only; sitemap via dynamic import
   at runtime)
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

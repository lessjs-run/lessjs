# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version: 0.17.0

## Branch Status

| Branch        | HEAD      | Status          |
| ------------- | --------- | --------------- |
| `origin/dev`  | pending   | v0.17.0 release |
| `origin/main` | `a02feb6` | v0.16.0 release |

## Tags

| Tag      | Commit    | Date       |
| -------- | --------- | ---------- |
| v0.17.0  | pending   | 2026-05-16 |
| v0.16.0  | `a02feb6` | 2026-05-16 |
| v0.15.3  | `5e06fc9` | 2026-05-16 |
| v0.15.2  | `64dadd8` | 2026-05-16 |
| v0.15.1  | `dd36eea` | 2026-05-16 |
| v0.14.11 | `32dcc7c` | 2026-05-16 |

## Last Release: 0.17.0 (2026-05-16)

- **Breaking**: `PackageIslandMeta` deleted — use
  `LessPackageManifest.declarations` instead.
- **Breaking**: `packageIslandFromManifest()` deleted — read
  `manifest.declarations` directly.
- **Breaking**: `@lessjs/ui` no longer exports `islands` — only `manifest`.
- adapter-vite reads `LessPackageManifest` directly (manifest-native pipeline).
- `IslandDecl` extended with `hydrate`, `ssr`, `dsd` fields from manifest.
- `scanPackageManifests()` replaces `scanPackageIslands()`.
- `Phase1Meta.packageManifests` + `packageIslandDecls` replace
  `packageIslands`.
- Release gate: 76 core tests pass; fmt, lint, typecheck clean.

## Known Issues

- 3 JSR `unanalyzable-dynamic-import` warnings in adapter-vite (expected,
  runtime-only deps, not blocking publish)

## In Progress

- v0.17.1: `less add <pkg>`, `less validate-manifest`, npm compat layer.
- SSR-aware rendering per manifest flags (ssr/dsd) for third-party packages.

## Version Ladder

| Version | SOP                                               | Main outcome                                     | Status  |
| ------- | ------------------------------------------------- | ------------------------------------------------ | ------- |
| v0.15.1 | `docs/sop/v0.15.1-audit-gates.md`                 | Security and test gates                          | ✅ Done |
| v0.15.2 | `docs/sop/v0.15.2-render-output-hooks.md`         | `RenderOutput` + `RenderHooks`                   | ✅ Done |
| v0.15.3 | `docs/sop/v0.15.3-dsd-report-and-release-gate.md` | `dsd-report.json` + release gate                 | ✅ Done |
| v0.16.0 | `docs/sop/v0.16.0-package-protocol.md`            | CEM manifest + local registry                    | ✅ Done |
| v0.17.0 | `docs/sop/v0.17.0-manifest-native-pipeline.md`    | Delete `PackageIslandMeta`, manifest-native pipe | ✅ Done |
| v0.17.1 | —                                                 | `less add`, npm compat, CLI tooling              | Next    |

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

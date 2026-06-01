# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.28.3 (Cleanup Closure + MDX - IMPLEMENTED)

v0.28.3 Status: **IMPLEMENTED.** The v0.28 pre-freeze closure is complete:
router, runtime, and protocols now have unit-test floors; dependency drift is
removed from the lockfile; MDX compiles through the existing LessJS JSX and DSD
pipeline; all 19 packages are aligned to `0.28.3`.

v0.28.2 Status: **IMPLEMENTED.** Deprecated adapter compatibility helpers were
removed, `renderDsd()` moved to structured options internally, HTML/head/link
security was hardened, Hub scanning moved to least-privilege permissions, CDN
resolution is configurable, and SSR default bundling no longer pulls Lit/React
unless the user opts in.

v0.28.1 Status: **IMPLEMENTED.** Hygiene-only cycle for v0.28 anchors,
`.gitignore` leaks, strategic-docs sync, and SOP index cleanup.

v0.28.0 Status: **IMPLEMENTED.** Architecture contracts stabilization
(`createAdapterRegistry`, `LessRenderer`, `onRenderError`), full Open Props
migration, CI composite action, docs-site theme gates, and signal-driven
registry work.

v0.27.0 Status: **IMPLEMENTED.** Virtual module coupling removed from route
files, island transform extracted to `@lessjs/core`, zero-bundler dev server,
SSG rendering robustness, and www/ documentation overhaul.

v0.25.0 Status: **IMPLEMENTED.** Declarative DX. `lessPipeline()`, 14 SOPs, and
route types.

v0.24.x Status: **IMPLEMENTED.** JSX+Signal component model and
`TemplateResult` removal.

v0.23.x and earlier: **HISTORICAL.**

## Next Target: v1.0 Stable Engine

The v0.28 line is now a coherent pre-freeze package set. The next planning
target is v1.0: freeze `DsdElement`, `renderDsd()`, adapter protocol, manifest
schema, package graph guarantees, and compatibility boundaries. Ecosystem
layers such as DB adapters, KV, and broader ISR integrations remain post-v1.0
unless a future SOP explicitly moves them forward.

## Current Product Center

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, JSX+Signal component model, Hono DSD-first
> API routes, build-time MDX, and a 19-package monorepo.

## Current Rendering Mode

| Mode                  | State   | Notes                                                 |
| --------------------- | ------- | ----------------------------------------------------- |
| SSG                   | shipped | default production rendering                          |
| DSD                   | shipped | `renderDsd()` outputs declarative shadow roots        |
| JSX+Signal            | shipped | `render(): string \| VNode`, effect() signal tracking |
| Island upgrade        | shipped | binary SSR/client-only boundary                       |
| Hydration strategies  | shipped | `client:load/idle/visible/only`                       |
| ISR contract          | shipped | `IsrCache`, `MemoryIsrCache`, manifest                |
| API route (Hono)      | shipped | Hono primary engine, DSD-first response shape         |
| Architecture hardened | v0.28.0 | adapter registry factory + contract surface           |
| Theme system          | v0.28.0 | Full Open Props migration, 7 color scales             |
| Security hardening    | v0.28.2 | HTML/head/link sanitizers and least-privilege Hub     |
| MDX                   | v0.28.3 | build-time MDX through Less JSX and DSD               |

## Package Version State

All 19 packages are aligned to **v0.28.3**. Patch releases remain unified across
the workspace so published JSR packages resolve a coherent version set.

## Architecture Positioning

1. **Application framework** - file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDsd()`, JSX runtime, adapters, compatibility.
3. **Registry Hub** - discovery, validation, snapshots, `less add`.

## v0.28 Release Line

| Version | Theme                        | Status | Headline                                                           |
| ------- | ---------------------------- | ------ | ------------------------------------------------------------------ |
| v0.28.0 | Contracts & Tokens           | Done   | Adapter registry factory, Open Props migration, CI composite gates |
| v0.28.1 | Hygiene Convergence          | Done   | Version anchors, gitignore leaks, strategic docs, SOP index        |
| v0.28.2 | Deprecated Purge + Hardening | Done   | Adapter compat removal, render options, HTML/head/link hardening   |
| v0.28.3 | Cleanup Closure + MDX        | Done   | Test floors, lockfile alignment, MDX, 19-package `0.28.3` bump     |

## Key Decisions

- **TemplateResult removed.** JSX+Signal is the only component model. `render()` returns `string | VNode`.
- **Signals in DsdElement via effect().** Signal-to-VNode re-render uses `effect()` from `@lessjs/signals`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero JS by default.
- **No DOM diff.** Signal writes trigger full re-render; complex subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions, and declared imports.
- **Cross-package types canonical.** `@lessjs/core` is the single source of truth for shared types.
- **API surface hardened.** `docs/reference/core-api-surface.md` defines HARDENED vs STABLE levels.
- **Adapter registry factory.** `createAdapterRegistry()` enables subprocess-isolated registries; `getDefaultRegistry()` keeps the shared runtime path explicit.
- **Full Open Props migration.** No custom semantic tokens; all colors derive from `@lessjs/ui/open-props-tokens`.
- **MDX through DSD.** MDX is build-time content compilation into the Less JSX runtime, not a runtime parser or React layer.

## Last Completed Line: v0.28.3

SOP-003 and SOP-004 are implemented together as the `0.28.3` release line.
Release details live in `docs/changelog/v0.28.2.md`,
`docs/changelog/v0.28.3.md`, `docs/release/v0.28.2.md`, and
`docs/release/v0.28.3.md`.

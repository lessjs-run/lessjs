# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.26.0 (Framework Decoupling — IMPLEMENTED)

v0.26.0 Status: **IMPLEMENTED.** Virtual module coupling removed from 60 route files,
island transform extracted to @lessjs/core, zero-bundler dev:fast server (~100ms),
SSG rendering robustness fixes, www/ documentation overhaul.

v0.25.0 Status: **IMPLEMENTED.** Declarative DX. lessPipeline(), 14 SOPs, route types.

v0.24.x Status: **IMPLEMENTED.** JSX+Signal component model, TemplateResult removal.

v0.23.x and earlier: **HISTORICAL.**

## Next Target: v1.0 Stable Engine

v1.0 will freeze: DsdElement, renderDsd(), adapter protocol, manifest schema,
compatibility boundary. Ecosystem layers (DB adapters, KV, ISR) are post-v1.0.

## Current Product Center

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, JSX+Signal component model, Hono API routes,
> and 18-package monorepo.

## Current Rendering Mode

| Mode                  | State   | Notes                                                 |
| --------------------- | ------- | ----------------------------------------------------- |
| SSG                   | shipped | default production rendering                          |
| DSD                   | shipped | `renderDsd()` outputs declarative shadow roots        |
| JSX+Signal            | shipped | `render(): string \| VNode`, effect() signal tracking |
| Island upgrade        | shipped | binary SSR/client-only boundary                       |
| Hydration strategies  | shipped | `client:load/idle/visible/only`                       |
| ISR contract          | shipped | `IsrCache`, `MemoryIsrCache`, manifest                |
| API route (Hono)      | shipped | Hono primary engine                                   |
| Architecture hardened | v0.24.3 | API surface + arch docs frozen                        |

## Package Version State

All 18 packages aligned to **v0.24.3**. Patch releases stay unified across the
workspace so published JSR packages resolve a coherent version set.

## Architecture Positioning

1. **Application framework** — file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** — DsdElement, renderDsd(), JSX runtime, adapters, compatibility.
3. **Registry Hub** — discovery, validation, `less add`.

## v0.24.3 — Consolidation (4 SOPs, 1 ADR)

| SOP | Title                     | Priority | Status       |
| --- | ------------------------- | -------- | ------------ |
| 002 | Shared Type Deduplication | P1       | ✅ COMPLETED |
| 003 | CLI & Data Organization   | P2       | ✅ COMPLETED |
| 004 | TemplateResult Removal    | P0       | ✅ COMPLETED |

| ADR  | Title                             | Status      |
| ---- | --------------------------------- | ----------- |
| 0057 | JSX + Signal Component Model      | IMPLEMENTED |
| 0058 | Remove TemplateResult Render Path | IMPLEMENTED |

Key outcomes:

- `template.ts` (602L) deleted. DsdElement.render() → `string | VNode`.
- 12 duplicated types canonicalized at `@lessjs/core`.
- 50+ nav-filter alias usages renamed.
- CLI `less-add` vs `less-install-guide` disambiguated.
- Changelog page reads `CHANGELOG.md` at build time.
- Architecture and API docs hardened.

## v0.24.4 — Declarative Architecture (PLANNED)

| Task Group | Title                         | Priority |
| ---------- | ----------------------------- | -------- |
| TG-01      | Declarative BuildPipeline API | P0       |
| TG-02      | Route Type Code Generation    | P0       |
| TG-03      | Route Scanner Enhancement     | P1       |
| TG-04      | Entry Renderer Adaptation     | P1       |
| TG-05      | Docs & Migration Guide        | P1       |
| TG-06      | Full Regression Gates         | P2       |

See `docs/sop/v0.24.4/README.md`.

## Historical Versions

- **v0.22.0** — Architecture Integrity: package boundaries, consumer surface, adapter decomposition, validation ownership, release gates.
- **v0.21.0** — Reactive DSD, safe templates, streaming DSD, unified event model.
- **v0.23.0** — Layered Package Architecture, protocols, runtime/app facades, package graph gates.

## Key Decisions

- **TemplateResult removed.** JSX+Signal is the only component model. `render()` returns `string | VNode`.
- **Signals in DsdElement via effect().** Signal→VNode re-render uses `effect()` from `@lessjs/signals`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero JS by default.
- **No DOM diff.** Signal writes trigger full re-render; complex subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions, declared imports.
- **Cross-package types canonical.** `@lessjs/core` is the single source of truth for shared types.
- **API surface hardened.** `docs/reference/core-api-surface.md` defines HARDENED vs STABLE levels.

## Last Completed Line: v0.24.3

All 4 SOPs completed. All gates green. Architecture and API docs hardened.
Next: v0.24.4 declarative pipeline + type-safe routes.

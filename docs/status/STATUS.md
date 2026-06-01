# LessJS Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.28.0 (Contracts & Tokens — IMPLEMENTED)

v0.28.0 Status: **IMPLEMENTED.** Architecture contracts stabilization (createAdapterRegistry factory, LessRenderer interface, onRenderError hook, _renderOrHydrate try/catch), full Open Props migration (7 color scales, dark mode inversions, 0 custom semantic tokens, 0 hardcoded colors in www/), CI composite action (5-step matrix, 14→9 jobs), docs site theme gates (80+ test cases), signal-driven registry (zero manual DOM via data-signal + data-signal-attr).

v0.27.0 Status: **IMPLEMENTED.** Virtual module coupling removed from 60 route files, island transform extracted to @lessjs/core, zero-bundler dev:fast server (~100ms), SSG rendering robustness, www/ documentation overhaul.

v0.25.0 Status: **IMPLEMENTED.** Declarative DX. lessPipeline(), 14 SOPs, route types.

v0.24.x Status: **IMPLEMENTED.** JSX+Signal component model, TemplateResult removal.

v0.23.x and earlier: **HISTORICAL.**

## Next Target: v0.28.2 Deprecated Purge + Hardening

v0.28.1 is closed as a hygiene-only cycle: v0.28 anchors, `.gitignore` leaks,
strategic-docs sync, and SOP index cleanup. It did not change package versions
or runtime behavior.

v0.28.2 is the next implementation target. It is not complete in the current
`dev` tree. It must remove deprecated compatibility paths, close selected
P0/P1 security and performance findings, and pass the full local and CI gates
before any package bump or release note can be called valid. See
`docs/sop/v0.28.2/SOP-003-deprecated-purge.md`.

v0.28.3 remains deferred until v0.28.2 is merged and verified. Its MDX work is a
multi-week feature track, not a same-day release bump.

## Stable Engine Target: v1.0

v1.0 will freeze: DsdElement, renderDsd(), adapter protocol, manifest schema, compatibility boundary. Ecosystem layers (DB adapters, KV, ISR) are post-v1.0.

## Current Product Center

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, JSX+Signal component model, Hono DSD-first API routes,
> and 19-package monorepo.

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
| Architecture hardened | v0.28.0 | `createAdapterRegistry()` factory + contract surface  |
| Theme system          | v0.28.0 | Full Open Props migration, 7 color scales             |

## Package Version State

All 19 packages aligned to **v0.28.0**. Patch releases stay unified across the
workspace so published JSR packages resolve a coherent version set.

## Architecture Positioning

1. **Application framework** — file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** — DsdElement, renderDsd(), JSX runtime, adapters, compatibility.
3. **Registry Hub** — discovery, validation, `less add`.

## v0.28.0 — Contracts & Tokens (10 SOPs, 1 ADR)

| Theme        | Headline                                                              |
| ------------ | --------------------------------------------------------------------- |
| Architecture | `createAdapterRegistry()` factory, `LessRenderer` interface expansion |
| Theme system | Full Open Props migration, 7 color scales, dark mode inversions       |
| CI/CD        | Composite action exported, 14→9 jobs                                  |
| Docs site    | Theme gates (80+ tests), signal-driven registry, zero manual DOM      |
| Resilience   | `onRenderError` hook, `_renderOrHydrate` try/catch, fallback chain    |

Key outcomes:

- `createAdapterRegistry()` factory replaces module-level singleton (subprocess-friendly)
- 0 custom semantic tokens, 0 hardcoded colors in www/ (except hero decorations + 6 hex `--compat-*` source definitions)
- 30+ www/ files rewritten to Open Props color references
- 80+ theme gate tests in `www/__tests__/v0.27.0-regression.test.ts`
- 6 individual role audits + 1 summary in `docs/conversation/20260601/`

## v0.28.1 — Hygiene Convergence (DONE)

| Task Group | Title                                | Status |
| ---------- | ------------------------------------ | ------ |
| HC-01      | `.gitignore` dedupe + `.gstack/`     | Done   |
| HC-02      | Untrack leaked tracked files         | Done   |
| HC-03      | v0.27 → v0.28 version anchor sweep   | Done   |
| HC-04      | `STATUS.md` rewrite to v0.28.0       | Done   |
| HC-05      | `docs/sop/README.md` index sync      | Done   |
| HC-06      | `tools/check-strategic-docs.ts` sync | Done   |

v0.28.1 is a repository hygiene closure, not a package release line. All 19
packages remain aligned to v0.28.0 until v0.28.2 or a later implementation
release satisfies its exit criteria.

## v0.28.2 / v0.28.3 Planning State

| Version | State    | Release Rule                                                                  |
| ------- | -------- | ----------------------------------------------------------------------------- |
| v0.28.2 | Planned  | Bump only after deprecated purge, hardening, build, test, DSD, and CI pass.   |
| v0.28.3 | Deferred | Depends on v0.28.2; MDX implementation requires ADR, package work, and tests. |

## Historical Versions

- **v0.27.0** — Framework Decoupling + Reactive Pragmatic. Virtual module coupling removed, island transform extracted.
- **v0.26.x** — Hub command reorganization, package publish sanity.
- **v0.25.0** — Declarative DX: lessPipeline(), 14 SOPs, route types.
- **v0.24.x** — JSX+Signal component model, TemplateResult removal, API naming convention.
- **v0.23.0** — Layered Package Architecture, protocols, runtime/app facades, package graph gates.
- **v0.22.0** — Architecture Integrity: package boundaries, consumer surface, adapter decomposition.
- **v0.21.0** — Reactive DSD, safe templates, streaming DSD, unified event model.

## Key Decisions

- **TemplateResult removed.** JSX+Signal is the only component model. `render()` returns `string | VNode`.
- **Signals in DsdElement via effect().** Signal→VNode re-render uses `effect()` from `@lessjs/signals`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero JS by default.
- **No DOM diff.** Signal writes trigger full re-render; complex subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions, declared imports.
- **Cross-package types canonical.** `@lessjs/core` is the single source of truth for shared types.
- **API surface hardened.** `docs/reference/core-api-surface.md` defines HARDENED vs STABLE levels.
- **Adapter registry factory.** `createAdapterRegistry()` enables subprocess-isolated registries; default registry retained for backward compatibility.
- **Full Open Props migration.** No custom semantic tokens; all colors derive from `@lessjs/ui/open-props-tokens`.

## Last Completed Line: v0.28.0

12 commits, 10 SOPs (SOP-001 in v0.28.0/ + 10 in v0.27.0/), 1 ADR. Theme system migrated. Architecture contracts frozen. CI composite action exported. v0.28.1 hygiene is closed; next implementation line is v0.28.2.

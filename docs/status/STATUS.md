# openElement Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.30.1 (Clean Architecture Sweep - Local Verified)

v0.30.1 Status: **LOCAL VERIFIED; REMOTE CI PENDING.** Governing docs:
`docs/adr/ADR-0081-vnode-event-unification.md` and
`docs/sop/v0.30.1/SOP-013-islands-fix-openelement-rename.md`. The line finishes
the `@openelement` rename, removes stale `less-*` active contracts, makes
dynamic island UI VNode-only, keeps HTML injection behind an explicit trusted
boundary, repairs current-doc drift, and makes `arch:check` prove the active
architecture. Local gates passed on 2026-06-04, including `deno task test`
(1296 passed), `deno task build` (363 HTML files, 333 DSD-report pages, 0
errors), `deno task publish:dry-run` (19 packages), and `deno task test:e2e`
(101 passed).

v0.30.0 Status: **IMPLEMENTED.** The architecture freeze collapsed the active
renderer contract to `VNode | null`, added architecture contract gates, aligned
all 19 packages to `0.30.0`, and established a single package graph release
proof. It is superseded by v0.30.1 for the openElement rename and post-freeze
cleanup sweep.

v0.28.5 Status: **IMPLEMENTED.** Post-publish consumer smoke for v0.28.4 found
a bare `sanitize-html` import in fresh JSR consumers. v0.28.5 makes the
sanitizer dependency an explicit `npm:` specifier in published source and aligns
all 19 packages to `0.28.5`.

v0.28.4 Status: **IMPLEMENTED.** AppShell is now an explicit framework
protocol; route-level layouts are configurable; `renderDsd()` uses the strict
object options contract; renderer raw HTML uses a parser-backed sanitizer; and
local release tasks cover all 19 packages. It is superseded by v0.28.5 for fresh
JSR consumers.

v0.28.3 Status: **IMPLEMENTED.** The v0.28 pre-freeze closure added router,
runtime, and protocols unit-test floors; removed dependency drift from the
lockfile; compiled MDX through the existing openElement JSX and DSD pipeline; and
aligned all 19 packages to `0.28.3`.

v0.28.2 Status: **IMPLEMENTED.** Deprecated adapter compatibility helpers were
removed, `renderDsd()` moved to structured options internally, HTML/head/link
security was hardened, Hub scanning moved to least-privilege permissions, CDN
resolution is configurable, and SSR default bundling no longer pulls Lit/React
unless the user opts in.

v0.28.1 Status: **IMPLEMENTED.** Hygiene-only cycle for v0.28 anchors,
`.gitignore` leaks, strategic-docs sync, and SOP index cleanup.

v0.28.0 Status: **IMPLEMENTED.** Architecture contracts stabilization
(`createAdapterRegistry`, `OpenElementRenderer`, `onRenderError`), full Open Props
migration, CI composite action, docs-site theme gates, and signal-driven
registry work.

v0.27.0 Status: **IMPLEMENTED.** Virtual module coupling removed from route
files, island transform extracted to `@openelement/core`, zero-bundler dev server,
SSG rendering robustness, and www/ documentation overhaul.

v0.25.0 Status: **IMPLEMENTED.** Declarative DX. `openPipeline()`, 14 SOPs, and
route types.

v0.24.x Status: **IMPLEMENTED.** JSX+Signal component model and
`TemplateResult` removal.

v0.23.x and earlier: **HISTORICAL.**

## Next Target: v0.31 UI Shell

v0.31 remains deferred until v0.30.1 is clean and gate-proven. Its planned scope
is UI Shell/Ocean-Island/@openelement UI work, not renderer or rename cleanup.

## Stable Target: v1.0

v1.0 remains the stable engine target. It should freeze the cleaned v0.30.x
renderer, metadata, package graph, and trust-boundary contracts after the v0.31
product-surface work proves those contracts in real applications.

## Current Product Center

> DSD-first Web Components application framework with SSG, progressive islands,
> `client:*` hydration strategies, JSX+Signal component model, Hono DSD-first
> API routes, build-time MDX, and a 19-package `@openelement/*` monorepo.

## Current Rendering Mode

| Mode                  | State   | Notes                                                  |
| --------------------- | ------- | ------------------------------------------------------ |
| SSG                   | shipped | default production rendering                           |
| DSD                   | shipped | `renderDsd()` outputs declarative shadow roots         |
| JSX+Signal            | shipped | `render(): VNode \| null`, effect() signal tracking    |
| Island upgrade        | shipped | binary SSR/client-only boundary                        |
| Hydration strategies  | shipped | `client:load/idle/visible/only`                        |
| ISR contract          | shipped | `IsrCache`, `MemoryIsrCache`, manifest                 |
| API route (Hono)      | shipped | Hono primary engine, DSD-first response shape          |
| Architecture hardened | v0.28.0 | adapter registry factory + contract surface            |
| Theme system          | v0.28.0 | Full Open Props migration, 7 color scales              |
| Security hardening    | v0.28.2 | HTML/head/link sanitizers and least-privilege Hub      |
| MDX                   | v0.28.3 | build-time MDX through Less JSX and DSD                |
| AppShell protocol     | v0.28.4 | default, bare, custom, and route-selected shells       |
| Consumer resolver     | v0.28.5 | explicit npm sanitizer imports for published source    |
| Architecture freeze   | v0.30.0 | one renderer contract, graph gate, architecture gate   |
| Clean sweep           | v0.30.1 | active `open-*`, VNode-only islands, trusted HTML gate |

## Package Version State

All 19 packages are currently aligned to **v0.30.1** under `@openelement/*`.
v0.30.1 has local proof and must not be called remote-released until GitHub
Actions pass on `dev` and after merge on `main`.

## Architecture Positioning

1. **Application framework** - file routes, dev server, build pipeline, Hono API routes.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDsd()`, JSX runtime, adapters, compatibility.
3. **Registry Hub** - discovery, validation, snapshots, install guidance.

## v0.30 Release Line

| Version | Theme                        | Status         | Headline                                                     |
| ------- | ---------------------------- | -------------- | ------------------------------------------------------------ |
| v0.30.0 | Architecture Contract Freeze | Done           | VNode/null renderer contract, graph gate, architecture gate  |
| v0.30.1 | Clean Architecture Sweep     | Local Verified | openElement rename closure, VNode-only islands, trusted HTML |

## v0.28 Release Line

| Version | Theme                        | Status | Headline                                                           |
| ------- | ---------------------------- | ------ | ------------------------------------------------------------------ |
| v0.28.0 | Contracts & Tokens           | Done   | Adapter registry factory, Open Props migration, CI composite gates |
| v0.28.1 | Hygiene Convergence          | Done   | Version anchors, gitignore leaks, strategic docs, SOP index        |
| v0.28.2 | Deprecated Purge + Hardening | Done   | Adapter compat removal, render options, HTML/head/link hardening   |
| v0.28.3 | Cleanup Closure + MDX        | Done   | Test floors, lockfile alignment, MDX, 19-package `0.28.3` bump     |
| v0.28.4 | AppShell Protocol + Cleanup  | Done   | Explicit shells, strict render API, sanitizer, 19-package gates    |
| v0.28.5 | Consumer Resolver Patch      | Done   | Explicit npm sanitizer imports for fresh JSR consumers             |

## Key Decisions

- **TemplateResult and string render removed.** JSX+Signal is the only component model. `render()` returns `VNode | null`.
- **Signals in DsdElement via effect().** Signal-to-DOM binding uses `effect()` from `@openelement/signals`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero JS by default.
- **No DOM diff.** Signal writes trigger full re-render; complex subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions, and declared imports.
- **Cross-package types canonical.** `@openelement/core` is the single source of truth for shared types.
- **API surface hardened.** `docs/reference/core-api-surface.md` defines HARDENED vs STABLE levels.
- **Adapter registry factory.** `createAdapterRegistry()` enables subprocess-isolated registries; `getDefaultRegistry()` keeps the shared runtime path explicit.
- **Full Open Props migration.** No custom semantic tokens; all colors derive from `@openelement/ui/open-props-tokens`.
- **MDX through DSD.** MDX is build-time content compilation into the Less JSX runtime, not a runtime parser or React layer.

## Last Completed Line: v0.30.0

v0.30.0 is the completed architecture contract freeze. v0.30.1 is the active
cleanup line with local proof complete. Remote release closure is still gated on
`dev` and `main` CI.

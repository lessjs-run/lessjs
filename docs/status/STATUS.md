# openElement Project Status

> AI assistant: read this file first on every session start.

## Current Version Line: v0.31.0 (JSX-first Application API)

v0.31.0 Status: **IMPLEMENTED AND RELEASED.**
Governing docs:

- `docs/adr/ADR-0082-jsx-first-application-api.md`
- `docs/adr/ADR-0083-deferred-public-surface-reset.md`
- `docs/sop/v0.31.0/README.md`
- `docs/roadmap/ROADMAP.md`

The line changes the default authoring model from runtime class inheritance to
Application API helpers:

- `definePage()`
- `defineIsland()`
- `defineElement()`
- `defineLayout()`
- `openElement()` from `@openelement/app/vite`

`DsdElement` remains a public runtime primitive in `@openelement/core`, but it is
not the default page-authoring tutorial API.

v0.30.1 Status: **IMPLEMENTED.** The clean architecture sweep finished the
openElement rename, removed stale LessJS compatibility names from active
contracts, made dynamic island UI VNode-only, kept HTML injection behind an
explicit trusted boundary, and aligned current docs and package metadata with
the openElement identity.

v0.30.0 Status: **IMPLEMENTED.** The architecture freeze collapsed the active
renderer contract to `VNode | null`, added architecture contract gates, aligned
all 19 packages to `0.30.0`, and established a single package graph release
proof.

v0.28.0-v0.29.6 Status: **IMPLEMENTED.** This line delivered AppShell protocol,
MDX, structured renderer IR, core simplification, type hardening, and architecture
debt closure.

v0.23.x-v0.27.x Status: **IMPLEMENTED.** This line delivered layered package
architecture, JSX+Signal component model, declarative DX, Hub CLI organization,
framework decoupling, and reactive route behavior.

v0.22.x and earlier: **HISTORICAL.**

## Next Targets

| Version | Theme                              | Status  | Purpose                                                          |
| ------- | ---------------------------------- | ------- | ---------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API          | Current | App authoring API, `/vite` config split, docs/template DX        |
| v0.32.0 | Rendering Modes                    | Planned | SSR, ISR, streaming DSD, cache adapters, deployment recipes      |
| v0.33.0 | Server/API Layer                   | Planned | Hono route helpers, middleware, typed responses, errors          |
| v0.34.0 | Data Integration Layer             | Planned | External ORM/database recipes without framework-owned ORM        |
| v0.35.0 | UI Shell and Design System Surface | Planned | AppShell, Ocean/Island UI split, `@openelement/ui/css`, starters |
| v0.36.0 | Hardening and Migration            | Planned | API audit, docs proof, fixtures, consumer smoke, performance     |
| v0.37.0 | Public Surface Reset               | Planned | Final package/product surface reset before v1.0                  |
| v1.0.0  | Stable Application Engine          | Vision  | API freeze after the v0.31-v0.37 line is implementation-proven   |

## Current Product Center

> JSX-first Web Components application framework with SSG, progressive islands,
> Declarative Shadow DOM, `client:*` hydration strategies, Hono DSD-first API
> routes, build-time MDX, and a 19-package `@openelement/*` monorepo.

ADR-0083 keeps the v0.31 physical package graph in place while v0.32-v0.36
validate product behavior. The planned v0.37 reset will decide whether the v1
public surface converges toward `protocol`, `elements`, `ui`, `framework`, and
`create`.

## Current Rendering Mode

| Mode                 | State   | Notes                                                |
| -------------------- | ------- | ---------------------------------------------------- |
| SSG                  | shipped | default production rendering                         |
| DSD                  | shipped | `renderDsd()` outputs declarative shadow roots       |
| JSX+Signal           | shipped | `render(): VNode \| null`, effect() signal tracking  |
| Island upgrade       | shipped | binary SSR/client-only boundary                      |
| Hydration strategies | shipped | `client:load/idle/visible/only`                      |
| ISR contract         | shipped | `IsrCache`, `MemoryIsrCache`, manifest               |
| API route (Hono)     | shipped | Hono primary engine, DSD-first response shape        |
| AppShell protocol    | shipped | default, bare, custom, and route-selected shells     |
| Architecture freeze  | v0.30.0 | one renderer contract, graph gate, architecture gate |
| Application API      | v0.31.0 | `definePage`, `defineIsland`, `/vite` config split   |

## Package Version State

All 19 packages are aligned to **v0.31.0** under `@openelement/*` for this
release. Release proof requires local gates, GitHub Actions on `dev`, merge to
`main`, GitHub Actions on `main`, and the GitHub tag/release note.

Package governance before v0.37:

- do not add a new top-level package without an ADR;
- prefer integration subpaths over package sprawl;
- keep protocol contracts small and runtime-free;
- keep UI independent from framework routing;
- keep database, ORM, auth, backend, and builder choices at adapter or recipe
  boundaries.

## Architecture Positioning

1. **Application framework** - file routes, Application API, dev server, build
   pipeline, Hono API routes.
2. **DSD/WC rendering engine** - `DsdElement`, `renderDsd()`, JSX runtime,
   adapters, compatibility.
3. **Registry Hub** - discovery, validation, snapshots, install guidance.

## Key Decisions

- **Application API first.** Users write `definePage()` and `defineIsland()`
  before touching `DsdElement`.
- **Vite config split.** `openElement()` is imported from `@openelement/app/vite`.
- **TemplateResult and string render removed.** JSX+Signal is the only component
  model. `render()` returns `VNode | null`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero
  JS by default.
- **No DOM diff.** Signal writes trigger scoped rerender behavior; complex
  subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions,
  and declared imports.
- **MDX through DSD.** MDX is build-time content compilation into the openElement
  JSX runtime, not a runtime parser or React layer.
- **Deferred public surface reset.** v0.32-v0.36 validate behavior first; v0.37
  is the planned v1 package/product surface reset.

## Release Gate Order

```bash
deno task arch:check
deno task graph:check
deno task docs:check-current
deno task docs:check-strategy
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

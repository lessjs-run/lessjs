# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active execution
package: `docs/next/v0.34.0/`.

## Current Version Line: v0.34.0 (AutoFlow2 Sidecar Kernel)

v0.34.0 Status: **IMPLEMENTED AND RELEASED.**
Governing docs:

- `docs/adr/ADR-0086-ai-readable-architecture-and-autoflow2-roadmap.md`
- `docs/sop/v0.34.0/README.md`
- `docs/next/v0.34.0/`
- `docs/roadmap/ROADMAP.md`

The line introduces an internal read-only workflow kernel that reads repository
governance documents and emits structured reports:

- `deno task autoflow:report` — JSON or Markdown summary.
- 5-state workflow machine: `planned → next → active → implemented → released`.
- 6 readers for STATUS, SOP, NextVersion, ROADMAP, package graph, and ADRs.
- 9 evidence cells with `ok`/`warning`/`missing`/`drifted` status.
- Advisory only — no CI gate, no code edits, zero network.

This is the kernel that v0.35 will turn into `deno task autoflow:check`.

v0.33.0 Status: **IMPLEMENTED AND RELEASED.** The line made page, island, head,
route, and render intent machine-readable with object-form `definePage()`,
`defineIslandConfig()`, and `dangerouslyHeadFragments` trust boundary.

v0.32.0 Status: **IMPLEMENTED AND RELEASED.** The line turned the v0.31
Application API into an explicit route lifecycle with `redirect()`, `notFound()`,
load context, route metadata, and page error fallback.

`DsdElement` remains a public runtime primitive in `@openelement/core`, but it is
not the default page-authoring tutorial API.

v0.31.0 Status: **IMPLEMENTED AND RELEASED.** The line changed the default
authoring model from runtime class inheritance to Application API helpers.

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
MDX, structured renderer IR, core simplification, type hardening, and
architecture debt closure.

v0.23.x-v0.27.x Status: **IMPLEMENTED.** This line delivered layered package
architecture, JSX+Signal component model, declarative DX, Hub CLI organization,
framework decoupling, and reactive route behavior.

v0.22.x and earlier: **HISTORICAL.**

## Next Targets

| Version | Theme                            | Status  | Purpose                                                        |
| ------- | -------------------------------- | ------- | -------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API        | Done    | App authoring API, `/vite` config split, docs/template DX      |
| v0.32.0 | App Lifecycle Contract           | Done    | Route, load, context, layout, error, redirect lifecycle        |
| v0.33.0 | AI-Readable API Foundation       | Done    | Structured page, island, head, route, and render intent APIs   |
| v0.34.0 | AutoFlow2 Sidecar Kernel         | Current | Workflow state, cells, evidence ledger, allowed-action report  |
| v0.35.0 | AutoFlow2 Harness Gate           | Next    | Low-noise workflow contradictions become local and CI blockers |
| v0.36.0 | Rendering Runtime and Deployment | Planned | SSR, ISR, streaming DSD, cache adapters, deployment recipes    |
| v0.37.0 | Server/Data/UI Product Closure   | Planned | Server, data, UI, starters, Hub disposition, pruning evidence  |
| v0.38.0 | Public Surface Reset             | Planned | Final package/product surface reset before the v1 RC           |
| v0.39.0 | v1 Release Candidate             | Planned | Final API, docs, starter, deploy, consumer, and publish gates  |
| v1.0.0  | Stable Engine + AutoFlow Default | Vision  | API freeze with workflow evidence as part of default gates     |

## Current Product Center

> JSX-first Web Components application framework with SSG, progressive islands,
> Declarative Shadow DOM, `client:*` hydration strategies, Hono DSD-first API
> routes, build-time MDX, and a 19-package `@openelement/*` monorepo.

ADR-0083 keeps the v0.32 physical package graph in place while the product line
is proven. ADR-0086 supersedes the sequencing parts of ADR-0084: v0.33-v0.35 now
build AI-readable APIs, AutoFlow2 sidecar reporting, and the AutoFlow2 harness
gate before rendering, server, data, and UI product expansion resumes.

## Current Rendering Mode

| Mode                 | State   | Notes                                                 |
| -------------------- | ------- | ----------------------------------------------------- |
| SSG                  | shipped | default production rendering                          |
| DSD                  | shipped | `renderDsd()` outputs declarative shadow roots        |
| JSX+Signal           | shipped | `render(): VNode \| null`, effect() signal tracking   |
| Island upgrade       | shipped | binary SSR/client-only boundary                       |
| Hydration strategies | shipped | `client:load/idle/visible/only`                       |
| ISR contract         | shipped | `IsrCache`, `MemoryIsrCache`, manifest                |
| API route (Hono)     | shipped | Hono primary engine, DSD-first response shape         |
| AppShell protocol    | shipped | default, bare, custom, and route-selected shells      |
| Architecture freeze  | v0.30.0 | one renderer contract, graph gate, architecture gate  |
| Application API      | v0.31.0 | `definePage`, `defineIsland`, `/vite` config split    |
| App lifecycle        | v0.32.0 | load context, route meta, redirect, not-found, error  |
| AI-Readable API      | v0.33.0 | Object-form pages, island config, head trust boundary |
| AutoFlow2 Sidecar    | v0.34.0 | Advisory workflow kernel: JSON + summary reports      |

## Package Version State

All 19 packages are aligned to **v0.34.0** under `@openelement/*` for this
release. Release proof includes local gates, GitHub Actions on `dev`, merge to
`main`, GitHub Actions on `main`, and the GitHub tag/release note.

Package governance before v0.38:

- do not add a new top-level package without an ADR;
- prefer integration subpaths over package sprawl;
- keep protocol contracts small and runtime-free;
- keep UI independent from framework routing;
- keep database, ORM, auth, backend, and builder choices at adapter or recipe
  boundaries.

## Architecture Positioning

1. **Application framework** - file routes, Application API, dev server, build
   pipeline, Hono API routes.
2. **DSD/WC element and UI engine** - `DsdElement`, `renderDsd()`, JSX runtime,
   adapters, UI components, compatibility.
3. **Registry Hub** - current package and tooling surface; v0.37 must decide
   whether it remains public product, becomes internal tooling, is deferred, is
   archived, or is removed.

## Key Decisions

- **Application API first.** Users write `definePage()` and `defineIsland()`
  before touching `DsdElement`.
- **Vite config split.** `openElement()` is imported from
  `@openelement/app/vite`.
- **TemplateResult and string render removed.** JSX+Signal is the only component
  model. `render()` returns `VNode | null`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero
  JS by default.
- **No DOM diff.** Signal writes trigger scoped rerender behavior; complex
  subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions,
  and declared imports.
- **MDX through DSD.** MDX is build-time content compilation into the
  openElement JSX runtime, not a runtime parser or React layer.
- **Deferred public surface reset.** v0.34-v0.37 collect API, workflow, and
  product evidence first; v0.38 is the planned v1 package/product surface reset;
  v0.39 is the v1 release candidate.
- **AutoFlow2 boundary.** AutoFlow2 may report state, evidence, blockers, and
  allowed actions. It must not merge, tag, bump, publish, or replace human review
  for ADRs, public API resets, package removal, release tags, or publishing.

## Release Gate Order

```bash
deno task workflow:check
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

`deno task autoflow:check` is planned for v0.35.0 and must not be listed as a
required release gate until the task exists and the low-noise blocker set is
implemented.

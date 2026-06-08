# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active execution
package: `docs/next/v0.36.2/`.

## Current Version Line: v0.36.2 (SSG Bridge Migration + Rendering Evidence Closure)

v0.36.2 is a patch release for SSG bridge migration. It moves the Vite-free SSG
render engine and HTML post-processing helpers into `@openelement/ssg`, while
`@openelement/adapter-vite` continues to own Vite SSR bundle build, virtual
entry generation, route scanning, generated data resolution, alias/noExternal
configuration, and plugin orchestration.

v0.36.2 Status: **RELEASED.**
Governing docs:

- `docs/sop/v0.36.2/README.md`
- `docs/next/v0.36.2/`
- `docs/roadmap/ROADMAP.md`
- `docs/governance/BRANCHING.md`

v0.36.1 Status: **IMPLEMENTED.** It closed the v0.36 release truth and
AutoFlow evidence gap with `cell-v0.36.1-001`, non-zero metrics, Windows-safe
generated test paths, and aligned v0.36.0 deferrals.

v0.36.0 Status: **IMPLEMENTED WITH DEFERRED ITEMS.** Delivered signals docs,
deployment docs, version sync, error-boundary retry/degraded fallback coverage,
FileIsrCache, `@openelement/ssg` Phase 1, parallel SSG evidence, and AutoFlow
built-in cell generation. Complete adapter-vite migration and expanded
Firefox/WebKit proof remain deferred.

## Next Targets

| Version | Theme                                              | Status              | Purpose                                                                                       |
| ------- | -------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API                          | Done                | App authoring API, `/vite` config split, docs/template DX                                     |
| v0.32.0 | App Lifecycle Contract                             | Done                | Route, load, context, layout, error, redirect lifecycle                                       |
| v0.33.0 | AI-Readable API Foundation                         | Done                | Structured page, island, head, route, and render intent APIs                                  |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Done                | Workflow state, cells, evidence ledger, allowed-action report                                 |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Done                | Harness Gate, Cell Execution, Evolution Loop, and full-auto evidence                          |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Done with deferrals | Rendering/runtime evidence and Phase 1 SSG extraction                                         |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Done                | AutoFlow proof and release truth alignment                                                    |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Done                | Move Vite-free SSG core into `@openelement/ssg` and close ISR/SSR/stream evidence             |
| v0.36.3 | Complete SSG File Ownership Migration              | Next                | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Planned             | Resolve Firefox/WebKit E2E timeout and behavior differences                                   |
| v0.37.0 | Server/Data/UI Product Closure                     | Planned             | Server, data, UI, starters, Hub disposition, pruning evidence                                 |
| v0.38.0 | Public Surface Reset                               | Planned             | Final package/product surface reset before the v1 RC                                          |
| v0.39.0 | v1 Release Candidate                               | Planned             | Final API, docs, starter, deploy, consumer, and publish gates                                 |
| v1.0.0  | Stable Engine + AutoFlow Default                   | Vision              | API freeze with workflow evidence as part of default gates                                    |

## Current Product Center

> JSX-first Web Components application framework with SSG, progressive islands,
> Declarative Shadow DOM, `client:*` hydration strategies, Hono DSD-first API
> routes, build-time MDX, and a 20-package `@openelement/*` monorepo.

## Current Rendering Mode

| Mode                 | State       | Notes                                                                                        |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| SSG                  | shipped     | default production rendering; Vite-free core now lives in `@openelement/ssg`                 |
| DSD                  | shipped     | `renderDsd()` outputs declarative shadow roots                                               |
| Streaming DSD        | evidence    | `renderDsdStream()` is tested through Web `Response` consumption; not default server runtime |
| JSX+Signal           | shipped     | `render(): VNode \| null`, effect() signal tracking                                          |
| Island upgrade       | shipped     | binary SSR/client-only boundary                                                              |
| Hydration strategies | shipped     | `client:load/idle/visible/only`                                                              |
| ISR contract         | shipped     | `IsrCache`, `MemoryIsrCache`, `FileIsrCache`, manifest entries with `createIsrCacheKey()`    |
| API route (Hono)     | shipped     | Hono primary engine, DSD-first response shape                                                |
| AppShell protocol    | shipped     | default, bare, custom, and route-selected shells                                             |
| Application API      | v0.31.0     | `definePage`, `defineIsland`, `/vite` config split                                           |
| App lifecycle        | v0.32.0     | load context, route meta, redirect, not-found, error                                         |
| AI-Readable API      | v0.33.0     | Object-form pages, island config, head trust boundary                                        |
| AutoFlow2            | v0.34-v0.36 | report/check/evolve sidecar with evidence ledger and release truth gates                     |

## Package Version State

All 20 packages are aligned to **v0.36.2** under `@openelement/*`.

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
3. **SSG engine** - Vite-free render/postprocess code in `@openelement/ssg`,
   with adapter-vite still orchestrating Vite build inputs in v0.36.2.
4. **Registry Hub** - current package and tooling surface; v0.37 must decide
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
- **SSG bridge boundary.** `@openelement/ssg` owns Vite-free SSG render and
  postprocess code; adapter-vite owns Vite orchestration until v0.37.
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
deno task autoflow:test
deno task autoflow:health
deno task autoflow:check
deno task test
deno task build
deno task dsd:check-report
deno task publish:dry-run
deno task test:e2e
```

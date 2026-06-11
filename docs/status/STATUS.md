# openElement Project Status

> AI assistant: read this file first on every session start.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`. Active execution
package: `docs/next/v0.37.5/` (Protocol Ports + DaisyUI Coverage Completion).

## Current Version Line: v0.37.4 (Hygiene + Pure CSS UI + Architecture Decoupling) - Publish Recovery

v0.37.4 implementation is complete. All 20 `@openelement/*` workspace packages
are aligned to `0.37.4`, tag `v0.37.4` exists, and the GitHub release exists.
The release is not closed until the JSR publish gate reaches 20/20 packages and
post-publish consumer smoke passes.

Live registry state on 2026-06-11: `@openelement/rpc`,
`@openelement/protocols`, and `@openelement/router` are visible on JSR at
`0.37.4`; the remaining 17 packages still need publish recovery. The first
recovery patch failed because a 5-minute per-package timeout interrupted
`@openelement/style-sheet` before JSR accepted the immutable version. The
current recovery patch restores a 20-minute package window, keeps provenance
enabled, polls live JSR metadata during `deno publish`, stops the hung publish
process after the version becomes visible, and extends the publish job to 360
minutes for the remaining 17-package recovery path.

v0.37.4 delivered the 2026-06-10 audit hygiene fixes, ADR-0094 Core Type
Consolidation, adapter-vite deprecated shell removal, SSG ownership cleanup,
dsd-hydration helper deduplication, UI/router decoupling, a daisyUI-inspired
pure CSS foundation, three DsdElement interactive thin-shell proofs
(`open-dropdown`, `open-modal`, `open-tabs`), and test supplementation. Local
evidence recorded for the release: 1600 tests passed before publish recovery.

v0.37.3 (Data / Database Boundary) is done as a validation-train stop:
ADR-0095 accepted and implemented with MemoryDataAdapter baseline,
FileDataAdapter deferred to recipe, and the 2026-06-10 JSR publish hotfix
closed for the prior package line. The current v0.37.4 publish recovery remains
open until the live registry and consumer-smoke evidence agree.

The next implementation line is v0.37.5, but publish recovery remains the P0
release-truth task before v0.37.5 can be called in progress beyond planning.

Governing docs:

- `docs/sop/v0.37.5/README.md`
- `docs/next/v0.37.5/`
- `docs/sop/v0.37.4/README.md`
- `docs/next/v0.37.4/`
- `docs/sop/v0.37.3/README.md`
- `docs/next/v0.37.3/`
- `docs/adr/ADR-0095-data-database-boundary.md`
- `docs/sop/v0.37.4/README.md`
- `docs/next/v0.37.4/`
- `docs/adr/ADR-0093-ssr-isr-runtime-contract.md`
- `docs/sop/v0.37.1/README.md`
- `docs/next/v0.37.1/`
- `docs/adr/ADR-0092-dsdelement-render-mode.md`
- `docs/sop/v0.37.0/README.md`
- `docs/next/v0.37.0/`
- `docs/adr/ADR-0091-four-product-platform-roadmap.md`
- `docs/sop/v0.36.5/README.md`
- `docs/next/v0.36.5/`
- `docs/sop/v0.36.4/README.md`
- `docs/next/v0.36.4/`
- `docs/roadmap/ROADMAP.md`
- `docs/governance/BRANCHING.md`

v0.36.4 Status: **IMPLEMENTED.** It closed the Firefox/WebKit cross-browser
proof line, documented remaining browser-specific limitations, added the
cross-browser E2E gate, and bumped all 20 packages to 0.36.4.

v0.36.5 Status: **IMPLEMENTED.** It closed release-truth and AutoFlow drift
without product-code changes or package version bumps.

v0.37.0 Status: **IMPLEMENTED.** It reset the roadmap, SOP, ADR, NextVersion,
status, and website truth around the four-product validation train without
product-code changes.

v0.36.3 Status: **IMPLEMENTED.** It completed SSG file ownership migration so
`@openelement/ssg` owns route scanning, entry generation, generated data
resolution, SSG Vite plugin logic, render, and postprocess code. `adapter-vite`
is now Vite build orchestration glue.

v0.36.2 Status: **IMPLEMENTED.** It moved Vite-free SSG render and HTML
postprocess helpers into `@openelement/ssg`, while keeping adapter-vite as the
Vite shell for the remaining bridge work.

v0.36.1 Status: **IMPLEMENTED.** It closed the v0.36 release truth and AutoFlow
evidence gap with `cell-v0.36.1-001`, non-zero metrics, Windows-safe generated
test paths, and aligned v0.36.0 deferrals.

v0.36.0 Status: **IMPLEMENTED WITH DEFERRED ITEMS.** Delivered signals docs,
deployment docs, version sync, error-boundary retry/degraded fallback coverage,
FileIsrCache, `@openelement/ssg` Phase 1, parallel SSG evidence, and AutoFlow
built-in cell generation.

## Next Targets

| Version | Theme                                              | Status              | Purpose                                                                                                                                     |
| ------- | -------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.31.0 | JSX-first Application API                          | Done                | App authoring API, `/vite` config split, docs/template DX                                                                                   |
| v0.32.0 | App Lifecycle Contract                             | Done                | Route, load, context, layout, error, redirect lifecycle                                                                                     |
| v0.33.0 | AI-Readable API Foundation                         | Done                | Structured page, island, head, route, and render intent APIs                                                                                |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Done                | Workflow state, cells, evidence ledger, allowed-action report                                                                               |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Done                | Harness Gate, Cell Execution, Evolution Loop, and full-auto evidence                                                                        |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Done with deferrals | Rendering/runtime evidence and Phase 1 SSG extraction                                                                                       |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Done                | AutoFlow proof and release truth alignment                                                                                                  |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Done                | Move Vite-free SSG core into `@openelement/ssg` and close ISR/SSR/stream evidence                                                           |
| v0.36.3 | Complete SSG File Ownership Migration              | Done                | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite                                               |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Done                | Resolve Firefox/WebKit E2E timeout and behavior differences                                                                                 |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Done                | Align workflow, release docs, AutoFlow evidence, and website truth                                                                          |
| v0.37.0 | Product Doctrine + Rendering Contract Reset        | Done                | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split                                                   |
| v0.37.1 | DsdElement Shadow + Light Contract                 | Done                | Explicit `DsdElement.renderMode = 'light'` opt-in with SSR/CSR proof                                                                        |
| v0.37.2 | SSR / ISR Server Runtime Contract                  | Done                | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                                                              |
| v0.37.3 | Data / Database Boundary                           | Done                | Data/database adapter contracts and recipes without built-in ORM ownership                                                                  |
| v0.37.4 | Hygiene + Pure CSS UI + Architecture Decoupling    | Recovery            | Code-quality hygiene, daisyUI CSS foundation, ui/router decoupling, dsd-hydration dedup, test supplementation, autoflow:gate                |
| v0.37.5 | Protocol Ports + DaisyUI Coverage Completion       | Planned             | Complete daisyUI interactive component coverage, migrate protocol types into @openelement/protocols, add exportable conformance test suites |
| v0.37.6 | Full-Stack Preset Smoke                            | Planned             | Compose elements, UI, protocol, and framework/create into a real smoke application                                                          |
| v0.38.x | Product Surface Reset and Hardening                | Planned             | Public package/API/product reset based on v0.37.x evidence                                                                                  |
| v0.39.0 | Full-Stack Framework RC                            | Planned             | Final API, docs, starter, deploy, consumer, and publish gates                                                                               |
| v1.0.0  | Stable Four-Product Platform                       | Vision              | API freeze for elements, UI, protocol, and framework with workflow evidence in release gates                                                |

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
| Static zero-JS       | doctrine    | static routes emit no framework JS unless islands, hydration, or client-only are explicit    |
| JSX+Signal           | shipped     | `render(): VNode \| null`, effect() signal tracking                                          |
| Island upgrade       | shipped     | binary SSR/client-only boundary                                                              |
| Hydration strategies | shipped     | `client:load/idle/visible/only`                                                              |
| ISR contract         | shipped     | `IsrCache`, caches, manifest entries, and `@openelement/core/isr-runtime` response flow      |
| API route (Hono)     | shipped     | Hono primary engine, DSD-first response shape                                                |
| AppShell protocol    | shipped     | default, bare, custom, and route-selected shells                                             |
| Application API      | v0.31.0     | `definePage`, `defineIsland`, `/vite` config split                                           |
| App lifecycle        | v0.32.0     | load context, route meta, redirect, not-found, error                                         |
| AI-Readable API      | v0.33.0     | Object-form pages, island config, head trust boundary                                        |
| AutoFlow2            | v0.34-v0.36 | report/check/evolve sidecar with evidence ledger and release truth gates                     |

## Package Version State

All 20 packages are aligned to **v0.37.4** under `@openelement/*`.

Package governance before v0.38:

- do not add a new top-level package without an ADR;
- prefer integration subpaths over package sprawl;
- keep protocol contracts small and runtime-free;
- keep UI independent from framework routing;
- keep database, ORM, auth, backend, and builder choices at adapter or recipe
  boundaries.

## Architecture Positioning

1. **Elements** - `DsdElement`, DSD/shadow defaults, explicit future light DOM
   opt-in, JSX runtime, and render contracts.
2. **UI** - pure CSS-first tokens, themes, and component classes; behavior is
   optional and must not be coupled to the CSS layer.
3. **Protocol** - small ports/adapters contracts for renderer, server, build,
   data, component adapter, cache, and ISR boundaries.
4. **Framework/create** - file routes, Application API, dev server, build
   pipeline, Hono-first API routes, SSG/SSR/ISR, and full-stack starter presets.
5. **SSG engine** - all SSG code (render, postprocess, route scanning, entry
   generation, data resolution) lives in `@openelement/ssg`; adapter-vite
   provides only Vite build orchestration glue.
6. **Registry Hub** - current package and tooling surface; future product reset
   must decide whether it remains public product, becomes internal tooling, is
   deferred, archived, or removed.

## Future Product Direction

- v0.37.x is a Four-Product Validation Train, not one oversized implementation
  epic.
- `DsdElement` is feasible as a Lit-like base-class product surface, but it
  remains DSD/shadow-first until explicit light DOM semantics are tested.
- SSR and ISR are framework core capabilities, not a fifth product.
- A daisyUI-inspired pure CSS layer is feasible after license review, token
  extraction, and Tailwind decoupling.
- A Spring-like protocol layer should grow gradually as ports/adapters, not as
  a broad abstraction rewrite.
- Database work belongs in data/database adapter contracts and recipes. It must
  not become a built-in ORM, auth platform, or migration system.
- A full-stack framework preset should compose the stabilized elements, UI,
  protocol, and framework/create surfaces after v0.37.x evidence exists.
- Governance convergence before v1.0: gate tiers (fast dev gate for PRs,
  full release gate for publishing), AutoFlow feature scope freeze, Hub scope
  deferred to post-v1.0. See `docs/roadmap/ROADMAP.md` v0.38.x for details.

## Key Decisions

- **Application API first.** Users write `definePage()` and `defineIsland()`
  before touching `DsdElement`.
- **Vite config split.** `openElement()` is imported from
  `@openelement/app/vite`.
- **TemplateResult and string render removed.** JSX+Signal is the only component
  model. `render()` returns `VNode | null`.
- **DSD-first architecture.** Declarative Shadow DOM is the primary output, zero
  JS by default.
- **Static default 0JS.** Static routes should emit zero framework JavaScript
  unless islands, hydration, or client-only components are explicit.
- **SSR/ISR in framework core.** SSR and ISR belong to the framework product
  line and are not split into a fifth product.
- **Light DOM is opt-in.** `DsdElement` remains DSD/shadow-first. Light DOM
  support requires explicit API, tests, docs, and ADR coverage.
- **No DOM diff.** Signal writes trigger scoped rerender behavior; complex
  subtrees stay in Islands.
- **Package graph gate.** `graph:check` verifies zero cycles, unified versions,
  and declared imports.
- **SSG ownership.** `@openelement/ssg` owns SSG render, postprocess, route
  scanning, entry generation, generated data resolution, and SSG-specific Vite
  plugin logic.
- **AutoFlow2 boundary.** AutoFlow2 may report state, evidence, blockers, and
  allowed actions. It must not merge, tag, bump, publish, or replace human review
  for ADRs, public API resets, package removal, release tags, or publishing.
- **Protocol first-class.** Core rendering, adapter, island/hydration, signal,
  data, and route-manifest contracts must live in `@openelement/protocols` with
  exportable conformance test suites by v0.38. Current types reside in
  implementation packages; migration is planned for v0.37.5.

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

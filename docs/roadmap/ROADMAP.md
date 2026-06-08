# openElement Roadmap

> Source of truth for forward version planning.\
> Current line: v0.36.2 SSG Bridge Migration + Rendering Evidence Closure.\
> Next line: v0.36.3 Complete SSG File Ownership Migration.\
> Updated: 2026-06-08.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a JSX-first Web Components application framework with
Declarative Shadow DOM as the default server-rendered output. Built on
DSD-first HTML, progressive islands, Hono routes, and a 20-package monorepo
under `@openelement/*`.

v0.33.0 (AI-Readable API Foundation) defined the public application contract
that all subsequent versions build upon. v1.0 remains the stable engine target.

## Version Ladder

| Version | Name                                               | Goal                                                                                                | Status                   |
| ------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------ |
| v0.30.x | Contract cleanup                                   | Architecture and package contract cleanup                                                           | Done                     |
| v0.31.0 | JSX-first Application API                          | App authoring API, `/vite` config split, docs/template DX                                           | Done                     |
| v0.32.0 | App Lifecycle Contract                             | Route, load, context, layout, error, redirect lifecycle                                             | Done                     |
| v0.33.0 | AI-Readable API Foundation                         | Structured page, island, head, route, and render intent APIs                                        | Done                     |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Workflow state, cells, evidence ledger, allowed-action report                                       | Done                     |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Harness Gate, Cell Execution, Evolution Loop, full-auto evidence                                    | Done                     |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Rendering runtime evidence, docs, ISR, SSG Phase 1, parallel SSG, AutoFlow cell base                | Done with deferred items |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Windows-safe AutoFlow tests, real merged cell metrics, release truth alignment                      | Done                     |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Move Vite-free SSG render/postprocess code into `@openelement/ssg`; keep adapter-vite as Vite shell | Done                     |
| v0.36.3 | Complete SSG File Ownership Migration              | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite       | Next                     |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Resolve Firefox/WebKit timeout and behavior differences; establish cross-browser E2E gate           | Planned                  |
| v0.37.0 | Server/Data/UI Product Closure                     | Server, data, UI, starters, Hub disposition, pruning evidence                                       | Planned                  |
| v0.38.0 | Public Surface Reset                               | Final package/product surface reset before the v1 RC                                                | Planned                  |
| v0.39.0 | v1 Release Candidate                               | Final API, docs, starter, deploy, consumer, and publish gates                                       | Planned                  |
| v1.0.0  | Stable Engine + AutoFlow Default                   | API freeze with workflow evidence as part of default gates                                          | Vision                   |

## v0.36.0 - Rendering Runtime, Deployment & Deferred Refactors

Delivered product work under AutoFlow2 governance:

- signals documentation;
- deployment recipes;
- version sync;
- error boundary retry/degraded fallback coverage;
- FileIsrCache;
- `@openelement/ssg` Phase 1 package;
- parallel SSG concurrency-pool behavior and evidence;
- AutoFlow built-in cell generation.

Deferred after v0.36.0:

- complete adapter-vite migration out of adapter-vite;
- expanded Firefox/WebKit execution proof;
- broader server/data/UI/starter/Hub product closure.

## v0.36.1 - AutoFlow Closure & v0.36 Release Truth

Patch release for v0.36 release truth and AutoFlow evidence:

- fixed generated AutoFlow tests on Windows by using path-safe APIs;
- treated `harness:passing` as an intermediate state, not release proof;
- counted only `merged` cells as successful for evolution metrics;
- recorded real v0.36.1 metrics from `cell-v0.36.1-001`;
- aligned `STATUS`, `ROADMAP`, SOP, NextVersion, changelog, release note, and
  package count/version evidence;
- kept v0.37 server/data/UI/starter/Hub product scope deferred.

## v0.36.2 - SSG Bridge Migration + Rendering Evidence Closure

Patch release for bridge migration and rendering evidence:

- move Vite-free `ssgRender()` and SSG render types into `@openelement/ssg`;
- move SSG postprocess helpers for client scripts, CSP, DSD polyfill, View
  Transitions, and Speculation Rules into `@openelement/ssg`;
- keep adapter-vite as the Vite orchestration shell for SSR bundle build,
  virtual entry generation, route scanning, alias/noExternal, generated data
  resolution, and plugin composition;
- keep adapter-vite compatibility re-exports for migrated SSG APIs;
- add direct SSG render/postprocess tests, adapter bridge tests, FileIsrCache
  persistence coverage, ISR manifest cache-key proof, and Streaming DSD
  Response coverage;
- record real v0.36.2 metrics from `cell-v0.36.2-001`: attempted 1, merged 1,
  firstPassRate 1;
- keep complete migration and Server/Data/UI/starter/Hub product scope deferred
  to v0.37.0.

## v0.36.3 - Complete SSG File Ownership Migration

Finish moving the remaining SSG-related files out of `adapter-vite`:

- route scanner and route type generation;
- virtual entry generator for SSG;
- Vite plugin orchestration specific to SSG;
- generated data resolver (blog, nav, search, i18n data bridges);
- remove bridge-only compatibility exports once new import paths are stable;
- ensure `@openelement/ssg` can be consumed without adapter-vite internal types.

## v0.36.4 - Firefox/WebKit Cross-Browser Proof

Resolve cross-browser E2E gaps identified in v0.36.2:

- investigate Firefox search/theme token wait timeout;
- investigate WebKit console error count and stability failures;
- establish `test:e2e:browsers` as a stable release gate;
- document any remaining browser-specific behavior as known limitations.

## v0.37.0 - Server/Data/UI Product Closure

With SSG migration complete in v0.36.3 and browser proof in v0.36.4, v0.37.0
focuses on product-line disposition:

- close server, data, UI, starter, and Hub disposition decisions;
- prune stale evidence and release truth docs after the product closure work;
- prepare for v0.38 public surface reset.

## v0.38.0 - Public Surface Reset

Package/product surface reset with AI-assisted evidence analysis. Human review
remains required for public API resets and package removals.

## v0.39.0 - v1 Release Candidate

Validate final APIs, docs, starters, deploy smoke, publish gates, and consumer
proof before v1.0.

## v1.0.0 - Stable Engine + AutoFlow Default

API freeze. AutoFlow evidence becomes part of default release gates. Requires
multiple autonomous version cycles of evidence, v0.38 reset completion, and
v0.39 RC gates passing.

## Explicit Non-Goals

| Item                              | Decision                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Built-in ORM                      | External recipes only.                                    |
| Generic auth platform             | External integrations only.                               |
| React-like runtime                | openElement outputs Web Components + DSD.                 |
| String renderer                   | JSX/VNode/RenderNode only.                                |
| Silent compatibility shims        | No. 0.x may break.                                        |
| Autonomous architecture decisions | No. ADR, API reset, package removal require human review. |

## Document Cross-Reference

| Document Type | Rhythm          | Location                |
| ------------- | --------------- | ----------------------- |
| SOP           | per version     | `docs/sop/`             |
| ADR           | decision-driven | `docs/adr/`             |
| Changelog     | per release     | `docs/changelog/`       |
| Status        | always current  | `docs/status/STATUS.md` |
| Release Note  | per version     | `docs/release/`         |

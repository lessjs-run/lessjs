# openElement Roadmap

> Source of truth for forward version planning.\
> Current package line: v0.36.4 Firefox/WebKit Cross-Browser Proof.\
> Active patch: v0.36.5 Release Truth and AutoFlow Closure.\
> Updated: 2026-06-09.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a JSX-first Web Components application framework with
Declarative Shadow DOM as the default server-rendered output. Built on
DSD-first HTML, progressive islands, Hono routes, and a 20-package monorepo
under `@openelement/*`.

v0.33.0 defined the AI-readable public application contract. v0.36 moved SSG
ownership into `@openelement/ssg` and proved the current browser surface. v1.0
remains the stable engine target.

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
| v0.36.3 | Complete SSG File Ownership Migration              | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite       | Done                     |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Resolve Firefox/WebKit timeout and behavior differences; establish cross-browser E2E gate           | Done                     |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Align workflow, release docs, AutoFlow evidence, and website truth                                  | Active                   |
| v0.37.0 | Server/Data/UI Product Closure                     | Server, data, UI, starters, Hub disposition, pruning evidence                                       | Planned                  |
| v0.38.0 | Public Surface Reset                               | Final package/product surface reset before the v1 RC                                                | Planned                  |
| v0.39.0 | v1 Release Candidate                               | Final API, docs, starter, deploy, consumer, and publish gates                                       | Planned                  |
| v1.0.0  | Stable Engine + AutoFlow Default                   | API freeze with workflow evidence as part of default gates                                          | Vision                   |

## v0.36.0 - Rendering Runtime, Deployment & Deferred Refactors

Delivered signals documentation, deployment recipes, version sync, error
boundary retry/degraded fallback coverage, FileIsrCache, `@openelement/ssg`
Phase 1 package work, parallel SSG evidence, and AutoFlow built-in cell
generation.

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
  firstPassRate 1.

## v0.36.3 - Complete SSG File Ownership Migration

Completed the SSG ownership migration:

- moved route scanner and route type generation into `@openelement/ssg`;
- moved virtual entry generator, SSG-specific Vite plugins, generated data
  resolver, and package resolver into `@openelement/ssg`;
- removed bridge-only adapter-vite exports once the new import paths were stable;
- kept adapter-vite as Vite build orchestration glue;
- bumped all 20 packages to 0.36.3.

## v0.36.4 - Firefox/WebKit Cross-Browser Proof

Closed cross-browser E2E proof:

- investigated Firefox search/theme token wait behavior;
- investigated WebKit console and stability failures;
- documented browser-specific limitations in the v0.36.4 NextVersion package;
- added cross-browser E2E proof to the release gate shape;
- bumped all 20 packages to 0.36.4.

## v0.36.5 - Release Truth and AutoFlow Closure

Active patch. It fixes repository evidence, not product code:

- point `workflow:check` at the active v0.36.5 execution package;
- complete missing v0.36.4 NextVersion files;
- align STATUS, ROADMAP, SOP index, changelog, release notes, and website copy;
- record v0.36.3/v0.36.4 AutoFlow evidence where repository proof exists;
- update stale v0.21.x SOP Gate workflow wording.

## v0.37.0 - Server/Data/UI Product Closure

With SSG migration complete and browser proof recorded, v0.37.0 focuses on
product-line disposition:

- close server, data, UI, starter, and Hub disposition decisions;
- validate a pure CSS UI export shape without mixing it with DsdElement behavior;
- define server/data helper boundaries without locking the framework to one
  backend stack;
- prepare for v0.38 public surface reset.

## v0.38.0 - Public Surface Reset

Package/product surface reset with AI-assisted evidence analysis. Human review
remains required for public API resets and package removals.

Candidate product split to evaluate:

- `@openelement/elements` or a core subpath for a Lit-like `DsdElement` base
  class product surface;
- `@openelement/ui` with a pure CSS layer inspired by daisyUI only after license,
  token, and Tailwind dependency review;
- `@openelement/protocol` or `@openelement/protocols` as a small ports/adapters
  layer, starting with renderer, server, build, data, and component-adapter
  contracts;
- `@openelement/framework` or starter presets that compose the stabilized
  surfaces.

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

# openElement Roadmap

> Source of truth for forward version planning.\
> Current package line: v0.37.2 SSR / ISR Server Runtime Contract.\
> Active execution package: v0.37.3 Data / Database Boundary.\
> Updated: 2026-06-10.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a JSX-first Web Components application framework with
Declarative Shadow DOM as the default server-rendered output. Built on
DSD-first HTML, progressive islands, Hono routes, and a 20-package monorepo
under `@openelement/*`.

v0.33.0 defined the AI-readable public application contract. v0.36 moved SSG
ownership into `@openelement/ssg` and proved the current browser surface.
v0.37.x validates the four-product platform in bounded steps. v1.0 remains the
Stable Four-Product Platform target.

## Version Ladder

| Version | Name                                               | Goal                                                                                                  | Status                   |
| ------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------ |
| v0.30.x | Contract cleanup                                   | Architecture and package contract cleanup                                                             | Done                     |
| v0.31.0 | JSX-first Application API                          | App authoring API, `/vite` config split, docs/template DX                                             | Done                     |
| v0.32.0 | App Lifecycle Contract                             | Route, load, context, layout, error, redirect lifecycle                                               | Done                     |
| v0.33.0 | AI-Readable API Foundation                         | Structured page, island, head, route, and render intent APIs                                          | Done                     |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Workflow state, cells, evidence ledger, allowed-action report                                         | Done                     |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Harness Gate, Cell Execution, Evolution Loop, full-auto evidence                                      | Done                     |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Rendering runtime evidence, docs, ISR, SSG Phase 1, parallel SSG, AutoFlow cell base                  | Done with deferred items |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Windows-safe AutoFlow tests, real merged cell metrics, release truth alignment                        | Done                     |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Move Vite-free SSG render/postprocess code into `@openelement/ssg`; keep adapter-vite as Vite shell   | Done                     |
| v0.36.3 | Complete SSG File Ownership Migration              | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite         | Done                     |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Resolve Firefox/WebKit timeout and behavior differences; establish cross-browser E2E gate             | Done                     |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Align workflow, release docs, AutoFlow evidence, and website truth                                    | Done                     |
| v0.37.0 | Product Doctrine + Rendering Contract Reset        | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split             | Done                     |
| v0.37.1 | DsdElement Shadow + Light Contract                 | Explicit DsdElement light DOM opt-in with SSR/CSR proof                                               | Done                     |
| v0.37.2 | SSR / ISR Server Runtime Contract                  | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                        | Done                     |
| v0.37.3 | Data / Database Boundary                           | Data/database adapter contracts and recipes without built-in ORM ownership                            | Active                   |
| v0.37.4 | Hygiene + Pure CSS UI + Architecture Decoupling    | Close code-quality debt, pure CSS UI, ui/router decoupling, dsd-hydration dedup, test supplementation | Active                   |
| v0.37.5 | Protocol Ports + Adapter Map                       | Small ports for renderer, server, build, data, component adapter, and cache/ISR boundaries            | Planned                  |
| v0.37.6 | Full-Stack Preset Smoke                            | Compose elements, UI, protocol, and framework/create into a real smoke application                    | Planned                  |
| v0.38.x | Product Surface Reset and Hardening                | Public package/API/product surface reset based on v0.37.x evidence                                    | Planned                  |
| v0.39.0 | Full-Stack Framework RC                            | Final API, docs, starter, deploy, consumer, and publish gates                                         | Planned                  |
| v1.0.0  | Stable Four-Product Platform                       | API freeze for elements, UI, protocol, and framework with workflow evidence in release gates          | Vision                   |

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

Implemented patch. It fixes repository evidence, not product code:

- point `workflow:check` at the active v0.36.5 execution package;
- complete missing v0.36.4 NextVersion files;
- align STATUS, ROADMAP, SOP index, changelog, release notes, and website copy;
- record v0.36.3/v0.36.4 AutoFlow evidence where repository proof exists;
- update stale v0.21.x SOP Gate workflow wording.

## v0.37.0 - Product Doctrine + Rendering Contract Reset

v0.37.0 is a docs, ADR, SOP, and contract-audit version. It replaces the old
single-version Server/Data/UI closure epic with a v0.37.x validation train.

The reset establishes:

- static routes emit zero framework JavaScript unless islands, hydration, or
  client-only components are explicit;
- SSR and ISR are framework core capabilities, not a fifth product;
- DSD/shadow DOM remains the default rendering mode;
- light DOM is an explicit opt-in contract, not an accidental side effect of
  `dsd: false`, `hydrate: "only"`, or pure-island behavior;
- database work enters through data/database boundaries and recipes, not a
  built-in ORM;
- AutoFlow remains execution and evidence tooling, not a decision-maker for
  APIs, packages, licenses, database defaults, security defaults, merges, tags,
  or releases.

## v0.37.1 - DsdElement Shadow + Light Contract

Define `DsdElement` as the elements product surface without prematurely
claiming all current behavior as light DOM support.

v0.37.1 accepts ADR-0092 and adds `static renderMode = 'light'` as the explicit
light DOM opt-in. The default remains shadow/DSD.

- audit lifecycle, property reflection, events, DSD output, hydration, and SSR
  assumptions;
- define shadow/DSD default behavior;
- design explicit light DOM opt-in semantics and migration notes;
- add contract tests before documenting light DOM as supported.

## v0.37.2 - SSR / ISR Server Runtime Contract

Treat SSR and ISR as framework core capability.

- define request-time SSR handler boundaries;
- validate ISR cache and manifest behavior in server contexts;
- map Hono-first behavior while leaving room for future server adapters;
- record zero-JS defaults for static routes and explicit client JS triggers.

v0.37.2 accepts ADR-0093 and adds a small `@openelement/core/isr-runtime`
contract for request-time ISR response flow. It does not choose a hosting
provider, cache backend, database, auth system, or server framework default.

## v0.37.3 - Data / Database Boundary

Define data/database integration without becoming an ORM or auth platform.

- specify data adapter and recipe boundaries;
- keep concrete database choices external, adapter-based, or recipe-based;
- add minimal test fixtures for memory/file and candidate platform recipes;
- require ADR review before any default database or migration story.
- close the 2026-06-10 `main` Publish to JSR hotfix so release-gate evidence
  can recover from partially published immutable JSR versions and reach
  consumer-smoke proof after code validation is green.

## v0.37.4 - Hygiene + Pure CSS UI + Architectu<!-- re Decoupling + Test Supplementation

Close code-quality debt from the 2026-06-10 comprehensive audit while building
the CSS-first UI product surface and supplementing test coverage.

### Code-Quality Hygiene

- fix `authoring.ts` `${ERROR_PREFIX}` interpolation bug;
- unify core `console.*` calls to use `core/logger.ts` scoped logger;
- delete all 11 `@deprecated` re-export shells from `packages/adapter-vite/src/`
  and migrate remaining original implementations to `@openelement/ssg`;
- extract shared `_hydrateEvents()` + `createRenderRoot()` from adapter
  dsd-hydration files into `core/src/dsd-hydration.ts`.

### Architecture Decoupling

- remove `@openelement/ui`'s dependency on `@openelement/router` by inlining
  locale/path utilities and SPA navigation in `open-layout.tsx`.

### Pure CSS UI Foundation

- audit daisyUI license (MIT) and document;
- define CSS custom property tokens (~20) in `open-props-tokens.ts`;
- whitelist daisyUI utility class subset as pure CSS (no Tailwind runtime);
- add CSS smoke for plain HTML, DsdElement light DOM, and shadow DOM guidance;
- keep existing `open-*` DSD components unchanged.

### Test Supplementation

- ssg: from 16.5% → ≥40% (EntryDescriptor, EntryRenderer, SSG error paths);
- router: from 4.3% → ≥60% (error routes, edge cases, client-router lifecycle);
- protocols: from 6.4% → ≥60% (validator boundary conditions, type-level
  conformance).

## v0.37.5 - Protocol Ports + Adapter Map

Turn protocol work into small ports/adapters contracts, not a broad abstraction
rewrite.

- define renderer, server, build, data, component-adapter, and cache/ISR ports;
- migrate protocol types from implementation packages into
  `@openelement/protocols`:
  - `RendererProtocol` (from `core/src/render-schemas.ts`);
  - `IslandConfig` / `HydrationStrategy` (from `app/src/authoring.ts`,
    `core/src/schemas.ts`);
  - `SignalEngine` / `SignalLike` (from `signals/src/types.ts`,
    `core/src/signal-like.ts`);
  - `DataAdapter` (from `core/src/data.ts`);
  - `EntryDescriptor` (from `ssg/src/entry-descriptor.ts`);
- write ADR-00XX for `EntryDescriptor` route manifest contract before type
  migration;
- add exportable conformance test suites for each port (parameterized runner
  pattern: `runRendererConformance(impl)`);
- map existing Deno, Hono, Vite, DsdElement, and SSG assumptions;
- keep port contracts thin and frozen — heavy documentation and tests, not heavy
  interfaces;
- require ADR approval before package splits or replacement guarantees.

## v0.37.6 - Full-Stack Preset Smoke

Prove the first composed framework path after the preceding contracts exist.

- create or update a preset smoke app using the stabilized surfaces;
- verify static zero-JS output, explicit islands, SSR/ISR evidence, data recipe
  boundaries, and CSS UI integration;
- verify adapter-lit passes protocol conformance suites using only
  `@openelement/protocols` imports (protocol layer proof);
- keep the smoke narrow enough to be repeatable in local and CI gates.

## v0.38.x - Product Surface Reset and Hardening

Package/product surface reset with evidence from the v0.37.x validation train.
Human review remains required for public API resets and package removals.

Governance convergence before v0.38 exit:

- gate tiers: fast dev gate (fmt, lint, typecheck, test) for PRs; full release
  gate (all 16 checks + E2E) for publishing;
- AutoFlow feature scope freeze: report/check/health only — no new evolve,
  generate, or autonomous capabilities;
- Hub scope deferral to post-v1.0; Hub remains internal tooling through v0.38.

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

## v0.39.0 - Full-Stack Framework RC

Validate final APIs, docs, starters, deploy smoke, publish gates, and consumer
proof before v1.0.

## v1.0.0 - Stable Four-Product Platform

API freeze for the stable elements, UI, protocol, and framework surfaces.
AutoFlow evidence becomes part of default release gates, but ADR and human
review continue to govern public API, package, license, security, database, tag,
release, and publish decisions.

## Explicit Non-Goals

| Item                              | Decision                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Built-in ORM                      | External adapters and recipes only.                       |
| Generic auth platform             | External integrations only.                               |
| React-like runtime                | openElement outputs Web Components + DSD.                 |
| String renderer                   | JSX/VNode/RenderNode only.                                |
| Silent compatibility shims        | No. 0.x may break.                                        |
| Autonomous architecture decisions | No. ADR, API reset, package removal require human review. |
| Protocol abstraction framework    | No. Thin frozen contracts with conformance tests.         |

## Document Cross-Reference

| Document Type | Rhythm          | Location                |
| ------------- | --------------- | ----------------------- |
| SOP           | per version     | `docs/sop/`             |
| ADR           | decision-driven | `docs/adr/`             |
| Changelog     | per release     | `docs/changelog/`       |
| Status        | always current  | `docs/status/STATUS.md` |
| Release Note  | per version     | `docs/release/`         |

# openElement Roadmap

> Source of truth for forward version planning.\
> Current package line: v0.39.0 Framework RC + Four-Product Matrix Reset.\
> Active version plan: docs/current/VERSION_PLAN.md.\
> Updated: 2026-06-13.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a four-product Web Components platform:

```text
openElement = Elements + UI + Framework + Protocols
```

Elements is the native Web Components authoring surface. Its public surface is
`@openelement/elements` and `OpenElement`, competing with Lit and FAST while
keeping shadow/DSD as the default render mode and explicit light DOM opt-in.
UI is the first-party `open-*` component library built on the Elements model.
Framework is the application layer powered by Vite + Nitro. Protocols is the
runtime-free replacement boundary for renderers, routes, islands, adapters,
runtime, cache, data, and signals.

Historical positioning note: earlier ADRs used the phrase DSD-first to protect
shadow/DSD output as the default. ADR-0096 refines that into Web Components
application framework identity, with shadow/DSD as the default render mode and
light DOM as first-class opt-in.

Vite + Nitro remain default Framework engines, not first-class products.
`@openelement/runtime`, `@openelement/core`, adapter packages, and advanced
feature packages support the four products without replacing them.

## Version Ladder

| Version | Name                                               | Goal                                                                                                                 | Status                   |
| ------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| v0.30.x | Contract cleanup                                   | Architecture and package contract cleanup                                                                            | Done                     |
| v0.31.0 | JSX-first Application API                          | App authoring API, `/vite` config split, docs/template DX                                                            | Done                     |
| v0.32.0 | App Lifecycle Contract                             | Route, load, context, layout, error, redirect lifecycle                                                              | Done                     |
| v0.33.0 | AI-Readable API Foundation                         | Structured page, island, head, route, and render intent APIs                                                         | Done                     |
| v0.34.0 | AutoFlow2 Sidecar Kernel                           | Workflow state, cells, evidence ledger, allowed-action report                                                        | Done                     |
| v0.35.x | AutoFlow2 Mechanical Autonomy                      | Harness Gate, Cell Execution, Evolution Loop, full-auto evidence                                                     | Done                     |
| v0.36.0 | Rendering Runtime, Deployment & Deferred Refactors | Rendering runtime evidence, docs, ISR, SSG Phase 1, parallel SSG, AutoFlow cell base                                 | Done with deferred items |
| v0.36.1 | AutoFlow Closure & v0.36 Release Truth             | Windows-safe AutoFlow tests, real merged cell metrics, release truth alignment                                       | Done                     |
| v0.36.2 | SSG Bridge Migration + Rendering Evidence Closure  | Move Vite-free SSG render/postprocess code into `@openelement/ssg`; keep adapter-vite as Vite shell                  | Done                     |
| v0.36.3 | Complete SSG File Ownership Migration              | Move route scanner, entry generator, Vite plugin, generated data resolver out of adapter-vite                        | Done                     |
| v0.36.4 | Firefox/WebKit Cross-Browser Proof                 | Resolve Firefox/WebKit timeout and behavior differences; establish cross-browser E2E gate                            | Done                     |
| v0.36.5 | Release Truth and AutoFlow Closure                 | Align workflow, release docs, AutoFlow evidence, and website truth                                                   | Done                     |
| v0.37.0 | Product Doctrine + Rendering Contract Reset        | ADR-0091, default 0JS doctrine, DSD/shadow default, light opt-in terms, v0.37.x SOP split                            | Done                     |
| v0.37.1 | DsdElement Shadow + Light Contract                 | Explicit DsdElement light DOM opt-in with SSR/CSR proof                                                              | Done                     |
| v0.37.2 | SSR / ISR Server Runtime Contract                  | Request-time SSR/ISR runtime boundary, cache contract, server adapter evidence                                       | Done                     |
| v0.37.3 | Data / Database Boundary                           | Data/database adapter contracts and recipes without built-in ORM ownership                                           | Done                     |
| v0.37.4 | Hygiene + Pure CSS UI + Architecture Decoupling    | Close code-quality debt, pure CSS UI, ui/router decoupling, dsd-hydration dedup, test supplementation, autoflow:gate | Done / JSR caveat        |
| v0.37.5 | Protocol-First Runtime Architecture                | Make @openelement/protocols the replacement boundary and define Vite + Nitro as the default base engine              | Done                     |
| v0.37.6 | Vite + Nitro Runtime Proof                         | Prove openElement routes, rendering, islands, assets, SSR/ISR intent, and deployment output through Nitro            | Done                     |
| v0.38.0 | Product Surface Reset and Hardening                | Public package/API/product surface reset based on protocol and Nitro runtime evidence                                | Done                     |
| v0.39.0 | Framework RC + Four-Product Matrix Reset           | ADR-0099, public docs integrity, Elements direction, starter/deploy/consumer gates, Preact island handoff            | Active                   |
| v0.40.0 | Elements + Preact + Repository Slimming            | Productize `OpenElement`, prove Preact islands, and slim root/docs/Hub/package/gate shape for the v1 path            | Planned                  |
| v0.41.0 | v1.0 Freeze Candidate                              | Freeze public APIs, complete protocol conformance, harden UI scope, migration docs, and release gates                | Planned                  |
| v1.0.0  | Stable Four-Product Platform                       | API freeze for elements, UI, protocol, and framework with workflow evidence in release gates                         | Vision                   |

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

## v0.37.4 - Hygiene + Pure CSS UI + Architecture Decoupling

Implemented as a bounded hygiene and foundation release:

- fix 2026-06-10 audit code-quality issues, including authoring error
  interpolation and scoped logger usage;
- remove deprecated adapter-vite SSG shell exports after moving ownership into
  `@openelement/ssg`;
- deduplicate shared dsd-hydration helpers across adapters;
- decouple `@openelement/ui` from `@openelement/router`;
- validate a CSS-first UI product surface independent from element behavior;
- extract daisyUI-inspired class sets as DSD-compatible pure CSS with Open Props
  tokens and no Tailwind runtime;
- prove the signal -> host attribute -> `:host([attr])` interactive thin-shell
  pattern with `open-dropdown`, `open-modal`, and `open-tabs`;
- supplement tests across ssg, router, and protocols.

Release-truth note: v0.37.4 implementation, tag, and GitHub release exist.
ADR-0097-era policy treated live JSR visibility as an external distribution
concern rather than a version-exit gate. JSR state still had to be recorded
honestly; release notes could not claim JSR availability unless direct resolver
checks proved it.

Distribution note: failed 2026-06-11 recovery attempts proved a 5-minute
package timeout and then a 20-minute package timeout are both too short for
JSR's then-current publish behavior. Publishing continued through local or CI
attempts under ADR-0097-era caveats, while roadmap execution continued after
local gates, AutoFlow evidence, and non-JSR CI were correct.

## v0.37.5 - Protocol-First Runtime Architecture

Make `@openelement/protocols` the real replacement boundary and accept
ADR-0096: Protocol-First Vite + Nitro Runtime Architecture. ADR-0098 defines
the EntryDescriptor route manifest contract required before Nitro can consume
route semantics without importing SSG implementation modules.

v0.37.5 repositions openElement as a Web Components application framework
powered by Vite + Nitro. Vite may be the deep default build/module graph engine,
and Nitro may be the deep default production runtime/deployment engine, but the
protocol layer stays frontend-framework-agnostic and runtime-agnostic.

Core work:

- move or re-export runtime-free renderer, component adapter, route manifest,
  island, signal, data, runtime adapter, cache, and storage contracts into
  `@openelement/protocols`;
- add conformance test entry points such as `runRendererConformance(impl)`;
- write the EntryDescriptor / route manifest ADR before route protocol
  migration;
- document the openElement universal request handler shape required by Nitro;
- preserve daisyUI interactive/form component coverage as a later UI product
  slice after the runtime pivot.

### Superseded v0.37.5 Backlog Trace

Complete daisyUI interactive component coverage and migrate protocol types.

### daisyUI Interactive Completion (12 components)

- collapse (accordion): DsdElement thin shell, signal `#open` index, `:host([data-open])` CSS
- drawer: DsdElement thin shell, signal `#open`, slide-from-left with backdrop
- carousel: DsdElement thin shell, signal `#index`, snap-scroll + prev/next buttons
- swap: DsdElement thin shell, signal `#active`, two-face toggle with rotation
- toast: DsdElement thin shell, signal `#toasts[]`, position-fixed stack with auto-dismiss
- navbar: DsdElement thin shell, responsive collapse menu
- footer: pure CSS component (no interaction, just layout)
- indicator: pure CSS component (badge positioning on avatars/icons)
- skeleton: already in v0.37.4 daisy-classes.css — no additional work
- loading: already in v0.37.4 daisy-classes.css — no additional work
- chat bubble: pure CSS component
- toggle (theme switch wrapper): DsdElement thin shell

### Form Enhancement Components (4 components)

- checkbox: DsdElement thin shell, signal `#checked`, custom ::before/::after
- radio: DsdElement thin shell, signal `#checked`, radio group via slot
- range: DsdElement thin shell, signal `#value`, custom track/fill via CSS
- file-input: DsdElement thin shell, signal `#file`, drag-and-drop zone

### Protocol Type Migration

- migrate `RendererProtocol` (from core/src/render-schemas.ts)
- migrate `IslandConfig` / `HydrationStrategy` (from app/src/authoring.ts, core/src/schemas.ts)
- migrate `SignalEngine` / `SignalLike` (from signals/src/types.ts, core/src/signal-like.ts)
- migrate `DataAdapter` (from core/src/data.ts)
- write ADR for `EntryDescriptor` route manifest contract
- add exportable conformance test suites: `runRendererConformance(impl)`

## v0.37.6 - Vite + Nitro Runtime Proof

Prove the new default engine with a narrow real application. v0.37.6 is
released at tag `v0.37.6` and GitHub release
`https://github.com/open-element/openelement/releases/tag/v0.37.6`. Local,
`dev`, and `main` non-JSR gates passed; JSR publish ran under the ADR-0097-era
distribution policy.

- generate an openElement universal request handler and mount it in Nitro;
- prove Node output and Cloudflare Workers output;
- verify openElement file routes, `load()`, layouts, error/redirect/not-found,
  API routes, static assets, island chunks, and explicit client JS triggers;
- map ISR/cache intent to Nitro cache or route-rule primitives without replacing
  openElement semantics;
- verify static zero-JS output remains true for routes without explicit islands;
- keep Hono as a viable request/API route implementation detail where useful;
- record evidence before v0.38 package/product reset.

### Superseded v0.37.6 Backlog Trace

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
- AutoFlow feature scope freeze: report/check/health only - no new evolve,
  generate, or autonomous capabilities;
- Hub scope deferral to post-v1.0; Hub remains internal tooling through v0.38.
- JSR release instability mitigation: keep direct registry visibility checks,
  ADR-0097-era publish attempts, release-note caveats, and fallback
  publishing/distribution options in the release design.

ADR-0099 supersedes the v0.38 candidate package-name deferral for future work.
It approves the four-product matrix and the future `@openelement/elements`
product name, while leaving package implementation for v0.39 follow-up tasks.

## v0.39.0 - Framework RC + Four-Product Matrix Reset

Validate the release-candidate framework surface on top of the v0.38 product
map while resetting the public product matrix before v1.0 API freeze work
begins.

The line proves that a generated openElement app can use the documented
first-run surface end to end: app authoring, pages, layouts, islands, API
routes, static/SSR/ISR intent, Vite + Nitro build/runtime output, docs, deploy
guidance, consumer smoke, and release gates. It also records ADR-0099,
establishes Elements as the Lit/FAST-facing product direction, excludes Web
Awesome from the current target, and hands heavy-framework island planning to a
Preact-first v0.40 proof. The earlier Vue adapter plan is superseded for the
pre-1.0 path; Vue, React, Svelte, and other heavy island adapters stay frozen
unless a later ADR reopens them.

## v0.40.0 - Elements + Preact + Repository Slimming

Productize the four-product matrix while keeping scope narrow enough for a
credible v1.0 path.

ADR-0101 also makes v0.40 the product-line reset. The previous v0.39
architecture state is frozen on `arch/v0.39-line`; `dev` continues as the
focused product-line branch. Active planning moves from separate SOP and
NextVersion dossiers to `docs/current/VERSION_PLAN.md`.

v0.40.0 has two equal exit requirements:

- the product surface becomes real and narrow;
- the repository shape stops contradicting that product story.

The product-surface jobs are:

- create the real Elements product surface around `@openelement/elements` and
  `OpenElement`, with migration notes instead of a long-term public
  `DsdElement` alias;
- add Preact as the only heavy-framework island priority, reflecting the
  Fresh/Deno lineage without making Preact the identity of openElement;
- evaluate `@preact/signals-core` as a `SignalEngine` implementation candidate
  behind `@openelement/signals` and `@openelement/protocols/signals`
  conformance, not as an immediate default-engine swap.

The Repository Slimming jobs are:

- move or archive root one-off proof fixtures such as `fixtures/nitro-proof`
  so historical v0.37.6 evidence no longer looks like an active product root;
- physically freeze Hub by resolving `hub-index`, `hub-ci.yml`, and
  `packages/hub` active-product status;
- shrink active docs to current truth, ADR, release evidence, and archive, with
  `docs/current/VERSION_PLAN.md` as the only active v0.40 execution plan;
- classify all 21 workspace packages as product-facing, foundation,
  adapter/interop, or archive/merge candidates before any v1 freeze;
- reduce hook and CI orchestration to AutoFlow3 entry points while keeping JSR
  publish and post-publish smoke as release evidence.

Initial implementation has re-homed the Nitro proof fixture under
`packages/adapter-vite/__fixtures__/nitro-proof/`, manual-scoped the archived
Hub submission workflow, and added `docs/current/PACKAGE_SURFACE.md` plus
`deno task package-surface:check` for the package classification. ADR-0102
also adds `@openelement/elements` as the first-class Elements package.

The v0.40 non-goals are explicit: Hub remains frozen, Vue/React/Svelte island
expansion stays out of scope, Web Awesome remains out of the current UI
strategy, and no Preact runtime may leak into `@openelement/core` or Elements
as a required public dependency. Physical package deletion, package merges,
new packages, default runtime changes, and default signal-engine changes still
require ADR-backed human approval.

## v0.41.0 - v1.0 Freeze Candidate

Turn the v0.40 productized surface into a release candidate for v1.0. The line
must complete protocol conformance coverage, freeze the supported UI component
scope, verify Preact island behavior through consumer smoke, decide whether
the Preact signal engine candidate becomes default or remains optional, and
finish migration docs for Elements, Framework, UI, and Protocols.

## v1.0.0 - Stable Four-Product Platform

API freeze for the stable Elements, UI, Framework, and Protocols surfaces.
AutoFlow evidence becomes part of default release gates, but ADR and human
review continue to govern public API, package, license, security, database, tag,
release, and publish decisions.

## Explicit Non-Goals

| Item                              | Decision                                                  |
| --------------------------------- | --------------------------------------------------------- |
| Built-in ORM                      | External adapters and recipes only.                       |
| Generic auth platform             | External integrations only.                               |
| React-like default runtime        | Web Components remain the default; adapters may exist.    |
| String renderer                   | JSX/VNode/RenderNode only.                                |
| Silent compatibility shims        | No. 0.x may break.                                        |
| Autonomous architecture decisions | No. ADR, API reset, package removal require human review. |
| Abstract protocol theater         | No. Protocols require baseline implementations and tests. |

## Document Cross-Reference

| Document Type    | Rhythm          | Location                       |
| ---------------- | --------------- | ------------------------------ |
| Current plan     | active version  | `docs/current/VERSION_PLAN.md` |
| ADR              | decision-driven | `docs/adr/`                    |
| Changelog        | per release     | `docs/changelog/`              |
| Status           | always current  | `docs/status/STATUS.md`        |
| Release evidence | per version     | `docs/release/`                |
| Historical plans | archived        | `docs/sop/`, `docs/next/`      |

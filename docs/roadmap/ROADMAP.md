# openElement Roadmap

> Source of truth for forward version planning.\
> Current line: v0.32.0 App Lifecycle Contract.\
> Next line: v0.33.0 AI-Readable API Foundation.\
> Updated: 2026-06-06.

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Product Position

openElement is a JSX-first Web Components application framework with
Declarative Shadow DOM as the default server-rendered output.

The project should compete on a narrower but cleaner axis than full-stack React
frameworks: Web Platform output, DSD-first HTML, progressive islands, and a small
runtime contract. It should not hide that it is not yet a complete full-stack
platform.

## Framework References

The roadmap follows the broad shape used by mainstream frameworks:

- Next.js separates App Router pages, layouts, route handlers, and revalidation:
  <https://nextjs.org/docs/app>
- SvelteKit separates page/server loading and endpoint handling:
  <https://svelte.dev/docs/kit/load>
- Astro centers static/server rendering and islands:
  <https://docs.astro.build/en/guides/on-demand-rendering/>
- Nuxt separates pages, server routes, data fetching, and app config:
  <https://nuxt.com/docs/getting-started/routing>

The openElement difference is the output model: Web Components plus Declarative
Shadow DOM, not a framework-owned component runtime.

## Product Surface Direction

The current v0.32 release line still publishes 19 packages. That graph is
technically healthy, but it is not the intended v1.0 public product surface.

ADR-0083 defers the physical package reset. ADR-0086 keeps ADR-0083's smaller v1
surface target, but changes the sequencing from ADR-0084: v0.33-v0.35 now build
AI-readable APIs, AutoFlow2's sidecar kernel, and the harness gate before
rendering/server/data/UI expansion resumes.

The v0.38 review target is:

| Surface                  | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `@openelement/protocol`  | Small Web Standards-shaped contracts for interop         |
| `@openelement/elements`  | DSD-first Custom Element authoring surface               |
| `@openelement/ui`        | DSD-first UI component library                           |
| `@openelement/framework` | Application framework for routes, rendering, server data |
| `@openelement/create`    | Project scaffolding                                      |

Integrations should default to subpaths such as
`@openelement/framework/vite`, `@openelement/framework/router`, and
`@openelement/elements/compat/lit` unless an ADR proves that a top-level package
is necessary.

## Current Public Contract

| Layer                 | Current contract                                                    |
| --------------------- | ------------------------------------------------------------------- |
| Application authoring | `definePage`, `defineIsland`, `defineElement`, `defineLayout`       |
| Build configuration   | `openElement()` from `@openelement/app/vite`                        |
| Renderer              | JSX -> VNode -> RenderNode -> DSD HTML or DOM                       |
| Metadata              | structured `openElement` declarations and `definePage()` descriptor |
| Runtime primitive     | `DsdElement` remains public but is not the default tutorial API     |
| Trust boundary        | `trustedHtml` is caller-trusted HTML, not a sanitizer               |

## Version Ladder

| Version | Name                             | Goal                                                                  | Status  |
| ------- | -------------------------------- | --------------------------------------------------------------------- | ------- |
| v0.30.x | Contract cleanup                 | One renderer model, one metadata boundary, openElement rename         | Done    |
| v0.31.0 | JSX-first Application API        | Make page/island authoring the default DX                             | Done    |
| v0.32.0 | App Lifecycle Contract           | Define page, route, layout, load, error, redirect, and context flow   | Current |
| v0.33.0 | AI-Readable API Foundation       | Make app/page/island/build intent explicit and machine-readable       | Next    |
| v0.34.0 | AutoFlow2 Sidecar Kernel         | Add workflow state, cells, evidence ledger, and allowed-action report | Planned |
| v0.35.0 | AutoFlow2 Harness Gate           | Turn low-noise AutoFlow checks into CI blockers                       | Planned |
| v0.36.0 | Rendering Runtime and Deployment | Resume SSR, ISR, streaming, cache, and deploy work under evidence     | Planned |
| v0.37.0 | Server/Data/UI Product Closure   | Complete server, data, UI, starter, Hub, and pruning decisions        | Planned |
| v0.38.0 | Public Surface Reset             | Package/product surface reset before the v1 release candidate         | Planned |
| v0.39.0 | v1 Release Candidate             | Validate final APIs, docs, starters, deploy smoke, and publish gates  | Planned |
| v1.0.0  | Stable Engine + AutoFlow Default | Freeze stable APIs and make workflow evidence part of default gates   | Vision  |

## v0.31.0 - JSX-first Application API

Goal: change the default mental model from "extend `DsdElement`" to "write JSX
pages and islands".

Deliverables:

- `@openelement/app` exports application authoring helpers.
- `@openelement/app/vite` exports the Vite build facade.
- `definePage()` supports function and object forms.
- `definePage({ load })` feeds SSR and SSG route rendering.
- `defineIsland()` gives islands a concise app-level entry.
- create template and docs teach Application API first.

SOP: `docs/sop/v0.31.0/`

## v0.32.0 - App Lifecycle Contract

Goal: define the stable page, layout, island, route, `load()`, context, error,
not-found, and redirect lifecycle.

Scope:

- route descriptor and metadata audit;
- lifecycle order for match, params, context, load, render, layout, error, and
  redirect;
- structured route render intent without runtime/deploy semantics;
- page function and object form alignment;
- lifecycle fixtures and docs.

SOP: `docs/sop/v0.32.0/`

## v0.33.0 - AI-Readable API Foundation

Goal: make the app/page/island/build API explicit, typed, and declarative enough
for humans, AI assistants, and future AutoFlow2 checks to read without guessing.

Scope:

- make object-form `definePage({ ... })` the default docs and template path;
- add structured page fields for `head`, `route`, and `renderIntent`;
- add a named island metadata helper such as `defineIslandMetadata()` or
  `defineIslandConfig()`;
- keep old `export const openElement = ...` island metadata compatible;
- add `ssr?: boolean` to app-level island options;
- add explicitly named trusted/raw head APIs such as `trustedHeadHtml` or
  `dangerouslyHeadFragments`;
- prove old and new intent forms normalize into the same descriptor path.

SOP: `docs/sop/v0.33.0/`\
NextVersion: `docs/next/v0.33.0/`

## v0.34.0 - AutoFlow2 Sidecar Kernel

Goal: introduce an internal advisory workflow kernel that reads repository
state and emits a machine-readable report without editing code or controlling
releases.

Scope:

- introduce `tools/autoflow` or `packages/autoflow`;
- read `PROJECT_WORKFLOW`, `STATUS`, `ROADMAP`, SOPs, `docs/next`, ADRs,
  package graph, workflow files, and gate results where available;
- emit JSON and a human summary with `version`, `workflowState`, `cells`,
  `evidence`, `blockers`, and `allowedActions`;
- add fixture states for released, active, planned, drifted, and invalid
  workflow states;
- keep the sidecar advisory in v0.34; no CI blocking except ordinary tests.

SOP: `docs/sop/v0.34.0/`

## v0.35.0 - AutoFlow2 Harness Gate

Goal: turn a narrow set of hard, low-noise AutoFlow2 contradictions into local
and CI blockers.

Scope:

- add `deno task autoflow:check`;
- fail active version mismatch, missing active NextVersion package, SOP claim
  without evidence, invalid release state, package/doc/version drift, public
  API/template mismatch, and illegal workflow transitions;
- add state-machine path tests for legal and illegal transitions;
- add property/model-based checks for allowed actions versus repository state;
- add AutoFlow status to PR evidence and CI;
- keep subjective product judgment outside the hard gate.

SOP: `docs/sop/v0.35.0/`

## v0.36.0 - Rendering Runtime and Deployment

Goal: turn the v0.32 lifecycle and v0.33 AI-readable render intent into
deployable rendering behavior under AutoFlow2 evidence.

Scope:

- static SSG, request-time SSR, ISR, and streaming DSD;
- revalidate and freshness normalization;
- memory, filesystem, Deno KV, and Cloudflare KV cache adapter boundaries;
- deploy recipes for static hosts, Deno Deploy, Cloudflare Workers, and
  Node-compatible hosts;
- stale/fresh ISR tests, streaming tests, and deployment fixtures;
- cells, expected evidence, and allowed transitions declared before
  implementation.

SOP: `docs/sop/v0.36.0/`

## v0.37.0 - Server/Data/UI Product Closure

Goal: close the remaining product surfaces under AutoFlow2 supervision without
reopening the renderer, package graph, or v1 product boundary.

Scope:

- typed Hono route helpers, middleware order, responses, forms, and mutations;
- documented external data recipes for selected SQL, KV, and edge stores;
- AppShell, Ocean/Island UI split, `@openelement/ui/css`, and starter
  templates;
- generated project matrix, consumer smoke, performance baseline, and docs/API
  consistency gates;
- Hub disposition as public product, internal tooling, deferred, archived, or
  removed;
- package and subpath inventory for v0.38.

SOP: `docs/sop/v0.37.0/`

## v0.38.0 - Public Surface Reset

Goal: reorganize the public product surface before the v1 release candidate,
using AutoFlow2 evidence gathered through v0.34-v0.37.

Scope:

- decide the final v1 package map against ADR-0083 and ADR-0086;
- classify all current packages as public product, subpath, internal, archived,
  or removed;
- move integration APIs toward subpaths instead of top-level packages;
- make protocol contracts small, explicit, and runtime-free;
- ensure `@openelement/ui` is framework/router independent;
- write migration guide, import table, and codemod notes;
- prove the reset through generated starter builds, consumer smoke, publish
  dry-run, docs gates, AutoFlow evidence, and e2e.

SOP: `docs/sop/v0.38.0/`

## v0.39.0 - v1 Release Candidate

Goal: validate the v1 candidate after the public surface reset without adding
new feature scope.

Scope:

- freeze v1 candidate public API list;
- finalize migration guide;
- run generated project matrix from a clean checkout;
- run consumer smoke and deploy smoke;
- fix release-candidate bugs only;
- prepare v1.0 release checklist.

SOP: `docs/sop/v0.39.0/`

## v1.0.0 - Stable Engine + AutoFlow Default

v1.0 can happen only when the following are true:

- app authoring API is stable and documented;
- lifecycle, rendering, server, data, and UI starter contracts are tested;
- AutoFlow2 has one advisory release, one gated release, and at least one
  product release of evidence;
- v0.38 public surface reset is complete or explicitly rejected by ADR;
- v0.39 release-candidate gates pass on `dev` and `main`;
- package graph, docs, architecture, build, publish dry-run, AutoFlow evidence,
  and e2e gates pass.

SOP: `docs/sop/v1.0.0/`

## Explicit Non-Goals

| Item                         | Decision                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Built-in ORM                 | External recipes only. ORM choice belongs to the app.                        |
| Generic auth platform        | External integrations and examples only before v1.                           |
| React-like runtime ownership | openElement outputs Web Components and DSD; it does not own a React runtime. |
| String renderer revival      | No. The renderer model remains JSX/VNode/RenderNode.                         |
| Silent compatibility shims   | No. 0.x may break APIs when cleanup improves the contract.                   |
| Autonomous release control   | No. AutoFlow2 cannot merge, tag, bump, publish, or remove human review.      |

## Document Cross-Reference

| Document Type | Rhythm                         | Location                |
| ------------- | ------------------------------ | ----------------------- |
| SOP           | per minor and per release task | `docs/sop/`             |
| ADR           | decision-driven                | `docs/adr/`             |
| Changelog     | per release                    | `docs/changelog/`       |
| Status        | always current                 | `docs/status/STATUS.md` |
| Release Note  | per version                    | `docs/release/`         |

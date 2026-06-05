# openElement Roadmap

> Source of truth for forward version planning.\
> Current line: v0.31.0 Application API.\
> Updated: 2026-06-05.

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

The current v0.31 release line still publishes 19 packages. That graph is
technically healthy, but it is not the intended v1.0 public product surface.

ADR-0083 defers the physical package reset until the v1.0 candidate stage. The
v0.32-v0.36 line should validate product behavior first, while avoiding new
top-level package sprawl.

The v0.37 review target is:

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

| Version | Name                               | Goal                                                                          | Status  |
| ------- | ---------------------------------- | ----------------------------------------------------------------------------- | ------- |
| v0.30.x | Contract cleanup                   | One renderer model, one metadata boundary, openElement rename                 | Done    |
| v0.31.0 | JSX-first Application API          | Make page/island authoring the default DX                                     | Current |
| v0.32.0 | Rendering Modes                    | Productize SSR, ISR, streaming DSD, and cache/deploy semantics                | Planned |
| v0.33.0 | Server/API Layer                   | Make Hono route handlers, middleware, errors, and typed responses first-class | Planned |
| v0.34.0 | Data Integration Layer             | External ORM/database recipes and adapters without owning an ORM              | Planned |
| v0.35.0 | UI Shell and Design System Surface | AppShell, Ocean/Island UI split, `@openelement/ui/css`, starters              | Planned |
| v0.36.0 | Hardening and Migration            | API audit, docs proof, fixtures, ecosystem smoke, performance                 | Planned |
| v0.37.0 | Public Surface Reset               | Package/product surface reset before v1.0                                     | Planned |
| v1.0.0  | Stable Application Engine          | Freeze stable APIs after v0.31-v0.37 are gate-proven                          | Vision  |

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

## v0.32.0 - Rendering Modes

Goal: make rendering mode selection explicit and deployable.

Scope:

- static, dynamic SSR, ISR, and streaming DSD mode declarations;
- route-level revalidate semantics;
- cache adapter boundary for memory, Deno KV, Cloudflare KV, and filesystem;
- deploy recipes for static host, Deno Deploy, Cloudflare Workers, and Node-compatible hosts;
- tests proving stale/fresh behavior and stream ordering.

SOP: `docs/sop/v0.32.0/`

## v0.33.0 - Server/API Layer

Goal: make backend routes feel intentional without turning openElement into a
heavy backend framework.

Scope:

- typed Hono route helpers;
- request context, middleware order, cookies, headers, redirect helpers;
- structured error responses;
- route handler docs and generated types;
- security defaults for API responses.

SOP: `docs/sop/v0.33.0/`

## v0.34.0 - Data Integration Layer

Goal: support real app data without owning an ORM.

Scope:

- documented integration recipes for Drizzle, Kysely, Prisma, TypeORM, Deno KV,
  Cloudflare D1, Postgres, and SQLite;
- connection lifecycle guidance for serverless and edge runtimes;
- typed loader examples;
- no built-in ORM, no auth provider, no proprietary database abstraction.

SOP: `docs/sop/v0.34.0/`

## v0.35.0 - UI Shell and Design System Surface

Goal: make the visible app shell and component surface good enough for real
sites without reopening renderer architecture.

Scope:

- explicit AppShell/layout APIs refined from ADR-0073;
- Ocean/Island UI split;
- `@openelement/ui/css` and token strategy;
- starter templates for docs, blog, product, and dashboard;
- visual docs and Playwright proof.

SOP: `docs/sop/v0.35.0/`

## v0.36.0 - Hardening and Migration

Goal: turn the v0.31-v0.35 features into a release-candidate engine without
renaming the package graph yet.

Scope:

- public API audit;
- docs/API consistency gate;
- generated project matrix;
- package publish dry-run and consumer smoke;
- performance baseline;
- migration guide from v0.30/v0.31 to v1.
- public surface inventory for the v0.37 reset.

SOP: `docs/sop/v0.36.0/`

## v0.37.0 - Public Surface Reset

Goal: reorganize the public product surface before v1.0, after v0.32-v0.36 have
proven the real feature boundaries.

Scope:

- decide the final v1 package map against ADR-0083;
- classify all current packages as public product, public support, subpath,
  internal, archived, or removed;
- move integration APIs toward subpaths instead of top-level packages;
- make protocol contracts small, explicit, and runtime-free;
- ensure `@openelement/ui` is framework/router independent;
- write migration guide and codemod notes for import-path changes;
- prove the reset through generated starter builds, consumer smoke, publish
  dry-run, docs gates, and e2e.

SOP: `docs/sop/v0.37.0/`

## v1.0.0 - Stable Application Engine

v1.0 can happen only when the following are true:

- app authoring API is stable and documented;
- rendering modes have deploy recipes and tests;
- server/API layer has explicit boundaries;
- data integrations are external and documented;
- UI shell has proven templates;
- v0.37 public surface reset is complete or explicitly rejected by ADR;
- package graph, docs, architecture, build, publish dry-run, and e2e gates pass.

SOP: `docs/sop/v1.0.0/`

## Explicit Non-Goals

| Item                         | Decision                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Built-in ORM                 | External recipes only. ORM choice belongs to the app.                        |
| Generic auth platform        | External integrations and examples only before v1.                           |
| React-like runtime ownership | openElement outputs Web Components and DSD; it does not own a React runtime. |
| String renderer revival      | No. The renderer model remains JSX/VNode/RenderNode.                         |
| Silent compatibility shims   | No. 0.x may break APIs when cleanup improves the contract.                   |

## Document Cross-Reference

| Document Type | Rhythm                         | Location                |
| ------------- | ------------------------------ | ----------------------- |
| SOP           | per minor and per release task | `docs/sop/`             |
| ADR           | decision-driven                | `docs/adr/`             |
| Changelog     | per release                    | `docs/changelog/`       |
| Status        | always current                 | `docs/status/STATUS.md` |
| Release Note  | per version                    | `docs/release/`         |

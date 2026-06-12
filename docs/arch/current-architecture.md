# Current Architecture - v0.32.0

> Status: **CURRENT (APP LIFECYCLE LINE)**\
> Version line: v0.32.0\
> Governing decisions: ADR-0077, ADR-0078, ADR-0080, ADR-0081, ADR-0082,
> ADR-0083, ADR-0084, ADR-0085, ADR-0086\
> Last hardened: 2026-06-06

Mandatory workflow: `docs/governance/PROJECT_WORKFLOW.md`.

## Architecture Center

openElement is a JSX-first Web Components application framework.

The architecture is designed around deterministic output:

- static-first rendering;
- Declarative Shadow DOM;
- explicit island upgrade boundaries;
- structured metadata instead of runtime guessing;
- generated projects as release artifacts;
- package graph gates before publish.

openElement owns the Web Component and DSD application layer. Hono, Vite, Deno,
JSR, and Web Platform APIs remain the substrate.

## Layer Model

```text
tools and release gates
  arch:check, graph:check, docs gates, publish dry-run, consumer smoke

application authoring
  @openelement/app: definePage, defineIsland, defineElement, defineLayout,
  redirect, notFound
  @openelement/runtime: runtime convenience exports

build configuration
  @openelement/app/vite: openElement()
  @openelement/adapter-vite: Vite adapter, SSG phases, generated entry wiring

framework adapters
  @openelement/adapter-lit, @openelement/adapter-react, @openelement/adapter-vanilla

product packages
  @openelement/create, @openelement/app, @openelement/runtime,
  @openelement/ui, @openelement/protocols

advanced and implementation packages
  @openelement/adapter-vite, @openelement/content, @openelement/i18n,
  @openelement/signals, @openelement/style-sheet, @openelement/router,
  @openelement/ssg, @openelement/cem, @openelement/compat-check,
  @openelement/rpc

runtime kernel
  @openelement/core: DsdElement, JSX runtime, renderDsd, renderer IR,
  islands, static props, error boundary, signal-like utilities

protocols
  @openelement/protocols: build contracts and future schema primitives
```

Dependencies must point downward or sideways through explicit protocols. A
feature package must not import a build adapter just to share a type. The runtime
kernel must not import a concrete build adapter.

## Public Surface Governance

The current 20-package graph is intentionally not reorganized physically during
v0.38.0 unless an ADR approves a package-name or removal decision. ADR-0083
deferred the public surface reset, and `docs/next/v0.38.0/PRODUCT_MAP.md` now
keeps the existing package names while separating product, advanced, internal,
and archived surfaces.

New work must still follow the target direction:

- no new top-level `@openelement/*` package without an ADR;
- integration APIs prefer subpaths over new packages;
- protocol contracts stay small, explicit, and runtime-free;
- `@openelement/ui` must not depend on framework routing or app state;
- framework code must not own database, ORM, auth, backend runtime, or builder
  choices;
- adapters live at the edge, never in the renderer or Elements core.

The v0.38 review target is a smaller public product surface centered on
protocols, Elements authoring, UI, Framework, and create scaffolding. It is a
documentation and template contract first; physical package moves require ADR
coverage.

## Current Package Surfaces

| Package                        | Role                                | v0.38 surface                 |
| ------------------------------ | ----------------------------------- | ----------------------------- |
| `@openelement/create`          | project scaffolding                 | product tooling               |
| `@openelement/app`             | application authoring facade        | product framework             |
| `@openelement/app/vite`        | build configuration subpath         | product framework             |
| `@openelement/runtime`         | runtime convenience facade          | product elements              |
| `@openelement/core`            | runtime kernel                      | advanced kernel               |
| `@openelement/protocols`       | shared build contracts              | product protocols             |
| `@openelement/ui`              | DSD component library               | product UI                    |
| `@openelement/signals`         | signal facade over `alien-signals`  | advanced                      |
| `@openelement/style-sheet`     | CSSStyleSheet cross-env abstraction | advanced                      |
| `@openelement/router`          | client and route helpers            | advanced                      |
| `@openelement/adapter-vite`    | Vite adapter + SSG                  | advanced build infrastructure |
| `@openelement/content`         | content feature                     | advanced framework feature    |
| `@openelement/i18n`            | i18n feature                        | advanced framework feature    |
| `@openelement/ssg`             | SSG engine                          | internal build infrastructure |
| `@openelement/cem`             | CEM parser                          | internal tooling              |
| `@openelement/compat-check`    | compatibility classifier            | internal tooling              |
| `@openelement/rpc`             | RPC primitives                      | archived                      |
| `@openelement/hub`             | registry + trust evidence           | archived                      |
| `@openelement/adapter-lit`     | Lit interop                         | advanced adapter ecosystem    |
| `@openelement/adapter-react`   | React interop                       | advanced adapter ecosystem    |
| `@openelement/adapter-vanilla` | vanilla WC interop                  | advanced adapter ecosystem    |

There are 20 workspace packages; `@openelement/app/vite` is a product subpath,
not an additional package. `@openelement/hub` remains in the current package
graph, but v0.38.0 classifies it as archived for the v1 public product map. New
Hub product work requires a fresh roadmap entry and ADR.

## Public Application Contract

The recommended app authoring contract is:

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  renderIntent: { mode: 'static' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

The same descriptor carries route data, page metadata, and render intent:

```tsx
export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: {
    title: 'Posts',
    description: 'Posts page',
  },
  renderIntent: { mode: 'static', revalidate: 300 },
  async load({ params, route }) {
    if (!params.slug) notFound();
    return { slug: params.slug };
  },
  render({ data, route }) {
    return <article data-path={route.path}>{data.slug}</article>;
  },
});
```

Lifecycle controls are exported from `@openelement/app`:

```tsx
import { definePage, notFound, redirect } from '@openelement/app';

export default definePage({
  route: { path: '/posts/[slug]', params: ['slug'] },
  head: { title: 'Post' },
  async load({ params }) {
    if (!params.slug) notFound();
    if (params.slug === 'old') redirect('/posts/new', 301);
    return { slug: params.slug };
  },
  render({ data }) {
    return <article>{data.slug}</article>;
  },
});
```

`DsdElement` is still the runtime primitive. It is not the default tutorial API.

## Renderer Pipeline

Core rendering has one structural model:

```text
JSX
  -> VNode
  -> RenderNode IR
  -> serializer
  -> DSD HTML or DOM boundary
```

Trusted HTML is explicit:

```tsx
<div innerHTML={trustedMarkup} trustedHtml />;
```

Without `trustedHtml`, `innerHTML` is treated as text. Core is a trust boundary,
not a sanitizer. Sanitization belongs at the content ingestion boundary.

## Metadata Source Of Truth

Framework behavior must come from structured declarations:

- package graph and release order come from `packages/*/deno.json`;
- internal JSR ranges are checked against the current release line;
- route metadata is extracted with TypeScript AST or generated manifests;
- page metadata comes from `definePage().openElementPage` or named `meta`;
- Hub client-only data is imported/read as structured data;
- generated SSR entries are declarative wiring only.

The build should never regex-parse generated TypeScript to recover business
logic.

## AI-Readable Architecture Direction

ADR-0086 makes AI-readable architecture an explicit precondition for AutoFlow2.
New application API work should favor typed object forms, structured metadata,
and named trust boundaries over hidden conventions.

The v0.33 direction is intentionally breaking:

- object-form `definePage({ ... })` is the only page authoring path;
- page descriptors expose structured `head`, `route`, and `renderIntent`;
- island metadata uses `defineIslandConfig()`;
- app-level island options can declare `ssr?: boolean`;
- route-local raw head fragments use the explicit
  `head.dangerouslyHeadFragments` trust boundary;
- old v0.31-v0.32 page shortcuts and object-literal island metadata are removed.

The v0.34-v0.35 AutoFlow2 direction is internal workflow evidence, not
autonomous code evolution. AutoFlow2 may report workflow state, cells, evidence,
blockers, and allowed actions. It must not merge, tag, bump, publish, or replace
human review for ADRs, package removal, public API resets, release tags, or
publishing.

## Canonical Shared Concepts

| Concept                             | Canonical owner                            |
| ----------------------------------- | ------------------------------------------ |
| app authoring API                   | `@openelement/app`                         |
| build configuration facade          | `@openelement/app/vite`                    |
| component render contract           | `@openelement/core`                        |
| HTML and attribute escaping         | `@openelement/core`                        |
| compatibility classification shape  | `@openelement/core/types`                  |
| Hub package record loading          | `packages/hub/src/cli/shared.ts`           |
| Hub snapshot placeholder rendering  | `packages/hub/src/snapshot-placeholder.ts` |
| adapter DSD hydration event binding | `@openelement/core`                        |
| package graph task execution        | `tools/run-package-graph-task.ts`          |

## Release Gates

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
```

## No Backward Compatibility

v0.33.0 is allowed to be breaking. The package root `@openelement/app` owns
application authoring, Vite configuration lives at `@openelement/app/vite`,
pages must use the canonical object descriptor, and island metadata must use
`defineIslandConfig()`.

## Next Architecture Work

The next minors should close the product path in order: AI-readable API
foundation, AutoFlow2 sidecar, AutoFlow2 harness gate, rendering and deployment,
server/data/UI product closure, public surface reset, and release-candidate
validation. They must not reopen the cleaned v0.30 renderer, metadata, package
graph, or trust-boundary contracts.

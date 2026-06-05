# Current Architecture - v0.31.0

> Status: **CURRENT (APPLICATION API LINE)**\
> Version line: v0.31.0\
> Governing decisions: ADR-0077, ADR-0078, ADR-0080, ADR-0081, ADR-0082,
> ADR-0083\
> Last hardened: 2026-06-05

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
  @openelement/app: definePage, defineIsland, defineElement, defineLayout
  @openelement/runtime: runtime convenience exports

build configuration
  @openelement/app/vite: openElement()
  @openelement/adapter-vite: Vite adapter, SSG phases, generated entry wiring

framework adapters
  @openelement/adapter-lit, @openelement/adapter-react, @openelement/adapter-vanilla

feature packages
  @openelement/content, @openelement/i18n, @openelement/hub, @openelement/ui,
  @openelement/cem, @openelement/compat-check

implementation packages
  @openelement/signals, @openelement/style-sheet, @openelement/router, @openelement/rpc

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

The current 19-package graph is intentionally not reorganized immediately after
v0.31.0. ADR-0083 defers physical package migration until v0.37 so v0.32-v0.36
can validate behavior first.

New work must still follow the target direction:

- no new top-level `@openelement/*` package without an ADR;
- integration APIs prefer subpaths over new packages;
- protocol contracts stay small, explicit, and runtime-free;
- `@openelement/ui` must not depend on framework routing or app state;
- framework code must not own database, ORM, auth, backend runtime, or builder
  choices;
- adapters live at the edge, never in the renderer or Elements core.

The v0.37 review target is a smaller public product surface centered on
protocol, Elements authoring, UI, Framework, and create scaffolding. That is a
future migration target, not the current import contract.

## Current Packages (19 total)

| Package                        | Role                                | Key fact                           |
| ------------------------------ | ----------------------------------- | ---------------------------------- |
| `@openelement/app`             | application authoring facade        | JSX-first pages, islands, layouts  |
| `@openelement/app/vite`        | build configuration subpath         | `openElement()` Vite facade        |
| `@openelement/core`            | runtime kernel                      | DSD+JSX+VNode; pure runtime        |
| `@openelement/protocols`       | shared build contracts              | zero-dependency pure types         |
| `@openelement/signals`         | signal facade over `alien-signals`  | owns public signal contract        |
| `@openelement/style-sheet`     | CSSStyleSheet cross-env abstraction | browser zero-overhead, SSR shim    |
| `@openelement/router`          | client and route helpers            | URLPattern-based routing           |
| `@openelement/rpc`             | RPC primitives                      | zero-dependency utility            |
| `@openelement/runtime`         | runtime convenience facade          | authoring-friendly runtime exports |
| `@openelement/adapter-vite`    | Vite adapter + SSG                  | owns build pipeline                |
| `@openelement/content`         | content feature                     | markdown, MDX, nav, blog, sitemap  |
| `@openelement/i18n`            | i18n feature                        | locale data + static path helpers  |
| `@openelement/ui`              | DSD component library               | JSX components                     |
| `@openelement/cem`             | CEM parser                          | CEM shape extraction               |
| `@openelement/compat-check`    | compatibility classifier            | admission decisions                |
| `@openelement/hub`             | registry + trust evidence           | Playwright real-browser snapshots  |
| `@openelement/create`          | project scaffolding                 | generated project contract         |
| `@openelement/adapter-lit`     | Lit interop                         | adapter-boundary conversion        |
| `@openelement/adapter-react`   | React interop                       | adapter-boundary conversion        |
| `@openelement/adapter-vanilla` | vanilla WC interop                  | VNode contract + style extraction  |

## Public Application Contract

The recommended app authoring contract is:

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => {
  return <main>Hello openElement</main>;
});
```

The object form carries route data and page metadata:

```tsx
export default definePage({
  title: 'Posts',
  async load({ params }) {
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

v0.31.0 is allowed to be breaking. The package root `@openelement/app` now owns
application authoring; Vite configuration moved to `@openelement/app/vite`.

## Next Architecture Work

The next minors should productize streaming/ISR, server route semantics, data
integration recipes, and UI Shell surfaces without reopening the cleaned v0.30
renderer, metadata, package graph, or trust-boundary contracts. The v0.37 line
then performs the public surface reset before v1.0 freezes stable APIs.

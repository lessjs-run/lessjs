# Current Architecture - v0.30.1

> Status: **CURRENT (CONTRACT-FROZEN)**\
> Version line: v0.30.1\
> Governing decisions: ADR-0077, ADR-0078, ADR-0080, ADR-0081\
> Last hardened: 2026-06-04

## Architecture Center

openElement is a DSD-first Web Components application framework.

The architecture is designed around deterministic output:

- static-first rendering;
- Declarative Shadow DOM;
- explicit island upgrade boundaries;
- structured metadata instead of runtime guessing;
- generated projects as release artifacts;
- package graph gates before publish.

openElement owns the Web Component and DSD application layer. Hono, Vite, Deno, JSR,
and Web Platform APIs remain the substrate.

## Layer Model

```text
tools and release gates
  arch:check, graph:check, docs gates, publish dry-run, consumer smoke

product facades
  @openelement/app, @openelement/runtime

build adapters
  @openelement/adapter-vite, SSG phases, generated entry wiring

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

## Current Packages (19 total)

| Package                        | Role                                | Key fact                          |
| ------------------------------ | ----------------------------------- | --------------------------------- |
| `@openelement/core`            | runtime kernel                      | DSD+JSX+VNode; pure runtime       |
| `@openelement/protocols`       | shared build contracts              | zero-dependency pure types        |
| `@openelement/signals`         | signal facade over `alien-signals`  | owns public signal contract       |
| `@openelement/style-sheet`     | CSSStyleSheet cross-env abstraction | browser zero-overhead, SSR shim   |
| `@openelement/router`          | client and route helpers            | URLPattern-based routing          |
| `@openelement/rpc`             | RPC primitives                      | zero-dependency utility           |
| `@openelement/runtime`         | authoring facade                    | single-import convenience         |
| `@openelement/adapter-vite`    | Vite adapter + SSG                  | owns build pipeline               |
| `@openelement/app`             | configuration facade                | single Vite config entry          |
| `@openelement/content`         | content feature                     | markdown, MDX, nav, blog, sitemap |
| `@openelement/i18n`            | i18n feature                        | locale data + static path helpers |
| `@openelement/ui`              | DSD component library               | JSX components                    |
| `@openelement/cem`             | CEM parser                          | CEM shape extraction              |
| `@openelement/compat-check`    | compatibility classifier            | admission decisions               |
| `@openelement/hub`             | registry + trust evidence           | Playwright real-browser snapshots |
| `@openelement/create`          | project scaffolding                 | generated project contract        |
| `@openelement/adapter-lit`     | Lit interop                         | adapter-boundary conversion       |
| `@openelement/adapter-react`   | React interop                       | adapter-boundary conversion       |
| `@openelement/adapter-vanilla` | vanilla WC interop                  | VNode contract + style extraction |

## Public Component Contract

The only openElement component render contract is:

```tsx
import { DsdElement, type VNode } from '@openelement/core';

class MyComponent extends DsdElement {
  render(): VNode | null {
    return <div class='my-component'>Hello</div>;
  }
}
```

Core does not accept string-returning components. Adapter-specific render values
must be converted before they enter the core renderer.

## Renderer Pipeline

Core rendering has one structural model:

```text
VNode
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
- Hub client-only data is imported/read as structured data;
- generated SSR entries are declarative wiring only.

The build should never regex-parse generated TypeScript to recover business
logic.

## Canonical Shared Concepts

| Concept                             | Canonical owner                            |
| ----------------------------------- | ------------------------------------------ |
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

v0.30.1 is the post-freeze cleanup line. Removed pre-freeze APIs are not
preserved with deprecation shims.

## Next Architecture Work

UI Shell, Ocean-Island, and `@openelement/ui/css` remain deferred to the next
product surface release. They must build on the v0.30.1 contract instead of
reopening the renderer or metadata cleanup arc.

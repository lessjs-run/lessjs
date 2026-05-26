# Current Architecture

> Status: CURRENT\
> Version line: v0.23.x\
> Governing decision: ADR-0050 Layered Package Architecture

## Architecture Center

LessJS is a DSD-first Web Components application framework.

The architecture is designed around deterministic output:

- static-first rendering;
- Declarative Shadow DOM;
- explicit island upgrade boundaries;
- package metadata instead of runtime guessing;
- generated projects as release artifacts;
- package graph gates before publish.

LessJS is not trying to become a generic server framework. Hono, Vite, Deno,
JSR, and Web Platform APIs are the substrate. LessJS owns the Web Component and
DSD application layer above that substrate.

## Layer Model

```text
tools and release gates
  create, package graph checker, publish workflow, smoke tests

product facades
  app configuration facade, runtime authoring facade

build adapters
  adapter-vite, SSG phases, Vite integration, generated source

feature packages
  content, i18n, hub, ui, cem, compat-check

implementation packages
  signals facade over alien-signals, style-sheet

runtime kernel
  core: DsdElement, html templates, renderDSD, islands, navigation, logger

protocols
  shared build contracts, virtual ids, future diagnostics/schema primitives
```

Dependencies should point downward or sideways through explicit protocols. A
feature package should not depend on an adapter implementation just to share a
type. A runtime kernel should not import a concrete reactive engine or build
adapter.

## Current Packages

| Package                | Role                                | Reason                                                                   |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `@lessjs/core`         | runtime kernel                      | keeps DSD rendering and runtime APIs small and explainable               |
| `@lessjs/protocols`    | shared contracts                    | prevents adapter-owned types from leaking into feature packages          |
| `@lessjs/signals`      | signal facade over `alien-signals`  | LessJS owns the public signal contract, not the engine algorithm         |
| `@lessjs/style-sheet`  | CSSStyleSheet abstraction           | isolates cross-environment stylesheet behavior                           |
| `@lessjs/adapter-vite` | Vite adapter and SSG implementation | owns Vite-specific build behavior and generated entries                  |
| `@lessjs/app`          | configuration facade                | gives users one Vite config entry without moving authoring APIs into app |
| `@lessjs/content`      | content feature package             | owns markdown, nav, blog data, sitemap behavior                          |
| `@lessjs/i18n`         | i18n feature package                | owns locale data and static path helpers                                 |
| `@lessjs/ui`           | DSD component library               | proves framework primitives with real components                         |
| `@lessjs/cem`          | CEM package                         | canonical CEM parser/shape owner                                         |
| `@lessjs/compat-check` | compatibility classifier            | canonical compatibility owner                                            |
| `@lessjs/hub`          | registry and trust evidence         | consumes compatibility and manifest evidence                             |
| `@lessjs/create`       | generated project contract          | proves the user-facing package graph                                     |
| `@lessjs/rpc`          | RPC primitives                      | dependency-light utility package                                         |

## Why `@lessjs/protocols` Exists

`content` and `i18n` need to communicate with the build context, but they should
not import `@lessjs/adapter-vite` internals. The adapter is an implementation
package; build contracts are shared architecture.

`@lessjs/protocols` exists to own these dependency-light shapes:

- build context interfaces;
- virtual module ids;
- future diagnostic result shapes;
- future manifest and validation primitives when they are not runtime-owned.

It must stay dependency-light. If it starts importing runtime or adapter code,
it has failed its purpose.

## Why `@lessjs/core` Must Stay Small

`@lessjs/core` is the runtime kernel. It owns:

- `DsdElement`;
- safe `html` templates;
- `renderDSD()` and streaming primitives;
- island runtime contracts;
- navigation helpers;
- runtime logger and runtime errors.

It should not own:

- Vite build contracts;
- virtual module ids;
- `alien-signals` implementation ownership;
- CEM parser ownership;
- compatibility classifier ownership;
- product-level single-import convenience.

This keeps the runtime portable and reduces publish-cycle risk.

## Why Signals Are A Facade

LessJS does not need to own a low-level reactive algorithm. The useful boundary
is the framework contract:

- `.value` reads and writes;
- `subscribe()` behavior;
- component-local update scheduling;
- integration with `DsdElement` and templates.

`alien-signals` is the engine. `@lessjs/signals` is the LessJS facade that makes
that engine fit the DSD runtime.

## Adapter Boundary

`@lessjs/adapter-vite` owns Vite-specific behavior:

- plugin assembly;
- build context implementation;
- virtual module resolution;
- route scanning;
- import and JSR package resolution;
- generated SSR/client/SSG entries;
- SSG phases and post-processing.

It must not become the owner of general LessJS contracts. If `content`, `i18n`,
`app`, or release gates need a shared type, that type belongs in protocols or
an owning feature package.

## Release Gates

The package graph is a first-class architecture gate.

Current required gate:

```sh
deno task graph:check
```

It verifies:

- all LessJS packages use one version;
- declared LessJS package dependencies point at that version line;
- source imports are declared in local `deno.json`;
- the package graph has no cycles;
- a publish order can be computed.

This is necessary because local workspace import maps can hide mistakes that
only appear after publishing to JSR.

## No Backward Compatibility During v0.23 Architecture Work

v0.23 is a long-term architecture phase, not a compatibility-preserving product
line. Wrong-owner paths should be removed, not bridged.

Examples:

- shared build types belong in `@lessjs/protocols/build-types`;
- virtual module ids belong in `@lessjs/protocols/virtual-ids`;
- adapter-owned historical paths should disappear once the canonical owner
  exists.

Breaking import moves are acceptable when they reduce architecture debt and are
documented in release notes.

## v0.23.0 Architecture State

1. Canonical signal creation is owned by `@lessjs/signals`, which wraps
   `alien-signals`.
2. `@lessjs/runtime` owns component authoring imports.
3. `@lessjs/cem` and `@lessjs/compat-check` own CEM and compatibility
   implementation.
4. `deno task graph:check` verifies direct package imports, cycles, unified
   versions, workflow coverage, and publish order.
5. `@lessjs/app` remains the configuration facade only.

## Next Architecture Work

1. Keep removing historical compatibility bridges whose ownership is now wrong.
2. Add richer diagnostics around generated consumer import maps.
3. Resume v0.24 Edge Full-Stack only after the package graph stays clean.

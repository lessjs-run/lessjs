# SOP-004: adapter-vite Build Modularity

> Version: v0.23.0\
> Priority: P0\
> Status: IMPLEMENTED\
> Depends on: SOP-001

## Objective

Keep `@openelement/adapter-vite` as the Vite adapter, but stop it from being the
implicit owner of every build-time concept in the repository.

## Current Problem

`adapter-vite` is the largest package and owns too many concerns:

- Vite plugin assembly;
- route scanning;
- package island admission;
- optional package stubs;
- import-map and JSR package resolution;
- client build entry generation;
- SSG rendering phases;
- HTML post-processing;
- build report and manifest output;
- contracts consumed by content and i18n.

The package can remain large, but its internal modules must have stable
responsibilities and test boundaries.

## Target Modules

| Area              | Responsibility                                      |
| ----------------- | --------------------------------------------------- |
| plugin assembly   | public `less()` options and Vite plugin order       |
| build context     | mutable build session data and plugin side channels |
| virtual modules   | virtual id constants and Vite load/resolve helpers  |
| import resolution | JSR, npm, workspace, and generated consumer graphs  |
| entry generation  | SSR/client entries and adapter installation code    |
| SSG phases        | route execution, DSD render, output write           |
| safety gates      | head injection, route params, external execution    |
| post-processing   | HTML/CSS/report finalization                        |

Contracts shared outside the adapter should move to the contracts package.

## Boundary Rules

- Adapter modules may depend on runtime contracts and protocols.
- Feature packages may depend on protocols, but not adapter implementation
  modules.
- Generated source must import public package paths only.
- Dynamic imports used for local-vs-published package resolution must have
  focused tests and a consumer smoke proof.
- Vite-specific types stay in `adapter-vite` or `app`; generic LessJS build
  contracts move out.

## Procedure

### Step 1: Draw the Current Build Graph

- [ ] Document phase inputs and outputs from dev server to SSG output.
- [ ] Identify every dynamic import used for local/published package handling.
- [ ] Identify every file that emits generated source code.

Acceptance:

- [ ] The graph names owner modules and data handoff points.
- [ ] The graph includes generated consumer build behavior.
- [ ] The graph identifies which modules emit source code and which imports
      that generated source contains.

### Step 2: Move Shared Contracts Out

- [ ] Replace external imports of `@openelement/adapter-vite/build-types`.
- [ ] Replace external imports of `@openelement/adapter-vite/virtual-ids`.
- [ ] Keep adapter compatibility exports for one minor release if needed.

Acceptance:

- [ ] `content`, `i18n`, and `app` do not depend on adapter implementation
      for shared contracts.
- [ ] Adapter compatibility exports are marked as transitional.

### Step 3: Add Focused Tests by Module

- [ ] Plugin order and option normalization.
- [ ] Virtual module id resolution.
- [ ] Import-map and JSR consumer resolution.
- [ ] Entry generation for adapter installation and UI subpaths.
- [ ] SSG route execution and report output.
- [ ] Head injection safety checks.

Acceptance:

- [ ] A failure in one module does not require running the entire build to
      understand the issue.
- [ ] The missing generated `vite` import-map failure is covered by a regression
      test or package graph gate.

### Step 4: Keep Adapter Scope Narrow

- [ ] Do not add Edge handlers to `adapter-vite` during v0.23.
- [ ] Do not add generic server abstractions.
- [ ] Keep Hono integration where Vite build/dev requires it.
- [ ] Prepare clean extension points for v0.24 Edge Full-Stack.

Acceptance:

- [ ] v0.24 can add Edge work without rewriting the v0.23 build modules.

## Verification

```sh
deno test packages/adapter-vite/__tests__ --allow-read --allow-write --allow-env --allow-run --allow-net --allow-ffi
deno task typecheck
deno task build
deno task test:e2e
```

## Exit Criteria

- Adapter internals are navigable by responsibility.
- Shared contracts no longer live in adapter-vite only because the adapter was
  the first user.
- Generated consumer build behavior remains a first-class test target.

## v0.23.0 Result

- Shared build contracts moved out of adapter-vite to `@openelement/protocols`.
- Removed stale adapter-vite exports for old `build-types` and `virtual-ids`
  ownership paths.
- Adapter-vite declares the LessJS packages it actually imports, including
  protocols, CEM, compatibility, stylesheet, and sitemap integration.
- Generated-source optional adapter imports remain generated consumer code, not
  adapter-vite package dependencies.
